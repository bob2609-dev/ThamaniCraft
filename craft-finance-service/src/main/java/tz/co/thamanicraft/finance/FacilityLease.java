package tz.co.thamanicraft.finance;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "facility_leases", schema = "finance")
public class FacilityLease {
    @Id
    private UUID id;
    private UUID tenantId;
    
    private String title;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    
    @Column(name = "billing_period_months")
    private Integer billingPeriodMonths;
    
    private boolean active;
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
