package tz.co.thamanicraft.sales;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class SalesSecurityTest {
    @Configuration
    @EnableMethodSecurity
    static class Security {
    }

    @Test
    void customerCreationRequiresSalesWritePermission() {
        var service = mock(SalesService.class);
        var customer = new SalesRequests.Customer("Asha", "0700000001", null, null, null, 0);
        when(service.saveCustomer(null, customer)).thenReturn(UUID.randomUUID());
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(Security.class);
            context.registerBean(SalesService.class, () -> service);
            context.registerBean(SalesController.class);
            context.refresh();
            var controller = context.getBean(SalesController.class);
            authenticate("VIEW_SALES");
            controller.customers();
            assertThrows(AccessDeniedException.class, () -> controller.createCustomer(customer));
            UUID orderId = UUID.randomUUID();
            var transition = new SalesRequests.Transition(0, "Confirmed");
            assertThrows(AccessDeniedException.class,
                    () -> controller.transition(orderId, "confirm", transition, "token"));
            assertThrows(AccessDeniedException.class, () -> controller.edit(orderId, null, null));
            authenticate("PROCESS_SALES");
            controller.createCustomer(customer);
            controller.transition(orderId, "confirm", transition, "token");
            verify(service).transition(orderId, "confirm", transition, "token");
            verify(service).saveCustomer(null, customer);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("test", "unused",
                List.of(new SimpleGrantedAuthority(authority))));
    }
}
