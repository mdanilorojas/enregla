# EnRegla Product Roadmap

**Last Updated**: 2026-04-20  
**Horizon**: Q2-Q4 2026

---

## 🎯 Vision Statement

> **"Ser la plataforma de compliance #1 en LATAM para empresas multi-sede, expandiéndose más allá de permisos operacionales hacia certificaciones industriales, compliance laboral, y auditorías integradas."**

---

## 📅 Timeline Overview

```
Q2 2026          Q3 2026               Q4 2026
  │                │                     │
  ├─ Phase 2 ──────┤                     │
  │  (4-6 weeks)   │                     │
  │                ├─── Phase 3 ─────────┤
  │                │    (8-10 weeks)     │
  │                │                     ├─── Phase 4 ────>
  │                │                     │    (12+ weeks)
  │                │                     │
MVP Shipped     Feature               Growth            Platform
(Apr 20)        Parity               Features          Expansion
```

---

## ✅ Phase 1: MVP (SHIPPED - 2026-04-20)

### Goal
Demostrar valor en gestión de permisos y alertas para empresas multi-sede.

### Features Shipped

#### Core Platform
- [x] **Authentication**
  - Email/password + Google OAuth
  - Profile setup
  - Session management with Supabase Auth

- [x] **Dashboard**
  - Métricas clave (sedes, permisos vigentes/vencidos/por vencer)
  - Risk overview card
  - Sedes grid con status badges
  - Responsive layout

- [x] **Sedes (Locations) Management**
  - CRUD completo (create, read, update, delete)
  - Automatic risk scoring (crítico/alto/medio/bajo)
  - Permit tracking per location
  - Address & city management

- [x] **Permit Management**
  - Document upload (PDF, images)
  - Status tracking (vigente/por vencer/vencido)
  - Expiry date management
  - Link to locations

- [x] **Public Verification Links**
  - Generate shareable QR codes
  - Public view without auth
  - Permit verification for inspectors

- [x] **Network Map**
  - Visual relationship graph (company ↔ sedes ↔ permits)
  - Interactive D3 force layout
  - Filter & search

- [x] **Onboarding**
  - Incremental wizard (profile → company → locations)
  - Smart skip logic
  - Guided setup flow

#### Design System
- [x] **UI v2 Components**
  - shadcn/ui integration
  - Functional badge system (risk + status variants)
  - Card, Button, Input, Select, Dialog, Form components
  - Design system testing view

- [x] **Typography**
  - Manrope font family (distinctive, professional)
  - Modular type scale (1.33 ratio)
  - Proper hierarchy (headings, body, labels)

- [x] **Theming**
  - Consolidated design tokens (`:root` CSS variables)
  - Professional light theme
  - Semantic color system

### Metrics Achieved
- ✅ Build time: 1.53s
- ✅ TypeScript compilation: Clean
- ✅ Tests: 8/8 passing
- ✅ Code review score: 6/10 (production-ready)

### Known Issues
- 🟡 Legacy features (Legal, Renewals, Tasks) still in UI v1
- 🟡 Network map has performance issues with 50+ nodes
- 🟡 No email notifications yet
- 🟡 No team management / roles

---

## 🔄 Phase 2: Feature Parity + Polish

**Timeline**: Q2 2026 (4-6 weeks)  
**Goal**: Migrar features faltantes a UI v2 y eliminar deuda técnica

### Week 1-2: Critical Features

#### 1. Marco Legal v2 ⚡ P0
- [ ] Migrate `LegalReferenceView` to `features-v2/legal/`
- [ ] Database of regulations (Código de Comercio EC, Ley de Turismo, etc.)
- [ ] Search by industry / permit type
- [ ] Links to official sources
- [ ] UI v2 components (Card, Badge, Search)

**Why**: Users consult this before inspections — it's a key reference.

**Success Metric**: 30%+ of active users view legal references monthly

---

