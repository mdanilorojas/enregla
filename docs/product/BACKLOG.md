# EnRegla Product Backlog

**Last Updated**: 2026-04-20  
**Format**: User Stories con priorización RICE

---

## 📋 Backlog Organization

Este backlog usa el framework **RICE** para priorizar:

- **R**each: ¿Cuántos usuarios afecta? (1-10)
- **I**mpact: ¿Cuánto impacto por usuario? (0.25 = minimal, 0.5 = low, 1 = medium, 2 = high, 3 = massive)
- **C**onfidence: ¿Qué tan seguros estamos? (0.5 = low, 0.8 = medium, 1.0 = high)
- **E**ffort: ¿Cuántas person-weeks? (estimado)

**Score RICE** = (R × I × C) / E

---

## 🔥 P0 - Critical (Do First)

### [RICE: 12.5] Marco Legal v2
**Como** gerente de compliance  
**Quiero** consultar normativas ecuatorianas/colombianas/peruanas en la app  
**Para** prepararme antes de inspecciones y saber qué permisos necesito

**Acceptance Criteria:**
- [ ] Migrar `LegalReferenceView` a `features-v2/legal/`
- [ ] Database con ≥20 normativas clave (Código de Comercio, Ley Turismo, etc.)
- [ ] Búsqueda por keyword (ej. "licencia bomberos")
- [ ] Filtro por industria (alimentos, retail, turismo, etc.)
- [ ] Links a fuentes oficiales (PDF, sitios gubernamentales)
- [ ] UI v2 con Card, Badge, SearchInput

**Estimación:**
- Reach: 10 (todos los usuarios)
- Impact: 2 (high - feature crítica)
- Confidence: 1.0 (clear requirements)
- Effort: 1.5 weeks

**RICE Score**: (10 × 2 × 1.0) / 1.5 = **13.3**

**Dependencies**: Ninguna

**Notes**: Usuarios consultan esto antes de inspecciones. Si no está, usan Google (salida de la app).

---

### [RICE: 11.4] Renovaciones v2
**Como** operador de sedes  
**Quiero** ver un timeline de renovaciones próximas (30/60/90 días)  
**Para** planificar mi trabajo y no perder fechas límite

**Acceptance Criteria:**
- [ ] Migrar `RenewalTimelineView` a `features-v2/renewals/`
- [ ] Timeline visual con 3 columnas (30d, 60d, 90d)
- [ ] Badge con urgencia (🔴 urgent, 🟡 upcoming, 🟢 ok)
- [ ] Batch renewal: select múltiples permisos → "Mark as Renewed"
- [ ] Link a permit detail para cada item
- [ ] Skeleton loading mientras fetch

