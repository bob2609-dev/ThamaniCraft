package tz.co.thamanicraft.finance;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication(scanBasePackages = {"tz.co.thamanicraft.finance", "com.thamanicraft.security"})
public class FinanceApplication {
    public static void main(String[] args) { SpringApplication.run(FinanceApplication.class, args); }
}
