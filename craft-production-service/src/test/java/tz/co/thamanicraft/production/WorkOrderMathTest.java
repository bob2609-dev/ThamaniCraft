package tz.co.thamanicraft.production;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class WorkOrderMathTest {
    private BigDecimal n(String value) { return new BigDecimal(value); }
    @Test void eggsStayInPiecesWhenOutputDoubles() {
        assertEquals(n("10.0000"),WorkOrderMath.quantity(n("5"),BigDecimal.ZERO,n("20"),n("10")));
    }
    @Test void wasteAllowanceIsIncludedOnce() {
        assertEquals(n("10.5000"),WorkOrderMath.quantity(n("5"),n("0.05"),n("20"),n("10")));
    }
    @Test void fractionalRequirementRoundsUpToInventoryPrecision() {
        assertEquals(n("0.3334"),WorkOrderMath.quantity(BigDecimal.ONE,BigDecimal.ZERO,BigDecimal.ONE,n("3")));
    }
    @Test void overheadScalesWithOutputRatherThanNumberOfOrders() {
        assertEquals(n("1500.0000"),WorkOrderMath.scale(n("1000"),n("15"),n("10")));
    }
}