#### 2. Renovaciones v2 ⚡ P0
- [ ] Migrate `RenewalTimelineView` to `features-v2/renewals/`
- [ ] Timeline of upcoming renewals (30/60/90 days)
- [ ] Batch renewal (multiple permits at once)
- [ ] Email reminder integration (Phase 3: actual sending)
- [ ] Status badges (upcoming/urgent/overdue)

**Why**: #2 most-used feature after Dashboard

**Success Metric**: 50%+ of permits renewed on-time (before expiry)

---

### Week 3-4: High Priority Features

#### 3. Tareas v2 📋 P1
- [ ] Migrate `TaskBoardView` to `features-v2/tasks/`
- [ ] Kanban board (To Do / In Progress / Done)
- [ ] Assign tasks to users
- [ ] Link tasks to specific permits
- [ ] Drag & drop (optional, nice-to-have)

**Why**: Teams use this to coordinate renewals

**Success Metric**: 20%+ of teams use tasks weekly

---

#### 4. Permisos v2 📄 P1
- [ ] Migrate `PermitListView` & `PermitDetailView` to `features-v2/permits/`
- [ ] Improved permit table (sortable, filterable)
- [ ] Bulk actions (delete, update status)
- [ ] Document preview in-app (PDF viewer)
- [ ] Upload progress indicators

**Why**: Primary data entry point for users

**Success Metric**: < 5% error rate on permit creation

---

#### 5. Documents Vault Improvements 📁 P1
- [ ] Evaluate current DocumentVaultView
- [ ] Bulk document upload (drag & drop 10+ files)
- [ ] Folder structure by location
- [ ] OCR extraction (future Phase 3)
- [ ] Download all documents (ZIP export)

**Why**: Users upload 10-50 PDFs, current UX is slow

**Success Metric**: < 30s to upload 10 documents

---

### Week 5-6: Polish & Technical Debt

#### 6. Network Map Bug Fixes 🗺️ P2
- [ ] Fix performance issues with 50+ nodes
- [ ] Improve filters (by permit type, status)
- [ ] Better node labels (truncate long names)
- [ ] Export map as PNG

**Why**: "Wow" feature in demos, but has bugs

**Success Metric**: Renders 100 nodes in < 2s

---

#### 7. Technical Debt 🔧 P2
- [ ] Consolidate design tokens (merge `index.css` + `design-tokens.css`)
- [ ] Memoize risk calculation (fix `useLocations` ↔ `usePermits` circular dependency)
- [ ] Move shared components from `features/` to `features-v2/` or `components/`
- [ ] Delete old UI v1 code (after v2 parity achieved)

**Why**: Cleaner codebase, easier maintenance

**Success Metric**: Build time < 1.5s (maintain current speed)

---

### Phase 2 Success Criteria

- ✅ All P0 + P1 features migrated to UI v2
- ✅ UI v1 code deleted (only v2 remains)
- ✅ Code review score: 8/10+
- ✅ Zero critical bugs in production
- ✅ Test coverage: 80%+ on new features

---

## 🌱 Phase 3: Growth Features

**Timeline**: Q3 2026 (8-10 weeks)  
**Goal**: Features que habilitan expansión B2B y viralidad

### 3.1 Multi-Tenant Improvements (Weeks 1-3)

#### Roles & Permissions 👥
- [ ] Implement RBAC (Role-Based Access Control)
  - Admin: Full access
  - Operator: Edit locations, permits
  - Viewer: Read-only
- [ ] Per-location permissions (user sees only assigned sedes)
- [ ] Migration script for existing users (default to Admin role)

**Use Case**: Consultants manage 10+ clients in one account

**Success Metric**: 30%+ of teams use multiple roles

---

#### Team Management 🤝
- [ ] Invite users by email
- [ ] Pending invitations view
- [ ] Team dashboard (who did what, activity log)
- [ ] Remove team members
- [ ] Transfer ownership

**Use Case**: Manager invites legal team

**Success Metric**: Avg 3+ users per company account

---

### 3.2 Proactive Compliance Intelligence (Weeks 4-6)

