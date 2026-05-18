# 🚀 Production Deployment Guide: GeoShield AI
## 🌐 Hosting Backend on Render & Frontend on Vercel

This guide outlines the step-by-step instructions to deploy your full-stack geofenced attendance system to **Render** (for the database and Express API) and **Vercel** (for the React SPA frontend).

---

## 📋 Pre-requisites & Checklist
1.  **Git Repository:** Push your entire project to a **GitHub** repository. The repo should contain the `backend` and `frontend` folders at the root level.
2.  **Accounts:** Create free accounts on [Render](https://render.com) and [Vercel](https://vercel.com).
3.  **Database Connection Safety:** The backend’s [database.ts](file:///c:/Users/shahi/OneDrive/Documents/GitHub/mml/backend/src/config/database.ts) is already configured to support SSL connections in production dynamically.

---

## 🗄️ Part 1: Deploying the Backend & Database on Render

Render will host two services for you:
1.  A managed **PostgreSQL Database** instance.
2.  A **Web Service** hosting the Express API.

### Step 1: Create a PostgreSQL Database on Render
1.  Log in to your **Render Dashboard** and click **New > PostgreSQL**.
2.  Configure the settings:
    *   **Name:** `geoshield-db`
    *   **Database:** `geoshield_db`
    *   **User:** (Leave as default or enter a custom name)
    *   **Region:** (Select the region closest to your users, e.g., Singapore for Asia, Oregon for US)
    *   **Instance Type:** **Free**
3.  Click **Create Database**.
4.  Once created, locate the **Connections** panel. Save these connection strings:
    *   **Internal Database URL:** (Used by other services on Render, format: `postgres://...`)
    *   **External Database URL:** (Used if you want to connect from your local PC to seed the database).

---

### Step 2: Create the Node.js Express Web Service
1.  On the Render Dashboard, click **New > Web Service**.
2.  Connect your GitHub repository.
3.  Configure the service details:
    *   **Name:** `geoshield-api`
    *   **Region:** (Select the **same region** as your database)
    *   **Branch:** `main` (or your active dev branch)
    *   **Root Directory:** `backend` *(CRITICAL: This tells Render to compile inside the backend sub-folder)*
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `node dist/server.js`
    *   **Instance Type:** **Free**

---

### Step 3: Add Environment Variables on Render
Click on the **Environment** tab inside your new Render Web Service and add the following keys:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enforces SSL and optimized production execution |
| `DATABASE_URL` | *(Use the **Internal Database URL** from Step 1)* | Connects the API to the secure Postgres instance |
| `JWT_SECRET` | *(Enter a long, random string, e.g., `g30sh13ld_s3cr3t_2026`)* | Used for securely signing user session badges |
| `PORT` | `5000` | Tells Express what port to bind to |
| `CLIENT_URL` | `https://your-frontend-domain.vercel.app` | **CORS protection!** Update this with your live Vercel domain once Vercel finishes deploying |

Click **Save Changes**. Render will automatically trigger a build, run migrations, and deploy your live API. 
Your backend will be hosted at: `https://geoshield-api.onrender.com`

---

## 🎨 Part 2: Deploying the Frontend on Vercel

Vercel is optimized to host Vite static builds. Since we have configured [vercel.json](file:///c:/Users/shahi/OneDrive/Documents/GitHub/mml/frontend/vercel.json), single-page redirects will work perfectly.

### Step 1: Connect your Project to Vercel
1.  Log in to your **Vercel Dashboard** and click **Add New > Project**.
2.  Import your GitHub repository.
3.  Configure the project settings:
    *   **Project Name:** `geoshield-frontend`
    *   **Framework Preset:** **Vite**
    *   **Root Directory:** Click Edit and select **`frontend`** *(CRITICAL: This compiles inside your frontend sub-folder)*

---

### Step 2: Configure Build & Environment Settings
1.  Expand **Build and Development Settings**:
    *   **Build Command:** `npm run build` (should say `tsc && vite build`)
    *   **Output Directory:** `dist`
2.  Expand **Environment Variables** and add:
    *   **Key:** `VITE_API_URL`
    *   **Value:** `https://geoshield-api.onrender.com/api` *(Pointing to the Render API url from Part 1)*
3.  Click **Deploy**.

Vercel will build your assets, render pages, and provide a secure, live production domain (e.g., `https://geoshield-frontend.vercel.app`).

> [!IMPORTANT]
> **Action Item:** Once your Vercel deployment finishes, copy your live Vercel domain. Go back to your **Render Web Service > Environment Settings**, and update the value of `CLIENT_URL` to match your Vercel domain. This removes the CORS block.

---

## 🌱 Part 3: Seeding your Live Production Database

Once both deployments are active, your database will be completely empty. To seed your database with high-fidelity analytics, employees, and admin credentials, run the seeding script from your local machine:

1.  Open your **Render Dashboard** and navigate to your PostgreSQL Database details.
2.  Copy the **External Database URL**.
3.  Open the [backend/.env](file:///c:/Users/shahi/OneDrive/Documents/GitHub/mml/backend/.env) file on your local machine and set the `DATABASE_URL` variable to that connection string:
    ```env
    DATABASE_URL=postgres://your_render_external_db_url_here
    ```
4.  Open a terminal inside the local `/backend` folder and run:
    ```bash
    npm run build
    npm run seed
    ```
5.  *Success!* This will execute the transaction on the live Render database, configuring the Bangalore HQ geofence, hashing passwords, and creating the rosters.
6.  **Admin credentials generated:**
    *   **Email:** `admin@geoshield.ai`
    *   **Password:** `admin123`
7.  **Employee credentials generated:**
    *   **Email:** `employee1@geoshield.ai`
    *   **Password:** `employee123`
