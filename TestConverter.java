import java.math.BigDecimal;
import java.math.RoundingMode;

public class TestConverter {
    public static void main(String[] args) {
        System.out.println(convert("Kg", "gm", new BigDecimal("7.5")));
        System.out.println(convert("Lt", "ml", new BigDecimal("1.5")));
    }
    
    public static BigDecimal convert(String fromSymbol, String toSymbol, BigDecimal quantity) {
        if (fromSymbol == null || toSymbol == null || fromSymbol.equalsIgnoreCase(toSymbol)) {
            return quantity;
        }
        
        String from = fromSymbol.toLowerCase().trim();
        String to = toSymbol.toLowerCase().trim();
        
        BigDecimal fromInML = getVolumetricInML(from);
        BigDecimal toInML = getVolumetricInML(to);
        
        if (fromInML != null && toInML != null) {
            return quantity.multiply(fromInML).divide(toInML, 6, RoundingMode.HALF_UP);
        }
        
        BigDecimal fromInGrams = getWeightInGrams(from);
        BigDecimal toInGrams = getWeightInGrams(to);
        
        if (fromInGrams != null && toInGrams != null) {
            return quantity.multiply(fromInGrams).divide(toInGrams, 6, RoundingMode.HALF_UP);
        }
        
        BigDecimal fromInPieces = getCountInPieces(from);
        BigDecimal toInPieces = getCountInPieces(to);
        
        if (fromInPieces != null && toInPieces != null) {
            return quantity.multiply(fromInPieces).divide(toInPieces, 6, RoundingMode.HALF_UP);
        }
        
        return quantity;
    }
    
    private static BigDecimal getVolumetricInML(String symbol) {
        switch (symbol) {
            case "ml": case "mililitre": return BigDecimal.ONE;
            case "l": case "lt": case "liter": case "liters": case "litre": return BigDecimal.valueOf(1000);
            case "cup": case "cups": case "cp": return BigDecimal.valueOf(250);
            case "tbsp": case "tablespoon": return BigDecimal.valueOf(15);
            case "tsp": case "teaspoon": return BigDecimal.valueOf(5);
            case "fl oz": case "fluid ounce": return BigDecimal.valueOf(29.5735);
            case "gal": case "gallon": return BigDecimal.valueOf(3785.41);
            case "qt": case "quart": return BigDecimal.valueOf(946.353);
            case "pt": case "pint": return BigDecimal.valueOf(473.176);
            default: return null;
        }
    }
    
    private static BigDecimal getWeightInGrams(String symbol) {
        switch (symbol) {
            case "g": case "gm": case "gram": case "grams": return BigDecimal.ONE;
            case "mg": case "milligram": return new BigDecimal("0.001");
            case "mcg": case "microgram": return new BigDecimal("0.000001");
            case "kg": case "kilogram": case "kilograms": return BigDecimal.valueOf(1000);
            case "oz": case "ounce": case "ounces": return BigDecimal.valueOf(28.3495);
            case "lb": case "lbs": case "pound": case "pounds": return BigDecimal.valueOf(453.592);
            default: return null;
        }
    }

    private static BigDecimal getCountInPieces(String symbol) {
        switch (symbol) {
            case "pc": case "piece": case "pieces": case "pkt": case "packet": case "box": case "bag": case "sack / bag": return BigDecimal.ONE;
            case "doz": case "dozen": return BigDecimal.valueOf(12);
            case "tray": case "tray of 30 eggs": return BigDecimal.valueOf(30);
            default: return null;
        }
    }
}
