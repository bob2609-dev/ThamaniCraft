        package tz.co.thamanicraft.inventory.entity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.bytecode.internal.bytebuddy.BytecodeProviderImpl;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UnitOfMeasureSerializationTest {
    @Test
    void serializesTopLevelProxyAndTrayConversionWithoutHibernateInternals() throws Exception {
        var piece = UnitOfMeasure.builder().id(UUID.randomUUID()).name("Piece")
                .symbol("pc").category("COUNT").conversionFactor(BigDecimal.ONE).build();
        var factory = new BytecodeProviderImpl().getProxyFactoryFactory().buildProxyFactory(null);
        factory.postInstantiate(UnitOfMeasure.class.getName(), UnitOfMeasure.class,
                Set.of(HibernateProxy.class), UnitOfMeasure.class.getMethod("getId"),
                UnitOfMeasure.class.getMethod("setId", UUID.class), null);
        var proxy = factory.getProxy(piece.getId(), null);
        proxy.getHibernateLazyInitializer().setImplementation(piece);
        var tray = UnitOfMeasure.builder().id(UUID.randomUUID()).name("Tray of 30 Eggs")
                .symbol("tray30").category("COUNT").conversionFactor(new BigDecimal("30"))
                .baseUnit((UnitOfMeasure) proxy).build();

        var mapper = new ObjectMapper();
        var json = mapper.writeValueAsString(List.of(tray, proxy));
        var units = mapper.readTree(json);
        assertEquals("pc", units.get(1).get("symbol").asText());
        assertEquals("pc", units.get(0).get("baseUnit").get("symbol").asText());
        assertEquals(30, units.get(0).get("conversionFactor").asInt());
        assertFalse(json.contains("hibernateLazyInitializer"));
        assertFalse(json.contains("handler"));
    }
}
