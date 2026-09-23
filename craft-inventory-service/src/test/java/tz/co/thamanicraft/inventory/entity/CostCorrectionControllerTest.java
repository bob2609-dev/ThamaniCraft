package tz.co.thamanicraft.inventory.entity;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;
import tz.co.thamanicraft.inventory.controller.CostCorrectionController;
import tz.co.thamanicraft.inventory.dto.CostCorrectionRequest;
import tz.co.thamanicraft.inventory.service.CostCorrectionService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CostCorrectionControllerTest {
    @Configuration @EnableMethodSecurity
    static class SecurityConfig {}

    @Test void requiresAdjustmentPermissionOrOwner() {
        var service = mock(CostCorrectionService.class);
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(SecurityConfig.class);
            context.registerBean(CostCorrectionService.class, () -> service);
            context.registerBean(CostCorrectionController.class);
            context.refresh();
            var controller = context.getBean(CostCorrectionController.class);
            var id = UUID.randomUUID();
            var request = new CostCorrectionRequest(BigDecimal.ONE, BigDecimal.TEN, UUID.randomUUID(), "Correction");
            authenticate("VIEW_INVENTORY");
            assertThrows(AccessDeniedException.class, () -> controller.correct(id, request));
            verifyNoInteractions(service);
            authenticate("ADJUST_INVENTORY");
            controller.correct(id, request);
            authenticate("ROLE_OWNER");
            controller.correct(id, request);
            verify(service, times(2)).correct(id, request);
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void rejectsInvalidHttpPayloadBeforeSaving() throws Exception {
        var service = mock(CostCorrectionService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new CostCorrectionController(service)).build();
        mvc.perform(patch("/raw-materials/" + UUID.randomUUID() + "/cost")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"costPerBaseUnit\":-1,\"reason\":\" \"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    private void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "unused", List.of(new SimpleGrantedAuthority(authority))));
    }
}
