package tz.co.thamanicraft.sales;

import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderLifecycleTest {
    final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    final InventoryDispatchClient dispatchClient = mock(InventoryDispatchClient.class);
    final FinanceClient financeClient = mock(FinanceClient.class);
    final SalesService service = new SalesService(jdbc, dispatchClient, financeClient,
            mock(ProductionRecipeClient.class), mock(tz.co.thamanicraft.sales.amqp.SalesEventPublisher.class));
    final UUID tenant = UUID.randomUUID(), id = UUID.randomUUID();

    @BeforeEach
    void setup() {
        TenantContext.setCurrentTenant(tenant);
        TenantContext.setCurrentUserId(UUID.randomUUID());
    }

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    void existing(String status, int version) {
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(tenant), eq(id)))
                .thenReturn(List.of(Map.of("status", status, "version", version, "discount_amount", BigDecimal.TEN)));
    }

    @Test
    void confirmAuditsAndIncrementsVersion() {
        existing("NEW", 0);
        service.transition(id, "confirm", new SalesRequests.Transition(0, "Agreed with customer"), "token");
        verify(jdbc).update(contains("version=version+1"), eq("CONFIRMED"), eq(tenant), eq(id));
        verify(jdbc).update(contains("INSERT INTO sales.order_history"), any(Object[].class));
    }

    @Test
    void staleTransitionDoesNotWrite() {
        existing("NEW", 1);
        assertEquals(409,
                assertThrows(ResponseStatusException.class,
                        () -> service.transition(id, "confirm", new SalesRequests.Transition(0, "Confirm"), "token"))
                        .getStatusCode().value());
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void foreignOrderNotFound() {
        assertEquals(404,
                assertThrows(ResponseStatusException.class,
                        () -> service.transition(id, "cancel", new SalesRequests.Transition(0, "Cancel"), "token"))
                        .getStatusCode().value());
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void productionOrderCannotCancel() {
        existing("IN_PRODUCTION", 0);
        assertThrows(ResponseStatusException.class,
                () -> service.transition(id, "cancel", new SalesRequests.Transition(0, "Cancel"), "token"));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void confirmedOrderCanCancelWithoutDeletingHistory() {
        existing("CONFIRMED", 2);
        service.transition(id, "cancel", new SalesRequests.Transition(2, "Customer cancelled"), "token");
        verify(jdbc).update(contains("version=version+1"), eq("CANCELLED"), eq(tenant), eq(id));
        verify(jdbc, never()).update(contains("DELETE"), any(Object[].class));
    }

    @Test
    void confirmedOrderCannotEdit() {
        existing("CONFIRMED", 0);
        assertThrows(ResponseStatusException.class,
                () -> service.editOrder(id, new SalesRequests.Edit(0, null, "Change"), "token"));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void fulfillConfirmedOrderDispatchesFinishedProducts() {
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(tenant), eq(id)))
                .thenReturn(List.of(Map.of("status", "CONFIRMED", "version", 1, "fulfillment_status", "UNFULFILLED",
                        "discount_amount", BigDecimal.ZERO)));
        UUID fpId = UUID.randomUUID();
        when(jdbc.queryForList(contains("sales.order_items"), eq(id)))
                .thenReturn(List.of(Map.of("finished_product_id", fpId, "quantity", new BigDecimal("5.0"),
                        "description", "Chocolate Cake")));

        service.fulfillOrder(id, new SalesRequests.Fulfill(1, "John Driver", "Delivered to shop"), "Bearer token");

        verify(dispatchClient).dispatch(eq(fpId), eq(new BigDecimal("5.0")), contains("Order ORD-"),
                eq("Delivered to shop"), eq("Bearer token"));
        verify(jdbc).update(contains("fulfillment_status='FULFILLED'"), any(UUID.class), eq("John Driver"),
                eq("Delivered to shop"), eq(tenant), eq(id));
    }

    SalesRequests.Order request(UUID customer) {
        return new SalesRequests.Order(UUID.randomUUID(), customer,
                java.time.OffsetDateTime.parse("2026-10-01T10:00:00+03:00"),
                "COLLECTION", null, "Updated notes", null, BigDecimal.ZERO, new BigDecimal("20"), BigDecimal.ZERO,
                List.of(new SalesRequests.Item("Cake", BigDecimal.ONE, "piece", new BigDecimal("100"), null, null, null,
                        null, null)));
    }

    @Test
    void editRecalculatesAndAuditsWithoutChangingContactSnapshot() {
        UUID customer = UUID.randomUUID();
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(tenant), eq(id)))
                .thenReturn(List.of(Map.of("status", "NEW", "version", 0, "customer_id", customer, "discount_amount",
                        BigDecimal.TEN)));
        var order = request(customer);
        service.editOrder(id, new SalesRequests.Edit(0, order, "Negotiated discount"), "token");
        verify(jdbc).update(contains("UPDATE sales.orders SET due_at"), eq(order.dueAt()), eq("COLLECTION"), isNull(),
                eq("Updated notes"), isNull(), eq(new BigDecimal("100.00")), eq(BigDecimal.ZERO),
                eq(new BigDecimal("20")),
                eq(new BigDecimal("80.00")), eq(BigDecimal.ZERO), eq(tenant), eq(id));
        verify(jdbc).update(contains("INSERT INTO sales.order_history"), any(UUID.class), eq(id), eq("EDITED"),
                eq("Negotiated discount"), eq(BigDecimal.TEN), eq(new BigDecimal("20")), any(UUID.class));
        verify(jdbc, never()).update(contains("customer_name="), any(Object[].class));
    }

    @Test
    void editCannotReplaceBookedCustomer() {
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(tenant), eq(id)))
                .thenReturn(List.of(Map.of("status", "NEW", "version", 0, "customer_id", UUID.randomUUID())));
        assertThrows(ResponseStatusException.class,
                () -> service.editOrder(id, new SalesRequests.Edit(0, request(UUID.randomUUID()), "Change"), "token"));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }
}
