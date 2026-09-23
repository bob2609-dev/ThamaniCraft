package tz.co.thamanicraft.sales;
import com.thamanicraft.security.context.TenantContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;

@Service
public class SalesService {
    private final JdbcTemplate jdbc;
    public SalesService(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    private UUID tenant() {
        UUID id=TenantContext.getCurrentTenant();
        if(id==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tenant context required");
        return id;
    }
    public List<Map<String,Object>> customers() {
        return jdbc.queryForList("SELECT id,name,phone,email,address,notes,version FROM sales.customers WHERE tenant_id=? ORDER BY name,id",tenant());
    }
    @Transactional
    public UUID saveCustomer(UUID id,SalesRequests.Customer c) {
        if(id==null) {
            id=UUID.randomUUID();
            jdbc.update("INSERT INTO sales.customers(id,tenant_id,name,phone,email,address,notes,created_by) VALUES (?,?,?,?,?,?,?,?)",
                id,tenant(),c.name().trim(),c.phone().trim(),c.email(),c.address(),c.notes(),TenantContext.getCurrentUserId());
        } else if(jdbc.update("""
            UPDATE sales.customers SET name=?,phone=?,email=?,address=?,notes=?,version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE tenant_id=? AND id=? AND version=?
            """,c.name().trim(),c.phone().trim(),c.email(),c.address(),c.notes(),tenant(),id,c.version())==0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Customer changed or is unavailable. Reload and retry.");
        return id;
    }
    public List<Map<String,Object>> orders() {
        var result=jdbc.queryForList("""
            SELECT id,customer_name AS "customerName",customer_phone AS "customerPhone",due_at AS "dueAt",
                fulfilment,status,total,deposit_required AS "depositRequired", 'ORD-' || order_number AS "orderNumber",version
            FROM sales.orders WHERE tenant_id=? ORDER BY due_at,id
            """,tenant());
        for(var order:result) paymentSummary(order);
        return result;
    }
    @Transactional(readOnly=true)
    public Map<String,Object> order(UUID id) {
        var rows=jdbc.queryForList("""
            SELECT id,customer_id AS "customerId",customer_name AS "customerName",customer_phone AS "customerPhone",
                customer_email AS "customerEmail",due_at AS "dueAt",fulfilment,delivery_address AS "deliveryAddress",
                notes,discount_note AS "discountNote",subtotal,delivery_charge AS "deliveryCharge",
                discount_amount AS "discountAmount",total,deposit_required AS "depositRequired",status,version,
                'ORD-' || order_number AS "orderNumber"
            FROM sales.orders WHERE tenant_id=? AND id=?
            """,tenant(),id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found");
        var result=rows.get(0);
        result.put("items",jdbc.queryForList("""
            SELECT id,description,quantity,unit,unit_price AS "unitPrice",line_total AS "lineTotal",instructions
            FROM sales.order_items WHERE order_id=? ORDER BY position
            """,id));
        result.put("history",jdbc.queryForList("SELECT id,action,reason,old_discount AS \"oldDiscount\",new_discount AS \"newDiscount\",actor,created_at AS \"createdAt\" FROM sales.order_history WHERE order_id=? ORDER BY created_at,id",id));
        paymentSummary(result);
        result.put("payments",jdbc.queryForList("""
            SELECT p.id,p.amount,p.received_at AS "receivedAt",p.method,p.reference,p.actor,
                r.reason AS "reversalReason",r.created_at AS "reversedAt",r.actor AS "reversedBy"
            FROM sales.order_payments p LEFT JOIN sales.payment_reversals r ON r.payment_id=p.id
            WHERE p.order_id=? ORDER BY p.created_at,p.id
            """,id));
        return result;
    }
    private void paymentSummary(Map<String,Object> order) {
        BigDecimal paid=PaymentService.netPaid(jdbc,(UUID)order.get("id"));
        BigDecimal total=(BigDecimal)order.get("total");
        boolean cancelled="CANCELLED".equals(order.get("status"));
        order.put("netPaid",paid);
        order.put("balance",cancelled?BigDecimal.ZERO:total.subtract(paid));
        order.put("refundDue",cancelled?paid:BigDecimal.ZERO);
        order.put("depositShortfall",cancelled?BigDecimal.ZERO:((BigDecimal)order.get("depositRequired")).subtract(paid).max(BigDecimal.ZERO));
        order.put("paymentStatus",cancelled?(paid.signum()>0?"REFUND_DUE":"CANCELLED"):paid.compareTo(total)>=0?"PAID":paid.signum()>0?"PARTIAL":"UNPAID");
    }
    private Map<String,Object> lockOrder(UUID id,int version) {
        var rows=jdbc.queryForList("SELECT status,version,customer_id,discount_amount FROM sales.orders WHERE tenant_id=? AND id=? FOR UPDATE",tenant(),id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found");
        var row=rows.get(0);
        if(((Number)row.get("version")).intValue()!=version)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Order changed. Reload before retrying.");
        return row;
    }
    private void audit(UUID id,String action,String reason,Object oldDiscount,Object newDiscount) {
        jdbc.update("INSERT INTO sales.order_history(id,order_id,action,reason,old_discount,new_discount,actor) VALUES (?,?,?,?,?,?,?)",
            UUID.randomUUID(),id,action,reason.trim(),oldDiscount,newDiscount,TenantContext.getCurrentUserId());
    }
    @Transactional
    public void transition(UUID id,String action,SalesRequests.Transition request) {
        var row=lockOrder(id,request.version());
        String status=(String)row.get("status");
        String next;
        if(action.equals("confirm") && status.equals("NEW")) next="CONFIRMED";
        else if(action.equals("cancel") && Set.of("NEW","CONFIRMED").contains(status)) next="CANCELLED";
        else throw new ResponseStatusException(HttpStatus.CONFLICT,"This action is not allowed for the current order status.");
        jdbc.update("UPDATE sales.orders SET status=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND id=?",next,tenant(),id);
        audit(id,next,request.reason(),row.get("discount_amount"),row.get("discount_amount"));
    }
    @Transactional
    public void editOrder(UUID id,SalesRequests.Edit request) {
        var row=lockOrder(id,request.version());
        if(!"NEW".equals(row.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Only new orders can be edited.");
        var o=request.order();
        if(!o.customerId().equals(row.get("customer_id")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"The booked customer cannot be changed. Cancel and create a new order.");
        if(o.fulfilment().equals("DELIVERY") && (o.deliveryAddress()==null || o.deliveryAddress().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Delivery address is required");
        BigDecimal subtotal=o.items().stream().map(OrderTotals::line).reduce(BigDecimal.ZERO,BigDecimal::add);
        BigDecimal total=OrderTotals.total(subtotal,o.deliveryCharge(),o.discountAmount(),o.depositRequired());
        if(total.compareTo(PaymentService.netPaid(jdbc,id))<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Order total cannot be less than payments received. Correct erroneous receipts first.");
        if(subtotal.precision()-subtotal.scale()>14) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Subtotal is too large");
        jdbc.update("""
            UPDATE sales.orders SET due_at=?,fulfilment=?,delivery_address=?,notes=?,discount_note=?,subtotal=?,
            delivery_charge=?,discount_amount=?,total=?,deposit_required=?,version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE tenant_id=? AND id=?
            """,o.dueAt(),o.fulfilment(),o.deliveryAddress(),o.notes(),o.discountNote(),subtotal,
            o.deliveryCharge(),o.discountAmount(),total,o.depositRequired(),tenant(),id);
        jdbc.update("DELETE FROM sales.order_items WHERE order_id=?",id);
        insertItems(id,o);
        audit(id,"EDITED",request.reason(),row.get("discount_amount"),o.discountAmount());
    }
    @Transactional
    public UUID createOrder(SalesRequests.Order o) {
        var customer=jdbc.queryForList("SELECT name,phone,email FROM sales.customers WHERE tenant_id=? AND id=? FOR UPDATE",tenant(),o.customerId());
        if(customer.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Customer not found");
        if(o.fulfilment().equals("DELIVERY") && (o.deliveryAddress()==null || o.deliveryAddress().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Delivery address is required");
        BigDecimal subtotal=o.items().stream().map(OrderTotals::line).reduce(BigDecimal.ZERO,BigDecimal::add);
        BigDecimal total=OrderTotals.total(subtotal,o.deliveryCharge(),o.discountAmount(),o.depositRequired());
        if(subtotal.precision()-subtotal.scale()>14) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Subtotal is too large");
        UUID id=UUID.randomUUID();
        var c=customer.get(0);
        int added=jdbc.update("""
            INSERT INTO sales.orders(id,tenant_id,request_id,customer_id,customer_name,customer_phone,customer_email,
                due_at,fulfilment,delivery_address,notes,discount_note,subtotal,delivery_charge,discount_amount,total,deposit_required,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,request_id) DO NOTHING
            """,id,tenant(),o.requestId(),o.customerId(),c.get("name"),c.get("phone"),c.get("email"),o.dueAt(),o.fulfilment(),
            o.deliveryAddress(),o.notes(),o.discountNote(),subtotal,o.deliveryCharge(),o.discountAmount(),total,o.depositRequired(),TenantContext.getCurrentUserId());
        if(added==0) throw new ResponseStatusException(HttpStatus.CONFLICT,"This submission was already recorded. Check the order list before creating another.");
        insertItems(id,o);
        return id;
    }
    private void insertItems(UUID id,SalesRequests.Order o) {
        int position=0;
        for(var item:o.items()) jdbc.update("""
            INSERT INTO sales.order_items(id,order_id,position,description,quantity,unit,unit_price,line_total,instructions)
            VALUES (?,?,?,?,?,?,?,?,?)
            """,UUID.randomUUID(),id,position++,item.description().trim(),item.quantity(),item.unit().trim(),item.unitPrice(),OrderTotals.line(item),item.instructions());
    }
}
