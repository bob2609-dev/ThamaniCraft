package tz.co.thamanicraft.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tz.co.thamanicraft.inventory.entity.FinishedProduct;
import tz.co.thamanicraft.inventory.repository.FinishedProductRepository;
import tz.co.thamanicraft.inventory.repository.UnitOfMeasureRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinishedProductService {

    private final FinishedProductRepository finishedProductRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public record DispatchRequest(java.math.BigDecimal quantity, String reference, String notes) {}

    public List<FinishedProduct> getAllByTenantId(UUID tenantId) {
        return finishedProductRepository.findByTenantId(tenantId);
    }

    @Transactional
    public void dispatchFinishedProduct(UUID id, DispatchRequest request, UUID tenantId, String userId) {
        if (request.quantity() == null || request.quantity().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dispatch quantity must be greater than zero");
        }
        FinishedProduct product = finishedProductRepository.findForUpdate(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Finished Product not found"));

        if (product.getCurrentStockBaseQty().compareTo(request.quantity()) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Insufficient stock for finished product: " + product.getName() +
                    " (Available: " + product.getCurrentStockBaseQty() + ", Requested: " + request.quantity() + ")");
        }

        product.setCurrentStockBaseQty(product.getCurrentStockBaseQty().subtract(request.quantity()));
        finishedProductRepository.save(product);

        java.math.BigDecimal unitCost = product.getCostPerBaseUnit() != null ? product.getCostPerBaseUnit() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalImpact = request.quantity().multiply(unitCost).negate();

        jdbc.update(
            "INSERT INTO inventory_adjustments(tenant_id, finished_product_id, adjustment_type, quantity_base_qty, total_cost_impact, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            tenantId, id, "FINISHED_GOODS_DISPATCH", request.quantity().negate(), totalImpact,
            "Dispatch: " + (request.reference() != null ? request.reference() : "") + " - " + (request.notes() != null ? request.notes() : ""),
            userId != null ? userId : "SYSTEM"
        );
    }

    @Transactional
    public FinishedProduct createFinishedProduct(FinishedProduct product) {
        String sku = normalizeSku(product.getSku());
        product.setSku(sku);
        if (sku != null && finishedProductRepository.findByTenantIdAndSkuIgnoreCase(product.getTenantId(), sku).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A finished product with this SKU already exists.");
        }
        if (product.getBaseUom() != null) {
            product.setBaseUom(uomRepository.findById(product.getBaseUom().getId()).orElseThrow(() -> new RuntimeException("Base UOM not found")));
        }
        if (product.getCurrentStockBaseQty() == null) {
            product.setCurrentStockBaseQty(java.math.BigDecimal.ZERO);
        }
        if (product.getCostPerBaseUnit() == null) {
            product.setCostPerBaseUnit(java.math.BigDecimal.ZERO);
        }
        return finishedProductRepository.save(product);
    }

    @Transactional
    public FinishedProduct updateFinishedProduct(UUID id, FinishedProduct updateRequest, UUID tenantId) {
        FinishedProduct existing = finishedProductRepository.findForUpdate(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Finished Product not found"));

        String sku = normalizeSku(updateRequest.getSku());
        if (sku != null) {
            finishedProductRepository.findByTenantIdAndSkuIgnoreCase(tenantId, sku)
                    .filter(product -> !product.getId().equals(id))
                    .ifPresent(product -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "A finished product with this SKU already exists.");
                    });
        }

        existing.setSku(sku);
        existing.setName(updateRequest.getName());
        existing.setCategory(updateRequest.getCategory());

        if (updateRequest.getBaseUom() != null) {
            UUID requestedBaseUomId = updateRequest.getBaseUom().getId();
            if (!existing.getBaseUom().getId().equals(requestedBaseUomId)
                    && existing.getCurrentStockBaseQty().signum() != 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The base UOM cannot change while stock exists. Adjust or migrate the stock first.");
            }
            existing.setBaseUom(uomRepository.findById(requestedBaseUomId).orElseThrow());
        }

        return finishedProductRepository.save(existing);
    }

    @Transactional
    public void deleteFinishedProduct(UUID id, UUID tenantId) {
        FinishedProduct existing = finishedProductRepository.findById(id)
                .filter(p -> p.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Finished Product not found"));
        finishedProductRepository.delete(existing);
    }

    private String normalizeSku(String sku) {
        if (sku == null || sku.isBlank()) {
            return null;
        }
        return sku.trim();
    }
}
