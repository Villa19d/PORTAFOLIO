package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.CvResponse;
import com.rodrigodvillar.portfolio.service.CvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/cv")
@Tag(name = "CV", description = "Endpoints públicos para consultar el currículum")
public class CvController {

    private final CvService cvService;

    public CvController(CvService cvService) {
        this.cvService = cvService;
    }

    @GetMapping
    @Operation(summary = "Obtener el CV por idioma", description = "Retorna el CV vinculado a cada idioma. Sin datos devuelve ambos slots en null, nunca 500.")
    @ApiResponse(
            responseCode = "200",
            description = "CV recuperado",
            content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(
                            name = "cv",
                            value = """
                                    {
                                      "es": {
                                        "url": "https://res.cloudinary.com/demo/raw/upload/v1712345678/portfolio/cv/cv-es.pdf",
                                        "fileName": "cv-es.pdf",
                                        "updatedAt": "2026-10-24T18:00:00Z"
                                      },
                                      "en": null
                                    }
                                    """
                    )
            )
    )
    public ResponseEntity<CvResponse> getCv() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(cvService.getAll());
    }
}
