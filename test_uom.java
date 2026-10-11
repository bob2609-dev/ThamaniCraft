import tz.co.thamanicraft.inventory.service.SmartUOMConverter;
import java.math.BigDecimal;

public class test_uom {
    public static void main(String[] args) {
        System.out.println(SmartUOMConverter.convert("Kg", "gm", new BigDecimal("7.5")));
        System.out.println(SmartUOMConverter.convert("gm", "Kg", new BigDecimal("7500")));
    }
}
