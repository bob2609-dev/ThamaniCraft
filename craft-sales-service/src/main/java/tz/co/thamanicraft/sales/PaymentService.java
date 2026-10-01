package tz.co.thamanicraft.sales;

import com.thamanicraft.security.context.TenantContext;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class PaymentService {
    public record Receipt(@NotNull UUID requestId,
        @NotNull @DecimalMin("0.01") @Digits(integer=14,fraction=2) BigDecimal amount,
        @NotNull @PastOrPresent OffsetDateTime receivedAt,
        @NotNull @Pattern(regexp="CASH|MOBILE_MONEY|BANK|OTHER") String method,
        @Size(max=255) String reference) {}
    public record Reversal(@NotBlank @Size(max=1000) String reason) {}
    private final JdbcTemplate jdbc;
    private final FinanceClient financeClient;
    public PaymentService(JdbcTemplate jdbc, FinanceClient financeClient) { this.jdbc=jdbc; this.financeClient=financeClient; }
    private Map<String,Object> lock(UUID order) {
        UUID tenant=TenantContext.getCurrentTenant();
        if(tenant==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tenant required");
        var rows=jdbc.queryForList("SELECT status,total FROM sales.orders WHERE tenant_id=? AND id=? FOR UPDATE",tenant,order);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found");
        return rows.get(0);
    }
    public static BigDecimal netPaid(JdbcTemplate jdbc,UUID order) {
        BigDecimal result=jdbc.queryForObject("""
            SELECT COALESCE(SUM(p.amount),0) FROM sales.order_payments p
            WHERE p.order_id=? AND NOT EXISTS (SELECT 1 FROM sales.payment_reversals r WHERE r.payment_id=p.id)
            """,BigDecimal.class,order);
        return result==null?BigDecimal.ZERO:result;
    }
    @Transactional
    public UUID record(UUID order,Receipt receipt, String token) {
        var header=lock(order);
        var previous=jdbc.queryForList("SELECT id,amount,received_at,method,reference FROM sales.order_payments WHERE order_id=? AND request_id=?",order,receipt.requestId());
        if(!previous.isEmpty()) {
            var p=previous.get(0);
            var received=p.get("received_at");
            var instant=received instanceof java.sql.Timestamp timestamp?timestamp.toInstant():((OffsetDateTime)received).toInstant();
            if(((BigDecimal)p.get("amount")).compareTo(receipt.amount())!=0 || !instant.equals(receipt.receivedAt().toInstant())
                || !Objects.equals(p.get("method"),receipt.method()) || !Objects.equals(p.get("reference"),receipt.reference()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Submission already used with different payment details. Reload payment history.");
            return (UUID)p.get("id");
        }
        if("CANCELLED".equals(header.get("status"))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Cannot receive payments for a cancelled order");
        BigDecimal remaining=((BigDecimal)header.get("total")).subtract(netPaid(jdbc,order));
        if(receipt.amount().signum()<=0 || receipt.amount().compareTo(remaining)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Payment must be positive and cannot exceed the outstanding balance");
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO sales.order_payments(id,order_id,request_id,amount,received_at,method,reference,actor) VALUES (?,?,?,?,?,?,?,?)",
            id,order,receipt.requestId(),receipt.amount(),receipt.receivedAt(),receipt.method(),receipt.reference(),TenantContext.getCurrentUserId());
        touch(order);
        
        try {
            if (token != null) {
                financeClient.postJournalEntry("PAY-" + id.toString().substring(0,8), 
                    "Payment Receipt - " + receipt.method(), 
                    List.of(
                        Map.of("account", Map.of("code", "1000"), "debitAmount", receipt.amount()),
                        Map.of("account", Map.of("code", "1100"), "creditAmount", receipt.amount())
                    ), 
                    token);
            }
        } catch (Exception e) {}
        
        return id;
    }
    @Transactional
    public void reverse(UUID order,UUID payment,Reversal request, String token) {
        lock(order);
        var rows=jdbc.queryForList("SELECT id, amount FROM sales.order_payments WHERE order_id=? AND id=?",order,payment);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Payment not found");
        int added=jdbc.update("INSERT INTO sales.payment_reversals(payment_id,reason,actor) VALUES (?,?,?) ON CONFLICT(payment_id) DO NOTHING",
            payment,request.reason().trim(),TenantContext.getCurrentUserId());
        if(added>0) {
            touch(order);
            try {
                if (token != null) {
                    BigDecimal amount = (BigDecimal) rows.get(0).get("amount");
                    financeClient.postJournalEntry("REVP-" + payment.toString().substring(0,8), 
                        "Payment Reversal - " + request.reason(), 
                        List.of(
                            Map.of("account", Map.of("code", "1100"), "debitAmount", amount),
                            Map.of("account", Map.of("code", "1000"), "creditAmount", amount)
                        ), 
                        token);
                }
            } catch (Exception e) {}
        }
    }
    private void touch(UUID order) {
        jdbc.update("UPDATE sales.orders SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",order);
    }
}
