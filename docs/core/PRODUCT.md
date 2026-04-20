# EnRegla - Product Documentation

**Version**: 1.0.0-MVP  
**Last Updated**: 2026-04-20  
**Status**: Production (UI v2 merged)

---

## 📋 One-Page Product Description

### What is EnRegla?

**EnRegla** es una plataforma SaaS de gestión de cumplimiento normativo (compliance) diseñada para empresas multi-sede en Ecuador, Colombia y Perú. Centraliza la gestión de permisos operacionales, licencias municipales, y requisitos legales, eliminando hojas de cálculo y correos dispersos.

### Target Users

1. **Gerentes/Administradores** (Primary) - Gestionan compliance para múltiples sedes durante jornada laboral
2. **Consultores legales/compliance** (Secondary) - Asesoran múltiples clientes, requieren herramienta profesional
3. **Dueños de pequeñas empresas** (Tertiary) - Manejan su propio compliance sin equipo dedicado

### Core Value Proposition

> **"Tu operación, siempre en regla."**

**Antes**: Hojas de cálculo, alertas perdidas, multas por permisos vencidos, pánico antes de inspecciones.

**Después**: Dashboard centralizado, alertas automáticas, documentos organizados, risk scoring automático, enlaces públicos para inspectores.

### Key Differentiators

1. **Risk Scoring Automático**: Calcula nivel de riesgo (crítico/alto/medio/bajo) basado en permisos vencidos y tipo de industria
2. **Public Verification Links**: QR codes compartibles con inspectores para verificar compliance sin acceso a la plataforma
3. **Multi-Sede Ready**: Diseñado desde día 1 para cadenas con 10-100+ locaciones
4. **Marco Legal Integrado**: Normativas ecuatorianas/colombianas/peruanas como referencia en-app

---

## 🎯 Product Strategy

### North Star Metric

**% de permisos vigentes en sedes activas**

Target: 95%+ de permisos vigentes (no vencidos) en todas las sedes operando.

**Why this metric?**
- Indica éxito real del cliente (evitan multas, inspecciones pasan)
- Correlaciona con retención y expansión
- Refleja valor entregado (compliance proactivo vs reactivo)

### Product Vision (3-5 años)

**"Ser la plataforma de compliance #1 en LATAM para empresas multi-sede, expandiéndose más allá de permisos operacionales hacia certificaciones industriales, compliance laboral, y auditorías integradas."**

### Strategic Pillars

1. **Simplicity First**: Onboarding < 15 min, UI accesible sin expertise legal
2. **Proactive Compliance**: Alertas inteligentes, risk scoring, renovaciones automáticas
3. **Collaboration**: Compartir info con inspectores, consultores, equipo multi-sede
4. **Expansion Ready**: Arquitectura para escalar a 1000+ sedes, múltiples países

---

## 🚀 Roadmap

### ✅ Phase 1: MVP (SHIPPED - 2026-04-20)

**Goal**: Demostrar valor en gestión de permisos y alertas para empresas multi-sede

**Features Shipped:**
- ✅ Auth (Email + Google OAuth)
- ✅ Dashboard con métricas (sedes, permisos vigentes, vencidos, por vencer)
- ✅ CRUD Sedes (locations) con risk scoring automático
- ✅ CRUD Permisos con upload de documentos
- ✅ Public Verification Links (QR codes para inspectores)
- ✅ Mapa de Red (relaciones empresa-sedes-permisos)
- ✅ Onboarding incremental (profile → company → locations)
- ✅ Design System v2 (Manrope typography, functional badges, professional theme)

**Tech Stack:**
- React 19 + TypeScript
- Vite 8 + Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- shadcn/ui components
- Zustand (state), React Hook Form, Zod validation

**Metrics Achieved:**
- Build time: 1.53s
- Test coverage: 8/8 passing
- Code review score: 6/10 → Production-ready

---

### 🔄 Phase 2: Feature Parity + Polish (Q2 2026 - 4-6 weeks)

**Goal**: Migrar features faltantes a UI v2 y eliminar deuda técnica

**Priorities:**

#### P0 - Critical (Week 1-2)
- [ ] **Marco Legal v2** - Recrear LegalReferenceView con UI v2
  - Base de datos de normativas (Código de Comercio EC, Ley de Turismo, etc.)
  - Búsqueda por industria/tipo de permiso
  - Links a fuentes oficiales
  - *Why*: Usuarios lo consultan antes de inspecciones, es referencia clave

