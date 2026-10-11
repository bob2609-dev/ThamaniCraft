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
public class PlatformAdminUOMService {

    private final UnitOfMeasureRepository uomRepository;

    public List<UnitOfMeasure> getAllGlobalUOMs() {
        return uomRepository.findByTenantIdIsNull();
    }

    @Transactional
    public UnitOfMeasure createGlobalUOM(UnitOfMeasure uom) {
        uom.setTenantId(null);
        if (uom.getBaseUnit() != null && uom.getBaseUnit().getId() != null) {
            uom.setBaseUnit(findGlobalUom(uom.getBaseUnit().getId()));
        }
        return uomRepository.save(uom);
    }

    @Transactional
    public UnitOfMeasure updateGlobalUOM(UUID id, UnitOfMeasure updateRequest) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> u.getTenantId() == null)
                .orElseThrow(() -> new RuntimeException("Global UOM not found"));

        existing.setName(updateRequest.getName());
        existing.setSymbol(updateRequest.getSymbol());
        existing.setCategory(updateRequest.getCategory());
        existing.setConversionFactor(updateRequest.getConversionFactor());

        if (updateRequest.getBaseUnit() == null || updateRequest.getBaseUnit().getId() == null) {
            existing.setBaseUnit(null);
        } else if (id.equals(updateRequest.getBaseUnit().getId())) {
            throw new IllegalArgumentException("A unit of measure cannot be its own base unit");
        } else {
            existing.setBaseUnit(findGlobalUom(updateRequest.getBaseUnit().getId()));
        }

        return uomRepository.save(existing);
    }

    @Transactional
    public void deleteGlobalUOM(UUID id) {
        UnitOfMeasure existing = uomRepository.findById(id)
                .filter(u -> u.getTenantId() == null)
                .orElseThrow(() -> new RuntimeException("Global UOM not found"));
        uomRepository.delete(existing);
    }

    private UnitOfMeasure findGlobalUom(UUID id) {
        return uomRepository.findById(id)
                .filter(uom -> uom.getTenantId() == null)
                .orElseThrow(() -> new RuntimeException("Base global UOM not found"));
    }
}
