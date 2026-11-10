package com.rodrigodvillar.portfolio.repository;

import com.rodrigodvillar.portfolio.entity.CvDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CvDocumentRepository extends JpaRepository<CvDocument, String> {
}
