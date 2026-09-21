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
        return uomRepository.findByTenantId(tenantId);
    }

    @Transactional
    public UnitOfMeasure createUnitOfMeasure(UnitOfMeasure uom) {
        return uomRepository.save(uom);
    }

    @Transactional
    public UnitOfMeasure updateUnitOfMeasure(UUID id, UnitOfMeasure updateRequest, UUID tenantId) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("UOM not found"));

        existing.setName(updateRequest.getName());
        existing.setSymbol(updateRequest.getSymbol());
        existing.setCategory(updateRequest.getCategory());
        existing.setConversionFactor(updateRequest.getConversionFactor());
        
        if (updateRequest.getBaseUnit() != null) {
            existing.setBaseUnit(uomRepository.findById(updateRequest.getBaseUnit().getId()).orElse(null));
        }

        return uomRepository.save(existing);
    }

    @Transactional
    public void deleteUnitOfMeasure(UUID id, UUID tenantId) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("UOM not found"));
        uomRepository.delete(existing);
    }
}
