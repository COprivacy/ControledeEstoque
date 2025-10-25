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

- **Technology Stack:** Node.js, Express.js, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL.
- **Database:** Drizzle ORM with PostgreSQL, schema in `/shared/schema.ts`, Zod validation.
- **API Design:** RESTful with JSON responses, authentication, CRUD for products, sales, and reports.
- **Data Models:** Users, Products, Sales, Suppliers, Purchases, Clients, Fiscal Config.
- **Architectural Decisions:** Monorepo structure, type safety via shared TypeScript schemas, progressive enhancement (barcode simulation), bilingual support (Brazilian Portuguese), mobile-first design, fiscal responsibility (user-provided NFe credentials), and invoice data validation with Zod.
- **Security Note:** Multi-tenant infrastructure is not fully implemented. Backend endpoints require tenant scoping (`conta_id` validation) for robust security before enabling the `/admin` panel. Server-side session/token validation is a future enhancement.

## External Dependencies

- **UI Components:** Radix UI primitives, shadcn/ui, Lucide React (iconography).
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`), Drizzle ORM (`drizzle-orm`, `drizzle-zod`), `connect-pg-simple`.
- **Form Management:** React Hook Form, Zod (`@hookform/resolvers`).
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`.
- **Development Tools:** Vite plugins for Replit, TypeScript, ESBuild.
- **Authentication:** Basic email/password (needs bcrypt).
- **Invoice Integration:** Focus NFe API.