import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$w4R4eJg/Gz6U8qU9kMvSce9SgR1h.l8w8m0dGZ/Y1rN/1bWb6M3V2";
        boolean match = encoder.matches("password", hash);
        System.out.println("Match: " + match);
        System.out.println("New hash for 'password': " + encoder.encode("password"));
    }
}
