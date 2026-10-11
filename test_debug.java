import java.math.BigDecimal;
import java.math.RoundingMode;

public class test_debug {
    public static void main(String[] args) {
        String fromSymbol = "Kg";
        String toSymbol = "gm";
        BigDecimal quantity = new BigDecimal("7.5");
        
        if (fromSymbol == null || toSymbol == null || fromSymbol.equalsIgnoreCase(toSymbol)) {
            System.out.println("Returned early");
        }
        
        String from = fromSymbol.toLowerCase().trim();
        String to = toSymbol.toLowerCase().trim();
        
        BigDecimal fromInML = getVolumetricInML(from);
        BigDecimal toInML = getVolumetricInML(to);
        
        System.out.println("fromInML: " + fromInML);
        System.out.println("toInML: " + toInML);
        
        BigDecimal fromInGrams = getWeightInGrams(from);
        BigDecimal toInGrams = getWeightInGrams(to);
        
        System.out.println("fromInGrams: " + fromInGrams);
        System.out.println("toInGrams: " + toInGrams);
    }
    
    private static BigDecimal getVolumetricInML(String symbol) {
        return switch (symbol) {
            case "ml", "mililitre" -> BigDecimal.ONE;
            case "l", "lt", "liter", "liters", "litre" -> BigDecimal.valueOf(1000);
            case "cup", "cups", "cp" -> BigDecimal.valueOf(250);
            case "tbsp", "tablespoon" -> BigDecimal.valueOf(15);
            case "tsp", "teaspoon" -> BigDecimal.valueOf(5);
            case "fl oz", "fluid ounce" -> BigDecimal.valueOf(29.5735);
            case "gal", "gallon" -> BigDecimal.valueOf(3785.41);
            case "qt", "quart" -> BigDecimal.valueOf(946.353);
            case "pt", "pint" -> BigDecimal.valueOf(473.176);
            default -> null;
        };
    }
    
    private static BigDecimal getWeightInGrams(String symbol) {
        return switch (symbol) {
            case "g", "gm", "gram", "grams" -> BigDecimal.ONE;
            case "mg", "milligram" -> new BigDecimal("0.001");
            case "mcg", "microgram" -> new BigDecimal("0.000001");
            case "kg", "kilogram", "kilograms" -> BigDecimal.valueOf(1000);
            case "oz", "ounce", "ounces" -> BigDecimal.valueOf(28.3495);
            case "lb", "lbs", "pound", "pounds" -> BigDecimal.valueOf(453.592);
            default -> null;
        };
    }
}
