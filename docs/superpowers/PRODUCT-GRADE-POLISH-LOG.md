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
- [ ] **5. Manejo de errores / edge cases** — evaluacion module + flujos recientes.
- [ ] **6. Tipos / `any`** — regenerar database.ts; reducir `as any` capa datos (P1.6).
- [ ] **7. Accesibilidad** — ShareLocationModal focus trap/Escape (P2.4); aria en flujos nuevos.
- [ ] **8. Estado `en_tramite`** — consistencia tipos/metrics (P1.4).
- [ ] **9. Docs/runbook** — email alerts .ec/x-cron-secret/RESEND_FROM (P1.7).
- [ ] **10. Barrido final** — gate completo, revisar todo el diff, resumen.

## Diferido (requiere coordinación / decisión usuario)
- **P0.1 public links**: acceso anon amplio. Fix = nuevo RPC con docs/signed-url + migrar frontend + **luego** revocar policies anon (revocar antes rompe el public page de main ya desplegado). Multi-deploy, feature de cliente. No auto-ship en loop.
- **P1.1 dashboard redesign** / **P1.3 fetch dedup**: refactors grandes, no "detalle pequeño".
