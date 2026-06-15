# Sportman.ke Full-Stack Monorepo

Sportman.ke is a sports e-commerce application built with a React (Vite) frontend and a NestJS (TypeORM) backend.

## Production Database Connection

The application is configured to connect directly to Supabase PostgreSQL. Tables are dynamically synchronized and seeded upon server boot.

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

## Technical Stack

- **Frontend**: React (Vite, HMR, ESLint)
- **Backend**: NestJS (TypeScript, TypeORM, Express)
- **Database**: 
  - Local Sandbox: SQLite (`sportman_sandbox.db`)
  - Production: PostgreSQL
