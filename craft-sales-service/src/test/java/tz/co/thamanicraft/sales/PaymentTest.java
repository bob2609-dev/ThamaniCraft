package tz.co.thamanicraft.sales;
import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentTest {
    final JdbcTemplate jdbc=mock(JdbcTemplate.class);
    final FinanceClient financeClient=mock(FinanceClient.class);
    final PaymentService service=new PaymentService(jdbc, financeClient);
    final UUID tenant=UUID.randomUUID(),order=UUID.randomUUID(),key=UUID.randomUUID();
    final OffsetDateTime date=OffsetDateTime.parse("2026-09-01T12:00:00+03:00");
    PaymentService.Receipt receipt(String amount) {return new PaymentService.Receipt(key,new BigDecimal(amount),date,"CASH",null);}
    @BeforeEach void setup() {
        TenantContext.setCurrentTenant(tenant);TenantContext.setCurrentUserId(UUID.randomUUID());
        when(jdbc.queryForList(contains("FOR UPDATE"),eq(tenant),eq(order))).thenReturn(List.of(Map.of("status","NEW","total",new BigDecimal("67500"))));
        when(jdbc.queryForObject(anyString(),eq(BigDecimal.class),eq(order))).thenReturn(new BigDecimal("40000"));
    }
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void remainingBalanceAccepted() {
        assertNotNull(service.record(order,receipt("27500"), "token"));
        verify(jdbc).update(contains("INSERT INTO sales.order_payments"),any(Object[].class));
    }
    @Test void overpaymentRejectedWithoutWrites() {
        assertThrows(ResponseStatusException.class,()->service.record(order,receipt("27500.01"), "token"));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void zeroRejected() {
        assertThrows(ResponseStatusException.class,()->service.record(order,receipt("0"), "token"));
    }
    @Test void cancelledOrderRejected() {
        when(jdbc.queryForList(contains("FOR UPDATE"),eq(tenant),eq(order))).thenReturn(List.of(Map.of("status","CANCELLED","total",new BigDecimal("67500"))));
        assertThrows(ResponseStatusException.class,()->service.record(order,receipt("1"), "token"));
    }
    @Test void foreignOrderRejected() {
        when(jdbc.queryForList(contains("FOR UPDATE"),eq(tenant),eq(order))).thenReturn(List.of());
        assertThrows(ResponseStatusException.class,()->service.record(order,receipt("1"), "token"));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void sameSubmissionReturnsOriginalReceiptWithoutWrite() {
        UUID id=UUID.randomUUID();
        var row=new HashMap<String,Object>();
        row.put("id",id);row.put("amount",new BigDecimal("10"));row.put("received_at",java.sql.Timestamp.from(date.toInstant()));row.put("method","CASH");
        when(jdbc.queryForList(contains("request_id=?"),eq(order),eq(key))).thenReturn(List.of(row));
        assertEquals(id,service.record(order,receipt("10"), "token"));
        assertThrows(ResponseStatusException.class,()->service.record(order,receipt("11"), "token"));
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void repeatedReversalDoesNotChangeVersion() {
        UUID payment=UUID.randomUUID();
        when(jdbc.queryForList(contains("WHERE order_id=? AND id=?"),eq(order),eq(payment))).thenReturn(List.of(Map.of("id",payment, "amount", new BigDecimal("10"))));
        service.reverse(order,payment,new PaymentService.Reversal("Mistake"), "token");
        verify(jdbc,never()).update(contains("UPDATE sales.orders"),any(Object[].class));
    }
    @Test void validationRejectsMissingOrFuturePaymentDetails() {
        try(var factory=jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var validator=factory.getValidator();
            assertFalse(validator.validate(new PaymentService.Receipt(key,BigDecimal.ONE,OffsetDateTime.now().plusDays(1),"CASH",null)).isEmpty());
            assertFalse(validator.validate(new PaymentService.Reversal(" ")).isEmpty());
            assertFalse(validator.validate(receipt("1.001")).isEmpty());
        }
    }
}
