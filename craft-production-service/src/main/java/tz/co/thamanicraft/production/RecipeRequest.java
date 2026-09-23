package tz.co.thamanicraft.production;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RecipeRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 4000) String description,
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal yieldQuantity,
        @NotNull UUID yieldUomId,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal laborCostPerBatch,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal energyCostPerBatch,
        @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal additionalOverheadPerBatch,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid Item> items) {
    public RecipeRequest {
        if (additionalOverheadPerBatch == null) additionalOverheadPerBatch = BigDecimal.ZERO;
    }
    public record Item(
            @NotNull UUID rawMaterialId,
            @NotNull @DecimalMin("0.0001") @Digits(integer = 10, fraction = 4) BigDecimal quantityRequired,
            @NotNull @DecimalMin("0") @DecimalMax("1") @Digits(integer = 1, fraction = 4) BigDecimal wasteFactor,
            @Size(max = 255) String instructions) {}
}
