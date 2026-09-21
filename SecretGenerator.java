import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility to generate a secure, Base64-encoded secret key for JWT (HS512).
 * HS512 requires at least 64 bytes (512 bits) of entropy.
 */
public class SecretGenerator {
    public static void main(String[] args) {
        // 64 bytes = 512 bits
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        String secret = Base64.getEncoder().encodeToString(bytes);
        
        System.out.println("\n==================================================================");
        System.out.println("CA-PORTAL V2: SECURE JWT SECRET GENERATOR");
        System.out.println("==================================================================\n");
        System.out.println("Generated Secret (Base64 encoded, 512-bit):");
        System.out.println("\n" + secret + "\n");
        System.out.println("==================================================================");
        System.out.println("Copy this into your .env or application-docker.yml as JWT_SECRET");
        System.out.println("==================================================================\n");
    }
}
