package tz.co.thamanicraft.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class GoodsReceiptRequest {
    private String supplierName;
    private String supplierReference;
    private String notes;
    @NotEmpty @Valid private List<Line> lines;
    @Data public static class Line {
        @NotNull private UUID rawMaterialId;
        @NotNull private UUID receivedUomId;
        @NotNull @DecimalMin(value = "0.0001") private BigDecimal purchaseQuantity;
        @NotNull @DecimalMin(value = "0.00") private BigDecimal purchaseUnitCost;
    }
}
