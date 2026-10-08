package com.rodrigodvillar.portfolio.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtTypeValidator implements OAuth2TokenValidator<Jwt> {
    private final String expectedType;

    public JwtTypeValidator(String expectedType) {
        this.expectedType = expectedType;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String type = jwt.getClaimAsString("typ");
        if (expectedType.equals(type)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Tipo de token inválido", null));
    }
}
