package com.rodrigodvillar.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.text.Normalizer;

public record ContactRequest(
        @NotBlank
        @Size(max = 80)
        @Pattern(regexp = "^[^\\p{Cc}\\p{Cf}]*$")
        String name,

        @NotBlank
        @Email
        @Size(max = 254)
        @Pattern(regexp = "^[^\\p{Cc}\\p{Cf}]*$")
        String email,

        @NotBlank
        @Size(min = 10, max = 2000)
        @Pattern(regexp = "^(?:[^\\p{Cc}\\p{Cf}]|\\r|\\n)*$")
        String message,

        @NotBlank
        @Size(max = 2048)
        @Pattern(regexp = "^[^\\p{Cc}\\p{Cf}]*$")
        String turnstileToken
) {
    public ContactRequest {
        name = normalize(name);
        email = normalize(email);
        message = normalize(message);
        turnstileToken = normalize(turnstileToken);
    }

    private static String normalize(String value) {
        return value == null ? null : Normalizer.normalize(value.trim(), Normalizer.Form.NFC);
    }
}
