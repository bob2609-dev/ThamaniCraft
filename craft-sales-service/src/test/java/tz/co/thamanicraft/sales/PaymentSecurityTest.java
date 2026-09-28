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

class PaymentSecurityTest {
    @Configuration @EnableMethodSecurity static class Security {}
    void auth(String permission) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("test","unused",List.of(new SimpleGrantedAuthority(permission))));
    }
    @Test void recordingAndReversingHaveSeparatePermissions() {
        var service=mock(PaymentService.class);
        UUID order=UUID.randomUUID(),payment=UUID.randomUUID();
        when(service.record(any(),any())).thenReturn(payment);
        try(var context=new AnnotationConfigApplicationContext()) {
            context.register(Security.class);context.registerBean(PaymentService.class,()->service);
            context.registerBean(PaymentController.class);context.refresh();
            var controller=context.getBean(PaymentController.class);
            auth("PROCESS_SALES");
            assertThrows(AccessDeniedException.class,()->controller.record(order,null));
            auth("RECORD_PAYMENTS");controller.record(order,null);
            assertThrows(AccessDeniedException.class,()->controller.reverse(order,payment,null));
            auth("REVERSE_PAYMENTS");controller.reverse(order,payment,null);
            verify(service).reverse(order,payment,null);
        } finally {SecurityContextHolder.clearContext();}
    }
}
