# 🏛️ UPSC Mains Editorial Value-Addition Platform

An enterprise-grade, full-stack platform designed to trap daily editorials from **The Hindu**, **The Indian Express**, **ORF**, and **MP-IDSA**, presenting them in an authentic **"The Hindu Editorial Page" 3-column broadsheet layout** with **instant in-line hover popovers**, **floating text selection tools**, **GS 1-4 syllabus mapping**, and **2013–2025 Mains PYQs**.

---

## 🏗️ Architecture & Tech Stack

* **Backend Core**: **Spring Boot 3 (Java 17)** REST API (Spring Data JPA, Hibernate, PostgreSQL).
* **Scraper Engine**: **Minimal Python Microservice** (`trafilatura`, `BeautifulSoup`, `urllib`).
* **Database**: **PostgreSQL 16** (Articles, Elements, GS 1-4 Syllabus, 2013-2025 PYQs, Hover Glossaries, Notes).
* **AI Engine**: **Feature-Flagged Gemini Service** (`gemini.enabled=false` by default).
* **Frontend**: **The Hindu Broadsheet UI** with Heritage Sepia / Dark mode, <10ms Hover Popovers, and Mains Dock.

---

## ⚡ Quick Start with Docker

```bash
# 1. Clone or open the project folder
cd /Users/ujjwalkumar/.gemini/antigravity/scratch/upsc-editorial-desk

# 2. Build and launch all 4 containers (Postgres + Spring Boot + Scraper + Frontend)
docker compose up --build
```

Access the services:
* **📰 Broadsheet Frontend**: [http://localhost:3000](http://localhost:3000)
* **⚙️ Spring Boot REST API**: [http://localhost:8080/api/v1/articles](http://localhost:8080/api/v1/articles)
* **📖 OpenAPI / Swagger Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 🛡️ Enabling Live Gemini AI (Optional)

In `.env` or `docker-compose.yml`:
1. Set `GEMINI_ENABLED=true`
2. Set `GEMINI_API_KEY=your-gemini-api-key`
3. Set `GEMINI_MODEL=gemini-2.5-pro` (or `gemini-2.5-flash`)
4. Re-run `docker compose up -d`
