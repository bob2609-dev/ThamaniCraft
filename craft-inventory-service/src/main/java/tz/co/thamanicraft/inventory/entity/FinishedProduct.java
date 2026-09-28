package tz.co.thamanicraft.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "finished_products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinishedProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(length = 64)
    private String sku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 64)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_uom_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "baseUnit"})
    private UnitOfMeasure baseUom;

    @Column(name = "current_stock_base_qty", nullable = false, precision = 14, scale = 4)
    private BigDecimal currentStockBaseQty;

    @Column(name = "cost_per_base_unit", nullable = false, precision = 14, scale = 4)
    private BigDecimal costPerBaseUnit;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
