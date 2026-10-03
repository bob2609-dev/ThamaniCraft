package tz.co.thamanicraft.production;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class SmartUOMConverter {

    /**
     * Converts a quantity from the recipe unit to the purchase unit to determine its cost.
     * For example, if purchase is Liters (L) and recipe uses Cups (cup), 
     * this returns how much of a Liter 1 cup is, so the cost can be prorated.
     */
    public static BigDecimal convert(String fromSymbol, String toSymbol, BigDecimal quantity) {
        if (fromSymbol == null || toSymbol == null || fromSymbol.equalsIgnoreCase(toSymbol)) {
            return quantity;
        }
        
        String from = fromSymbol.toLowerCase().trim();
        String to = toSymbol.toLowerCase().trim();
        
        // Volumetric
        BigDecimal fromInML = getVolumetricInML(from);
        BigDecimal toInML = getVolumetricInML(to);
        
        if (fromInML != null && toInML != null) {
            return quantity.multiply(fromInML).divide(toInML, 6, RoundingMode.HALF_UP);
        }
        
        // Weight
        BigDecimal fromInGrams = getWeightInGrams(from);
        BigDecimal toInGrams = getWeightInGrams(to);
        
        if (fromInGrams != null && toInGrams != null) {
            return quantity.multiply(fromInGrams).divide(toInGrams, 6, RoundingMode.HALF_UP);
        }
        // Count
        BigDecimal fromInPieces = getCountInPieces(from);
        BigDecimal toInPieces = getCountInPieces(to);
        
        if (fromInPieces != null && toInPieces != null) {
            return quantity.multiply(fromInPieces).divide(toInPieces, 6, RoundingMode.HALF_UP);
        }
        
        // Unknown or mismatched types (e.g. converting Liters to Kg directly without density)
        // Fallback to 1:1 if we can't convert
        return quantity;
    }
    
    private static BigDecimal getVolumetricInML(String symbol) {
        return switch (symbol) {
            case "ml", "mililitre" -> BigDecimal.ONE;
            case "l", "lt", "liter", "liters", "litre" -> BigDecimal.valueOf(1000);
            case "cup", "cups", "cp" -> BigDecimal.valueOf(250); // Metric cup
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

    private static BigDecimal getCountInPieces(String symbol) {
        return switch (symbol) {
            case "pc", "piece", "pieces", "pkt", "packet", "box", "bag", "sack / bag" -> BigDecimal.ONE;
            case "doz", "dozen" -> BigDecimal.valueOf(12);
            case "tray", "tray of 30 eggs" -> BigDecimal.valueOf(30);
            default -> null;
        };
    }
}
