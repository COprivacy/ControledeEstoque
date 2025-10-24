# Controle de Estoque Simples

## Overview

A simple inventory management web application designed for Brazilian small businesses (minimarkets, retail shops). The system provides product management, point-of-sale (PDV) functionality with barcode scanning, sales tracking, reporting features, and Brazilian invoice (NF-e/NFC-e) emission through Focus NFe API integration. Built with a focus on simplicity and mobile-first design for on-the-go inventory management.

**Important:** Each user configures their own Focus NFe account credentials, ensuring the developer assumes no fiscal costs or responsibilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as build tool and dev server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS for styling with shadcn/ui component library

**Design System:**
- Based on shadcn/ui "new-york" style preset
- Custom color palette with Brazilian Portuguese branding
- Neutral base colors (0 0% 94% background, #2563EB primary blue)
- Responsive mobile-first layout using Tailwind breakpoints
- Design guidelines documented in `design_guidelines.md`

**Component Architecture:**
- Presentational components in `/client/src/components` with clear prop interfaces
- Page components in `/client/src/pages` handling routing and business logic
- Shared UI components from shadcn/ui in `/client/src/components/ui`
- Layout wrapper (`DashboardLayout`) with sidebar navigation and header
- Component examples for documentation in `/client/src/components/examples`

**Key Features:**
- Product management with barcode support and expiration date tracking
- PDV (Point of Sale) with real-time barcode scanner simulation
- Sales tracking with cart functionality
- Dashboard with inventory alerts (low stock, expiring products)
- Reports for sales analysis and expiration monitoring
- Supplier management with purchase history and spending tracking
- Purchase registration system with product linking to suppliers
- Client management with purchase history tracking
- **Financial Management Module:**
  - Accounts Payable (Contas a Pagar)
  - Accounts Receivable (Contas a Receber)
  - Projected POS Cash Flow (Fluxo de PDV Projetado)
  - Simplified Income Statement - DRE (DRE Simplificado)
- **Brazilian Invoice (NF-e/NFC-e) Emission** via Focus NFe API
- Fiscal configuration page with legal disclaimer
- Optional invoice emission after each sale

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for REST API
- TypeScript for type safety
- Drizzle ORM for database operations
- Neon Serverless PostgreSQL adapter

**Database Layer:**
- Drizzle ORM with PostgreSQL dialect
- Schema defined in `/shared/schema.ts` with Zod validation
- Three main tables: `users`, `produtos` (products), `vendas` (sales)
- Migration management via drizzle-kit

**API Design:**
- RESTful endpoints with JSON responses
- Authentication routes: `/api/auth/register`, `/api/auth/login`
- Product CRUD: `/api/produtos/*` with barcode lookup support
- Sales: `/api/vendas` with multi-item support via JSON array
- Reports: Daily/weekly aggregations and expiring products filter

**Data Models:**
- **Users:** id (UUID), email (unique), senha (password), nome (name)
- **Products:** id (serial), nome, categoria, preco, quantidade, estoque_minimo, codigo_barras, vencimento
- **Sales:** id (serial), produto, quantidade_vendida, valor_total, data, itens (JSON for multi-item sales), cliente_id
- **Suppliers (Fornecedores):** id (serial), nome, cnpj, telefone, email, endereco, observacoes, data_cadastro
- **Purchases (Compras):** id (serial), fornecedor_id, produto_id, quantidade, valor_unitario, valor_total, data, observacoes
- **Clients (Clientes):** id (serial), nome, cpf_cnpj, telefone, email, endereco, observacoes, data_cadastro
- **Fiscal Config (ConfigFiscal):** id (serial), cnpj, focus_nfe_token (encrypted), ambiente (homologacao/producao)

**Storage Strategy:**
- In-memory storage implementation (`MemStorage`) for development/testing
- Interface-based design (`IStorage`) allows swapping to database implementation
- Seed data includes demo users and products with various expiration dates

### External Dependencies

**UI Component Library:**
- Radix UI primitives for accessible components (accordion, dialog, dropdown, select, etc.)
- shadcn/ui configuration for consistent design system
- Lucide React for iconography

**Database & ORM:**
- Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- Drizzle ORM (`drizzle-orm`, `drizzle-zod`)
- PostgreSQL session store (`connect-pg-simple`) for Express sessions

**Form Management:**
- React Hook Form with Zod resolvers (`@hookform/resolvers`)
- Zod for schema validation and type inference

**Utilities:**
- date-fns for date manipulation and formatting
- clsx and tailwind-merge for conditional styling
- class-variance-authority for component variants

**Development Tools:**
- Vite plugins for Replit integration (cartographer, dev banner, runtime error overlay)
- TypeScript compiler with strict mode
- ESBuild for production server bundling

**Authentication:**
- Basic email/password authentication (currently plain text, needs bcrypt implementation)
- Session-based approach with cookies

**Key Architectural Decisions:**

1. **Monorepo Structure:** Client, server, and shared code in single repository with path aliases
2. **Type Safety:** Shared TypeScript schemas between frontend and backend via `/shared` directory
3. **Progressive Enhancement:** Barcode scanner simulated via keyboard events for accessibility
4. **Bilingual Support:** All UI text in Brazilian Portuguese for target audience
5. **Mobile-First:** Responsive design prioritizing small screens for shop floor use
6. **Fiscal Responsibility:** Each user provides their own Focus NFe credentials - no fiscal costs assumed by developer
7. **Invoice Validation:** Zod schemas validate all invoice data before sending to Focus NFe API

### Recent Changes (October 2025)

**Financial Management Module (October 24, 2025):**
- Created new "Gestão Financeira" category in sidebar navigation
- Added 4 new financial management pages:
  - Contas a Pagar (Accounts Payable) - `/financeiro/contas-pagar`
  - Contas a Receber (Accounts Receivable) - `/financeiro/contas-receber`
  - Fluxo de PDV Projetado (Projected POS Cash Flow) - `/financeiro/fluxo-pdv`
  - DRE Simplificado (Simplified Income Statement) - `/financeiro/dre`
- Reorganized sidebar menu into logical sections: General, Estoque, Gestão Financeira, Sistema
- Added appropriate icons for each financial feature (CreditCard, DollarSign, TrendingUp, LineChart)

**Non-Fiscal Receipt Feature (October 24, 2025):**
- Added "Cupom Não-Fiscal" option in PDV after completing a sale
- New button alongside existing NFC-e emission options
- Generates formatted non-fiscal receipt with:
  - Company information (if configured)
  - Sale items with prices and quantities
  - Total amount and discounts
  - Clear warning that document has no fiscal value
- Features:
  - Copy receipt text to clipboard
  - Print receipt option via browser print dialog
  - Professional receipt formatting with dashed borders
  - Responsive design for mobile and desktop

**Brazilian Invoice System Implementation:**
- Added Focus NFe API integration service (`server/focusnfe.ts`)
- Created fiscal configuration page with legal disclaimer
- Implemented NFC-e emission endpoints with Zod validation
- Integrated invoice emission dialog in PDV (optional after sales)
- Schema validation for all invoice payloads (`shared/nfce-schema.ts`)
- Correct item calculation using actual product prices and subtotals