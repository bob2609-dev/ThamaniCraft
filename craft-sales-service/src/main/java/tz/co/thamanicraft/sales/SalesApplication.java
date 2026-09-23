package tz.co.thamanicraft.sales;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication(scanBasePackages = {"tz.co.thamanicraft.sales", "com.thamanicraft.security"})
public class SalesApplication {
    public static void main(String[] args) { SpringApplication.run(SalesApplication.class, args); }
}
