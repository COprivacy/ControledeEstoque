# Controle de Estoque Simples

## Overview
A web application for Brazilian small businesses, offering inventory management, point-of-sale (PDV) with barcode scanning, sales tracking, and reporting. It includes integration with the Focus NFe API for Brazilian invoice (NF-e/NFC-e) emission. The system emphasizes simplicity, mobile-first design, comprehensive financial management, and employee permission controls. Users are responsible for their Focus NFe account credentials.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
**2025-11-10:** Fixed Orçamentos (Budget/Quotes) page - rebuilt with professional UI, proper data validation, and full functionality (create, view, print, approve, reject, convert to sale, delete). Resolved TypeScript naming conflicts (camelCase vs snake_case).

## System Architecture

### Frontend
- **Technology Stack:** React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui.
- **Design System:** shadcn/ui "new-york" preset, custom Brazilian Portuguese color palette, responsive mobile-first design.
- **Key Features:** Product management (barcode, expiration), PDV, sales tracking, dashboard alerts, reports (sales, expiration), supplier/purchase management, client management, returns/devolutions management, full Financial Management Module (Accounts Payable/Receivable, Projected POS Cash Flow, Simplified Income Statement), Brazilian Invoice (NF-e/NFC-e) emission, optional non-fiscal receipt, and PWA support.
- **Admin Panels:** `/admin-publico` (Super admin for system owner), `/admin` (Account admin for customers).
- **Access Control:** Permission-based system for employees with frontend protection.

### Backend
- **Technology Stack:** Node.js, Express.js, TypeScript.
- **Database:** Neon-hosted PostgreSQL with Drizzle ORM.
- **API Design:** RESTful with JSON responses, authentication, CRUD for products, sales, and reports.
- **Data Models:** Users, Products, Sales, Suppliers, Purchases, Clients, Devoluções (Returns), Fiscal Config, Caixas (Cash Registers), Movimentações de Caixa.
- **Architectural Decisions:** Monorepo structure, type safety via shared TypeScript schemas, progressive enhancement, bilingual support (Brazilian Portuguese), mobile-first design, fiscal responsibility (user-provided NFe credentials), and invoice data validation with Zod.
- **Multi-Tenant Security:** Complete data isolation across all API routes using `effective-user-id` for ownership and filtering.
- **Cash Register System (Caixa):** Complete cash register management with opening/closing, automatic tracking of sales/movements, and historical records. Sales require an open cash register.

## External Dependencies
- **UI Components:** Radix UI primitives, shadcn/ui, Lucide React.
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`), Drizzle ORM (`drizzle-orm`, `drizzle-zod`), `connect-pg-simple`.
- **Form Management:** React Hook Form, Zod (`@hookform/resolvers`).
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`.
- **Development Tools:** Vite plugins for Replit, TypeScript, ESBuild.
- **Authentication:** Basic email/password.
- **Invoice Integration:** Focus NFe API.
- **Payment Gateway:** Mercado Pago (for subscription management and employee package purchases).