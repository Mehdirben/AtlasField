# Deploying AtlasField on Coolify

This guide explains how to deploy the AtlasField application on [Coolify](https://coolify.io/), an open-source self-hostable platform.

## ⚠️ Common Pitfalls (Read First!)

Before deploying, be aware of these common issues:

| Issue                        | Solution                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **Bad Gateway (502)**        | **Most common**: Set correct **Ports Exposes** (Backend = `8000`). Also ensures `NEXT_PUBLIC_API_URL` includes `/api/v1` suffix. |
| **CORS Header Missing**      | Often a "fake" error caused by a **502**. Fix the 502 first. Also check `CORS_ORIGINS_STR` matches Frontend URL. |
| **Frontend can't reach API** | Set `NEXT_PUBLIC_API_URL` to backend URL (e.g., `https://api.yourdomain.com/api/v1`) |
| **Database Connection Error**| Ensure `DATABASE_URL` uses the internal Coolify hostname for PostgreSQL       |
| **Changes not taking effect**| Use **Rebuild** not just Redeploy (Coolify caches images)                     |

## Prerequisites

- A server with Coolify installed ([Installation Guide](https://coolify.io/docs/get-started/installation))
- A domain name (or use Coolify's wildcard domain)
- Git repository access (GitHub, GitLab, or Bitbucket)

---

## Custom Domain Setup (Namecheap)

If you're using a domain from Namecheap, follow these steps to connect it to your Coolify deployment.

### Step 1: Get Your Coolify Server IP

Find your Coolify server's public IP address:

```bash
# SSH into your Coolify server and run:
curl ifconfig.me
```

### Step 2: Configure DNS Records in Namecheap

1. Log into your [Namecheap account](https://www.namecheap.com/)
2. Go to **Domain List** → Click **Manage** on your domain
3. Navigate to the **Advanced DNS** tab
4. Add the following A Records:

| Type     | Host      | Value             | TTL       | Purpose                                      |
| -------- | --------- | ----------------- | --------- | -------------------------------------------- |
| A Record | `@`       | `YOUR_COOLIFY_IP` | Automatic | Main frontend (`yourdomain.com`)             |
| A Record | `www`     | `YOUR_COOLIFY_IP` | Automatic | WWW subdomain (`www.yourdomain.com`)         |
| A Record | `api`     | `YOUR_COOLIFY_IP` | Automatic | Backend API (`api.yourdomain.com`)           |
| A Record | `coolify` | `YOUR_COOLIFY_IP` | Automatic | Coolify Dashboard (`coolify.yourdomain.com`) |

> **Note**: Replace `YOUR_COOLIFY_IP` with your actual server IP address.

### Step 3: Configure Coolify Dashboard Domain

After DNS propagation (may take up to 48 hours, usually much faster):

#### Option A: Via SSH

```bash
# Edit the Coolify environment file
nano /data/coolify/source/.env

# Update/Add the APP_URL variable
APP_URL=https://coolify.yourdomain.com

# Restart Coolify
cd /data/coolify/source
docker compose down
docker compose up -d
```

#### Option B: Via Coolify UI

1. Access Coolify dashboard using your server IP
2. Navigate to **Settings** → **Configuration**
3. Update **Instance's Domain** to `https://coolify.yourdomain.com`
4. Save and restart

### Step 4: Update Frontend Environment Variables

After configuring domains:

1. Go to Frontend resource → **Environment Variables**
2. Set: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`
3. Set: `INTERNAL_API_URL=http://backend:8000/api/v1` (For SSR communication inside the network)
4. Set: `NEXTAUTH_URL=https://yourdomain.com`
5. Set: `NEXTAUTH_SECRET=${SERVICE_PASSWORD_64_FRONTEND}` (Use Coolify to generate a secret)
6. Set: `NEXT_PUBLIC_MAPTILER_KEY=` (Optional, for MapTiler styles)
7. **Important**: Click **Rebuild** (not just Redeploy)

### Step 5: Configure Application Domains in Coolify

**Backend Domain:**

1. Go to your Backend resource → **Settings** → **Domains**
2. Add: `https://api.yourdomain.com`
3. Ensure **Ports Exposes** is set to `8000`

**Frontend Domain:**

1. Go to your Frontend resource → **Settings** → **Domains**
2. Add: `https://yourdomain.com` and `https://www.yourdomain.com`
3. Ensure **Ports Exposes** is set to `3000`

### Domain Summary

| Domain                   | Service           | Port |
| ------------------------ | ----------------- | ---- |
| `yourdomain.com`         | Frontend (Next.js)| 3000 |
| `www.yourdomain.com`     | Frontend (Next.js)| 3000 |
| `api.yourdomain.com`     | Backend (FastAPI) | 8000 |
| `coolify.yourdomain.com` | Coolify Dashboard | 8000 |

## Architecture Overview

The AtlasField application consists of three components:

1. **PostgreSQL** - Database (deployed as a Coolify Database service)
2. **Backend** - FastAPI application (Python)
3. **Frontend** - Next.js application

```text
┌─────────────────────────────────────────────────────────────┐
│                         Coolify                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Frontend  │───▶│   Backend   │───▶│  PostgreSQL │      │
│  │   (Next.js) │    │  (FastAPI)  │    │  (Database) │      │
│  │   :3000     │    │   :8000     │    │   :5432     │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│        │                                                    │
│        ▼                                                    │
│   https://atlasfield.yourdomain.com                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Deploy PostgreSQL Database

1. In Coolify dashboard, go to your **Project** → **Environment**
2. Click **+ New** → **Database** → **PostgreSQL**
3. Configure PostgreSQL:
   - **Name**: `atlasfield-db`
   - **Version**: `15-alpine` (as per docker-compose)
   - Leave other settings as default (Coolify will generate secure credentials)
4. Click **Save** then **Deploy**
5. Once deployed, note the connection details:
   - **Internal Host**: Usually `atlasfield-db`
   - **Port**: `5432`
   - **Username**: (auto-generated)
   - **Password**: (auto-generated)
   - **Database Name**: `atlasfield`

> **Important**: Enable **Connect to Predefined Network** on the PostgreSQL database.

---

## Step 2: Deploy Backend (FastAPI Server)

### Deployment from Git Repository

1. In Coolify, go to your **Project** → **Environment**
2. Click **+ New** → **Application** → Select your Git provider
3. Select your repository and configure:
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `backend/Dockerfile`
   - **Base Directory**: `backend`
4. Configure the **Domain**:
   - Set domain like `api.yourdomain.com`
5. Set **Ports Exposes** to `8000`

### Environment Variables for Backend

Set the following environment variables in Coolify:

| Variable                     | Description                       | Example                                                                 |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string      | `postgresql+asyncpg://user:pass@atlasfield-db:5432/atlasfield`          |

> [!TIP]
> **New**: The backend now automatically converts `postgres://` to `postgresql+asyncpg://`. You can copy-paste the connection string directly from Coolify without manual editing.
| `SECRET_KEY`                 | Secure secret key                 | (generate a secure random string)                                       |
| `DEBUG`                      | Debug mode (false for prod)       | `false`                                                                 |
| `SENTINEL_HUB_CLIENT_ID`     | Sentinel Hub Client ID            | (your Client ID)                                                        |
| `SENTINEL_HUB_CLIENT_SECRET` | Sentinel Hub Secret               | (your Secret)                                                           |
| `GEMINI_API_KEY`             | Google Gemini API Key             | (your API key)                                                          |
| `CORS_ORIGINS_STR`           | Allowed origins                   | `https://yourdomain.com`                                                |

---

## Step 3: Deploy Frontend (Next.js)

1. In Coolify, go to your **Project** → **Environment**
2. Click **+ New** → **Application** → Select your Git provider
3. Select your repository and configure:
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `frontend/Dockerfile`
   - **Base Directory**: `frontend`
4. Set **Ports Exposes** to `3000`

### Environment Variables for Frontend (Build-time)

| Variable              | Description                       | Example                                      |
| --------------------- | --------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL (Public)          | `https://api.yourdomain.com/api/v1`          |
| `INTERNAL_API_URL`    | Backend API URL (Internal)        | `http://backend:8000/api/v1`                 |
| `NEXTAUTH_URL`        | Canonical App URL                 | `https://yourdomain.com`                     |
| `NEXTAUTH_SECRET`     | Secret for NextAuth               | (secure random string)                       |
| `NEXT_PUBLIC_MAPTILER_KEY`| MapTiler API Key (Optional) | (your API key)                               |

> **Important**: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_MAPTILER_KEY` are **build arguments**.
>
> 1. In Coolify, go to your Frontend resource → **Environment Variables**.
> 2. For these variables, ensure the **"Build Variable"** (or "Build-time") checkbox is checked.
> 3. You must **Rebuild** the frontend after changing them.

---

## Step 4: Configure Networking

### Enable Predefined Network Connection

1. Go to your **PostgreSQL** resource → **Settings** → Enable **Connect to Predefined Network**
2. Go to your **Backend** resource → **Settings** → Enable **Connect to Predefined Network**

---

## Complete Docker Compose (Alternative)

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-atlasfield}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
      POSTGRES_DB: ${POSTGRES_DB:-atlasfield}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-atlasfield}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      SECRET_KEY: ${SECRET_KEY:?}
      DEBUG: "false"
      SENTINEL_HUB_CLIENT_ID: ${SENTINEL_HUB_CLIENT_ID}
      SENTINEL_HUB_CLIENT_SECRET: ${SENTINEL_HUB_CLIENT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      CORS_ORIGINS_STR: ${CORS_ORIGINS_STR}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      INTERNAL_API_URL: http://backend:8000/api/v1
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?}
      NEXT_PUBLIC_MAPTILER_KEY: ${NEXT_PUBLIC_MAPTILER_KEY}
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Deployment Checklist

- [ ] PostgreSQL deployed and running
- [ ] Backend deployed with `DATABASE_URL` and other secrets
- [ ] Backend **Ports Exposes** set to `8000`
- [ ] Frontend deployed with `NEXT_PUBLIC_API_URL`
- [ ] Frontend **Ports Exposes** set to `3000`
- [ ] Predefined network enabled for backend and DB
