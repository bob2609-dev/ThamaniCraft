package com.thamanicraft.identity.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SubscriptionInvoiceDto {
    private UUID id;
    private UUID tenantId;
    private String planCode;
    private BigDecimal amount;
    private LocalDateTime billingPeriodStart;
    private LocalDateTime billingPeriodEnd;
    private String status;
    private String paymentMethod;
    private String paymentReference;
    private String proofUrl;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
