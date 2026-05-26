# AI Customer Feedback & Sentiment Intelligence Platform

Build a modern fullstack SaaS web application called:

# AI Customer Feedback & Sentiment Intelligence Platform

The application analyzes customer feedback using Gemini AI and provides realtime analytics dashboards, sentiment analysis, issue detection, and AI-generated business insights.

Use modern clean UI/UX similar to enterprise SaaS dashboards.

---

# GEMINI API CONFIG

Use this Gemini API Key:

```env
GEMINI_API_KEY=AIzaSyBAvJQtRg7JKacuq7NDvk30WxnlQi44R7U
```

Use Gemini API for:
- sentiment analysis
- issue detection
- AI summary
- business insights
- trend analysis

---

# CORE FEATURES

## 1. CSV Feedback Upload

Allow users to:
- upload CSV files
- preview imported rows
- process feedback asynchronously

CSV example fields:
- customer_name
- rating
- feedback
- created_at

Example:

```csv
customer_name,rating,feedback,created_at
Andi,2,"Pengiriman lama banget",2026-05-20
Budi,5,"Packaging bagus",2026-05-20
```

---

## 2. AI Sentiment Analysis

Use Gemini API to analyze each feedback.

Gemini should generate:
- sentiment (positive/neutral/negative)
- confidence score
- detected topics/issues
- short summary

Topics examples:
- delivery
- packaging
- app bug
- customer service
- pricing

---

## 3. AI Business Insights

Generate AI insights automatically such as:
- negative sentiment spike
- most complained issue
- happiest product category
- customer satisfaction trends

Example:

```txt
"Delivery complaints increased 35% this week."
```

---

## 4. Dashboard Analytics

Create modern analytics dashboard with:

### Overview Cards
- Total Feedback
- Positive %
- Negative %
- Top Issue
- Average Rating

### Charts
- sentiment distribution
- trend chart
- issue category chart

### Realtime Feedback Feed

Display latest analyzed feedback with:
- sentiment badge
- detected issue
- AI summary

### AI Insight Section

Show AI-generated business insights in cards.

---

## 5. Realtime Update

Use websocket or realtime polling so dashboard updates automatically after upload and AI analysis.

---

## 6. Architecture

Use scalable clean architecture.

---

# TECH STACK

## Frontend
- Next.js
- TailwindCSS
- Shadcn UI
- Recharts

## Backend
- NestJS

## Database
- PostgreSQL

## Queue & Cache
- Redis
- BullMQ

## Realtime
- Socket.IO

## Documentation
- Swagger/OpenAPI

## Monitoring
- Sentry

## Deployment Ready
- Docker
- Docker Compose

---

# BACKEND REQUIREMENTS

Create:
- REST API
- Swagger documentation
- modular architecture
- DTO validation
- queue workers
- background AI processing

Endpoints:
- upload feedback CSV
- get dashboard analytics
- get latest feedback
- get AI insights

---

# AI PROCESSING FLOW

1. User uploads CSV
2. Backend parses CSV
3. Feedback stored in PostgreSQL
4. Queue job sent to BullMQ
5. AI worker sends feedback to Gemini API
6. AI analysis stored in database
7. Dashboard updates realtime

---

# CACHE STRATEGY

Use Redis cache for:
- dashboard analytics
- AI summary
- trend charts

Invalidate cache when:
- new feedback uploaded
- new AI analysis completed

---

# CONCURRENT HANDLING

Implement optimistic locking for feedback labeling/editing.

---

# CI/CD

Setup GitHub Actions pipeline:
- install
- lint
- test
- build
- docker build

---

# MONITORING & LOGGING

Add:
- structured logging
- Sentry error monitoring
- API request logging

---

# UI STYLE

Design should feel like:
- Stripe Dashboard
- Linear
- Vercel
- modern SaaS admin panel

Use:
- dark/light mode
- responsive layout
- smooth animation
- clean cards
- professional charts

---

# IMPORTANT

- Build production-ready folder structure
- Use clean code architecture
- Use environment variables properly
- Include README setup instructions
- Generate sample dummy feedback automatically
- Include Docker setup
- Include Swagger docs
- Include sample CSV file
- Make application demo-ready for hackathon judging

---

# BONUS

If possible add:
- fake realtime feedback simulation
- live sentiment updates
- AI insight auto-refresh
- animated dashboard widgets


# Nice to Have

## 1. TDD (Test-Driven Development)
### Pertanyaan yang Akan Ditanya
- Pilih satu fitur.
- Tunjukkan test yang ditulis **SEBELUM** implementasi melalui commit history.

---

## 2. CI/CD Pipeline Otomatis
### Pertanyaan yang Akan Ditanya
- Trigger pipeline dari satu commit sampai live.
- Berapa total durasi dari commit ke deploy?
- Stage mana yang paling lambat?

---

## 3. Caching Mechanism
### Pertanyaan yang Akan Ditanya
- Tunjukkan endpoint yang menggunakan cache.
- Apa cache strategy yang digunakan?
- Bagaimana mekanisme invalidation cache-nya?

---

## 4. API Documentation (OpenAPI / Swagger)
### Pertanyaan yang Akan Ditanya
- Buka dokumentasi API.
- Pilih satu endpoint.
- Jelaskan:
  - Request schema
  - Response schema
  - Authentication requirement

---

## 5. Structured Logging dan Error Monitoring
### Pertanyaan yang Akan Ditanya
- Tunjukkan dashboard atau log file.
- Jika ada error di production:
  - Dari mana proses investigasi dimulai?
  - Tools apa yang digunakan untuk monitoring?

---

# Extraordinary

## 1. Multi-Service Event-Driven Architecture
### Pertanyaan yang Akan Ditanya
- Gambarkan diagram service.
- Apa trade-off yang dipertimbangkan saat memecah menjadi banyak service dibanding tetap monolith?

---

## 2. Concurrent Edit Handling dengan Proper Locking Strategy
### Pertanyaan yang Akan Ditanya
- Demo 2 browser mengedit data yang sama secara bersamaan.
- Apa yang terjadi di UI dan backend?
- Menggunakan optimistic locking atau pessimistic locking?

---

## 3. AI-Driven Analytics
### Pertanyaan yang Akan Ditanya
- Tunjukkan hasil analytics dari sample data.
- Insight apa yang dihasilkan AI yang tidak langsung terlihat dari raw data?

---

## 4. End-to-End Feature Flow
### Pertanyaan yang Akan Ditanya
- Walkthrough full flow:
  1. Import data
  2. Data masuk dashboard
  3. AI generate analytics
- Berapa total latency?
- Di mana bottleneck terbesar terjadi?