#### Smart Alerts & Notifications 🔔
- [ ] Email alerts (30/15/7 days before expiry)
- [ ] SMS alerts (opt-in, via Twilio)
- [ ] Configurable alert thresholds per permit type
- [ ] Weekly compliance digest email
- [ ] In-app notification center

**Why**: Reduce permisos vencidos from 15% → 5%

**Success Metric**: 40%+ click-through rate on alerts

---

#### Regulatory Calendar 📅
- [ ] Annual calendar of key dates (tax deadlines, inspection seasons)
- [ ] Sync with Google Calendar / Outlook
- [ ] Custom reminders per company
- [ ] Public holidays per country (EC, CO, PE)

**Why**: Companies miss renewal deadlines

**Success Metric**: 50%+ of companies use calendar sync

---

#### Compliance Recommendations 💡
- [ ] AI-suggested permits based on industry
- [ ] "Similar locations have these additional permits"
- [ ] Best practice tips in Dashboard
- [ ] Educational content library (guides, videos)

**Why**: Proactive education, natural upsell

**Success Metric**: 10% conversion from suggestion → new permit added

---

### 3.3 Reporting & Analytics (Weeks 7-10)

#### Custom Reports 📊
- [ ] PDF report generation (cover page, charts, tables)
- [ ] Compliance over time graphs
- [ ] Drill-down by location / region / permit type
- [ ] Scheduled reports (weekly/monthly email)
- [ ] White-label reports (company logo)

**Why**: CFOs and legal teams need quarterly reports

**Success Metric**: 25%+ of companies generate reports monthly

---

#### Audit Trail 🔍
- [ ] Activity log (who updated what, when)
- [ ] Export CSV for external audits
- [ ] Immutable records (no edit history deletion)
- [ ] Filter by user, date, action type

**Why**: Requirement for ISO certifications

**Success Metric**: 100% of changes tracked

---

### Phase 3 Success Criteria

- ✅ Email alerts sent on schedule (0 missed alerts)
- ✅ Multi-tenant RBAC functional (no permission bugs)
- ✅ Custom reports generated in < 10s
- ✅ Audit trail captures 100% of changes
- ✅ NPS Score > 50 (measure after 100+ users)

---

## 🚀 Phase 4: Platform Expansion

**Timeline**: Q4 2026 (12+ weeks)  
**Goal**: Convertir EnRegla en plataforma de compliance integral

### 4.1 Marketplace & Integrations (Weeks 1-4)

#### Renovación Asistida 🤝
- [ ] Directory of certified consultants (lawyers, legal firms)
- [ ] Request quotes within app
- [ ] Payment processing (Stripe integration)
- [ ] Consultant reviews & ratings

**Business Model**: 10-15% commission on referrals

**Success Metric**: $10K+ in referral revenue per quarter

---

#### Public API 🔌
- [ ] RESTful API with authentication (API keys)
- [ ] Webhooks (permit expiry, location created, etc.)
- [ ] Zapier integration
- [ ] Slack bot (alerts in Slack channels)
- [ ] Developer docs (OpenAPI spec)

**Why**: Enterprise customers want ERP integrations

**Success Metric**: 5+ companies use API integrations

---

### 4.2 Vertical Expansion (Weeks 5-8)

#### Compliance Laboral (Nuevo Módulo) 👷
- [ ] Employee contracts management
- [ ] Work certificates tracking
- [ ] IESS (social security) affiliations
- [ ] Contract renewal dates
- [ ] Labor compliance dashboard

**Why**: Same pain point, different vertical

**Success Metric**: 20% of companies adopt labor module

---

#### Certificaciones Industriales 🏭
- [ ] ISO 9001, ISO 14001, HACCP tracking
- [ ] External audit scheduling
- [ ] Certification expiry alerts
- [ ] Document requirements checklist

**Why**: Mid/large companies need this

**Success Metric**: 10% of companies track certifications

---

### 4.3 Geographic Expansion (Weeks 9-12)

#### Chile & México 🌎
- [ ] Chile legal framework integration
- [ ] Mexico legal framework integration
- [ ] Multi-country companies (HQ in one country, branches in others)
- [ ] Localized date formats, currency