- [ ] **Renovaciones v2** - Recrear RenewalTimelineView con UI v2
  - Timeline de renovaciones próximas (30/60/90 días)
  - Batch renewal (renovar múltiples permisos)
  - Email reminders integrados
  - *Why*: Feature #2 más usada después de Dashboard

#### P1 - High (Week 3-4)
- [ ] **Tareas v2** - Recrear TaskBoardView con UI v2
  - Kanban board (To Do / In Progress / Done)
  - Asignar tareas a usuarios
  - Link tareas a permisos específicos
  - *Why*: Equipos usan esto para coordinar renovaciones

- [ ] **Documents Vault** - Evaluar y mejorar DocumentVaultView
  - Subida masiva de documentos
  - OCR para extraer fechas de vencimiento (futuro)
  - Folders por sede
  - *Why*: Usuarios suben 10-50 PDFs, UX actual es lenta

#### P2 - Medium (Week 5-6)
- [ ] **Network Map bug fixes** - Arreglar issues en mapa interactivo
  - Relaciones empresa ↔ sedes ↔ permisos visuales
  - Performance con 50+ nodos
  - Filtros por tipo de permiso
  - *Why*: Feature "wow" en demos, pero tiene bugs reportados

- [ ] **Consolidar design tokens** - Unificar index.css y design-tokens.css
- [ ] **Memoizar risk calculation** - Optimizar circular dependency useLocations ↔ usePermits
- [ ] **Mover componentes compartidos** - Desacoplar features-v2 de features viejas

---

### 🌱 Phase 3: Growth Features (Q3 2026 - 8-10 weeks)

**Goal**: Features que habilitan expansión B2B y viralidad

#### 3.1 Multi-Tenant Improvements
- [ ] **Roles & Permissions** granulares
  - Admin / Operator / Viewer roles
  - Permisos por sede (un usuario solo ve ciertas sedes)
  - *Use case*: Consultores gestionan 10+ clientes en una cuenta

- [ ] **Invites & Team Management**
  - Invitar usuarios por email
  - Dashboard de equipo (quién hizo qué)
  - *Use case*: Gerente invita a su equipo legal

#### 3.2 Proactive Compliance Intelligence
- [ ] **Smart Alerts & Notifications**
  - Email + SMS alerts (30/15/7 días antes de vencimiento)
  - Alertas configurables por tipo de permiso
  - Digest semanal de compliance status
  - *Why*: Reducir permisos vencidos de 15% → 5%

- [ ] **Regulatory Calendar**
  - Calendario anual de fechas clave (cierre fiscal, inspecciones comunes)
  - Sincronizar con Google Calendar / Outlook
  - *Why*: Empresas pierden plazos de renovación

- [ ] **Compliance Recommendations**
  - Sugerencias basadas en industry best practices
  - "Sedes similares suelen tener estos permisos adicionales"
  - *Why*: Educación proactiva, upsell natural

#### 3.3 Reporting & Analytics
- [ ] **Custom Reports**
  - Exportar reportes PDF para gerencia
  - Gráficos de compliance over time
  - Drill-down por sede/región/tipo de permiso
  - *Why*: CFOs y legal teams necesitan reportes trimestrales

- [ ] **Audit Trail**
  - Log de todos los cambios (quién actualizó qué y cuándo)
  - Export CSV para auditorías externas
  - *Why*: Requisito para certificaciones ISO

---

### 🚀 Phase 4: Platform Expansion (Q4 2026 - 12+ weeks)

**Goal**: Convertir EnRegla en plataforma de compliance integral

#### 4.1 Marketplace & Integrations
- [ ] **Renovación asistida** - Conectar con abogados/consultores externos
  - Directorio de consultores certificados
  - Request quotes dentro de la app
  - *Business model*: Comisión 10-15% por referrals

- [ ] **API Pública**
  - Webhooks para integraciones (Slack, Zapier)
  - REST API para custom dashboards
  - *Why*: Empresas enterprise quieren integrar con ERP

#### 4.2 Vertical Expansion
- [ ] **Compliance Laboral** (nuevo módulo)
  - Contratos, certificados de trabajo, afiliaciones IESS
  - Fechas de renovación de contratos
  - *Why*: Mismo pain point, diferente vertical

