package tz.co.thamanicraft.finance;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "fixed_assets", schema = "finance")
public class FixedAsset {
    @Id
    private UUID id;
    private UUID tenantId;
    
    private String name;
    private String category;
    
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    
    @Column(name = "purchase_cost")
    private BigDecimal purchaseCost;
    
    private String status;
    private String reference;
    private String notes;
    
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "updated_by")
    private UUID updatedBy;
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
