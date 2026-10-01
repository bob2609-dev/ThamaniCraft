const fs = require('fs');

const serviceFile = '/home/bob2609/Projects/ThamaniCraft/craft-sales-service/src/main/java/tz/co/thamanicraft/sales/SalesService.java';
let svc = fs.readFileSync(serviceFile, 'utf8');

const target = `        BigDecimal totalStandardCost = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;
        boolean hasActualCosts = false;

        for (var item : items) {
            boolean hasItemCost = false;
            BigDecimal unitCostTotal = BigDecimal.ZERO;

            if (item.get("finishedProductId") != null && item.get("unitCost") != null) {
                unitCostTotal = ((BigDecimal) item.get("unitCost")).multiply((BigDecimal) item.get("quantity"));
            }

            if (item.get("standardCost") != null) {
                totalStandardCost = totalStandardCost.add((BigDecimal) item.get("standardCost"));
                hasItemCost = true;
            }
            if (item.get("actualBatchCost") != null) {
                totalActualCost = totalActualCost.add((BigDecimal) item.get("actualBatchCost"));
                hasActualCosts = true;
                hasItemCost = true;
            }
            
            if (!hasItemCost && unitCostTotal.compareTo(BigDecimal.ZERO) > 0) {
                totalStandardCost = totalStandardCost.add(unitCostTotal);
                totalActualCost = totalActualCost.add(unitCostTotal);
                hasActualCosts = true;
            }
        }

        BigDecimal subtotal = (BigDecimal) result.get("subtotal");

        BigDecimal estimatedProfit = subtotal.subtract(totalStandardCost);
        BigDecimal estimatedMarginPct = subtotal.compareTo(BigDecimal.ZERO) > 0 ? 
            estimatedProfit.multiply(new BigDecimal("100")).divide(subtotal, 2, java.math.java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStandardCost", totalStandardCost);
        summary.put("estimatedProfit", estimatedProfit);
        summary.put("estimatedMarginPct", estimatedMarginPct);
        summary.put("hasActualCosts", hasActualCosts);

        if (hasActualCosts) {
            BigDecimal actualProfit = subtotal.subtract(totalActualCost);
            BigDecimal actualMarginPct = subtotal.compareTo(BigDecimal.ZERO) > 0 ? 
                actualProfit.multiply(new BigDecimal("100")).divide(subtotal, 2, java.math.java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
            summary.put("totalActualCost", totalActualCost);
            summary.put("actualProfit", actualProfit);
            summary.put("actualMarginPct", actualMarginPct);
        }`;

const replacement = `        BigDecimal totalStandardCost = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;
        BigDecimal costableSubtotalEst = BigDecimal.ZERO;
        BigDecimal costableSubtotalAct = BigDecimal.ZERO;
        boolean hasActualCosts = false;

        for (var item : items) {
            boolean hasItemCost = false;
            boolean hasEstCost = false;
            boolean hasActCost = false;
            BigDecimal unitCostTotal = BigDecimal.ZERO;
            BigDecimal itemLineTotal = (BigDecimal) item.get("lineTotal");
            if (itemLineTotal == null) itemLineTotal = BigDecimal.ZERO;

            if (item.get("finishedProductId") != null && item.get("unitCost") != null) {
                unitCostTotal = ((BigDecimal) item.get("unitCost")).multiply((BigDecimal) item.get("quantity"));
            }

            if (item.get("standardCost") != null) {
                totalStandardCost = totalStandardCost.add((BigDecimal) item.get("standardCost"));
                hasEstCost = true;
                hasItemCost = true;
            }
            if (item.get("actualBatchCost") != null) {
                totalActualCost = totalActualCost.add((BigDecimal) item.get("actualBatchCost"));
                hasActCost = true;
                hasActualCosts = true;
                hasItemCost = true;
            }
            
            if (!hasItemCost && unitCostTotal.compareTo(BigDecimal.ZERO) > 0) {
                totalStandardCost = totalStandardCost.add(unitCostTotal);
                totalActualCost = totalActualCost.add(unitCostTotal);
                hasEstCost = true;
                hasActCost = true;
                hasActualCosts = true;
            }
            
            if (hasEstCost) costableSubtotalEst = costableSubtotalEst.add(itemLineTotal);
            if (hasActCost) costableSubtotalAct = costableSubtotalAct.add(itemLineTotal);
        }

        BigDecimal subtotal = (BigDecimal) result.get("subtotal");
        boolean incompleteEst = costableSubtotalEst.compareTo(subtotal) < 0;
        boolean incompleteAct = costableSubtotalAct.compareTo(subtotal) < 0;

        BigDecimal estimatedProfit = costableSubtotalEst.subtract(totalStandardCost);
        BigDecimal estimatedMarginPct = costableSubtotalEst.compareTo(BigDecimal.ZERO) > 0 ? 
            estimatedProfit.multiply(new BigDecimal("100")).divide(costableSubtotalEst, 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStandardCost", totalStandardCost);
        summary.put("estimatedProfit", estimatedProfit);
        summary.put("estimatedMarginPct", estimatedMarginPct);
        summary.put("hasActualCosts", hasActualCosts);
        summary.put("incompleteEst", incompleteEst);
        summary.put("costableSubtotalEst", costableSubtotalEst);

        if (hasActualCosts) {
            BigDecimal actualProfit = costableSubtotalAct.subtract(totalActualCost);
            BigDecimal actualMarginPct = costableSubtotalAct.compareTo(BigDecimal.ZERO) > 0 ? 
                actualProfit.multiply(new BigDecimal("100")).divide(costableSubtotalAct, 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
            summary.put("totalActualCost", totalActualCost);
            summary.put("actualProfit", actualProfit);
            summary.put("actualMarginPct", actualMarginPct);
            summary.put("incompleteAct", incompleteAct);
            summary.put("costableSubtotalAct", costableSubtotalAct);
        }`;

svc = svc.replace(target, replacement);
fs.writeFileSync(serviceFile, svc);
console.log('done');
