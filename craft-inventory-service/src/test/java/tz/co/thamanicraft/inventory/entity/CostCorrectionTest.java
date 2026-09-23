package tz.co.thamanicraft.inventory.entity;

import com.thamanicraft.security.context.TenantContext;
import jakarta.validation.Validation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import tz.co.thamanicraft.inventory.dto.CostCorrectionRequest;
import tz.co.thamanicraft.inventory.repository.RawMaterialRepository;
import tz.co.thamanicraft.inventory.service.CostCorrectionService;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CostCorrectionTest {
    private final RawMaterialRepository repository = mock(RawMaterialRepository.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final CostCorrectionService service = new CostCorrectionService(repository, jdbc);
    private final UUID id = UUID.randomUUID(), tenant = UUID.randomUUID(), unit = UUID.randomUUID();

    @AfterEach void cleanup() { TenantContext.clear(); }

    private RawMaterial material() {
        TenantContext.setCurrentTenant(tenant);
        TenantContext.setCurrentUserId(UUID.randomUUID());
        var material = RawMaterial.builder().id(id).tenantId(tenant)
                .baseUom(UnitOfMeasure.builder().id(unit).build())
                .currentStockBaseQty(new BigDecimal("1950"))
                .costPerBaseUnit(new BigDecimal("753.8462")).build();
        when(repository.findForUpdate(id, tenant)).thenReturn(Optional.of(material));
        when(repository.save(material)).thenReturn(material);
        return material;
    }

    private CostCorrectionRequest request(String cost, String expected, UUID base) {
        return new CostCorrectionRequest(new BigDecimal(cost), new BigDecimal(expected), base, " Wrong unit price ");
    }

    @Test void correctsCostAndAuditsWithoutChangingStock() {
        var material = material();
        service.correct(id, request("0.75", "753.8462", unit));
        assertEquals(new BigDecimal("0.75"), material.getCostPerBaseUnit());
        assertEquals(new BigDecimal("1950"), material.getCurrentStockBaseQty());
        verify(jdbc).update(anyString(), any(UUID.class), eq(tenant), eq(id), eq(unit),
                eq(new BigDecimal("1950")), eq(new BigDecimal("753.8462")), eq(new BigDecimal("0.75")),
                eq("Wrong unit price"), eq(TenantContext.getCurrentUserId()));
    }

    @Test void rejectsStaleCostAndChangedUnit() {
        material();
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.correct(id, request("0.75", "750", unit))).getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.correct(id, request("0.75", "753.8462", UUID.randomUUID()))).getStatusCode().value());
        verifyNoInteractions(jdbc);
        verify(repository, never()).save(any());
    }

    @Test void rejectsMissingOrOtherTenantMaterial() {
        TenantContext.setCurrentTenant(tenant);
        when(repository.findForUpdate(id, tenant)).thenReturn(Optional.empty());
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.correct(id, request("0.75", "750", unit))).getStatusCode().value());
        verifyNoInteractions(jdbc);
    }

    @Test void unchangedCostDoesNotCreateAudit() {
        material();
        service.correct(id, request("753.8462", "753.8462", unit));
        verifyNoInteractions(jdbc);
        verify(repository, never()).save(any());
    }

    @Test void validatesPrecisionRangeAndReason() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(request("0", "750", unit)).isEmpty());
            assertFalse(validator.validate(request("-1", "750", unit)).isEmpty());
            assertFalse(validator.validate(request("0.12345", "750", unit)).isEmpty());
            assertFalse(validator.validate(request("10000000000", "750", unit)).isEmpty());
            assertFalse(validator.validate(new CostCorrectionRequest(BigDecimal.ONE, BigDecimal.ONE, unit, " ")).isEmpty());
        }
    }
}
