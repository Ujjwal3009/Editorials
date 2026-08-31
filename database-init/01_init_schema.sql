-- PostgreSQL 16 + pgvector + BM25 tsvector Schema for UPSC Mains Editorial Desk
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Official UPSC Syllabus Micro-Topics Table
CREATE TABLE IF NOT EXISTS syllabus_topics (
    id BIGSERIAL PRIMARY KEY,
    gs_paper VARCHAR(10) NOT NULL, -- GS-1, GS-2, GS-3, GS-4
    subject VARCHAR(100) NOT NULL,
    topic_code VARCHAR(50) UNIQUE NOT NULL,
    topic_title TEXT NOT NULL,
    embedding vector(768),
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Editorial Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author VARCHAR(150),
    published_date DATE NOT NULL,
    full_text TEXT NOT NULL,
    summary_150 TEXT,
    summary_250 TEXT,
    layout_slot VARCHAR(20) DEFAULT 'SIDE',
    gs_paper VARCHAR(10),
    syllabus_topic_id BIGINT REFERENCES syllabus_topics(id),
    embedding vector(768),
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Structured Article Paragraphs & Headings
CREATE TABLE IF NOT EXISTS article_elements (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES articles(id) ON DELETE CASCADE,
    element_type VARCHAR(20) NOT NULL, -- paragraph, heading
    element_order INT NOT NULL,
    content TEXT NOT NULL
);

-- 4. Mains Previous Years Questions (PYQs 2013-2025)
CREATE TABLE IF NOT EXISTS mains_pyqs (
    id BIGSERIAL PRIMARY KEY,
    gs_paper VARCHAR(10) NOT NULL,
    exam_year INT NOT NULL,
    question_number INT NOT NULL,
    marks INT NOT NULL,
    question_text TEXT NOT NULL,
    model_approach_hints TEXT,
    syllabus_topic_id BIGINT REFERENCES syllabus_topics(id),
    embedding vector(768),
    search_vector tsvector
);

-- 5. High-Performance KV Cache Table
CREATE TABLE IF NOT EXISTS kv_store (
    cache_key VARCHAR(255) PRIMARY KEY,
    value_payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- =========================================================================
-- INDEXES FOR HYBRID SEARCH
-- =========================================================================

-- Dense Semantic Vector Indexes (HNSW for Sub-Millisecond Cosine Similarity)
CREATE INDEX IF NOT EXISTS idx_syllabus_embedding ON syllabus_topics USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_articles_embedding ON articles USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_pyqs_embedding ON mains_pyqs USING hnsw (embedding vector_cosine_ops);

-- Sparse Keyword GIN Indexes (PostgreSQL BM25 / Full-Text Search)
CREATE INDEX IF NOT EXISTS idx_pyqs_tsvector ON mains_pyqs USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_syllabus_tsvector ON syllabus_topics USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_articles_tsvector ON articles USING gin(search_vector);

-- Auto-Populate tsvectors
CREATE OR REPLACE FUNCTION update_pyq_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', coalesce(NEW.question_text, '') || ' ' || coalesce(NEW.model_approach_hints, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pyq_search_vector ON mains_pyqs;
CREATE TRIGGER trg_pyq_search_vector
BEFORE INSERT OR UPDATE ON mains_pyqs
FOR EACH ROW EXECUTE FUNCTION update_pyq_search_vector();
