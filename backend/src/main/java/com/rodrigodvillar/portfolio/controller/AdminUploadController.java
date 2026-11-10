package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.config.CloudinaryProperties;
import com.rodrigodvillar.portfolio.dto.CloudinarySignatureResponse;
import com.rodrigodvillar.portfolio.exception.CvUploadPresetMissingException;
import com.rodrigodvillar.portfolio.service.CloudinarySignatureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/uploads")
@Tag(name = "Admin Uploads", description = "Admin operations for direct Cloudinary uploads")
@SecurityRequirement(name = "bearerAuth")
public class AdminUploadController {

    private final CloudinaryProperties properties;
    private final CloudinarySignatureService signatureService;

    public AdminUploadController(
            CloudinaryProperties properties,
            CloudinarySignatureService signatureService
    ) {
        this.properties = properties;
        this.signatureService = signatureService;
    }

    @PostMapping("/sign")
    @Operation(summary = "Create a Cloudinary upload signature")
    public ResponseEntity<CloudinarySignatureResponse> sign() {
        return signatureResponse(properties.getFolder(), properties.getUploadPreset());
    }

    @PostMapping("/sign-document")
    @Operation(summary = "Create the Cloudinary upload signature for the CV PDF")
    public ResponseEntity<CloudinarySignatureResponse> signDocument() {
        String cvUploadPreset = properties.getCvUploadPreset();
        if (cvUploadPreset == null || cvUploadPreset.isBlank()) {
            throw new CvUploadPresetMissingException("Cloudinary CV upload preset is not configured");
        }
        return signatureResponse(properties.getCvFolder(), cvUploadPreset);
    }

    private ResponseEntity<CloudinarySignatureResponse> signatureResponse(String folder, String uploadPreset) {
        CloudinarySignatureService.SignatureData signature =
                signatureService.generateSignature(folder, uploadPreset);
        CloudinarySignatureResponse response = new CloudinarySignatureResponse(
                properties.getCloudName(),
                properties.getApiKey(),
                signature.timestamp(),
                folder,
                uploadPreset,
                signature.signature()
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
