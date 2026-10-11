package tz.co.thamanicraft.finance;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "expenses", schema = "finance")
public class Expense {
    @Id
    private UUID id;
    private UUID tenantId;
    
    private String title;
    private String category;
    
    @Column(name = "expense_date")
    private LocalDate expenseDate;
    
    private BigDecimal amount;
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
