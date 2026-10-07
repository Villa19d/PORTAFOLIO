package com.rodrigodvillar.portfolio.repository;

import com.rodrigodvillar.portfolio.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByPublishedTrueOrderByDisplayOrderAsc();
    Optional<Project> findBySlugAndPublishedTrue(String slug);
}
