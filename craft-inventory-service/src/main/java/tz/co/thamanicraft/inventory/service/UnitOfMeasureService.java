package tz.co.thamanicraft.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.thamanicraft.inventory.entity.UnitOfMeasure;
import tz.co.thamanicraft.inventory.repository.UnitOfMeasureRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository uomRepository;

    public List<UnitOfMeasure> getAllByTenantId(UUID tenantId) {
        return uomRepository.findByTenantIdOrTenantIdIsNull(tenantId);
    }

    @Transactional
    public UnitOfMeasure createUnitOfMeasure(UnitOfMeasure uom) {
        if (uom.getBaseUnit() != null && uom.getBaseUnit().getId() != null) {
            uom.setBaseUnit(findTenantUom(uom.getBaseUnit().getId(), uom.getTenantId()));
        }
        return uomRepository.save(uom);
    }

    @Transactional
    public UnitOfMeasure updateUnitOfMeasure(UUID id, UnitOfMeasure updateRequest, UUID tenantId) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new RuntimeException("UOM not found or you don't have permission to edit a global unit"));

        existing.setName(updateRequest.getName());
        existing.setSymbol(updateRequest.getSymbol());
        existing.setCategory(updateRequest.getCategory());
        existing.setConversionFactor(updateRequest.getConversionFactor());
        
        if (updateRequest.getBaseUnit() == null || updateRequest.getBaseUnit().getId() == null) {
            existing.setBaseUnit(null);
        } else if (id.equals(updateRequest.getBaseUnit().getId())) {
            throw new IllegalArgumentException("A unit of measure cannot be its own base unit");
        } else {
            existing.setBaseUnit(findTenantUom(updateRequest.getBaseUnit().getId(), tenantId));
        }

        return uomRepository.save(existing);
    }

    @Transactional
    public void deleteUnitOfMeasure(UUID id, UUID tenantId) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new RuntimeException("UOM not found or you don't have permission to delete a global unit"));
        uomRepository.delete(existing);
    }

    private UnitOfMeasure findTenantUom(UUID id, UUID tenantId) {
        return uomRepository.findById(id)
                .filter(uom -> uom.getTenantId() == null || tenantId.equals(uom.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Base UOM not found"));
    }
}
