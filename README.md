# 🛡️ GeoShield AI

> **Secure Location-Validated Attendance & Intelligent Corporate Workforce Analytics Platform**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white)](https://leafletjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-4caf50.svg)](LICENSE)

---

## 🌟 Overview

**GeoShield AI** is an enterprise-grade, high-fidelity corporate workforce management and location-validated attendance application. Engineered to solve attendance fraud, proxy check-ins, and complex multi-office shift rosters, the platform combines secure browser-level GPS telemetry, leaflet mapping perimeters, and modern dark neutral aesthetics to offer a seamless SaaS experience.

Designed to look fully "alive" for live hackathon presentations, the application comes seeded with a rich chronological workforce roster, historical attendance logs, geofence perimeter exceptions, and statistical Recharts data panels.

---

## ✨ Key Features

### 📍 1. Geo-Validated Attendance Terminal
*   **Active Perimeter Verification**: Uses browser-level high-accuracy geolocation APIs to calculate proximity to the corporate headquarters coordinates.
*   **Geofence Enforcement**: Dynamically connects user pins to office benchmarks on a custom dark-mode Leaflet Map, displaying radius rings and highlighting out-of-bounds attempts with colored route indicators.
*   **Tactile Actions**: Quick check-in and check-out actions with built-in spring tactile motion response and loading telemetry feedback.

### 📊 2. Comprehensive Employee Ledger
*   **Personal Attendance Calendar**: Monthly view detailing presence rates, late counts, and average daily working shift hours.
*   **Productivity Trends**: Interactive Recharts area chart showing daily active shift hours velocity over the past 7 days.
*   **Shift Timestamps**: Complete overview of punch-in and punch-out stamps with dedicated state badges (`PRESENT`, `LATE`, `INVALID`).

### 🔑 3. Administrative Control Console
*   **Live Daily Roster Directory**: Central dashboard monitoring real-time active attendance rates across all company staff.
*   **Department Comparative Metrics**: Comparative charts demonstrating total department staffing vs. active present headcount.
*   **Audit Correction Overrides**: Seamless administrative tools to override, audit, and invalidate suspicious punches, creating non-deletable correction tracks in the system database.

### 📈 4. Trust & Security Analytics
*   **AI Confidence Indicators**: Compiles daily trust scores based on proximity parameters, unusual timings, and previous failed attempts.
*   **Telemetry Audits**: Access historical audit logs detailing exact distance metrics, IP coordinates, and validation results.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[React Client / Vite] -->|HTTPS Requests / JWT| B[Express.js Server]
    A -->|Browser GPS API| C[Leaflet Maps API]
    B -->|Prisma Client ORM| D[(PostgreSQL Database)]
```

---

## ⚙️ Environment Configuration

The application is structured into two main packages. Configure the environment variables in their respective root directories:

### 📡 Server Environment (`/server/.env`)
Create a `.env` file inside the `server/` directory:
```env
# Server Configuration
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:shahid@localhost:5432/geoshield?schema=public"

# Authentication
JWT_SECRET="geoshield_super_secure_jwt_secret_key_12345!"
```

### 💻 Client Environment (`/client/.env`)
The client leverages standard Vite proxies to automatically route requests to the backend server. No manual environmental settings are required by default.

---

## 🚀 Local Development Setup

Follow these steps to spin up the local development environment:

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) (Running on default port `5432`)

### 📦 1. Database Provisioning & Schema Synchronization
Before launching the server, compile the Prisma schemas and populate the PostgreSQL database:
```bash
# Navigate to the server folder
cd server

# Install backend dependencies
npm install

# Push database schema models to PostgreSQL
npx prisma db push

# Populate high-fidelity hackathon seed data
npm run prisma:seed
```

### 📡 2. Launch Backend API Server
Launch the backend server with dynamic typescript-node reloading:
```bash
# Start backend dev server
npm run dev
```
*The server will start listening at [http://localhost:5000](http://localhost:5000).*

### 💻 3. Launch Frontend React Client
In a new terminal window, initialize the frontend web workspace:
```bash
# Navigate to the client folder
cd client

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
*Open your browser and navigate to [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Hackathon Demo Credentials

Use these seeded accounts to showcase user profiles and dashboards during your live presentation:

| Profile Role | Email Address | Password | Intended Visual Showcase |
| :--- | :--- | :--- | :--- |
| **Corporate Administrator** | `admin@geoshield.ai` | `Password123` | Active daily rosters, department comparison charts, audit invalidation overrides |
| **Seeded Employee** (Sarah Connor) | `employee@geoshield.ai` | `Password123` | Working hours velocity charts, geofence mapping perimeter, historical calendars, custom location punches |

---

## 📡 REST API Route Catalog

The backend server exposes clean, modular, and fully protected endpoints:

### 🔑 Authentication Endpoints
*   `POST /api/auth/login`: Authorizes corporate session credentials.
    *   **Body**: `{ "email": "...", "password": "..." }`
*   `GET /api/auth/me`: Validates active token session headers.

### 📍 Attendance Telemetry Endpoints
*   `GET /api/attendance/today`: Fetches today's active shift status and perimeter circle settings.
*   `GET /api/attendance/history`: Compiles monthly roster logs for calendars and charts.
*   `POST /api/attendance/check-in`: Registers location-validated check-in.
    *   **Body**: `{ "latitude": 12.8943, "longitude": 77.5753 }`
*   `POST /api/attendance/check-out`: Registers location-validated check-out.
    *   **Body**: `{ "latitude": 12.8943, "longitude": 77.5753 }`

### 🛡️ Administrative Console Endpoints
*   `GET /api/admin/attendance/today`: Compiles organizational overview statistics.
*   `PUT /api/admin/attendance/invalidate`: Invalidates suspicious punch entries with reasons.
    *   **Body**: `{ "attendanceId": "...", "reason": "..." }`
*   `GET /api/admin/attendance/insights`: Fetches system-wide confidence scores and geolocation anomalies.
*   `GET /api/admin/attendance/report`: Generates and downloads historical Excel/CSV summaries.

---

## 🎨 Premium Visual Identity
GeoShield AI incorporates state-of-the-art styling mechanics:
*   **Vercel Dark-Neutral Theme**: Curated dark background surfaces with slate border framing to reduce visual fatigue.
*   **Frosted Glass Elements (`.glass-card`)**: Layered component depths built using premium glassmorphic backdrops.
*   **Interactive Micro-animations**: Tactile active springs (`scale-[0.97]`) and color border glows on hover.

---

## 👥 Hackathon Team Credits

*   **Shahid** — Product Lead & Database Architect
*   **Antigravity** — AI Systems Engineer (Google DeepMind)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
