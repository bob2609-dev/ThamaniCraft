package tz.co.thamanicraft.finance;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class FinanceSecurityTest {
    @Configuration @EnableMethodSecurity static class Security {}
    @Test void financeRecordsRequireFinancePermissions() {
        var service = mock(FinanceService.class);
        var expense = new FinanceRequests.Expense("Rent","RENT",LocalDate.now(),BigDecimal.TEN,null,null);
        when(service.saveExpense(null,expense)).thenReturn(UUID.randomUUID());
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(Security.class);
            context.registerBean(FinanceService.class,()->service);
            context.registerBean(FinanceController.class);
            context.refresh();
            var controller = context.getBean(FinanceController.class);
            authenticate("VIEW_RECIPES");
            assertThrows(AccessDeniedException.class,controller::assets);
            assertThrows(AccessDeniedException.class,controller::expenses);
            authenticate("VIEW_FINANCE");
            controller.expenses();
            assertThrows(AccessDeniedException.class,()->controller.createExpense(expense));
            authenticate("MANAGE_FINANCE");
            controller.createExpense(expense);
            authenticate("ROLE_OWNER");
            controller.assets(); controller.createExpense(expense);
            verify(service,times(2)).saveExpense(null,expense);
        } finally { SecurityContextHolder.clearContext(); }
    }
    private void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("test","unused",List.of(new SimpleGrantedAuthority(authority))));
    }
}
