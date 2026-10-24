package com.rodrigodvillar.portfolio.config;

import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("prod")
@Lazy(false)
public class CloudinaryProductionValidator {

    public CloudinaryProductionValidator(CloudinaryProperties properties) {
        List<String> missingProperties = new ArrayList<>();
        if (isBlank(properties.getCloudName())) {
            missingProperties.add("CLOUDINARY_CLOUD_NAME");
        }
        if (isBlank(properties.getApiKey())) {
            missingProperties.add("CLOUDINARY_API_KEY");
        }
        if (isBlank(properties.getApiSecret())) {
            missingProperties.add("CLOUDINARY_API_SECRET");
        }
        if (isBlank(properties.getUploadPreset())) {
            missingProperties.add("CLOUDINARY_UPLOAD_PRESET");
        }
        if (isBlank(properties.getFolder())) {
            missingProperties.add("CLOUDINARY_FOLDER");
        }
        if (!missingProperties.isEmpty()) {
            throw new IllegalStateException(
                    "Faltan propiedades obligatorias de Cloudinary para el perfil prod: "
                            + String.join(", ", missingProperties));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
