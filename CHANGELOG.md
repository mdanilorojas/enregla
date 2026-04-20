# Changelog

All notable changes to EnRegla will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-MVP] - 2026-04-20

### 🎉 MVP Launch

First production release of EnRegla compliance management platform.

### Added

#### Core Features
- **Authentication System**
  - Email/password login with Supabase Auth
  - Google OAuth integration
  - Session management
  - Profile setup wizard

- **Dashboard**
  - Real-time compliance metrics (vigentes, vencidos, por vencer)
  - Risk overview card with automatic scoring
  - Sedes grid with status badges
  - Responsive layout (desktop, tablet, mobile)

- **Locations (Sedes) Management**
  - Full CRUD operations (create, read, update, delete)
  - Automatic risk calculation (crítico/alto/medio/bajo)
  - Per-location permit tracking
  - Address & city management
  - CreateLocationModal with risk scoring

- **Permit Management**
  - Document upload (PDF, images) to Supabase Storage
  - Expiry date tracking
  - Status management (vigente/por vencer/vencido/no registrado)
  - Link permits to locations
  - Document preview

- **Public Verification Links**
  - Generate shareable QR codes for inspectors
  - Public permit verification page (no auth required)
  - Token-based access (`/p/:token`)

- **Network Map**
  - Visual relationship graph (company ↔ sedes ↔ permits)
  - Interactive D3.js force layout
  - Node filtering & search
  - Export capability

- **Onboarding**
  - Incremental wizard (profile → company → locations)
  - Smart skip logic based on completion state
  - Progress tracking

#### Design System (UI v2)
- **Component Library**
  - shadcn/ui integration (Badge, Button, Card, Dialog, Form, Input, Select, etc.)
  - Functional badge system with semantic variants:
    - Risk badges: `risk-critico`, `risk-alto`, `risk-medio`, `risk-bajo`
    - Status badges: `success`, `warning`, `destructive`, `info`
  - Design System testing view (`/design-system`)

- **Typography**
  - Manrope font family (replacing Inter)
  - Modular type scale (1.33 ratio - Perfect Fourth)
  - Proper heading hierarchy (h1-h6)
  - Optimized line-heights & letter-spacing

- **Theming**
  - Consolidated design tokens (`:root` CSS variables)
  - Professional light theme (corporate modern aesthetic)
  - Semantic color system (surface, border, text, accent)
  - Risk & status color mappings

### Changed
- Replaced Inter font with Manrope for distinctive professional look
- Consolidated dual-theme system (professional/energetic) into single unified theme
- Migrated from `ui/` components to `ui-v2/` components
- Improved Badge API: `color` prop → `variant` prop for semantic consistency

### Fixed
- **Critical**: Badge component API mismatch in LocationCardV2 (color → variant)
- **Critical**: Removed hardcoded mock profile from useAuth (now fetches real Supabase profile)
- **Critical**: Added Google OAuth environment validation (button only shows if configured)
- TypeScript build errors for deployment
- Unused forceX and forceY imports in network map
- RLS policies for documents table and Storage bucket

### Technical
- **Stack**: React 19 + TypeScript 5.0 + Vite 8.0 + Supabase
- **Build time**: 1.53s (production build)
- **Tests**: 8/8 passing (Vitest)
- **Code review score**: 6/10 → Production-ready
- **Lighthouse**: TBD (target: 90+)

### Documentation
- Added comprehensive product documentation (PRODUCT.md, ROADMAP.md, BACKLOG.md)
- Created architecture context (.impeccable.md)
- Added code review findings report
- Documented UI v2 migration inventory
- Created merge plan with checklists

---

## [Unreleased]

### Planned (Phase 2 - Q2 2026)

#### To Add
- Marco Legal v2 (legal framework reference)
- Renovaciones v2 (renewal timeline view)
- Tareas v2 (task board with Kanban)
- Permisos v2 (improved permit CRUD UX)
- Documents Vault improvements (bulk upload)

#### To Fix
- Network map performance issues (50+ nodes)
- Circular dependency in useLocations ↔ usePermits
- Design tokens duplication (index.css + design-tokens.css)

#### To Remove
- Legacy UI v1 code (after v2 feature parity achieved)
- Unused imports and dead code

### Planned (Phase 3 - Q3 2026)

#### To Add
- Smart alerts (email/SMS notifications)
- Custom reports (PDF generation)
- Audit trail (change log)
- Roles & permissions (RBAC)
- Team management (invites, user dashboard)
- Regulatory calendar (compliance date tracker)

### Planned (Phase 4 - Q4 2026)

#### To Add
- Public API (REST + webhooks)
- Marketplace (consultant directory)
- Compliance Laboral module
- Certificaciones Industriales tracking
- Chile & Mexico legal frameworks
- Multi-language support (EN, PT-BR)

---

## Version History

| Version | Date | Status | Highlights |
|---------|------|--------|------------|
| **1.0.0-MVP** | 2026-04-20 | ✅ Shipped | Initial production release |
| 0.9.0 | 2026-04-15 | Internal | Public links feature |
| 0.8.0 | 2026-04-14 | Internal | Document upload flow |
| 0.7.0 | 2026-04-14 | Internal | Incremental onboarding |
| 0.6.0 | 2026-04-14 | Internal | shadcn/ui migration |

---

## Migration Guides

### From UI v1 to UI v2

If you have custom code using old UI components, follow these steps:

1. **Update imports**:
   ```typescript
   // Before
   import { Badge } from '@/components/ui';
   
   // After
   import { Badge } from '@/components/ui-v2';
   ```

2. **Update Badge usage**:
   ```typescript
   // Before
   <Badge color="green">Vigente</Badge>
   
   // After
   <Badge variant="success">Vigente</Badge>
   ```

3. **Update design tokens**:
   ```css
   /* Before */
   [data-theme="professional"] {
     --color-primary: #1e3a8a;
   }
   
   /* After */
   :root {
     --color-primary: #1e3a8a;
   }
   ```

---

## Breaking Changes

### [1.0.0-MVP]
- **Badge component**: `color` prop removed, use `variant` instead
- **Theme system**: `[data-theme]` attribute removed, use `:root` tokens
- **Font**: Inter font replaced with Manrope (may affect custom styles)

---

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)

---

**Last Updated**: 2026-04-20  
**Next Release**: Phase 2 (Q2 2026) - Feature Parity
