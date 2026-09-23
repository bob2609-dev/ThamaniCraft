package tz.co.thamanicraft.sales;
import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SalesTest {
    private final JdbcTemplate jdbc=mock(JdbcTemplate.class);
    private final SalesService service=new SalesService(jdbc);
    private final UUID tenant=UUID.randomUUID(),customer=UUID.randomUUID();
    private BigDecimal n(String s){return new BigDecimal(s);}
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void upfrontFixedDiscountReducesTotal() {
        assertEquals(n("95000"),OrderTotals.total(n("100000"),n("5000"),n("10000"),n("30000")));
    }
    @Test void invalidDiscountAndDepositRejected() {
        assertThrows(ResponseStatusException.class,()->OrderTotals.total(n("100"),n("0"),n("101"),n("0")));
        assertThrows(ResponseStatusException.class,()->OrderTotals.total(n("100"),n("0"),n("-1"),n("0")));
        assertThrows(ResponseStatusException.class,()->OrderTotals.total(n("100"),n("0"),n("10"),n("100")));
    }
    @Test void lineAmountsRoundToTwoDecimals() {
        assertEquals(n("10.01"),OrderTotals.line(new SalesRequests.Item("Cake",n("1.001"),"piece",n("10"),null)));
    }
    @Test void quickCustomerOnlyNeedsNameAndPhone() {
        try(var factory=jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var validator=factory.getValidator();
            assertTrue(validator.validate(new SalesRequests.Customer("Asha","+255700000001",null,null,null,0)).isEmpty());
            assertFalse(validator.validate(new SalesRequests.Customer("Asha"," ",null,null,null,0)).isEmpty());
        }
    }
    @Test void missingTenantRejected() {
        assertThrows(ResponseStatusException.class,service::customers);
        verifyNoInteractions(jdbc);
    }
    @Test void customerEditIsTenantAndVersionScoped() {
        TenantContext.setCurrentTenant(tenant);
        assertThrows(ResponseStatusException.class,()->service.saveCustomer(customer,
                new SalesRequests.Customer("Asha","0700000001",null,null,null,2)));
        verify(jdbc).update(contains("WHERE tenant_id=? AND id=? AND version=?"),eq("Asha"),eq("0700000001"),
                isNull(),isNull(),isNull(),eq(tenant),eq(customer),eq(2));
    }
    private SalesRequests.Order order() {
        return new SalesRequests.Order(UUID.randomUUID(),customer,OffsetDateTime.parse("2026-10-01T10:00:00+03:00"),
                "COLLECTION",null,null,null,n("0"),n("10"),n("0"),
                List.of(new SalesRequests.Item("Cake",n("1"),"piece",n("100"),null)));
    }
    @Test void foreignCustomerCannotBeUsedInOrder() {
        TenantContext.setCurrentTenant(tenant);
        assertThrows(ResponseStatusException.class,()->service.createOrder(order()));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void duplicateSubmissionDoesNotInsertItems() {
        TenantContext.setCurrentTenant(tenant);
        when(jdbc.queryForList(anyString(),eq(tenant),eq(customer))).thenReturn(List.of(Map.of("name","Asha","phone","0700000001")));
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.createOrder(order())).getStatusCode().value());
        verify(jdbc,never()).update(contains("INSERT INTO sales.order_items"),any(Object[].class));
    }
    @Test void orderStoresContactSnapshotAndDiscountedTotal() {
        TenantContext.setCurrentTenant(tenant);
        UUID actor=UUID.randomUUID(); TenantContext.setCurrentUserId(actor);
        when(jdbc.queryForList(anyString(),eq(tenant),eq(customer))).thenReturn(List.of(Map.of("name","Asha","phone","0700000001")));
        when(jdbc.update(anyString(),any(Object[].class))).thenReturn(1);
        var request=order();
        UUID id=service.createOrder(request);
        verify(jdbc).update(contains("INSERT INTO sales.orders"),eq(id),eq(tenant),eq(request.requestId()),eq(customer),
                eq("Asha"),eq("0700000001"),isNull(),eq(request.dueAt()),eq("COLLECTION"),isNull(),isNull(),isNull(),
                eq(n("100.00")),eq(n("0")),eq(n("10")),eq(n("90.00")),eq(n("0")),eq(actor));
        verify(jdbc,never()).update(contains("UPDATE sales.customers"),any(Object[].class));
    }
}
