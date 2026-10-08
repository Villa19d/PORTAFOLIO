package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/projects")
@Tag(name = "Admin Projects", description = "Admin operations for managing projects")
@SecurityRequirement(name = "bearerAuth")
public class AdminProjectController {

    private final ProjectService projectService;

    public AdminProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    @Operation(summary = "Get all projects", description = "Retrieves all projects (published or unpublished) ordered by display order")
    public ResponseEntity<List<ProjectResponse>> getAll() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(projectService.getAllAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID", description = "Retrieves a specific project by its ID")
    public ResponseEntity<ProjectResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(projectService.getByIdAdmin(id));
    }

    @PostMapping
    @Operation(summary = "Create a project", description = "Creates a new project")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
        ProjectResponse createdProject = projectService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdProject.id())
                .toUri();
        
        return ResponseEntity.created(location)
                .cacheControl(CacheControl.noStore())
                .body(createdProject);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a project", description = "Fully updates an existing project")
    public ResponseEntity<ProjectResponse> update(@PathVariable UUID id, @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(projectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project", description = "Physically deletes a project by its ID")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }
}
