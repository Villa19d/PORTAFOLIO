CREATE TABLE cv_documents (
    lang VARCHAR(2) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    file_name VARCHAR(120) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cv_documents_lang_check CHECK (lang IN ('es', 'en'))
);
