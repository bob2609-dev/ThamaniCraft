package tz.co.thamanicraft.production;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class RecipeCosting {
    private RecipeCosting() {}

    public static BigDecimal line(BigDecimal quantity, BigDecimal cost, BigDecimal waste) {
        return quantity.multiply(cost).multiply(BigDecimal.ONE.add(waste));
    }

    public static BigDecimal perUnit(BigDecimal total, BigDecimal yield) {
        if (yield.signum() <= 0) throw new IllegalArgumentException("Yield must be positive");
        return total.divide(yield, 4, RoundingMode.HALF_UP);
    }
}
