package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.config.SecurityProperties;
import com.rodrigodvillar.portfolio.dto.LoginRequest;
import com.rodrigodvillar.portfolio.dto.TokenResponse;
import com.rodrigodvillar.portfolio.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtService jwtService;
    private final SecurityProperties securityProperties;
    private final PasswordEncoder passwordEncoder;
    private final JwtDecoder jwtDecoder;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    public AuthController(JwtService jwtService, SecurityProperties securityProperties, PasswordEncoder passwordEncoder, JwtDecoder jwtDecoder) {
        this.jwtService = jwtService;
        this.securityProperties = securityProperties;
        this.passwordEncoder = passwordEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        boolean match = false;
        if (securityProperties.adminUsername().equals(request.username())) {
            match = passwordEncoder.matches(request.password(), securityProperties.adminPasswordHash());
        } else {
            // Dummy check to prevent timing attacks
            passwordEncoder.matches(request.password(), securityProperties.adminPasswordHash());
        }

        if (!match) {
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
        }

        String accessToken = jwtService.generateAccessToken(securityProperties.adminUsername());
        String refreshToken = jwtService.generateRefreshToken(securityProperties.adminUsername());

        ResponseCookie cookie = createRefreshCookie(refreshToken, securityProperties.refreshTtlSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new TokenResponse(accessToken, securityProperties.accessTtlSeconds()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletRequest request) {
        checkOrigin(request);

        if (refreshToken == null) {
            return unauthorizedProblemDetail();
        }

        try {
            Jwt jwt = jwtService.decodeRefreshToken(refreshToken);

            String subject = jwt.getSubject();
            if (!securityProperties.adminUsername().equals(subject)) {
                return unauthorizedProblemDetail();
            }

            String newAccessToken = jwtService.generateAccessToken(subject);
            String newRefreshToken = jwtService.generateRefreshToken(subject);

            ResponseCookie cookie = createRefreshCookie(newRefreshToken, securityProperties.refreshTtlSeconds());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(new TokenResponse(newAccessToken, securityProperties.accessTtlSeconds()));

        } catch (JwtException e) {
            e.printStackTrace();
            return unauthorizedProblemDetail();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        checkOrigin(request);
        ResponseCookie cookie = createRefreshCookie("", 0);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    private void checkOrigin(HttpServletRequest request) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin != null && !origin.isBlank() && allowedOrigins != null) {
            boolean allowed = Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .anyMatch(origin::equals);
            if (!allowed) {
                throw new org.springframework.security.access.AccessDeniedException("Origin no permitido");
            }
        }
    }

    private ResponseCookie createRefreshCookie(String token, long maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(securityProperties.cookieSecure())
                .path("/api/auth")
                .maxAge(maxAge)
                .sameSite("Lax");

        if (securityProperties.cookieDomain() != null && !securityProperties.cookieDomain().isBlank()) {
            builder.domain(securityProperties.cookieDomain());
        }

        return builder.build();
    }

    private ResponseEntity<ProblemDetail> unauthorizedProblemDetail() {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Acceso no autorizado");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
    }
}

