-- ==========================================================
-- UPSC Mains Editorial Platform: PostgreSQL Database Schema
-- ==========================================================

CREATE TABLE IF NOT EXISTS syllabus_topics (
    id SERIAL PRIMARY KEY,
    gs_paper VARCHAR(10) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic_code VARCHAR(50) UNIQUE NOT NULL,
    topic_title TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pyqs (
    id SERIAL PRIMARY KEY,
    gs_paper VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    question_number INT NOT NULL,
    marks INT DEFAULT 15,
    syllabus_topic_id INT REFERENCES syllabus_topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    model_approach_hints TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS concept_glossaries (
    id SERIAL PRIMARY KEY,
    term VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    definition TEXT NOT NULL,
    upsc_context TEXT NOT NULL,
    related_gs_paper VARCHAR(10),
    synonyms TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author VARCHAR(150) NOT NULL DEFAULT 'Editorial Desk',
    published_date DATE NOT NULL,
    layout_slot VARCHAR(50) DEFAULT 'LEAD',
    gs_paper VARCHAR(10),
    syllabus_topic_id INT REFERENCES syllabus_topics(id) ON DELETE SET NULL,
    key_takeaways TEXT[],
    statistics TEXT[],
    committees_cited TEXT[],
    model_answer_blueprint JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_elements (
    id SERIAL PRIMARY KEY,
    article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    element_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    article_id INT REFERENCES articles(id) ON DELETE CASCADE,
    selected_text TEXT,
    note_content TEXT NOT NULL,
    gs_tag VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_gs_paper ON articles(gs_paper);
CREATE INDEX IF NOT EXISTS idx_article_elements_article_id ON article_elements(article_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_pyqs_gs_paper ON pyqs(gs_paper, year DESC);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON concept_glossaries(term);