**Estimación:**
- Reach: 10 (todos)
- Impact: 2 (high - #2 most used feature)
- Confidence: 0.8 (UI patterns exist)
- Effort: 1.4 weeks

**RICE Score**: (10 × 2 × 0.8) / 1.4 = **11.4**

**Dependencies**: Ninguna

**Notes**: Segunda feature más usada después del Dashboard.

---

### [RICE: 8.0] Tareas v2
**Como** gerente de compliance  
**Quiero** asignar tareas de renovación a mi equipo  
**Para** coordinar quién hace qué y cuándo

**Acceptance Criteria:**
- [ ] Migrar `TaskBoardView` a `features-v2/tasks/`
- [ ] Kanban con 3 columnas (To Do, In Progress, Done)
- [ ] Crear task: título, descripción, assignee, due date
- [ ] Link task → permit (optional)
- [ ] Drag & drop entre columnas (nice-to-have, no blocker)
- [ ] Filter por assignee

**Estimación:**
- Reach: 8 (equipos medianos/grandes)
- Impact: 1 (medium - coordination tool)
- Confidence: 1.0 (clear requirements)
- Effort: 1.0 week

**RICE Score**: (8 × 1 × 1.0) / 1.0 = **8.0**

**Dependencies**: Team management (users table)

**Notes**: No es blocker para compliance en sí, pero ayuda a coordinación.

---

## ⚡ P1 - High Priority (Do Next)

### [RICE: 10.0] Permisos v2 - Improved UX
**Como** operador  
**Quiero** crear y editar permisos más rápido  
**Para** ahorrar tiempo en data entry

**Acceptance Criteria:**
- [ ] Migrar `PermitListView` y `PermitDetailView` a `features-v2/permits/`
- [ ] Tabla sortable (por fecha vencimiento, status, tipo)
- [ ] Filtros rápidos (vigente/vencido/por vencer)
- [ ] Bulk actions: delete, update status
- [ ] In-app PDF preview (no download required)
- [ ] Upload progress indicator (% uploaded)

**Estimación:**
- Reach: 10 (todos)
- Impact: 1 (medium - UX improvement)
- Confidence: 1.0
- Effort: 1.0 week

**RICE Score**: (10 × 1 × 1.0) / 1.0 = **10.0**

**Dependencies**: Ninguna

---

### [RICE: 7.5] Documents Vault Improvements
**Como** operador  
**Quiero** subir 10-50 documentos a la vez  
**Para** no perder tiempo en uploads uno por uno

**Acceptance Criteria:**
- [ ] Bulk upload (drag & drop múltiples archivos)
- [ ] Carpetas por sede (folders, no flat list)
- [ ] Download all documents (ZIP export)
- [ ] Preview thumbnails para PDFs
- [ ] Upload queue con retry on failure

**Estimación:**
- Reach: 10 (todos)
- Impact: 1.5 (high - current UX is slow)
- Confidence: 0.5 (Supabase Storage limits unclear)
- Effort: 1.0 week

**RICE Score**: (10 × 1.5 × 0.5) / 1.0 = **7.5**

**Dependencies**: Supabase Storage quotas

**Notes**: OCR extraction (auto-detect expiry dates) es Phase 3.

---

### [RICE: 6.4] Smart Alerts - Email Notifications
**Como** gerente  
**Quiero** recibir email 30/15/7 días antes de vencimiento  
**Para** no perder fechas límite

**Acceptance Criteria:**
- [ ] Cron job (Supabase Edge Function + pg_cron)
- [ ] Email template (HTML + plain text)
- [ ] Enviar a todos los admins de la empresa
- [ ] Link directo al permiso en el email
- [ ] Unsubscribe link
- [ ] Settings: configurar días de anticipación (default 30/15/7)

**Estimación:**
- Reach: 10 (todos)
- Impact: 2 (high - reduce overdue permits)
- Confidence: 0.8 (email deliverability unknown)
- Effort: 2.5 weeks

**RICE Score**: (10 × 2 × 0.8) / 2.5 = **6.4**

**Dependencies**: Email service (Resend, SendGrid, or Supabase Auth emails)

**Notes**: Killer feature para retención.

---

## 📊 P2 - Medium Priority

### [RICE: 5.0] Network Map Bug Fixes
**Como** usuario  
**Quiero** ver el mapa de relaciones sin lag  
**Para** entender visualmente mi estructura

**Acceptance Criteria:**
- [ ] Performance: 100 nodos en < 2s
- [ ] Filtros por tipo de permiso
- [ ] Truncar labels largos (max 20 chars)
- [ ] Export map as PNG
- [ ] Fix overlapping nodes (mejor layout algorithm)

**Estimación:**
- Reach: 5 (feature "wow" en demos, no usada diario)
- Impact: 1 (medium - nice-to-have)
- Confidence: 1.0
- Effort: 1.0 week

**RICE Score**: (5 × 1 × 1.0) / 1.0 = **5.0**

**Dependencies**: Ninguna

---

### [RICE: 4.0] Custom Reports - PDF Generation
**Como** CFO  
**Quiero** generar reportes PDF de compliance  
**Para** presentar en juntas trimestrales

**Acceptance Criteria:**
- [ ] Report builder UI (select date range, locations, metrics)
- [ ] PDF generation (cover page, charts, tables)
- [ ] Charts: compliance over time, permits by status
- [ ] Drill-down by location / region
- [ ] White-label (company logo)
- [ ] Schedule reports (weekly/monthly email)

**Estimación:**
- Reach: 8 (equipos grandes)
- Impact: 1 (medium - quarterly use case)
- Confidence: 0.5 (PDF gen complexity unknown)
- Effort: 1.0 week

**RICE Score**: (8 × 1 × 0.5) / 1.0 = **4.0**

**Dependencies**: Ninguna

---

### [RICE: 3.2] Audit Trail
**Como** auditor externo  
**Quiero** ver quién cambió qué y cuándo  
**Para** certificaciones ISO

**Acceptance Criteria:**
- [ ] Log table (user_id, action, resource_type, resource_id, timestamp)
- [ ] Activity feed en settings
- [ ] Export CSV
- [ ] Filtros (user, date range, action type)
- [ ] Immutable records (no deletion)

**Estimación:**
- Reach: 4 (empresas grandes con ISO)
- Impact: 2 (high - requirement for certifications)
- Confidence: 1.0
- Effort: 2.5 weeks

**RICE Score**: (4 × 2 × 1.0) / 2.5 = **3.2**

**Dependencies**: Ninguna

**Notes**: No urgente para MVP, pero blocker para enterprise sales.

---

### [RICE: 2.7] Roles & Permissions (RBAC)
**Como** admin  
**Quiero** dar permisos granulares a mi equipo  
**Para** que viewers solo vean, operators editen, admins todo

**Acceptance Criteria:**
- [ ] 3 roles: Admin (full), Operator (edit), Viewer (read-only)
- [ ] Per-location permissions (user ve solo sus sedes)
- [ ] Migration script (existing users → Admin)
- [ ] UI: settings → team → edit role
- [ ] RLS policies en Supabase

**Estimación:**
- Reach: 6 (equipos con 3+ usuarios)
- Impact: 1.5 (high - security/collaboration)
- Confidence: 0.8 (RLS complexity)
- Effort: 2.0 weeks

**RICE Score**: (6 × 1.5 × 0.8) / 2.0 = **3.6**

**Dependencies**: Team management (invites)

---

## 🎯 P3 - Low Priority (Nice-to-Have)

### [RICE: 2.4] Team Management - Invites
**Como** admin  
**Quiero** invitar a mi equipo por email  
**Para** colaborar en la plataforma

**Acceptance Criteria:**
- [ ] Invite by email → pending invitations table
- [ ] Invitation email con link de signup
- [ ] Accept invitation → auto-join company
- [ ] Team dashboard (list users, roles, last seen)
- [ ] Remove team member

**Estimación:**
- Reach: 6 (equipos)
- Impact: 1 (medium)
- Confidence: 1.0
- Effort: 2.5 weeks

**RICE Score**: (6 × 1 × 1.0) / 2.5 = **2.4**

**Dependencies**: Supabase Auth invites

---

### [RICE: 2.0] Regulatory Calendar
**Como** operador  
**Quiero** un calendario de fechas clave (cierres fiscales, inspecciones comunes)  
**Para** no perder plazos importantes

**Acceptance Criteria:**
- [ ] Calendar view (month/year)
- [ ] Pre-populated dates (Ecuador: declaración IVA, cierre fiscal, etc.)
- [ ] Sync con Google Calendar / Outlook
- [ ] Custom reminders

**Estimación:**
- Reach: 10 (todos)
- Impact: 0.5 (low - nice-to-have)
- Confidence: 0.8
- Effort: 2.0 weeks

**RICE Score**: (10 × 0.5 × 0.8) / 2.0 = **2.0**

**Dependencies**: Calendar API integrations

---

### [RICE: 1.6] Compliance Recommendations (AI)
**Como** usuario nuevo  
**Quiero** sugerencias de permisos que debería tener  
**Para** no perderme ninguno

**Acceptance Criteria:**
- [ ] Rule engine: if industry=X → suggest permits [A, B, C]
- [ ] Banner en Dashboard: "¿Sabías que sedes similares tienen..."
- [ ] Dismiss recommendations
- [ ] Track conversion (suggestion → permit added)

**Estimación:**
- Reach: 10 (todos)
- Impact: 0.5 (low - educational)
- Confidence: 0.8 (rules must be curated manually)
- Effort: 2.5 weeks

**RICE Score**: (10 × 0.5 × 0.8) / 2.5 = **1.6**

**Dependencies**: Legal research (curate permit rules)

---

## 🚀 Future / Icebox

### Marketplace & Integrations
- [ ] Public API (RESTful + webhooks)
- [ ] Zapier integration
- [ ] Slack bot
- [ ] Renovación asistida (directory of consultants)

### Vertical Expansion
- [ ] Compliance Laboral (contracts, IESS)
- [ ] Certificaciones Industriales (ISO 9001, HACCP)

### Geographic Expansion
- [ ] Chile legal framework
- [ ] Mexico legal framework
- [ ] Multi-language (EN, PT-BR)

### AI / Advanced
- [ ] OCR document extraction (auto-detect expiry dates)
- [ ] AI-powered compliance advisor (LLM Q&A)
- [ ] Predictive risk scoring (ML model)

---

## 📊 Backlog Health Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total stories | 17 | N/A |
| Estimated (P0+P1) | 7.4 weeks | < 8 weeks per phase |
| % with RICE score | 100% | 100% |
| Avg confidence | 0.85 | > 0.7 |

---

## 🔄 Backlog Grooming Schedule

**Weekly**: Review top 5 stories, update estimates based on learnings

**Monthly**: Re-score RICE based on new data (analytics, user interviews)

**Quarterly**: Archive completed stories, add new ones from user feedback

---

## 📝 How to Add New Stories

1. **Write user story**: "Como [persona], quiero [feature], para [goal]"
2. **Add acceptance criteria**: Checklist de requirements
3. **Estimate RICE**:
   - Reach: 1-10
   - Impact: 0.25, 0.5, 1, 2, 3
   - Confidence: 0.5, 0.8, 1.0
   - Effort: person-weeks
4. **Calculate score**: (R × I × C) / E
5. **Insert in priority order** (high score = top)

---

## 🎯 Current Sprint (Phase 2 - Week 1-2)

**Sprint Goal**: Migrate P0 features (Legal v2, Renovaciones v2) to UI v2

**In Progress:**
- [ ] Task #9: Recrear Marco Legal con UI v2
- [ ] Task #11: Recrear Renovaciones con UI v2

**Sprint Capacity**: 2 weeks

**Sprint Burndown**: TBD (track in task system)

---

**Last Updated**: 2026-04-20 by Claude Code  
**Next Grooming**: 2026-04-27 (weekly)
