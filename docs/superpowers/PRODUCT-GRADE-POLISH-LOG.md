# Product-Grade Polish — Deep Review Log

Branch: `product-grade-polish`. Encargo: 10 pasadas de revisión profunda,
encontrar y corregir detalles, dejar listo para producción. Continuo.

Regla: solo fixes reales y verificados (typecheck+lint+test+build verdes, y
verificación de comportamiento en DB/anon cuando aplique). No inventar cambios.

## Pasadas

- [x] **1. Seguridad deps** — react-router-dom 7.14→7.18 (2 CVEs high). audit prod = 0.
- [x] **2. RPCs/RLS empresa** — export_company_data + delete_company (documents vía permits, rol admin), invitaciones por link (RLS verificado anon).
- [x] **3. Código/rutas muertas** — botón "Exportar reporte" muerto; rutas dev gateadas DEV (P1.5); ComplianceInvoiceCard borrado (P2.3).
- [x] **4. Tokens/visual** — `--ds-text-muted` inexistente→subtle; orange-700/800/900 rojos→naranja (P2.1); letter-spacing normal (P2.2); claims login (P2.5); rol owner→admin (P0.3 frontend).
- [x] **5. Manejo de errores / edge cases** — revisado: ErrorBoundary presente y montado en main.tsx; engine tolera inputs faltantes (matchCondition/formatValue→'—'); DeleteCompanyDialog maneja error RPC + navega /setup. Sin bug real → sin cambios.
- [~] **6. Tipos / `any`** — typecheck verde; `as any` en capa de datos están documentados y testeados (no son bug). Regenerar database.ts = mantenimiento (overwrite grande), **deferred**.
- [~] **7. Accesibilidad** — P2.4 ShareLocationModal (focus trap/Escape) ligado a tocar seguridad de public links (P0.1) → **deferred** con P0.1.
- [~] **8. Estado `en_tramite`** — DB no tiene filas en_tramite (solo no_registrado/vigente); `enTramite=0` es correcto. Quitar el enum de tipos/UI/public-link = refactor multi-archivo + decisión → **deferred**, no es bug.
- [x] **9. Docs/runbook** — email alerts: `enregla.app`→`app.enregla.ec`, `Authorization: Bearer`→`x-cron-secret`/`CRON_SECRET`, dominio envío `enregla.ec`, nota RESEND_FROM (P1.7).
- [x] **10. Barrido final** — gate completo verde (typecheck+lint+32 tests+build) y `npm audit --omit=dev` = 0 vulnerabilidades.

## Resultado
Backlog de detalles **pequeños y seguros** agotado y corregido. Lo que queda son
items grandes / con decisión de producto / multi-deploy (abajo), que NO deben
auto-shippearse en loop:

## Diferido (requiere coordinación / decisión usuario)
- **P0.1 public links**: acceso anon amplio. Fix = nuevo RPC con docs/signed-url + migrar frontend + **luego** revocar policies anon (revocar antes rompe el public page de main ya desplegado). Multi-deploy, feature de cliente. No auto-ship en loop.
- **P1.1 dashboard redesign** / **P1.3 fetch dedup**: refactors grandes, no "detalle pequeño".
