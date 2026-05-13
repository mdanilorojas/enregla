# Hallazgos — Flujos de usuario

**Fecha:** 2026-05-13 · **Agente:** auditor flujos / service design
**Scope:** 13 flujos críticos, fricciones cross-flow, flujos missing, mejoras

Ver tabla consolidada en sección 5 del [FINAL-REPORT.md](./FINAL-REPORT.md).

## Mapa de 13 flujos

| # | Flujo | Estado | Mejora |
|---|---|---|---|
| 1 | Landing → app activa | broken | Solo Google OAuth + welcome page |
| 2 | Onboarding power user (120 permits) | partial | Import CSV + Duplicar sede |
| 3 | Día 1 diario | partial | Buzón de hoy con top 5 acciones |
| 4 | Subir documento | works | Permit number opcional + reemplazar sin versionar |
| 5 | Renovar permit | broken | Wire trigger + renewPermit real |
| 6 | Compartir con tercero | works frágil | expires_at + revocar + 2 tabs (QR fachada / link temporal) |
| 7 | Invitar colaborador | missing | company_invitations + magic link |
| 8 | Marco Legal → qué necesito | partial | CTA "Agregar a {sede}" |
| 9 | Mapa Red | partial | Canvas interactivo con acciones |
| 10 | /renovaciones | works redundante | Fusionar como tab de /permisos |
| 11 | Settings | partial | Miembros + Billing + Export/Delete |
| 12 | Consultor multi-empresa | missing | memberships table m:n |
| 13 | Eliminar / exportar | missing | Soft-delete + /export-my-data ZIP |

## 10 Flujos missing críticos

| Flujo | Impacto |
|---|---|
| Invitar miembros al equipo | Bloquea persona 1 (gerentes) |
| Multi-empresa por usuario | Bloquea persona 2 (consultores) entera |
| Import CSV / Excel | Setup 120 líneas = 45 min → debe ser 3 min |
| "Añadir permit al catálogo" desde Marco Legal | Marco Legal es enciclopedia read-only sin valor operativo |
| Billing / Plan / Trial | Sin modelo de negocio visible |
| Reset password / Solicitar acceso | Si Google OAuth falla, sin camino |
| Eliminar entidades (sede/permit/company/account) | Sede zombie con permits |
| Deep link email alerta | Email va a `/dashboard` inexistente |
| Bulk edit permits | Sin marcar "mismo nº y fecha" (RUC multi-sede) |
| Audit trail global | Por permit existe; global no |

## Fricciones comunes (patterns cross-flow)

- Modal sin confirmación consistente (3 patrones)
- Forms pre-llenan defaults agresivos (`business_type='restaurante'`, `city='Quito'`)
- CTAs sin handler (patrón repetido)
- Doble fuente de verdad (NotificationsTab vs NotificationPreferences; Renovaciones vs /permisos)
- Empty states sin educar
- Sidebar plana 7 items (sobrecarga persona 3)
- Sede/Local/Sucursal intercambiables
- Fechas sin contexto relativo

## Top 5 mejoras por impacto

### 1. Unificar "Renovar" (alto impacto · costo bajo)
`renewPermit()` (orphaned, versiona) + botón real en `PermitDetailView` + email CTA deep-link `/permisos/:id?action=renew`. Hoy: API completa + modal hecho + 0 triggers. 2 líneas JSX desbloquean el flujo core.

### 2. "Hoy" dashboard (alto impacto · costo medio)
Reemplazar weather card por **buzón operativo**: top 5 acciones por urgencia + botón inline. Persona 3 entra 5 min → sabe qué hacer en 10s.

### 3. Multi-empresa real (alto impacto · costo alto)
`memberships(user_id, company_id, role)` m:n + selector header. Desbloquea consultores, invitar colaboradores, transfer ownership.

### 4. "Agregar permit al catálogo" desde Marco Legal (medio/bajo)
`LegalPermitDetailView` accionable: CTA "Este permiso aplica a mis sedes" → selector multi-sede → crea en `no_registrado`. Cierra loop.

### 5. Import rápido onboarding (medio/medio)
"Pegar desde Excel" + "Duplicar sede" + CSV upload. Persona 1: 45 min → 3 min. Diferenciador en demo.

## Hallazgos complementarios

- `renewPermit()` en `src/lib/api/permits.ts:132` sin un solo llamador
- Deep-link email `supabase/functions/send-expiry-alerts/email-service.ts:8` → `/dashboard` inexistente
- `NotificationsTab` cosmético vs `NotificationPreferences` funcional huérfano
- `createPublicLink` sin `expires_at` param; `ShareLocationModal` sin botón revocar
- `ProtectedOnboardingRoute` solo chequea `profile.company_id` — signup parcial = loop sin escape
- `CompanyStep` defaults silenciosos: `business_type='restaurante'`, `city='Quito'`
