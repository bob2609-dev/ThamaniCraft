package tz.co.thamanicraft.finance;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class FinanceRequests {
    private FinanceRequests() {}
    public record Asset(
        @NotBlank @Size(max=255) String name,
        @NotNull @Pattern(regexp="MACHINERY|TOOLS|IT_HARDWARE|VEHICLE|LEASEHOLD") String category,
        @NotNull LocalDate purchaseDate,
        @NotNull @DecimalMin("0") @Digits(integer=12,fraction=2) BigDecimal purchaseCost,
        @NotNull @Pattern(regexp="ACTIVE|MAINTENANCE|DISPOSED|WRITTEN_OFF") String status,
        @Size(max=255) String reference,
        @Size(max=4000) String notes) {}
    public record Expense(
        @NotBlank @Size(max=255) String title,
        @NotNull @Pattern(regexp="RENT|UTILITIES|MAINTENANCE|TRANSPORT|OTHER") String category,
        @NotNull LocalDate expenseDate,
        @NotNull @DecimalMin("0") @Digits(integer=12,fraction=2) BigDecimal amount,
        @Size(max=255) String reference,
        @Size(max=4000) String notes) {}
}
