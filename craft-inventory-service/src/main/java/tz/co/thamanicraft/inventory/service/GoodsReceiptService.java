package tz.co.thamanicraft.inventory.service;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tz.co.thamanicraft.inventory.dto.GoodsReceiptRequest;
import tz.co.thamanicraft.inventory.entity.RawMaterial;
import tz.co.thamanicraft.inventory.repository.RawMaterialRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor
public class GoodsReceiptService {
  private final RawMaterialRepository materials;
  private final JdbcTemplate jdbc;
  private final tz.co.thamanicraft.inventory.FinanceClient financeClient;
  
  @Transactional public UUID receive(GoodsReceiptRequest request) {
    UUID tenant = TenantContext.getCurrentTenant(), receipt = UUID.randomUUID();
    jdbc.update("insert into goods_receipts(id,tenant_id,supplier_name,supplier_reference,received_by,received_at,notes) values (?,?,?,?,?,?,?)", receipt, tenant, request.getSupplierName(), request.getSupplierReference(), TenantContext.getCurrentUserName(), Timestamp.valueOf(LocalDateTime.now()), request.getNotes());
    for (var line : request.getLines()) {
      RawMaterial material = materials.findForUpdate(line.getRawMaterialId(), tenant).orElseThrow(() -> new IllegalArgumentException("Raw material not found"));
      String receivedUomSymbol = jdbc.queryForObject("select symbol from units_of_measure where id = ?", String.class, line.getReceivedUomId());
      String baseUomSymbol = material.getBaseUom().getSymbol();
      BigDecimal baseQty = SmartUOMConverter.convert(receivedUomSymbol, baseUomSymbol, line.getPurchaseQuantity());
      BigDecimal total = line.getPurchaseQuantity().multiply(line.getPurchaseUnitCost());
      BigDecimal stock = material.getCurrentStockBaseQty();
      BigDecimal unitCost = stock.add(baseQty).signum() == 0 ? BigDecimal.ZERO : stock.multiply(material.getCostPerBaseUnit()).add(total).divide(stock.add(baseQty), 4, RoundingMode.HALF_UP);
      material.setCurrentStockBaseQty(stock.add(baseQty)); material.setCostPerBaseUnit(unitCost); materials.save(material);
      jdbc.update("insert into goods_receipt_lines(id,goods_receipt_id,raw_material_id,received_uom_id,purchase_quantity,purchase_unit_cost,base_quantity_received,total_cost) values (?,?,?,?,?,?,?,?)", UUID.randomUUID(), receipt, material.getId(), line.getReceivedUomId(), line.getPurchaseQuantity(), line.getPurchaseUnitCost(), baseQty, total);
    } return receipt;
  }
  
  @Transactional public UUID quickRefill(GoodsReceiptRequest request, String authorization) {
    UUID receipt = receive(request);
    BigDecimal total = request.getLines().stream()
        .map(l -> l.getPurchaseQuantity().multiply(l.getPurchaseUnitCost()))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
        
    try {
        if (authorization != null) {
            financeClient.postJournalEntry("REF-" + receipt.toString().substring(0,8), 
                "Quick Refill - " + request.getSupplierName(), 
                List.of(
                    Map.of("account", Map.of("code", "1200"), "debitAmount", total), // Inventory
                    Map.of("account", Map.of("code", "2000"), "creditAmount", total) // Accounts Payable
                ), authorization);
        }
    } catch (Exception e) {}
    
    return receipt;
  }
  public List<Map<String, Object>> list() {
    return jdbc.queryForList("select gr.id, gr.supplier_name as \"supplierName\", gr.supplier_reference as \"supplierReference\", gr.received_by as \"receivedBy\", gr.received_at as \"receivedAt\", count(grl.id) as \"lineCount\", string_agg(rm.name, ', ') as materials, string_agg(to_char(grl.purchase_quantity, 'FM999,999,999,990.####') || ' ' || received_uom.symbol, ', ') as \"receivedQuantities\", string_agg(to_char(grl.base_quantity_received, 'FM999,999,999,990.####') || ' ' || base_uom.symbol, ', ') as \"baseQuantities\", sum(grl.total_cost) as \"totalCost\" from goods_receipts gr join goods_receipt_lines grl on grl.goods_receipt_id = gr.id join raw_materials rm on rm.id = grl.raw_material_id join units_of_measure received_uom on received_uom.id = grl.received_uom_id join units_of_measure base_uom on base_uom.id = rm.base_uom_id where gr.tenant_id = ? group by gr.id, gr.supplier_name, gr.supplier_reference, gr.received_by, gr.received_at order by gr.received_at desc", TenantContext.getCurrentTenant());
  }


}
