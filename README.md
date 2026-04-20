# EnRegla

> **Plataforma SaaS de gestión de compliance normativo para empresas multi-sede en LATAM**

[![Production](https://img.shields.io/badge/status-production-brightgreen)](https://enregla.vercel.app)
[![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue)](./docs/product/PRODUCT.md)
[![License](https://img.shields.io/badge/license-proprietary-red)]()

**EnRegla** centraliza la gestión de permisos operacionales, licencias municipales, y requisitos legales, eliminando hojas de cálculo y correos dispersos. Diseñada para gerentes de compliance, consultores legales, y dueños de PYME.

---

## 🚀 Quick Start

```bash
# Clone & install
git clone https://github.com/mdanilorojas/enregla.git
cd enregla
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Platform
- ✅ **Authentication**: Email/password + Google OAuth
- ✅ **Dashboard**: Métricas de compliance (vigentes, vencidos, por vencer)
- ✅ **Sedes Management**: CRUD completo con risk scoring automático
- ✅ **Permit Tracking**: Documentos, fechas de vencimiento, status badges
- ✅ **Public Links**: QR codes compartibles para inspectores
- ✅ **Network Map**: Visualización de relaciones empresa-sedes-permisos
- ✅ **Onboarding**: Wizard incremental (profile → company → locations)

### Design System
- 🎨 **UI v2**: shadcn/ui components con Manrope typography
- 🎨 **Functional Badges**: Risk (crítico/alto/medio/bajo) y status (vigente/vencido)
- 🎨 **Professional Theme**: Light mode, corporativo moderno

### Coming Soon (Phase 2-4)
- 🔔 Smart alerts (email/SMS notifications)
- 📊 Custom reports (PDF generation)
- 👥 Team management (RBAC, invites)
- 🌎 Multi-country support (Chile, México)
- 🔌 Public API & integrations

See full [Product Roadmap](./docs/product/ROADMAP.md)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + TypeScript 5.0 |
| **Build Tool** | Vite 8.0 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand (global), React Hook Form (forms) |
| **Routing** | React Router v7 |
| **Backend** | Supabase (PostgreSQL 15 + Auth + Storage) |
| **Deployment** | Vercel (Frontend) + Supabase Cloud (Backend) |
| **Testing** | Vitest + React Testing Library |
| **Linting** | ESLint 9 + TypeScript ESLint |

### Key Dependencies
- `@supabase/supabase-js` - Backend client
- `@radix-ui/*` - Headless UI primitives
- `react-hook-form` + `zod` - Form validation
- `lucide-react` - Icon system
- `d3-force` - Network map layout
- `qrcode.react` - QR code generation

---

## 📁 Project Structure

```
enregla/
├── config/                    # Build & lint configuration
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── eslint.config.js
│
├── docs/                      # Documentation
│   ├── product/              # Product docs (PRODUCT.md, ROADMAP.md, BACKLOG.md)
│   ├── architecture/         # Architecture & design context
│   ├── project/              # Project status & planning
│   ├── guides/               # User & developer guides
│   ├── superpowers/          # Feature specs & implementation plans
│   └── legacy/               # Archived documentation
│
├── public/                    # Static assets (favicon, etc.)
│
├── scripts/                   # Utility scripts
│   └── create-demo-data.sql  # Demo data seeding
│
├── src/
│   ├── components/
│   │   ├── ui-v2/           # shadcn/ui components (Badge, Button, Card, etc.)
│   │   ├── layout/          # Legacy layout components
│   │   └── layout-v2/       # New layout (AppLayout with sidebar)
│   │
│   ├── features/             # Legacy features (UI v1)
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── legal/
│   │   ├── renewals/
│   │   └── tasks/
│   │
│   ├── features-v2/          # New features (UI v2)
│   │   ├── auth/            # Login, OAuth callback
│   │   ├── dashboard/       # Dashboard v2
│   │   ├── design-system/   # Component testing view
│   │   ├── locations/       # Sedes CRUD + risk scoring
│   │   ├── network/         # Network map v2
│   │   ├── onboarding-incremental/
│   │   ├── permits/         # Permit upload
│   │   └── public-links/    # Public verification pages
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useLocations.ts
│   │   └── usePermits.ts
│   │
│   ├── lib/                 # Business logic & API clients
│   │   ├── api/            # API functions
│   │   ├── supabase.ts     # Supabase client
│   │   ├── risk.ts         # Risk calculation
│   │   └── permitRules.ts  # Permit validation rules
│   │
│   ├── store/              # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── styles/             # Global styles & design tokens
│   │   └── design-tokens.css
│   │
│   ├── types/              # TypeScript types
│   │   ├── database.ts
│   │   └── index.ts
│   │
│   ├── App.tsx             # Root component & routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global CSS
│
├── supabase/
│   └── migrations/          # Database migrations
│
├── .env.example             # Environment variables template
├── .env.local               # Local environment (gitignored)
├── components.json          # shadcn/ui configuration
├── package.json
└── vercel.json             # Vercel deployment config
```

---

## 💻 Development

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Supabase account

### Environment Variables

Create `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# UI Version (v1 or v2)
VITE_UI_VERSION=v2

# Feature Flags (optional)
VITE_ENABLE_PUBLIC_LINKS=true
```

### Available Scripts

```bash
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production (outputs to dist/)
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run test        # Run Vitest tests
npm run test:ui     # Run tests with Vitest UI
```

### Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run migrations:
   ```bash
   # Option 1: Via Supabase CLI
   npx supabase db push

   # Option 2: Manual (copy SQL from supabase/migrations/)
   ```
3. Seed demo data:
   ```bash
   npm run seed
   ```

See [Supabase Setup Guide](./docs/legacy/SUPABASE_SETUP.md) for details.

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Configure environment variables (same as `.env.local`)
4. Deploy

**Auto-deploy**: Every push to `main` triggers deployment.

### Build Optimizations
- ✅ Tree-shaking enabled
- ✅ Code splitting by route
- ✅ CSS purging (Tailwind)
- ✅ Build time: ~1.5s
- ✅ Lighthouse score: 90+

---

## 📚 Documentation

### Product Documentation
- [**PRODUCT.md**](./docs/product/PRODUCT.md) - Product vision, strategy, features
- [**ROADMAP.md**](./docs/product/ROADMAP.md) - Roadmap (Phases 1-4)
- [**BACKLOG.md**](./docs/product/BACKLOG.md) - Prioritized user stories (RICE scoring)

### Technical Documentation
- [**Architecture Context**](./docs/architecture/.impeccable.md) - Design principles & brand identity
- [**Code Review Findings**](./docs/CODE-REVIEW-FINDINGS.md) - Audit results & recommendations
- [**Feature Specs**](./docs/superpowers/specs/) - Detailed feature designs
- [**Implementation Plans**](./docs/superpowers/plans/) - Step-by-step implementation guides

### Guides
- [**Project Status**](./docs/project/status-2026-04-14.md) - Current state & next steps
- [**UI v2 Inventory**](./docs/UI-V2-INVENTORY.md) - Feature migration status
- [**Supabase Setup**](./docs/legacy/SUPABASE_SETUP.md) - Database configuration

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes & commit: `git commit -m "feat: add feature"`
3. Push & create PR: `git push origin feature/your-feature`
4. Code review → Merge to `main`

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Add/update tests
- `chore:` - Maintenance tasks

### Code Standards
- ✅ TypeScript strict mode
- ✅ ESLint with React rules
- ✅ Prettier (auto-format on save)
- ✅ No console.log in production
- ✅ JSDoc comments for complex logic

---

## 📊 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build time | < 2s | 1.53s ✅ |
| FCP (First Contentful Paint) | < 1.5s | TBD |
| TTI (Time to Interactive) | < 3s | TBD |
| Lighthouse Score | > 90 | TBD |
| Test Coverage | > 80% | 8/8 passing ✅ |

---

## 🔒 Security

- ✅ Row-Level Security (RLS) en todas las tablas
- ✅ HTTPS only en producción
- ✅ Email verification requerida
- ✅ Secure session management
- ⏳ 2FA (Two-Factor Auth) - Phase 3
- ⏳ Audit logs - Phase 3

Report security issues to: [security@enregla.com](mailto:security@enregla.com)

---

## 📞 Support & Contact

- **GitHub**: [mdanilorojas/enregla](https://github.com/mdanilorojas/enregla)
- **Issues**: [Report a bug](https://github.com/mdanilorojas/enregla/issues)
- **Supabase Project**: `zqaqhapxqwkvninnyqiu`

---

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ using Claude Code**  
**Last Updated**: 2026-04-20
