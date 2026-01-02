# Multi-Tenant SaaS Starter – Projects & Tasks (Live Deployment)

A lightweight, Docker-based **multi-tenant SaaS starter platform** where multiple organizations (tenants) can manage users, projects, and tasks with strict data isolation.

This README documents the **live deployed instance** of the application.

---

## 🌐 Live Application URLs

- **Frontend UI:** http://54.83.167.72:3000/
- **Backend API:** http://54.83.167.72:5000/
- **Health Check:** http://54.83.167.72:5000/api/health

---

## Key Capabilities

- Multi-tenant architecture with strict data isolation using `tenant_id`
- Role-based access control (RBAC)
  - `super_admin`
  - `tenant_admin`
  - `user`
- Subscription plan enforcement
  - Maximum users per tenant
  - Maximum projects per tenant
- Automatic database migrations and seed data on startup
- Fully Dockerized frontend, backend, and database

---

## Technology Stack

- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- Infrastructure: Docker & Docker Compose

---

## Accessing the Live System

No local setup is required.  
Use the URLs above along with the seeded credentials below.

---

## Seeded Login Accounts

These accounts are available on the live deployment.

### Super Admin

- Email: superadmin@system.com
- Password: Admin@123

### Demo Tenant

- Subdomain: demo

Tenant Admin:
- admin@demo.com / Demo@123

Tenant Users:
- user1@demo.com / User@123
- user2@demo.com / User@123

---

## Environment Variables (Deployment)

Configured via Docker at deployment time.

- Database: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- Authentication: JWT_SECRET, JWT_EXPIRES_IN
- Server: PORT
- Frontend / CORS: FRONTEND_URL, VITE_API_URL

---

## API Documentation

See:

docs/API.md

---

## Additional Documentation

Available in the `docs/` directory:

- Product Requirements: docs/PRD.md
- Architecture Overview: docs/architecture.md
- Technical Specification: docs/technical-spec.md
- Research Notes: docs/research.md
- API Reference: docs/API.md

---

