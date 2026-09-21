package tz.co.thamanicraft.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.thamanicraft.inventory.entity.RawMaterial;
import tz.co.thamanicraft.inventory.repository.RawMaterialRepository;
import tz.co.thamanicraft.inventory.repository.UnitOfMeasureRepository;

import tz.co.thamanicraft.inventory.repository.ItemCategoryRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RawMaterialService {

    private final RawMaterialRepository rawMaterialRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final ItemCategoryRepository categoryRepository;

    public List<RawMaterial> getAllByTenantId(UUID tenantId) {
        return rawMaterialRepository.findByTenantId(tenantId);
    }

    @Transactional
    public RawMaterial createRawMaterial(RawMaterial material) {
        if (material.getBaseUom() != null) {
            material.setBaseUom(uomRepository.findById(material.getBaseUom().getId()).orElseThrow(() -> new RuntimeException("Base UOM not found")));
        }
        if (material.getPurchaseUom() != null) {
            material.setPurchaseUom(uomRepository.findById(material.getPurchaseUom().getId()).orElseThrow(() -> new RuntimeException("Purchase UOM not found")));
        }
        if (material.getCategory() != null && material.getCategory().getId() != null) {
            material.setCategory(categoryRepository.findById(material.getCategory().getId()).orElse(null));
        }
        return rawMaterialRepository.save(material);
    }

    @Transactional
    public RawMaterial updateRawMaterial(UUID id, RawMaterial updateRequest, UUID tenantId) {
        RawMaterial existing = rawMaterialRepository.findById(id)
                .filter(m -> m.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Raw Material not found"));

        existing.setSku(updateRequest.getSku());
        existing.setName(updateRequest.getName());
        existing.setCurrentStockBaseQty(updateRequest.getCurrentStockBaseQty());
        existing.setCostPerBaseUnit(updateRequest.getCostPerBaseUnit());
        existing.setReorderLevelBaseQty(updateRequest.getReorderLevelBaseQty());
        existing.setStorageLocation(updateRequest.getStorageLocation());

        if (updateRequest.getCategory() != null && updateRequest.getCategory().getId() != null) {
            existing.setCategory(categoryRepository.findById(updateRequest.getCategory().getId()).orElse(null));
        } else {
            existing.setCategory(null);
        }

        if (updateRequest.getBaseUom() != null) {
            existing.setBaseUom(uomRepository.findById(updateRequest.getBaseUom().getId()).orElseThrow());
        }
        if (updateRequest.getPurchaseUom() != null) {
            existing.setPurchaseUom(uomRepository.findById(updateRequest.getPurchaseUom().getId()).orElseThrow());
        }

        return rawMaterialRepository.save(existing);
    }

    @Transactional
    public void deleteRawMaterial(UUID id, UUID tenantId) {
        RawMaterial existing = rawMaterialRepository.findById(id)
                .filter(m -> m.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Raw Material not found"));
        rawMaterialRepository.delete(existing);
    }
}