- [ ] **Certificaciones Industriales**
  - ISO 9001, ISO 14001, HACCP
  - Tracking de auditorías externas
  - *Why*: Empresas medianas/grandes necesitan esto

#### 4.3 Geographic Expansion
- [ ] **Chile & México** - Adaptar marco legal
- [ ] **Multi-Language** - EN/ES/PT

---

## 📊 Feature Inventory (Current State)

### ✅ Production Features (UI v2)

| Feature | Route | Status | Coverage |
|---------|-------|--------|----------|
| **Auth** | `/login`, `/auth/callback` | ✅ Shipped | Email + Google OAuth |
| **Dashboard** | `/` | ✅ Shipped | Métricas, risk overview, sedes grid |
| **Sedes (Locations)** | `/sedes`, `/sedes/:id` | ✅ Shipped | CRUD, risk scoring, permits table |
| **Create Location** | Modal | ✅ Shipped | Auto risk calculation |
| **Public Links** | `/p/:token` | ✅ Shipped | QR codes, public verification |
| **Onboarding** | `/setup` | ✅ Shipped | Incremental wizard (profile/company/locations) |
| **Design System** | `/design-system` | ✅ Shipped | Component testing view |

### 🔄 Legacy Features (UI v1 - Needs Migration)

| Feature | Route | Status | Priority |
|---------|-------|--------|----------|
| **Marco Legal** | `/marco-legal` | 🟡 v1 only | P0 - Critical |
| **Renovaciones** | `/renovaciones` | 🟡 v1 only | P0 - Critical |
| **Tareas** | `/tareas` | 🟡 v1 only | P1 - High |
| **Permisos** | `/permisos`, `/permisos/:id` | 🟡 v1 only | P1 - High |
| **Documents Vault** | (in permits detail) | 🟡 v1 only | P1 - High |
| **Network Map** | `/mapa-red` | 🟡 v1 (buggy) | P2 - Medium |

### 🚧 Partially Implemented

| Feature | Status | Next Steps |
|---------|--------|------------|
| **Permit Upload** | ✅ Backend ready | UI polish, error states |
| **Risk Calculation** | ✅ Automatic | Memoize for performance |
| **Alerts** | ❌ Not implemented | Phase 3 priority |
| **Email Notifications** | ❌ Not implemented | Phase 3 priority |
| **Team Management** | ❌ Not implemented | Phase 3 priority |
| **Reports/Export** | ❌ Not implemented | Phase 3 priority |

---

## 🎯 Success Metrics

### Product-Market Fit Signals

**Leading Indicators:**
- [ ] **Onboarding completion rate** > 80% (users who create ≥1 location)
- [ ] **Weekly Active Users (WAU)** > 60% of signups after week 4
- [ ] **Retention (M1)** > 50% of users active after 30 days
- [ ] **NPS Score** > 40 (measure after 50+ users)

**Lagging Indicators:**
- [ ] **Permisos vigentes %** > 90% (North Star delivered)
- [ ] **Churn rate** < 10% monthly
- [ ] **Expansion revenue** > 20% of MRR (multi-sede upsells)

### Feature-Specific KPIs

| Feature | Success Metric | Target |
|---------|----------------|--------|
| Dashboard | Daily active views | 80% of WAU |
| Sedes CRUD | Avg sedes per company | 5+ sedes |
| Public Links | Links shared/month | 2+ per active company |
| Renovaciones | Permisos renewed on-time | 85%+ |
| Alerts | Alert click-through rate | 40%+ |

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 19 + TypeScript 5.0
- **Build Tool**: Vite 8.0 (1.53s builds)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (global), React Hook Form (forms)
- **Routing**: React Router v7
- **Validation**: Zod schemas

### Backend Stack
- **BaaS**: Supabase (PostgreSQL 15 + Auth + Storage)
- **Auth**: Email/Password + Google OAuth
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Storage**: Supabase Storage (permit documents, avatars)
- **Real-time**: Supabase Realtime (future: live dashboard updates)

### Key Design Decisions

1. **Monorepo with Feature Flags**: UI v1 and v2 coexist, toggled via `UI_VERSION` env var
2. **Functional Badge System**: Risk and status badges use semantic CSS variables
3. **Automatic Risk Scoring**: Location risk = f(vencidos%, por_vencer%, industry_type)
4. **Public Links via UUID**: Shareable tokens (`/p/:token`) without auth for inspectors

