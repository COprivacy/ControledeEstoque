# Controle de Estoque Simples

## Overview

A web application designed for Brazilian small businesses, offering inventory management, point-of-sale (PDV) with barcode scanning, sales tracking, and reporting. A key feature is the integration with Focus NFe API for Brazilian invoice (NF-e/NFC-e) emission. The system prioritizes simplicity, mobile-first design, and includes comprehensive financial management and employee permission controls. Users are responsible for their Focus NFe account credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Comprehensive Performance Optimizations - November 1, 2025
- **Implemented Multi-Layer Performance Improvements:** System-wide optimizations to reduce response time across all features
  - **Backend Compression:** Added gzip compression (level 6) on all API responses with optional bypass via `x-no-compression` header
  - **Database Indexing:** Created SQLite indexes on frequently queried fields (`users.email`, `produtos.codigo_barras`, `user_id` across all tables)
  - **Debounced Persistence:** Implemented 500ms debounce buffer for SQLite writes to reduce file I/O operations
  - **React Query Caching:** Configured intelligent cache with 5-minute `staleTime` and 10-minute `gcTime` to minimize redundant API calls
  - **Component Memoization:** Applied `React.memo` to `ProductCard` and `StatsCards` components to prevent unnecessary re-renders
  - **Event Handler Optimization:** Used `useCallback` for event handlers in Products page to maintain referential equality
  - **Query Result Limiting:** Added support for optional `limit` parameter in `/api/produtos` endpoint for pagination
  - Fixed critical bug where database indexes were created before tables existed, preventing fresh database initialization
  - Validated by architect review - all optimizations approved, no security concerns identified

### Editable Plan Expiration Days - November 1, 2025
- **Added Editable "Dias Restantes" Field:** Implemented manual plan/trial extension in Admin Master panel
  - New "Dias Restantes" (remaining days) input field in user edit form at `/admin-master`
  - Real-time preview showing calculated expiration date based on input days
  - Smart preservation logic: only updates `data_expiracao_plano` when field is explicitly filled with positive value
  - Empty or zero values preserve original expiration date (fixes data integrity issue)
  - Field displays current remaining days for users with active expiration, blank for users without
  - Allows manual extension/reduction of trial or plan duration without changing plan type
  - Validated by architect review - no data integrity or security issues

### Trial Expiration & Plan Subscription System - November 1, 2025
- **Implemented Trial Expiration Blocking:** Complete system to block access when 7-day trial expires
  - Created `/planos` page showing monthly (R$ 99,90/mês) and annual (R$ 959,90/ano) plan options
  - Implemented `TrialExpiredModal` component that displays full-screen blocking overlay when trial expires
  - Modal shows message "Para continuar utilizando nossos serviços, contrate um plano" with link to plans page
  - Integrated modal into `DashboardLayout` to block all protected routes when trial expires
  - Fixed `usePermissions().isPremium()` to support both legacy plan names (mensal/anual) and current names (premium_mensal/premium_anual)
  - Plans page integrates with existing `CheckoutForm` component for Asaas payment processing
  - Blocking logic respects admin users, employees with permissions, and users with active paid plans
  - Validated by architect review - no security issues, consistent with existing checkout workflow

### Bug Fixes - October 31, 2025
- **Fixed User Update Bug:** Corrected issue where plan changes and admin flag updates in Admin Master panel were not being saved to database
  - Root cause: Use of `||` operator in `updateUser` method treated falsy values incorrectly
  - Solution: Replaced `||` with explicit `!== undefined` checks in `server/sqlite-storage.ts`
  - Added comprehensive debug logging for update operations
  - Validated by architect review - no security concerns or side effects identified
  
- **Fixed Admin Permission Update Bug:** Resolved issue where removing admin permissions from a logged-in user didn't immediately take effect
  - Root cause: localStorage was not being updated when user permissions changed via Admin Master panel
  - Solution: Added localStorage update logic in `updateUserMutation.onSuccess` in `client/src/pages/AdminPublico.tsx`
  - When admin flag is removed from currently logged-in user, system now updates localStorage and redirects to dashboard
  - Validated by architect review - works correctly with brief 2-second notification before redirect

- **Performance Optimization:** Significantly improved user update operation speed
  - Root cause: Excessive debug logging with JSON.stringify was slowing down updates (35-61ms)
  - Solution: Removed debug logs from `server/sqlite-storage.ts` and `server/routes.ts`
  - Result: Update operations now complete in <10ms (6x faster)
  - Validated by architect review - no security or functional regressions

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
- **Multi-Tenant Security:** Complete data isolation implemented across all API routes (October 31, 2025):
  - All entity routes use `getUserId` middleware to extract `effective-user-id` from headers
  - All CREATE operations inject `user_id` for tenant ownership
  - All READ operations filter by `user_id` to prevent cross-tenant data leakage
  - All UPDATE/DELETE operations validate ownership before mutation
  - Employee (funcionários) routes validate `conta_id` matches authenticated user
  - DELETE /api/vendas scoped to only delete authenticated user's sales
  - Server-side session/token validation is a future enhancement

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