**Why**: Expand TAM (Total Addressable Market)

**Success Metric**: 10% of revenue from CL/MX

---

#### Multi-Language 🌐
- [ ] English (EN) localization
- [ ] Portuguese (PT-BR) localization
- [ ] Language switcher in settings
- [ ] i18n infrastructure (react-i18next)

**Why**: International companies in LATAM

**Success Metric**: 15% of users use EN or PT

---

### Phase 4 Success Criteria

- ✅ API launched with 5+ integrations live
- ✅ Marketplace generating $10K+ quarterly revenue
- ✅ Labor compliance module adopted by 20% of companies
- ✅ Chile & Mexico legal frameworks complete
- ✅ Multi-language support functional (EN/ES/PT)

---

## 📊 Success Metrics Tracking

### North Star Metric
**% de permisos vigentes en sedes activas**: Target 95%+

### Leading Indicators
| Metric | Current | Target Q2 | Target Q3 | Target Q4 |
|--------|---------|-----------|-----------|-----------|
| Onboarding completion | TBD | 80% | 85% | 90% |
| Weekly Active Users (WAU) | TBD | 60% | 70% | 75% |
| M1 Retention | TBD | 50% | 60% | 70% |
| NPS Score | TBD | 40+ | 50+ | 60+ |

### Lagging Indicators
| Metric | Current | Target Q2 | Target Q3 | Target Q4 |
|--------|---------|-----------|-----------|-----------|
| Permisos vigentes % | TBD | 85% | 90% | 95% |
| Monthly Churn | TBD | < 10% | < 8% | < 5% |
| Expansion Revenue | TBD | 10% MRR | 15% MRR | 20% MRR |

---

## 🎯 Strategic Bets

### Big Bets (High Impact, High Risk)
1. **AI-Powered Compliance Advisor** (Phase 4+)
   - Use LLMs to answer legal questions
   - Auto-fill permit applications
   - Risk: Hallucinations, legal liability

2. **White-Label for Consultants** (Phase 4+)
   - Allow consultants to brand as their own
   - SaaS for consultancies
   - Risk: Cannibalization of direct sales

### Safe Bets (High Impact, Low Risk)
1. **Email Alerts** (Phase 3) ✅
2. **Custom Reports** (Phase 3) ✅
3. **Public API** (Phase 4) ✅

---

## 🚧 Known Blockers & Risks

### Technical Risks
- ⚠️ **Supabase Scale**: Can Supabase handle 1000+ companies? (Mitigation: Monitor, plan migration if needed)
- ⚠️ **Risk Calculation Performance**: Circular dependency (Mitigation: Memoize in Phase 2)

### Business Risks
- ⚠️ **Market Education**: Users don't understand compliance software (Mitigation: Onboarding videos, case studies)
- ⚠️ **Regulatory Changes**: Laws change, framework outdated (Mitigation: Quarterly legal review)

### Resource Risks
- ⚠️ **Solo Developer**: 1 person building everything (Mitigation: AI-assisted development, prioritize ruthlessly)

---

## 📅 Release Schedule

| Date | Milestone | Features |
|------|-----------|----------|
| **2026-04-20** | **MVP Launch** | Auth, Dashboard, Sedes, Permits, Public Links ✅ |
| **2026-05-31** | **Phase 2 Complete** | Legal v2, Renovaciones v2, Tareas v2, Permisos v2 |
| **2026-08-15** | **Phase 3 Complete** | Alerts, Reports, Audit Trail, Team Management |
| **2026-11-30** | **Phase 4 Complete** | API, Labor Module, Chile/Mexico, Multi-Language |

---

## 📞 Roadmap Feedback

This roadmap is a living document. Feedback welcome via:
- GitHub Issues: [mdanilorojas/enregla/issues](https://github.com/mdanilorojas/enregla/issues)
- Product Owner: (TBD)

---

**Last Updated**: 2026-04-20 by Claude Code  
**Next Review**: End of Phase 2 (Q2 2026)
