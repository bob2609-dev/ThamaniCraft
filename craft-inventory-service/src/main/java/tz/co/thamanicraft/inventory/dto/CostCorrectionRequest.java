package tz.co.thamanicraft.inventory.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CostCorrectionRequest(
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 4) BigDecimal costPerBaseUnit,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 4) BigDecimal expectedCost,
        @NotNull UUID baseUomId,
        @NotBlank @Size(max = 500) String reason) {}
