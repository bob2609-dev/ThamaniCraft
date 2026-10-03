package tz.co.thamanicraft.production;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RecipeServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final RecipeService service = new RecipeService(jdbc);
    private final UUID tenant = UUID.randomUUID();
    private final UUID unit = UUID.randomUUID();
    private final UUID material = UUID.randomUUID();

    private RecipeRequest request() {
        return new RecipeRequest("Bread", null, new BigDecimal("50"), unit,
                new BigDecimal("15000"), new BigDecimal("10000"), new BigDecimal("5500"), new BigDecimal("40"), List.of(
                        new RecipeRequest.Item(material, new BigDecimal("25000"), null, new BigDecimal("0.02"), null)),
                "BATCH_PRE_MADE", null);
    }

    @Test
    void costingUsesTenantMaterialAndIncludesOverheads() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material))).thenReturn(List.of(
                Map.of("name", "Flour", "cost", new BigDecimal("1.80"), "unit", "g")));
        var result = service.preview(tenant, request());
        assertEquals(0, new BigDecimal("76400").compareTo((BigDecimal) result.get("batchCost")));
        assertEquals(new BigDecimal("1528.0000"), result.get("unitCost"));
        assertEquals(new BigDecimal("5500"), result.get("additionalOverheadPerBatch"));
        verify(jdbc).queryForList(contains("m.tenant_id=? AND m.id=?"), eq(tenant), eq(material));
    }

    @Test
    void foreignOrMissingIngredientCannotBeSaved() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material))).thenReturn(List.of());
        assertThrows(ResponseStatusException.class, () -> service.save(tenant, null, request()));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void foreignOutputUnitIsRejectedBeforeLookingUpMaterials() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(0);
        assertThrows(ResponseStatusException.class, () -> service.preview(tenant, request()));
        verify(jdbc, never()).queryForList(anyString(), eq(tenant), eq(material));
    }

    @Test
    void savesExplicitOverheadWithoutFinanceDependency() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material)))
                .thenReturn(List.of(Map.of("name", "Flour", "cost", BigDecimal.ONE, "unit", "g")));
        UUID id = service.save(tenant, null, request());
        verify(jdbc).update(contains("additional_overhead_per_batch"), eq(id), eq(tenant), eq("Bread"), isNull(),
                eq(new BigDecimal("50")), eq(unit), eq(new BigDecimal("15000")), eq(new BigDecimal("10000")),
                eq(new BigDecimal("5500")), eq(new BigDecimal("40")), eq("BATCH_PRE_MADE"), isNull());
    }

    @Test
    void omittedManualOverheadDefaultsToZero() {
        var original = request();
        var request = new RecipeRequest(original.name(), null, original.yieldQuantity(), unit,
                original.laborCostPerBatch(), original.energyCostPerBatch(), null, original.suggestedPrice(),
                original.items(), "BATCH_PRE_MADE", null);
        assertEquals(BigDecimal.ZERO, request.additionalOverheadPerBatch());
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material)))
                .thenReturn(List.of(Map.of("name", "Flour", "cost", BigDecimal.ONE, "unit", "g")));
        assertEquals(0,
                new BigDecimal("50500").compareTo((BigDecimal) service.preview(tenant, request).get("batchCost")));
    }

    @Test
    void negativeManualOverheadIsInvalid() {
        var original = request();
        var request = new RecipeRequest(original.name(), null, original.yieldQuantity(), unit,
                original.laborCostPerBatch(), original.energyCostPerBatch(), new BigDecimal("-1"),
                original.suggestedPrice(), original.items(), "BATCH_PRE_MADE", null);
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(request).stream()
                    .anyMatch(v -> v.getPropertyPath().toString().equals("additionalOverheadPerBatch")));
        }
    }

    @Test
    void detailReturnsStoredManualOverheadAndUsesItInCosting() {
        UUID id = UUID.randomUUID();
        var header = new HashMap<String, Object>();
        header.put("name", "Bread");
        header.put("yieldQuantity", new BigDecimal("50"));
        header.put("yieldUomId", unit);
        header.put("laborCostPerBatch", new BigDecimal("15000"));
        header.put("energyCostPerBatch", new BigDecimal("10000"));
        header.put("additionalOverheadPerBatch", new BigDecimal("5500"));
        header.put("suggestedPrice", new BigDecimal("40"));
        header.put("productionMode", "BATCH_PRE_MADE");
        when(jdbc.queryForList(contains("FROM recipes WHERE"), eq(tenant), eq(id))).thenReturn(List.of(header));
        when(jdbc.queryForList(contains("FROM recipe_items WHERE"), eq(tenant), eq(id))).thenReturn(List.of(Map.of(
                "rawMaterialId", material, "quantityRequired", new BigDecimal("25000"), "uomId", unit, "wasteFactor",
                new BigDecimal("0.02"))));
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material))).thenReturn(List.of(
                Map.of("name", "Flour", "cost", new BigDecimal("1.80"), "unit", "g")));
        var result = service.detail(tenant, id);
        assertEquals(new BigDecimal("5500"), result.get("additionalOverheadPerBatch"));
        assertEquals(new BigDecimal("1528.0000"), ((Map<?, ?>) result.get("costing")).get("unitCost"));
    }

    @Test
    void editingPersistsManualOverheadWithTenantScope() {
        UUID id = UUID.randomUUID();
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenant), eq(unit))).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(tenant), eq(material))).thenReturn(List.of(
                Map.of("name", "Flour", "cost", BigDecimal.ONE, "unit", "g")));
        when(jdbc.update(contains("UPDATE recipes SET"), eq("Bread"), isNull(), eq(new BigDecimal("50")), eq(unit),
                eq(new BigDecimal("15000")), eq(new BigDecimal("10000")), eq(new BigDecimal("5500")),
                eq(new BigDecimal("40")), eq("BATCH_PRE_MADE"), isNull(), eq(id), eq(tenant))).thenReturn(1);
        assertEquals(id, service.save(tenant, id, request()));
        verify(jdbc).update(contains("production_mode=CAST(? AS production_mode), image_url=?"), eq("Bread"), isNull(),
                eq(new BigDecimal("50")), eq(unit),
                eq(new BigDecimal("15000")), eq(new BigDecimal("10000")), eq(new BigDecimal("5500")),
                eq(new BigDecimal("40")), eq("BATCH_PRE_MADE"), isNull(), eq(id), eq(tenant));
    }
}
