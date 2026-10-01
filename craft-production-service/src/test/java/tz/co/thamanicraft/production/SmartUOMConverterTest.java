package tz.co.thamanicraft.production;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SmartUOMConverterTest {

    @Test
    void testVolumetricConversion() {
        // 1 Cup = 250ml
        // 1 Liter = 1000ml
        // So 1 Cup is 0.25 Liters
        BigDecimal qty = BigDecimal.ONE;
        
        BigDecimal converted = SmartUOMConverter.convert("cup", "Liters", qty);
        
        // 250 / 1000 = 0.25
        assertEquals(0, new BigDecimal("0.25").compareTo(converted), "1 Cup should be 0.25 Liters");
    }

    @Test
    void testWeightConversion() {
        // 1 kg = 1000g
        // converting 500 grams to kg should be 0.5
        BigDecimal qty = new BigDecimal("500");
        
        BigDecimal converted = SmartUOMConverter.convert("g", "kg", qty);
        
        assertEquals(0, new BigDecimal("0.5").compareTo(converted), "500g should be 0.5 kg");
    }

    @Test
    void testUnknownConversion() {
        // Liters to kg (no density) -> should return original
        BigDecimal qty = new BigDecimal("2");
        BigDecimal converted = SmartUOMConverter.convert("L", "kg", qty);
        
        assertEquals(0, qty.compareTo(converted), "Unknown conversion should return original quantity");
    }
}
