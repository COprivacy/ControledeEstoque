# Controle de Estoque Simples

## Overview

A web application designed for Brazilian small businesses, offering inventory management, point-of-sale (PDV) with barcode scanning, sales tracking, and reporting. A key feature is the integration with Focus NFe API for Brazilian invoice (NF-e/NFC-e) emission. The system prioritizes simplicity, mobile-first design, and includes comprehensive financial management and employee permission controls. Users are responsible for their Focus NFe account credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Technology Stack:** React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui.
- **Design System:** shadcn/ui "new-york" preset, custom Brazilian Portuguese color palette, responsive mobile-first design.
- **Key Features:** Product management (barcode, expiration), PDV, sales tracking, dashboard alerts, reports (sales, expiration), supplier/purchase management, client management, full Financial Management Module (Accounts Payable/Receivable, Projected POS Cash Flow, Simplified Income Statement), Brazilian Invoice (NF-e/NFC-e) emission, optional non-fiscal receipt, and PWA support.
- **Admin Panels:**
    - `/admin-publico`: Super admin for system owner (user management, plan management, Asaas integration).
    - `/admin`: Account admin for customers (employee management, permissions - currently disabled for security).
- **Access Control:** Permission-based system for employees with frontend protection via `usePermissions` and `ProtectedRoute` hooks.

### Backend

- **Technology Stack:** Node.js, Express.js, TypeScript, better-sqlite3 (SQLite).
- **Database:** SQLite with better-sqlite3, schema in `/shared/schema.ts`, Zod validation.
- **API Design:** RESTful with JSON responses, authentication, CRUD for products, sales, and reports.
- **Data Models:** Users, Products, Sales, Suppliers, Purchases, Clients, Fiscal Config, Caixas (Cash Registers), Movimentações de Caixa.
- **Architectural Decisions:** Monorepo structure, type safety via shared TypeScript schemas, progressive enhancement (barcode simulation), bilingual support (Brazilian Portuguese), mobile-first design, fiscal responsibility (user-provided NFe credentials), and invoice data validation with Zod.
- **Security Note:** Multi-tenant infrastructure is not fully implemented. Backend endpoints require tenant scoping (`conta_id` validation) for robust security before enabling the `/admin` panel. Server-side session/token validation is a future enhancement.

### Cash Register System (Caixa)

**Implemented: October 30, 2025**

Complete cash register management with opening/closing functionality integrated with sales operations:

- **Schema:** Two tables - `caixas` (cash registers) and `movimentacoes_caixa` (cash movements)
- **Features:**
  - Opening/closing cash registers with initial and final balances
  - Automatic tracking of sales, supplies (suprimentos), and withdrawals (sangrias)
  - Real-time total updates using dedicated `atualizarTotaisCaixa` method
  - Historical record of all cash register operations
  - Sales require an open cash register to proceed
- **API Endpoints:**
  - GET `/api/caixas` - List all cash registers
  - GET `/api/caixas/aberto` - Get currently open cash register
  - POST `/api/caixas` - Open a new cash register
  - PATCH `/api/caixas/:id/fechar` - Close a cash register
  - POST `/api/caixas/:id/movimentacoes` - Create cash movement (supply/withdrawal)
  - GET `/api/caixas/:id/movimentacoes` - Get all movements for a cash register
- **Frontend:** Complete UI at `/caixa` route for managing all cash operations
- **Integration:** Sales workflow checks for open cash register and updates totals automatically

## External Dependencies

- **UI Components:** Radix UI primitives, shadcn/ui, Lucide React (iconography).
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`), Drizzle ORM (`drizzle-orm`, `drizzle-zod`), `connect-pg-simple`.
- **Form Management:** React Hook Form, Zod (`@hookform/resolvers`).
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`.
- **Development Tools:** Vite plugins for Replit, TypeScript, ESBuild.
- **Authentication:** Basic email/password (needs bcrypt).
- **Invoice Integration:** Focus NFe API.