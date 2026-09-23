package tz.co.thamanicraft.inventory.service;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tz.co.thamanicraft.inventory.dto.CostCorrectionRequest;
import tz.co.thamanicraft.inventory.entity.RawMaterial;
import tz.co.thamanicraft.inventory.repository.RawMaterialRepository;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CostCorrectionService {
    private final RawMaterialRepository materials;
    private final JdbcTemplate jdbc;

    @Transactional
    public RawMaterial correct(UUID id, CostCorrectionRequest request) {
        UUID tenant = TenantContext.getCurrentTenant();
        var material = materials.findForUpdate(id, tenant)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        if (!material.getBaseUom().getId().equals(request.baseUomId())
                || material.getCostPerBaseUnit().compareTo(request.expectedCost()) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The material cost or unit changed. Close this form, refresh Inventory and try again.");
        }
        if (material.getCostPerBaseUnit().compareTo(request.costPerBaseUnit()) == 0) return material;
        jdbc.update("""
                INSERT INTO material_cost_corrections
                (id, tenant_id, raw_material_id, base_uom_id, stock_quantity, old_cost, new_cost, reason, corrected_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), tenant, id, material.getBaseUom().getId(),
                material.getCurrentStockBaseQty(), material.getCostPerBaseUnit(), request.costPerBaseUnit(),
                request.reason().trim(), TenantContext.getCurrentUserId());
        material.setCostPerBaseUnit(request.costPerBaseUnit());
        return materials.save(material);
    }
}
