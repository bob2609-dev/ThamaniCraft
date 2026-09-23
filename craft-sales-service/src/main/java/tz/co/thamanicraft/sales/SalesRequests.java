package tz.co.thamanicraft.sales;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

public class SalesRequests {
    public record Edit(@NotNull @Min(0) Integer version, @NotNull @Valid Order order,
        @NotBlank @Size(max=1000) String reason) {}
    public record Transition(@NotNull @Min(0) Integer version,
        @NotBlank @Size(max=1000) String reason) {}
    public record Customer(@NotBlank @Size(max=255) String name,
        @NotBlank @Size(max=40) String phone, @Email @Size(max=255) String email,
        @Size(max=1000) String address, @Size(max=4000) String notes,
        @NotNull @Min(0) Integer version) {}
    public record Order(@NotNull UUID requestId,@NotNull UUID customerId,
        @NotNull OffsetDateTime dueAt,@NotNull @Pattern(regexp="COLLECTION|DELIVERY") String fulfilment,
        @Size(max=1000) String deliveryAddress,@Size(max=4000) String notes,
        @Size(max=1000) String discountNote,
        @NotNull @DecimalMin("0") @Digits(integer=12,fraction=2) BigDecimal deliveryCharge,
        @NotNull @DecimalMin("0") @Digits(integer=12,fraction=2) BigDecimal discountAmount,
        @NotNull @DecimalMin("0") @Digits(integer=12,fraction=2) BigDecimal depositRequired,
        @NotEmpty @Size(max=100) List<@NotNull @Valid Item> items) {}
    public record Item(@NotBlank @Size(max=255) String description,
        @NotNull @DecimalMin("0.0001") @Digits(integer=8,fraction=4) BigDecimal quantity,
        @NotBlank @Size(max=40) String unit,
        @NotNull @DecimalMin("0") @Digits(integer=10,fraction=2) BigDecimal unitPrice,
        @Size(max=1000) String instructions) {}
}
