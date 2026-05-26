# 🔮 SentiView AI — Customer Sentiment Analytics Platform

> AI-powered real-time customer feedback analytics with Gemini AI sentiment analysis, business insights, and a modern SaaS dashboard.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat&logo=google&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📤 CSV Upload | Bulk upload customer feedback via CSV files |
| 🤖 AI Sentiment Analysis | Automatic sentiment classification (positive/neutral/negative) via Gemini AI |
| 📊 Analytics Dashboard | Real-time charts: sentiment donut, rating distribution, trend lines, topic cloud |
| 💡 AI Business Insights | AI-generated business recommendations, trends, and anomaly detection |
| ⚡ Real-time Updates | Live dashboard via WebSocket (Socket.IO) |
| 🔄 Background Processing | BullMQ queue for async AI processing |
| 🗄️ Redis Caching | Fast analytics with Redis cache + auto-invalidation |
| 📝 Swagger API Docs | Auto-generated OpenAPI documentation |
| 🐳 Docker Ready | One-command deployment with Docker Compose |
| 🚀 CI/CD | GitHub Actions pipeline included |

---

## 🏗️ Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma (PostgreSQL)
- **Queue**: BullMQ + Redis
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **AI**: Google Gemini 1.5 Flash
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS (custom dark theme)
- **State**: React hooks + Socket.IO client
- **Charts**: Custom SVG + CSS (zero-dependency)

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7 (Alpine)
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — untuk menjalankan PostgreSQL & Redis
- [Node.js 20+](https://nodejs.org/) — untuk development lokal
- [Git](https://git-scm.com/)

---

### ⚡ Cara 1: Docker Compose (Paling Mudah)

Semua service (database, redis, backend, frontend) jalan otomatis dengan 1 perintah.

```bash
# 1. Clone repo
git clone https://github.com/marshandaks/Competetion_InaAI.git
cd Competetion_InaAI

# 2. Buat file .env untuk backend
cp backend/.env.example backend/.env
# Lalu edit backend/.env, isi GEMINI_API_KEY dengan API key kamu

# 3. Jalankan semua service
docker compose up --build -d

# 4. Tunggu ~1 menit, lalu jalankan migrasi database
docker compose exec backend npx prisma migrate deploy

# 5. (Opsional) Isi database dengan data contoh
docker compose exec backend npx prisma db seed
```

**Akses aplikasi:**
| Service | URL |
|---------|-----|
| 🌐 Dashboard | http://localhost:3000 |
| 🔌 Backend API | http://localhost:4000 |
| 📚 Swagger Docs | http://localhost:4000/api/docs |

---

### 💻 Cara 2: Development Lokal (Manual)

Cocok jika ingin edit kode dan lihat perubahan langsung.

#### Langkah 1 — Jalankan Database & Redis via Docker
```bash
git clone https://github.com/marshandaks/Competetion_InaAI.git
cd Competetion_InaAI

# Jalankan hanya database & redis (tanpa backend/frontend)
docker compose up db redis -d
```

#### Langkah 2 — Setup Backend
```bash
cd backend

# Salin file environment
cp .env.example .env
# Edit .env dan isi GEMINI_API_KEY dengan API key kamu

# Install dependencies
npm install

# Generate Prisma client & jalankan migrasi
npx prisma generate
npx prisma migrate dev

# (Opsional) Seed data contoh
npx prisma db seed

# Jalankan backend (mode development, auto-reload)
npm run start:dev
```
Backend berjalan di: **http://localhost:4000**

#### Langkah 3 — Setup Frontend (terminal baru)
```bash
cd frontend

# Install dependencies
npm install

# Jalankan frontend
npm run dev
```
Frontend berjalan di: **http://localhost:3000**

---

### 🔑 Environment Variables

Buat file `backend/.env` berdasarkan `backend/.env.example`:

```env
# Wajib diisi:
GEMINI_API_KEY=your_gemini_api_key_here   # Dapatkan di https://aistudio.google.com

# Sudah ada default (tidak perlu diubah jika pakai Docker):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sentiview?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000
NODE_ENV=development
```

> **Cara dapat Gemini API Key:** Buka https://aistudio.google.com → Get API Key → Create API Key (gratis)

---

## 📁 Project Structure

```
marshanda/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Seed data
│   ├── src/
│   │   ├── analytics/             # Analytics endpoints
│   │   ├── cache/                 # Redis cache service
│   │   ├── feedback/              # Feedback CRUD + CSV upload
│   │   ├── gemini/                # Gemini AI integration
│   │   ├── queue/                 # BullMQ processor
│   │   ├── websocket/             # Socket.IO gateway
│   │   ├── app.module.ts          # Root module
│   │   ├── main.ts                # Bootstrap
│   │   └── prisma.service.ts      # Prisma client
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css        # Dark theme styles
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Dashboard page
│   │   ├── components/
│   │   │   ├── CsvUpload.tsx      # Drag-and-drop CSV
│   │   │   ├── FeedbackFeed.tsx   # Feedback list
│   │   │   ├── InsightsList.tsx   # AI insights
│   │   │   ├── RatingChart.tsx    # Rating bars
│   │   │   ├── SentimentChart.tsx # Donut chart
│   │   │   ├── StatsCards.tsx     # KPI cards
│   │   │   ├── TopicCloud.tsx     # Topic bars
│   │   │   └── TrendChart.tsx     # Trend lines
│   │   └── lib/
│   │       ├── api.ts             # API client
│   │       └── socket.ts          # Socket.IO client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── sample.csv                     # Sample feedback data
├── .github/workflows/ci.yml      # CI/CD pipeline
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/feedback` | List all feedback (paginated) |
| `POST` | `/feedback/upload` | Upload CSV file |
| `PATCH` | `/feedback/:id` | Edit feedback (optimistic locking) |
| `DELETE` | `/feedback/:id` | Delete feedback |
| `POST` | `/feedback/simulate` | Generate fake feedback |
| `GET` | `/analytics` | Get analytics summary |
| `GET` | `/analytics/insights` | Get AI insights |
| `POST` | `/analytics/insights/generate` | Generate new insights |

Full interactive documentation at: `http://localhost:4000/api/docs`

---

## 🤖 Gemini AI Integration

The platform uses **Google Gemini 1.5 Flash** for:

1. **Sentiment Analysis**: Classifies each feedback as positive/neutral/negative with confidence score
2. **Topic Extraction**: Extracts key topics from feedback text
3. **Business Insights**: Generates actionable business recommendations from aggregated data

**Fallback handling**: Built-in keyword-based fallback when Gemini API is unavailable.

---

## ⚡ Real-time Architecture

```
CSV Upload → API → Database → BullMQ Queue
                                    ↓
                              Gemini AI Processing
                                    ↓
                              Cache Invalidation
                                    ↓
                              WebSocket Broadcast → Dashboard Update
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Lint
npm run lint
```

---

## 📄 License

MIT License — Built for hackathon demonstration.
