package tz.co.thamanicraft.sales;
import java.math.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class OrderTotals {
    private OrderTotals() {}
    static BigDecimal line(SalesRequests.Item item) {
        return item.quantity().multiply(item.unitPrice()).setScale(2,RoundingMode.HALF_UP);
    }
    static BigDecimal total(BigDecimal subtotal,BigDecimal delivery,BigDecimal discount,BigDecimal deposit) {
        BigDecimal total=subtotal.add(delivery).subtract(discount);
        if (discount.signum()<0 || delivery.signum()<0 || deposit.signum()<0 || total.signum()<0 || deposit.compareTo(total)>0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check discount and deposit: neither may exceed the order total available to it");
        if (total.compareTo(new BigDecimal("99999999999999.99"))>0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Order total is too large");
        return total;
    }
}