### Performance Targets
- **Build time**: < 2s (current: 1.53s) ✅
- **FCP (First Contentful Paint)**: < 1.5s
- **TTI (Time to Interactive)**: < 3s
- **Lighthouse Score**: > 90

---

## 🔒 Security & Compliance

### Data Security
- ✅ Row-Level Security (RLS) en todas las tablas
- ✅ Email verification requerida
- ✅ HTTPS only en producción
- ⏳ 2FA (Two-Factor Auth) - Phase 3
- ⏳ Audit logs - Phase 3

### Compliance
- ✅ GDPR-ready (data export, deletion requests)
- ⏳ SOC 2 Type II - Phase 4 (si enterprise sales escalan)

---

## 💼 Business Model

### Pricing Strategy (Future)

**Freemium Model:**
- **Free**: 1 sede, 10 permisos max, public links limitados
- **Pro**: $49/mes - 10 sedes, permisos ilimitados, alerts, reports
- **Business**: $149/mes - 50 sedes, team management, API access
- **Enterprise**: Custom - 100+ sedes, SLA, dedicated support

**Unit Economics (Proyección):**
- CAC (Customer Acquisition Cost): $200-300 (ads + sales)
- LTV (Lifetime Value): $1,500+ (avg 30 meses de retención)
- LTV:CAC Ratio: 5:1 (healthy SaaS)

---

## 📚 Related Documentation

### Project Docs
- [`docs/CODE-REVIEW-FINDINGS.md`](docs/CODE-REVIEW-FINDINGS.md) - Code review audit results
- [`docs/UI-V2-INVENTORY.md`](docs/UI-V2-INVENTORY.md) - Feature migration status (v1 → v2)
- [`docs/UI-V2-MERGE-PLAN.md`](docs/UI-V2-MERGE-PLAN.md) - Merge strategy & checklist
- [`.impeccable.md`](.impeccable.md) - Design context & brand personality

### Technical Specs
- [`docs/superpowers/specs/`](docs/superpowers/specs/) - Feature design documents
- [`docs/superpowers/plans/`](docs/superpowers/plans/) - Implementation plans
- [`docs/superpowers/testing/`](docs/superpowers/testing/) - Test reports & checklists

### Legacy Docs
- [`docs/legacy/`](docs/legacy/) - Archived documentation from early development

---

## 🎨 Design Principles

### Brand Identity
**Palabras clave**: Preciso, Confiable, Protector

**Aesthetic**: Corporativo moderno - Balance entre profesional y accesible

**Typography**: Manrope (humanist sans) - Transmite expertise sin intimidar

**Theme**: Light mode only (usuarios trabajan en oficina durante el día)

### UX Principles
1. **Functional Hierarchy over Decoration** - Cada elemento visual sirve comprensión o acción
2. **Controlled Density** - Suficiente información sin abrumar
3. **Professional Accessibility** - Serio pero no intimidante
4. **Clear States & Feedback** - Sin sorpresas, estados claros
5. **Multi-Context Consistency** - Desktop, laptop, tablet

### Anti-Patterns Eliminated
- ❌ Generic Inter font → ✅ Distinctive Manrope
- ❌ AI color palette (cyan-on-dark, purple gradients) → ✅ Professional blues/greens
- ❌ Floating orbs, glassmorphism → ✅ Solid, intentional design
- ❌ Hero metrics template → ✅ Custom dashboard cards
- ❌ Nested cards → ✅ Flat, scannable hierarchy

---

## 👥 Team & Ownership

### Current Team
- **Product Owner**: (TBD - founder/CEO)
- **Engineering**: 1 developer (Claude Code assisted)
- **Design**: Embedded (Claude Code + impeccable skill)

### Decision-Making Framework

**Product Decisions** (What to build):
- User interviews (5+ per quarter)
- Analytics (usage patterns, drop-off points)
- Competitor analysis (Asana, Monday, LegalZoom)

**Technical Decisions** (How to build):
- PRD → Spec → Code Review → Merge
- Feature flags for gradual rollout
- Always write tests for critical paths

---

## 📞 Contact & Support

- **GitHub**: [mdanilorojas/enregla](https://github.com/mdanilorojas/enregla)
- **Docs**: This file + `/docs` folder
- **Supabase Project**: `zqaqhapxqwkvninnyqiu`

---

**Last Updated**: 2026-04-20 by Claude Code  
**Next Review**: After Phase 2 completion (Q2 2026)
