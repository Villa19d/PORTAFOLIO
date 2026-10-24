package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.config.CloudinaryProperties;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Service
public class CloudinarySignatureService {

    private final CloudinaryProperties properties;

    public CloudinarySignatureService(CloudinaryProperties properties) {
        this.properties = properties;
    }

    public SignatureData generateSignature() {
        long timestamp = Instant.now().getEpochSecond();
        String signatureBase = "folder=" + properties.getFolder()
                + "&timestamp=" + timestamp
                + "&upload_preset=" + properties.getUploadPreset();

        return new SignatureData(
                timestamp,
                sha1Hex(signatureBase + properties.getApiSecret())
        );
    }

    private String sha1Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte current : digest) {
                hex.append(String.format("%02x", current));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-1 no está disponible en el runtime de Java", exception);
        }
    }

    public record SignatureData(long timestamp, String signature) {
    }
}
