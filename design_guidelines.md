# Design Guidelines: Controle de Estoque Simples

## Design Approach
**Utility-Focused Dashboard Application** - Following a clean, functional design system inspired by modern productivity tools, prioritizing clarity and efficiency for Brazilian small business owners.

## Core Design Principles
- **Simplicity First**: Clean, beginner-friendly interface with minimal visual complexity
- **Business Focus**: Professional appearance suitable for retail/minimarket environments
- **Mobile-First**: Fully responsive design for on-the-go inventory management
- **Clear Feedback**: Immediate visual confirmation for all user actions

## Color Palette

**Primary Colors:**
- Brand Blue: 217 91% 60% (#2563EB) - All primary buttons, active states, links
- Background: 0 0% 94% (#F0F0F0) - Main app background
- White: 0 0% 100% - Cards, forms, content areas

**Alert Colors:**
- Low Stock Alert: 0 84% 60% - Red background for critical inventory alerts
- Success: 142 71% 45% - Confirmation messages ("Venda registrada")
- Error: 0 84% 60% - Error states ("Estoque insuficiente")
- Warning: 38 92% 50% - Warning indicators

**Neutral Tones:**
- Text Primary: 0 0% 20% - Main content text
- Text Secondary: 0 0% 50% - Supporting text, labels
- Border: 0 0% 80% - Input borders, dividers

## Typography

**Font Stack:**
- System Fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Headings: Bold (600-700 weight), larger sizes for hierarchy
- Body Text: Regular (400 weight), 16px base for readability
- Labels/Small Text: 14px for form labels, table headers

**Text Hierarchy:**
- Page Titles: 24-28px, Bold
- Section Headers: 18-20px, Semibold
- Body Text: 16px, Regular
- Supporting Text: 14px, Regular

## Layout System

**Spacing Scale (Tailwind-based):**
- Micro spacing: 2, 4 units (p-2, m-4) - Internal padding, small gaps
- Standard spacing: 6, 8 units - Form fields, card padding
- Section spacing: 12, 16 units - Between major sections
- Page margins: 16, 20, 24 units - Outer containers

**Container Strategy:**
- Max Width: 1200px for dashboard content
- Form Containers: 400-500px max-width, centered
- Responsive Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)

## Component Library

**Navigation:**
- Top Navigation Bar: Fixed header with logo "Controle de Estoque Simples", user email, logout
- Side Menu (Desktop): Vertical navigation with icons - Dashboard, Produtos, Vendas, Relatórios
- Mobile Menu: Hamburger menu collapsing to slide-out drawer

**Forms:**
- Input Fields: White background, subtle border (1px #CCCCCC), rounded corners (4px)
- Labels: Above inputs, 14px, semibold, dark gray
- Primary Buttons: Blue (#2563EB), white text, 8px padding, rounded corners
- Secondary Buttons: White background, blue border and text
- Form Validation: Red text below inputs for errors, green checkmark for success

**Data Display:**
- Product Cards/Table: White background, shadow (0 1px 3px rgba(0,0,0,0.1))
- Low Stock Highlight: Red background (0 84% 95%), red text, bold quantity
- Sales Table: Striped rows (alternating white and light gray), sortable headers
- Alert Badges: Pill-shaped, colored backgrounds matching alert colors

**Dashboard Components:**
- Summary Cards: White cards showing total products, low stock count, today's sales
- Quick Actions: Large buttons for "Adicionar Produto" and "Registrar Venda"
- Alert Panel: Prominent red-bordered section listing low stock items

**Reports:**
- Date Range Picker: Clean date inputs with calendar icon
- Report Tables: Professional styling with alternating row colors
- Total Summaries: Highlighted in blue background with white text

## Images

**No Hero Images Required** - This is a utility dashboard application focused on functionality over marketing aesthetics.

**Icon Usage:**
- Use Font Awesome or similar icon library via CDN
- Icons for: Dashboard (home), Products (box), Sales (shopping-cart), Reports (chart-bar), Alerts (exclamation-triangle)
- Icon size: 20px in navigation, 16px in buttons

## Responsive Design

**Mobile (<640px):**
- Single column layout
- Stacked navigation (hamburger menu)
- Full-width forms and tables
- Touch-friendly button sizes (44px minimum height)

**Tablet (640-1024px):**
- Two-column grid for product cards
- Collapsible side navigation
- Optimized table scrolling

**Desktop (>1024px):**
- Multi-column dashboard layout (3-4 cards per row)
- Persistent side navigation
- Full-width tables with all columns visible

## Interaction Patterns

**User Feedback:**
- Toast Notifications: Slide-in from top-right, auto-dismiss after 3 seconds
- Success Messages: Green background, checkmark icon, Portuguese text
- Error Messages: Red background, X icon, clear error explanation
- Loading States: Blue spinner for form submissions, skeleton screens for data loading

**Animations:**
- Minimal, functional animations only
- Button hover: Slight darkening of blue
- Form validation: Smooth error message slide-in
- Page transitions: None (instant navigation for speed)

## Portuguese Language Considerations

- All UI text in Brazilian Portuguese (pt-BR)
- Currency: R$ format with comma for decimals (R$ 25,50)
- Date Format: DD/MM/YYYY (Brazilian standard)
- Error Messages: Friendly, clear Brazilian Portuguese ("Estoque insuficiente para esta venda")
- Button Labels: Action-oriented ("Adicionar Produto", "Registrar Venda", "Ver Relatório")

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Form inputs with associated labels (for attribute)
- Error messages linked to inputs (aria-describedby)
- Keyboard navigation support for all interactive elements
- Focus indicators: Blue outline on interactive elements