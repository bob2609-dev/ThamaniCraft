package tz.co.thamanicraft.production;

import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkOrderServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final WorkOrderService service = new WorkOrderService(jdbc);
    private final UUID tenant = UUID.randomUUID(), id = UUID.randomUUID();
    @BeforeEach void setup() { TenantContext.setCurrentTenant(tenant); TenantContext.setCurrentUserId(UUID.randomUUID()); }
    @AfterEach void cleanup() { TenantContext.clear(); }
    private void header(String status,int version) {
        when(jdbc.queryForList(contains("FROM production_batches WHERE"),eq(tenant),eq(id)))
                .thenReturn(List.of(new HashMap<>(Map.of("status",status,"version",version))));
    }
    private void noWrites() { verify(jdbc,never()).update(anyString(),any(Object[].class)); }
    @Test void missingTenantFailsBeforeQuery() {
        TenantContext.clear();
        assertThrows(ResponseStatusException.class,service::list);
        verifyNoInteractions(jdbc);
    }
    @Test void missingOrForeignBatchIsNotFound() {
        var error = assertThrows(ResponseStatusException.class,()->service.detail(id));
        assertEquals(404,error.getStatusCode().value());
        verify(jdbc).queryForList(contains("WHERE tenant_id=? AND id=?"),eq(tenant),eq(id));
    }
    @Test void staleActionCannotWrite() {
        header("DRAFT",1);
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.transition(id,"cancel",0)).getStatusCode().value());
        noWrites();
    }
    @Test void inProgressBatchCannotBeCancelled() {
        header("IN_PROGRESS",0);
        assertThrows(ResponseStatusException.class,()->service.transition(id,"cancel",0));
        noWrites();
    }
    @Test void scheduleNeedsDate() {
        header("DRAFT",0);
        assertThrows(ResponseStatusException.class,()->service.transition(id,"schedule",0));
        noWrites();
    }
    @Test void scheduledDraftCannotBeEdited() {
        header("SCHEDULED",0);
        assertThrows(ResponseStatusException.class,()->service.save(id,new WorkOrderRequest(UUID.randomUUID(),BigDecimal.TEN,null,null,null,0)));
        noWrites();
    }
    @Test void stockShortagePreventsStart() {
        header("SCHEDULED",0);
        when(jdbc.queryForList(contains("FROM production_batch_ingredients"),eq(tenant),eq(id)))
                .thenReturn(List.of(Map.of("name","Eggs","compatible",true,"quantity",BigDecimal.TEN,"available",BigDecimal.ONE)));
        assertThrows(ResponseStatusException.class,()->service.transition(id,"start",0));
        noWrites();
    }
    @Test void missingSnapshotPreventsStart() {
        header("SCHEDULED",0);
        assertThrows(ResponseStatusException.class,()->service.transition(id,"start",0));
        noWrites();
    }
    @Test void startUsesFrozenSnapshotAndDoesNotChangeInventory() {
        header("SCHEDULED",2);
        when(jdbc.queryForList(contains("FROM production_batch_ingredients"),eq(tenant),eq(id)))
                .thenReturn(List.of(Map.of("name","Eggs","compatible",true,"quantity",BigDecimal.TEN,"available",BigDecimal.TEN)));
        service.transition(id,"start",2);
        verify(jdbc).update(contains("UPDATE production_batches"),eq("IN_PROGRESS"),eq("IN_PROGRESS"),eq(tenant),eq(id));
        verify(jdbc,never()).queryForList(contains("FROM recipes"),any(Object[].class));
        verify(jdbc,never()).update(contains("raw_materials"),any(Object[].class));
    }
    @Test void cannotBypassPendingCompletionImplementation() {
        header("IN_PROGRESS",0);
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.transition(id,"complete",0)).getStatusCode().value());
        noWrites();
    }
    @Test void schedulingSnapshotsScaledQuantitiesAndManualOverheads() {
        UUID recipeId = UUID.randomUUID(), material = UUID.randomUUID(), unit = UUID.randomUUID();
        when(jdbc.queryForList(contains("FROM production_batches WHERE"),eq(tenant),eq(id)))
                .thenReturn(List.of(new HashMap<>(Map.of("status","DRAFT","version",0,"recipeId",recipeId,
                        "plannedYield",new BigDecimal("20"),"scheduledDate",java.sql.Date.valueOf("2026-09-24")))));
        when(jdbc.queryForList(contains("FROM recipes r"),eq(tenant),eq(recipeId))).thenReturn(List.of(
                Map.of("name","Cake","yield",new BigDecimal("10"),"unit",unit,"symbol","pc",
                        "labor",new BigDecimal("1000"),"energy",new BigDecimal("500"),"overhead",new BigDecimal("250"))));
        var ingredient = new HashMap<String,Object>();
        ingredient.put("material",material); ingredient.put("quantity",new BigDecimal("5"));
        ingredient.put("waste",BigDecimal.ZERO); ingredient.put("name","Eggs");
        ingredient.put("unit",unit); ingredient.put("symbol","pc"); ingredient.put("cost",new BigDecimal("300"));
        when(jdbc.queryForList(contains("FROM recipe_items i"),eq(tenant),eq(recipeId))).thenReturn(List.of(ingredient));
        service.transition(id,"schedule",0);
        verify(jdbc).update(contains("INSERT INTO production_batch_ingredients"),any(UUID.class),eq(tenant),eq(id),
                eq(material),eq("Eggs"),eq(unit),eq("pc"),eq(new BigDecimal("10.0000")),
                eq(new BigDecimal("300")),eq(new BigDecimal("3000.0000")),isNull());
        verify(jdbc).update(contains("SET recipe_name"),eq("Cake"),eq(unit),eq("pc"),eq(new BigDecimal("2000.0000")),
                eq(new BigDecimal("1000.0000")),eq(new BigDecimal("500.0000")),eq(new BigDecimal("6500.0000")),eq(tenant),eq(id));
        verify(jdbc).update(contains("SET status"),eq("SCHEDULED"),eq("SCHEDULED"),eq(tenant),eq(id));
    }
}
