package tz.co.thamanicraft.sales;
import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderRecipeMappingTest {
    final JdbcTemplate jdbc=mock(JdbcTemplate.class);
    final ProductionWorkOrderClient workOrderClient=mock(ProductionWorkOrderClient.class);
    final OrderRecipeMappingService service=new OrderRecipeMappingService(jdbc, workOrderClient);
    final UUID tenant=UUID.randomUUID(),order=UUID.randomUUID(),item=UUID.randomUUID(),recipeId=UUID.randomUUID(),unit=UUID.randomUUID();
    final ProductionRecipeClient.Recipe recipe=new ProductionRecipeClient.Recipe(recipeId,"Cake",unit,"kg",new BigDecimal("1"),
        new ProductionRecipeClient.Costing(new BigDecimal("15000")));
    @BeforeEach void setup() {TenantContext.setCurrentTenant(tenant);TenantContext.setCurrentUserId(UUID.randomUUID());}
    @AfterEach void cleanup(){TenantContext.clear();}
    OrderRecipeMappingService.Request request(int version) {return new OrderRecipeMappingService.Request(recipeId,version,BigDecimal.ONE);}
    void header(String status) {
        when(jdbc.queryForList(contains("FOR UPDATE"),eq(tenant),eq(order))).thenReturn(List.of(Map.of("version",0,"status",status)));
    }
    @Test void twoOneKgCakesProduceTwoKgAndSnapshotCost() {
        header("CONFIRMED");
        when(jdbc.queryForList(contains("SELECT quantity"),eq(order),eq(item))).thenReturn(List.of(Map.of("quantity",new BigDecimal("2"))));
        service.save(order,item,request(0),recipe);
        verify(jdbc).update(contains("INSERT INTO sales.order_recipe_mappings"),eq(item),eq(recipeId),eq("Cake"),eq(unit),eq("kg"),
            eq(BigDecimal.ONE),eq(new BigDecimal("2.0000")),eq(new BigDecimal("30000.0000")),any(UUID.class));
    }
    @Test void quantityLimitsRejectRoundedZeroAndOverflow() {
        assertThrows(ResponseStatusException.class,()->OrderRecipeMappingService.plannedOutput(new BigDecimal(".0001"),new BigDecimal(".0001")));
        assertThrows(ResponseStatusException.class,()->OrderRecipeMappingService.plannedOutput(new BigDecimal("99999999"),new BigDecimal("100")));
    }
    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.CsvSource({"NEW,0","NEW,40000","NEW,67500","CONFIRMED,0","CONFIRMED,40000","CONFIRMED,67500"})
    void mappingDoesNotRequireAnyPayment(String status,String paid) {
        when(jdbc.queryForList(contains("FOR UPDATE"),eq(tenant),eq(order))).thenReturn(List.of(Map.of(
            "version",0,"status",status,"total",new BigDecimal("67500"),"netPaid",new BigDecimal(paid))));
        when(jdbc.queryForList(contains("SELECT quantity"),eq(order),eq(item))).thenReturn(List.of(Map.of("quantity",BigDecimal.ONE)));
        service.save(order,item,request(0),recipe);
        verify(jdbc).update(contains("INSERT INTO sales.order_recipe_mappings"),any(Object[].class));
        verify(jdbc,never()).queryForObject(contains("order_payments"),eq(BigDecimal.class),eq(order));
    }
    @Test void staleOrderDoesNotWrite() {
        header("NEW");
        assertThrows(ResponseStatusException.class,()->service.save(order,item,request(1),recipe));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void cancelledOrderDoesNotWrite() {
        header("CANCELLED");
        assertThrows(ResponseStatusException.class,()->service.save(order,item,request(0),recipe));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void foreignOrderOrItemDoesNotWrite() {
        assertThrows(ResponseStatusException.class,()->service.save(order,item,request(0),recipe));
        header("NEW");
        assertThrows(ResponseStatusException.class,()->service.save(order,item,request(0),recipe));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
}
