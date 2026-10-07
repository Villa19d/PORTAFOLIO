package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Endpoints públicos para consultar proyectos")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    @Operation(summary = "Obtener proyectos publicados", description = "Retorna la lista de proyectos publicados ordenados por displayOrder ascendente.")
    @ApiResponse(responseCode = "200", description = "Lista de proyectos exitosa")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(projectService.getPublishedProjects());
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Obtener un proyecto por slug", description = "Retorna el detalle de un proyecto si existe y está publicado.")
    @ApiResponse(responseCode = "200", description = "Proyecto encontrado")
    @ApiResponse(responseCode = "404", description = "Proyecto no encontrado o no publicado",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<ProjectResponse> getProjectBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(projectService.getProjectBySlug(slug));
    }
}
