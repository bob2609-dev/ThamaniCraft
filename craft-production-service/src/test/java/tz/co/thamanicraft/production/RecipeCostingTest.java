package tz.co.thamanicraft.production;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class RecipeCostingTest {
    @Test void flourIncludesWasteInBaseUnits() {
        assertEquals(0, new BigDecimal("45900").compareTo(RecipeCosting.line(
                new BigDecimal("25000"), new BigDecimal("1.80"), new BigDecimal("0.02"))));
    }
    @Test void batchCostIsDividedByYield() {
        assertEquals(new BigDecimal("1820.0000"), RecipeCosting.perUnit(new BigDecimal("91000"), new BigDecimal("50")));
    }
    @Test void invalidYieldIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> RecipeCosting.perUnit(BigDecimal.TEN, BigDecimal.ZERO));
    }
}
