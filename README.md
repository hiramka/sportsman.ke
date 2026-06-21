# Sportsman.ke Full-Stack Monorepo

Sportsman.ke is a sports e-commerce application built with a React (Vite) frontend and a NestJS (TypeORM) backend.

---

## Local Development Setup

### 1. Installation
Install dependencies for both the frontend and backend:
```bash
npm run install:all
```

### 2. Running the Application
Start both the React frontend and NestJS backend concurrently:
```bash
npm run dev
```

* **Frontend client**: Runs at `http://localhost:5173/` (or `http://localhost:5174/` if port 5173 is occupied)
* **Backend API**: Runs at `http://localhost:3000/api`

---

## Production Deployment (Decoupled Architecture)

To run the application in production, we recommend a decoupled deployment strategy:
1. **Database**: PostgreSQL hosted on **Supabase** (or any Postgres provider).
2. **Backend API**: NestJS hosted on an API-friendly platform like **Render**, **Fly.io**, or **Railway**.
3. **Frontend**: React (Vite SPA) hosted on **Vercel**.

---

### Step 1: Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Retrieve your connection string under **Project Settings -> Database -> Connection string** (use the Transaction/Session Pooler connection string for `DB_HOST`).
3. Set up the schema:
   * Upon the first boot of the production backend, the tables will automatically migrate and seed. There is no need to manually import SQL files.

---

### Step 2: Backend API Deployment (Render Web Service)

To deploy the NestJS API backend to [Render](https://render.com):

1. **Create a New Web Service**:
   * Log into your Render dashboard, click **New +** in the top-right corner, and select **Web Service**.
   * Connect your GitHub repository containing the monorepo code.
2. **Configure the Web Service Settings**:
    * **Name**: `sportsman-backend`
   * **Runtime**: `Node`
   * **Branch**: `main` (or your default branch)
   * **Root Directory**: `backend` (⚠️ **Critical**: This instructs Render to navigate into the `backend` subfolder before installing, building, and running the service).
   * **Build Command**: `npm run build` (This runs `nest build` under the `backend` directory)
   * **Start Command**: `npm run start:prod` (This runs `node dist/src/main` under the `backend` directory)
3. **Configure Environment Variables**:
   * Under **Advanced settings**, add the following environment variables:
   ```ini
  NODE_ENV=production
  PORT=3000
  
  # PostgreSQL Connection Details
  DB_TYPE=postgres
  DB_HOST=aws-1-us-west-2.pooler.supabase.com  # Your Supabase pooler host
  DB_PORT=6543
  DB_USERNAME=postgres.your_project_ref
  DB_PASSWORD=your_database_password
  DB_DATABASE=postgres
  DB_SSL=true

  # JWT Token Verification Security
  JWT_SECRET=use-a-strong-randomly-generated-key

  # SMTP Email Configurations (To send order confirmations)
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=YOUR_EMAIL@gmail.com
  SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
  SMTP_FROM="Sportsman.ke" <YOUR_EMAIL@gmail.com>

  # Production Frontend Origins (Allows cross-domain communication)
  # Include your Vercel deployment domain here:
  ALLOWED_ORIGINS=https://sportsman-frontend.vercel.app,https://sportsman.ke

  # Safaricom Daraja M-Pesa Credentials
  MPESA_API_URL=https://api.safaricom.co.ke  # Safe live endpoint
  MPESA_CONSUMER_KEY=your_production_key
  MPESA_CONSUMER_SECRET=your_production_secret
  MPESA_SHORTCODE=your_till_or_paybill
  MPESA_PASSKEY=your_passkey
  MPESA_CALLBACK_URL=https://your-backend-domain.com/api/mpesa/callback
  ```

---

### Step 3: Frontend Deployment (Vercel)
Deploy the project to [Vercel](https://vercel.com).

#### Vercel Project Settings:
1. **Framework Preset**: Choose **Vite**.
2. **Root Directory**: Set this to `frontend`. (Vercel needs to know the sub-folder where the React application lives).
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   * Add a single variable:
     * Key: `VITE_API_URL`
     * Value: `https://your-backend-domain.com/api` (The public URL of your NestJS backend deployed in Step 2, appending `/api`).

#### ⚠️ Handling Client-Side Routing Reloads (SPA Fallback)
Because this is a Single Page Application (SPA) using client-side routing (`react-router-dom`), reload attempts on sub-pages (e.g. `/cart` or `/admin`) on Vercel will return `404 Not Found` unless a rewrite rule is specified.

To prevent this:
1. Create a `vercel.json` file in your **`frontend`** directory (or inside `frontend/public/`):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. Commit and deploy this file. It directs all route requests back to the `index.html` file so React Router can handle them.

---

### Technical Stack Summary
- **Frontend**: React (Vite, TailwindCSS v4, React Router v7)
- **Backend**: NestJS (TypeScript, TypeORM, Express)
- **Database**:
  - Local Sandbox: SQLite (`sportsman_sandbox.db`)
  - Production: PostgreSQL
