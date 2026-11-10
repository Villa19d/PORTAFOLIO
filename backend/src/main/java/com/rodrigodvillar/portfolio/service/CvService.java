package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.dto.CvDocumentDto;
import com.rodrigodvillar.portfolio.dto.CvResponse;
import com.rodrigodvillar.portfolio.dto.CvUpsertRequest;
import com.rodrigodvillar.portfolio.entity.CvDocument;
import com.rodrigodvillar.portfolio.repository.CvDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@Transactional(readOnly = true)
public class CvService {

    private static final String SPANISH = "es";
    private static final String ENGLISH = "en";

    private final CvDocumentRepository repository;

    public CvService(CvDocumentRepository repository) {
        this.repository = repository;
    }

    public CvResponse getAll() {
        return new CvResponse(findDocument(SPANISH), findDocument(ENGLISH));
    }

    @Transactional
    public CvDocumentDto upsert(String lang, CvUpsertRequest request) {
        CvDocument document = repository.findById(lang).orElseGet(() -> new CvDocument(lang));
        document.setUrl(request.url());
        document.setFileName(request.fileName());
        document.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return toDto(repository.save(document));
    }

    @Transactional
    public void delete(String lang) {
        if (repository.existsById(lang)) {
            repository.deleteById(lang);
        }
    }

    private CvDocumentDto findDocument(String lang) {
        return repository.findById(lang)
                .map(this::toDto)
                .orElse(null);
    }

    private CvDocumentDto toDto(CvDocument document) {
        return new CvDocumentDto(document.getUrl(), document.getFileName(), document.getUpdatedAt());
    }
}
