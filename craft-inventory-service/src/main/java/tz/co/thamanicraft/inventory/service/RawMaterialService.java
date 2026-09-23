package tz.co.thamanicraft.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
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
        String sku = normalizeSku(material.getSku());
        material.setSku(sku);
        if (sku != null && rawMaterialRepository.findByTenantIdAndSkuIgnoreCase(material.getTenantId(), sku).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A material with this SKU already exists. Use Goods Receipts to add stock and recalculate its weighted cost.");
        }
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
        RawMaterial existing = rawMaterialRepository.findForUpdate(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Raw Material not found"));

        String sku = normalizeSku(updateRequest.getSku());
        if (sku != null) {
            rawMaterialRepository.findByTenantIdAndSkuIgnoreCase(tenantId, sku)
                    .filter(material -> !material.getId().equals(id))
                    .ifPresent(material -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "A material with this SKU already exists.");
                    });
        }

        existing.setSku(sku);
        existing.setName(updateRequest.getName());
        existing.setReorderLevelBaseQty(updateRequest.getReorderLevelBaseQty());
        existing.setStorageLocation(updateRequest.getStorageLocation());

        if (updateRequest.getCategory() != null && updateRequest.getCategory().getId() != null) {
            existing.setCategory(categoryRepository.findById(updateRequest.getCategory().getId()).orElse(null));
        } else {
            existing.setCategory(null);
        }

        if (updateRequest.getBaseUom() != null) {
            UUID requestedBaseUomId = updateRequest.getBaseUom().getId();
            if (!existing.getBaseUom().getId().equals(requestedBaseUomId)
                    && existing.getCurrentStockBaseQty().signum() != 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The base UOM cannot change while stock exists. Adjust or migrate the stock first.");
            }
            existing.setBaseUom(uomRepository.findById(requestedBaseUomId).orElseThrow());
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

    private String normalizeSku(String sku) {
        if (sku == null || sku.isBlank()) {
            return null;
        }
        return sku.trim();
    }
}
