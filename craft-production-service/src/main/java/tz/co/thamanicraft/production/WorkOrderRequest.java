package tz.co.thamanicraft.production;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record WorkOrderRequest(
        @NotNull UUID recipeId,
        @NotNull @DecimalMin("0.01") @Digits(integer=8,fraction=2) BigDecimal plannedYield,
        @Size(max=255) String reference,
        @Size(max=4000) String notes,
        LocalDate scheduledDate,
        @NotNull @Min(0) Integer version) {
    public record Transition(@NotNull @Min(0) Integer version) {}
}
