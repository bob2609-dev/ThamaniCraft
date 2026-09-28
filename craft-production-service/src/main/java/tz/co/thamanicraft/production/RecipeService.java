package tz.co.thamanicraft.production;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RecipeService {
    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> list(UUID tenant) {
        return jdbc.queryForList("""
                SELECT r.id, r.name, r.yield_quantity AS "yieldQuantity", u.symbol AS "yieldUnit",
                       r.created_at AS "createdAt"
                FROM recipes r JOIN units_of_measure u ON u.id=r.yield_uom_id AND u.tenant_id=r.tenant_id
                WHERE r.tenant_id=? AND r.is_active=true ORDER BY r.created_at DESC
                """, tenant);
    }

    private Map<String, Object> header(UUID tenant, UUID id) {
        var rows = jdbc.queryForList("""
                SELECT id, name, description, yield_quantity AS "yieldQuantity", yield_uom_id AS "yieldUomId",
                       (SELECT u.symbol FROM units_of_measure u WHERE u.id=recipes.yield_uom_id AND u.tenant_id=recipes.tenant_id) AS "yieldUnit",
                       labor_cost_per_batch AS "laborCostPerBatch", energy_cost_per_batch AS "energyCostPerBatch",
                       additional_overhead_per_batch AS "additionalOverheadPerBatch"
                FROM recipes WHERE tenant_id=? AND id=? AND is_active=true
                """, tenant, id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found");
        return rows.get(0);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(UUID tenant, UUID id) {
        var recipe = header(tenant, id);
        var items = jdbc.queryForList("""
                SELECT raw_material_id AS "rawMaterialId", quantity_required AS "quantityRequired",
                       waste_factor AS "wasteFactor", instructions
                FROM recipe_items WHERE tenant_id=? AND recipe_id=? ORDER BY id
                """, tenant, id);
        var request = new RecipeRequest((String) recipe.get("name"), (String) recipe.get("description"),
                (BigDecimal) recipe.get("yieldQuantity"), (UUID) recipe.get("yieldUomId"),
                (BigDecimal) recipe.get("laborCostPerBatch"), (BigDecimal) recipe.get("energyCostPerBatch"),
                (BigDecimal) recipe.get("additionalOverheadPerBatch"),
                items.stream().map(i -> new RecipeRequest.Item((UUID) i.get("rawMaterialId"),
                        (BigDecimal) i.get("quantityRequired"), (BigDecimal) i.get("wasteFactor"),
                        (String) i.get("instructions"))).toList());
        recipe.put("items", items);
        recipe.put("costing", preview(tenant, request));
        return recipe;
    }

    public Map<String, Object> preview(UUID tenant, RecipeRequest request) {
        Integer unitCount = jdbc.queryForObject("SELECT count(*) FROM units_of_measure WHERE tenant_id=? AND id=?",
                Integer.class, tenant, request.yieldUomId());
        if (unitCount == null || unitCount == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Output unit not found");
        var lines = new ArrayList<Map<String, Object>>();
        var seen = new HashSet<UUID>();
        BigDecimal ingredients = BigDecimal.ZERO;
        for (var item : request.items()) {
            if (!seen.add(item.rawMaterialId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Combine repeated ingredients into one line");
            var rows = jdbc.queryForList("""
                    SELECT m.name, m.cost_per_base_unit AS cost, u.symbol AS unit
                    FROM raw_materials m JOIN units_of_measure u ON u.id=m.base_uom_id AND u.tenant_id=m.tenant_id
                    WHERE m.tenant_id=? AND m.id=?
                    """, tenant, item.rawMaterialId());
            if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingredient is unavailable; check the recipe materials");
            var material = rows.get(0);
            BigDecimal cost = (BigDecimal) material.get("cost");
            BigDecimal lineCost = RecipeCosting.line(item.quantityRequired(), cost, item.wasteFactor());
            ingredients = ingredients.add(lineCost);
            lines.add(Map.of("rawMaterialId", item.rawMaterialId(), "name", material.get("name"),
                    "unit", material.get("unit"), "unitCost", cost, "lineCost", lineCost));
        }
        BigDecimal total = ingredients.add(request.laborCostPerBatch()).add(request.energyCostPerBatch())
                .add(request.additionalOverheadPerBatch());
        return Map.of("lines", lines, "ingredientCost", ingredients, "batchCost", total,
                "unitCost", RecipeCosting.perUnit(total, request.yieldQuantity()),
                "additionalOverheadPerBatch", request.additionalOverheadPerBatch());
    }

    @Transactional
    public UUID save(UUID tenant, UUID id, RecipeRequest request) {
        preview(tenant, request);
        if (id == null) {
            id = UUID.randomUUID();
            jdbc.update("""
                    INSERT INTO recipes(id, tenant_id, name, description, yield_quantity, yield_uom_id,
                                        labor_cost_per_batch, energy_cost_per_batch, additional_overhead_per_batch)
                    VALUES (?,?,?,?,?,?,?,?,?)
                    """, id, tenant, request.name().trim(), request.description(), request.yieldQuantity(),
                    request.yieldUomId(), request.laborCostPerBatch(), request.energyCostPerBatch(), request.additionalOverheadPerBatch());
        } else {
            int updated = jdbc.update("""
                    UPDATE recipes SET name=?, description=?, yield_quantity=?, yield_uom_id=?,
                                       labor_cost_per_batch=?, energy_cost_per_batch=?, additional_overhead_per_batch=?
                    WHERE id=? AND tenant_id=? AND is_active=true
                    """, request.name().trim(), request.description(), request.yieldQuantity(), request.yieldUomId(),
                    request.laborCostPerBatch(), request.energyCostPerBatch(), request.additionalOverheadPerBatch(), id, tenant);
            if (updated == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found");
            jdbc.update("DELETE FROM recipe_items WHERE recipe_id=? AND tenant_id=?", id, tenant);
        }
        for (var item : request.items()) {
            jdbc.update("""
                    INSERT INTO recipe_items(id, tenant_id, recipe_id, raw_material_id, quantity_required, waste_factor, instructions)
                    VALUES (?,?,?,?,?,?,?)
                    """, UUID.randomUUID(), tenant, id, item.rawMaterialId(), item.quantityRequired(), item.wasteFactor(), item.instructions());
        }
        return id;
    }

    public void archive(UUID tenant, UUID id) {
        if (jdbc.update("UPDATE recipes SET is_active=false WHERE tenant_id=? AND id=? AND is_active=true", tenant, id) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found");
    }
}
