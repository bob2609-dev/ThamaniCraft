package tz.co.thamanicraft.production;

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
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkOrderSecurityTest {
    @Configuration @EnableMethodSecurity static class Security {}
    @Test void viewingPermissionDoesNotAuthorizeTransitions() {
        var service = mock(WorkOrderService.class);
        UUID id = UUID.randomUUID();
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(Security.class);
            context.registerBean(WorkOrderService.class,()->service);
            context.registerBean(WorkOrderController.class);
            context.refresh();
            var controller = context.getBean(WorkOrderController.class);
            authenticate("VIEW_PRODUCTION");
            controller.list();
            assertThrows(AccessDeniedException.class,()->controller.transition(id,"cancel",new WorkOrderRequest.Transition(0)));
            authenticate("EXECUTE_PRODUCTION");
            controller.transition(id,"cancel",new WorkOrderRequest.Transition(0));
            authenticate("VIEW_RECIPES");
            assertThrows(AccessDeniedException.class,controller::list);
            verify(service).transition(id,"cancel",0);
        } finally { SecurityContextHolder.clearContext(); }
    }
    private void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("test","unused",List.of(new SimpleGrantedAuthority(authority))));
    }
}
