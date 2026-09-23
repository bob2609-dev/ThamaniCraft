package tz.co.thamanicraft.finance;
import com.thamanicraft.security.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FinanceServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final FinanceService service = new FinanceService(jdbc);
    private final UUID tenant = UUID.randomUUID();
    private final FinanceRequests.Expense expense = new FinanceRequests.Expense("September rent","RENT",
            LocalDate.of(2026,9,22),new BigDecimal("500000"),"R-1","Paid for September");
    @AfterEach void cleanup() { TenantContext.clear(); }

    @Test void listsOnlyTenantRecordsWithoutCalculatedValues() {
        TenantContext.setCurrentTenant(tenant);
        when(jdbc.queryForList(anyString(),eq(tenant))).thenReturn(List.of());
        assertEquals(List.of(),service.assets());
        assertEquals(List.of(),service.expenses());
        assertEquals(List.of(),service.leases());
        verify(jdbc).queryForList(contains("FROM finance.fixed_assets WHERE tenant_id=?"),eq(tenant));
        verify(jdbc).queryForList(contains("FROM finance.expenses WHERE tenant_id=?"),eq(tenant));
        verify(jdbc).queryForList(contains("FROM finance.facility_leases WHERE tenant_id=?"),eq(tenant));
        verifyNoMoreInteractions(jdbc);
    }
    @Test void assetUpdateIsTenantScoped() {
        TenantContext.setCurrentTenant(tenant);
        UUID id = UUID.randomUUID();
        var request = new FinanceRequests.Asset("Oven","MACHINERY",LocalDate.now(),BigDecimal.TEN,"ACTIVE",null,null);
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.saveAsset(id,request)).getStatusCode().value());
        verify(jdbc).update(contains("WHERE id=? AND tenant_id=?"),eq("Oven"),eq("MACHINERY"),any(),eq(BigDecimal.TEN),
                eq("ACTIVE"),isNull(),isNull(),isNull(),eq(id),eq(tenant));
    }
    @Test void expenseCreationRecordsExactAmountDateAndUser() {
        TenantContext.setCurrentTenant(tenant);
        UUID user = UUID.randomUUID();
        TenantContext.setCurrentUserId(user);
        UUID id = service.saveExpense(null,expense);
        verify(jdbc).update(contains("INSERT INTO finance.expenses"),eq(id),eq(tenant),eq(expense.title()),
                eq("RENT"),eq(java.sql.Date.valueOf(expense.expenseDate())),eq(expense.amount()),eq("R-1"),
                eq(expense.notes()),eq(user),eq(user));
        verifyNoMoreInteractions(jdbc);
    }
    @Test void foreignExpenseUpdateIsNotFound() {
        TenantContext.setCurrentTenant(tenant);
        UUID id = UUID.randomUUID();
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.saveExpense(id,expense)).getStatusCode().value());
        verify(jdbc).update(contains("WHERE id=? AND tenant_id=?"),eq(expense.title()),eq("RENT"),any(),eq(expense.amount()),
                eq("R-1"),eq(expense.notes()),isNull(),eq(id),eq(tenant));
    }
    @Test void missingTenantRejected() {
        assertThrows(ResponseStatusException.class,service::assets);
        assertThrows(ResponseStatusException.class,service::expenses);
        assertThrows(ResponseStatusException.class,()->service.saveExpense(null,expense));
        verifyNoInteractions(jdbc);
    }
    @Test void validatesManualAmountsWithoutProjectionFields() {
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(expense).isEmpty());
            assertTrue(validator.validate(new FinanceRequests.Asset("Oven","MACHINERY",LocalDate.now(),
                    BigDecimal.TEN,"ACTIVE",null,null)).isEmpty());
            assertFalse(validator.validate(new FinanceRequests.Expense("Rent","RENT",LocalDate.now(),
                    BigDecimal.ONE.negate(),null,null)).isEmpty());
        }
    }
}
