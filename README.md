# MAtchMaker Project

## Overview

This repository contains a **full‑stack application** built with a modern React frontend and an Express/Node.js backend. The app demonstrates a matching service that evaluates customer data against various criteria using AI APIs (OpenRouter). It includes a polished UI, authentication, and robust server‑side logic.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router, Tailwind‑style custom CSS, custom hooks for data fetching.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, OpenRouter AI integration.
- **Database**: PostgreSQL (configured via Prisma schema `prisma/`)
- **Environment**: `.env` holds secrets such as `DATABASE_URL` and OpenRouter API keys.

---

## Project Structure

```
Assignment/
├─ client/                 # React frontend
│   ├─ src/
│   │   ├─ assets/        # Images, icons, etc.
│   │   ├─ components/    # Reusable UI components
│   │   ├─ pages/         # Page components (Matches, Dashboard, …)
│   │   ├─ services/      # API service layer
│   │   ├─ App.tsx, main.tsx, index.css, App.css
│   └─ package.json
│
├─ server/                 # Express backend
│   ├─ src/
│   │   ├─ auth/          # Authentication routes/middleware
│   │   ├─ customers/      # Customer CRUD
│   │   ├─ Matching/       # Matching logic
│   │   │   └─ matching.ts # Core matching algorithm (uses OpenRouter)
│   │   ├─ middlewares/   # Logging, error handling, etc.
│   │   ├─ prisma.ts       # Prisma client init
│   │   └─ index.ts        # Server bootstrap
│   ├─ prisma/             # Prisma schema files
│   ├─ .env                # Secrets (DB URL, API keys)
│   └─ package.json
│
├─ .gitignore
├─ README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** (>=18)
- **pnpm** (or npm/yarn) – package manager
- **PostgreSQL** instance (local or remote)

### Setup

```bash
# Clone the repo (if not already)
git clone <repo‑url>
cd MatchMaker
```

#### Frontend

```bash
cd client
pnpm install   # or npm install
pnpm dev       # Starts Vite dev server at http://localhost:5173
```

#### Backend

```bash
cd ../server
pnpm install   # Install dependencies
# Create a .env file (copy from .env.example if provided) and set:
#   DATABASE_URL=postgresql://user:password@host:port/dbname
#   OPENROUTER_API_KEY1=your_key_1
#   OPENROUTER_API_KEY2=your_key_2

pnpm dev       # Starts the Express server (default port 3000)
```

---

## Usage

- Navigate to `http://localhost:5173` to explore the UI.
- The **Matches** page (`src/pages/Matches.tsx`) displays AI‑generated match evaluations.
- Backend routes are defined under `server/src` – you can extend them or add new services as needed.

---

## notable Changes

- **API Keys Simplified**: `server/src/Matching/matching.ts` now filters only `OPENROUTER_API_KEY1` and `OPENROUTER_API_KEY2`. The third key (`OPENROUTER_API_KEY3`) has been removed to avoid unused secrets.

---

## Build & Deploy

For production builds:

```bash
# Frontend
cd client
pnpm build   # Generates static files in `dist/`

# Backend (example using pm2)
cd ../server
pnpm build   # If a build step exists
pm2 start src/index.ts --name assignment-backend
```

Deploy the `client/dist` folder to any static hosting platform (Netlify, Vercel, etc.) and run the backend on a Node‑compatible server.

---

## License

MIT © 2026 Your Name / Organization
