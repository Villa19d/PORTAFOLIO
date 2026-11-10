package com.rodrigodvillar.portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "cv_documents")
public class CvDocument {

    @Id
    @Column(nullable = false, length = 2)
    private String lang;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "file_name", nullable = false, length = 120)
    private String fileName;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CvDocument() {
    }

    public CvDocument(String lang) {
        this.lang = lang;
    }

    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
