package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.CvDocumentDto;
import com.rodrigodvillar.portfolio.dto.CvUpsertRequest;
import com.rodrigodvillar.portfolio.service.CvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cv")
@Tag(name = "Admin CV", description = "Admin operations for the CV documents")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class AdminCvController {

    private final CvService cvService;

    public AdminCvController(CvService cvService) {
        this.cvService = cvService;
    }

    @PutMapping("/{lang}")
    @Operation(summary = "Associate the CV of a language", description = "Stores the Cloudinary PDF url and file name for the given language (es or en)")
    public ResponseEntity<CvDocumentDto> upsert(
            @PathVariable @Pattern(regexp = "^(?:es|en)$") String lang,
            @Valid @RequestBody CvUpsertRequest request
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(cvService.upsert(lang, request));
    }

    @DeleteMapping("/{lang}")
    @Operation(summary = "Unlink the CV of a language", description = "Removes the stored CV for the given language. The Cloudinary file is kept")
    public ResponseEntity<Void> delete(@PathVariable @Pattern(regexp = "^(?:es|en)$") String lang) {
        cvService.delete(lang);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }
}
