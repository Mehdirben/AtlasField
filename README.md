# 🛰️ AtlasField

**AI-powered satellite crop monitoring for agriculture and forestry**

AtlasField is a SaaS platform that leverages satellite imagery (Sentinel-1 & Sentinel-2) and AI to help farmers and foresters monitor their fields, predict yields, and receive actionable insights.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

## ✨ Features

- 🗺️ **Interactive Map** - Draw and manage field boundaries with MapLibre GL
- 📊 **Satellite Analysis** - NDVI, RVI, and multi-sensor fusion from Sentinel Hub
- 🤖 **AI Assistant** - Get personalized agricultural advice powered by Google Gemini
- 🔔 **Smart Alerts** - Automated notifications for crop health issues
- 📈 **Yield Predictions** - Machine learning-based harvest forecasting
- 🌱 **Biomass Estimation** - Carbon sequestration monitoring

## 🏗️ Project Structure

```
AtlasField/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── config.py       # Settings
│   │   ├── database.py     # PostgreSQL connection
│   │   ├── models.py       # SQLAlchemy models
│   │   └── schemas.py      # Pydantic schemas
│   ├── .env                # Backend environment
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js Frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities & API client
│   ├── .env.local        # Frontend environment
│   ├── Dockerfile        # Production
│   └── Dockerfile.dev    # Development
├── docker-compose.yml     # Production setup
└── docker-compose.dev.yml # Development setup
```

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Or for local development:
  - Node.js 20+
  - Python 3.11+
  - PostgreSQL 15+

### Option 1: Docker (Recommended)

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/atlasfield.git
cd atlasfield
```

**2. Configure environment variables**

Copy the example files and edit them:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

**3. Start with Docker Compose**

For development (with hot reload):
```bash
docker-compose -f docker-compose.dev.yml up --build
```

For production:
```bash
docker-compose up --build
```

**4. Access the application**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

---

### Option 2: Local Development

**1. Start PostgreSQL**

You can use Docker just for the database:
```bash
docker run -d \
  --name atlasfield-db \
  -e POSTGRES_USER=atlasfield \
  -e POSTGRES_PASSWORD=atlasfield \
  -e POSTGRES_DB=atlasfield \
  -p 5432:5432 \
  postgres:15-alpine
```

**2. Setup Backend**
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL to localhost:
# DATABASE_URL=postgresql+asyncpg://atlasfield:atlasfield@localhost:5432/atlasfield

# Start the server
uvicorn app.main:app --reload --port 8000
```

**3. Setup Frontend**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT signing key (min 32 chars) | ✅ |
| `SENTINEL_HUB_CLIENT_ID` | Copernicus Data Space client ID | ❌ |
| `SENTINEL_HUB_CLIENT_SECRET` | Copernicus Data Space secret | ❌ |
| `GEMINI_API_KEY` | Google Gemini API key | ❌ |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | ✅ |

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ |
| `NEXTAUTH_URL` | Frontend URL for NextAuth | ✅ |
| `NEXTAUTH_SECRET` | NextAuth encryption key | ✅ |
| `NEXT_PUBLIC_MAPTILER_KEY` | MapTiler API key for maps | ❌ |

### Getting API Keys

- **Sentinel Hub**: Register at [Copernicus Data Space](https://dataspace.copernicus.eu/)
- **Gemini**: Get your key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- **MapTiler**: Register at [MapTiler](https://www.maptiler.com/) (100k free tiles/month)

## �️ Database Migrations

AtlasField uses **Alembic** for database migrations. Migrations run automatically on application startup, but you can also manage them manually.

### Automatic Migrations

When the backend starts, it automatically runs any pending migrations. This ensures the database schema is always up-to-date with the code.

### Manual Migration Commands

```bash
# Run inside the backend container
docker compose exec backend bash

# Check current migration status
alembic current

# Run all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

### Creating New Migrations

When you modify the models in `app/models.py`, create a new migration:

```bash
# Auto-generate migration from model changes
docker compose exec backend alembic revision --autogenerate -m "description_of_change"

# Or create an empty migration for custom SQL
docker compose exec backend alembic revision -m "description_of_change"
```

Then edit the generated file in `backend/alembic/versions/` if needed.

### Migration Files

```
backend/
├── alembic.ini              # Alembic configuration
└── alembic/
    ├── env.py               # Migration environment setup
    ├── script.py.mako       # Template for new migrations
    └── versions/            # Migration scripts
        ├── 001_initial.py   # Initial schema
        └── 002_add_complete_enum.py  # Example migration
```

### Fresh Database Setup

For a completely fresh database, migrations will create all tables automatically:

```bash
# Start only the database
docker compose up -d db

# Run migrations
docker compose exec backend alembic upgrade head
```

## �📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Get JWT token |
| `GET` | `/api/v1/fields` | List user's fields |
| `POST` | `/api/v1/fields` | Create a field |
| `POST` | `/api/v1/analysis/{id}` | Run satellite analysis |
| `POST` | `/api/v1/chat` | Chat with AI assistant |
| `GET` | `/api/v1/alerts` | Get user alerts |

## 🧪 Testing

**Backend:**
```bash
cd backend
pytest
```

**Frontend:**
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Using Docker Compose (VPS/Cloud)

```bash
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables for Production

Make sure to set secure values:
- Generate `SECRET_KEY`: `openssl rand -base64 32`
- Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Use a managed PostgreSQL database
- Set proper `CORS_ORIGINS`

## 📝 License

This project was created for the ESA ActInSpace Challenge.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
