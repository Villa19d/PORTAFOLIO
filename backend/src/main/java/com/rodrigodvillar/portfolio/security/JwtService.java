package com.rodrigodvillar.portfolio.security;

import com.rodrigodvillar.portfolio.config.SecurityProperties;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final SecurityProperties securityProperties;

    public JwtService(JwtEncoder jwtEncoder, SecurityProperties securityProperties) {
        this.jwtEncoder = jwtEncoder;
        this.securityProperties = securityProperties;
    }

    public String generateAccessToken(String subject) {
        return generateToken(subject, "access", securityProperties.accessTtlSeconds());
    }

    public String generateRefreshToken(String subject) {
        return generateToken(subject, "refresh", securityProperties.refreshTtlSeconds());
    }

    public org.springframework.security.oauth2.jwt.Jwt decodeRefreshToken(String token) {
        byte[] bytes = securityProperties.jwtSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(bytes, "HmacSHA256");
        org.springframework.security.oauth2.jwt.NimbusJwtDecoder decoder = org.springframework.security.oauth2.jwt.NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
                .build();
        
        org.springframework.security.oauth2.core.OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withIssuer = org.springframework.security.oauth2.jwt.JwtValidators.createDefaultWithIssuer(securityProperties.jwtIssuer());
        org.springframework.security.oauth2.core.OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withType = new JwtTypeValidator("refresh");
        decoder.setJwtValidator(new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(withIssuer, withType));
        
        return decoder.decode(token);
    }

    private String generateToken(String subject, String type, long ttlSeconds) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(securityProperties.jwtIssuer())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .claim("typ", type)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}

