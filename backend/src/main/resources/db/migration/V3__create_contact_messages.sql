CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(320) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(7) NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT contact_messages_status_check CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
