package tz.co.thamanicraft.production;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class WorkOrderMath {
    private WorkOrderMath() {
    }

    static BigDecimal scale(BigDecimal amount, BigDecimal planned, BigDecimal yield) {
        return amount.multiply(planned).divide(yield, 4, RoundingMode.HALF_UP);
    }

    static BigDecimal quantity(BigDecimal amount, BigDecimal waste, BigDecimal planned, BigDecimal yield) {
        return amount.multiply(BigDecimal.ONE.add(waste)).multiply(planned).divide(yield, 4, RoundingMode.CEILING);
    }
}
