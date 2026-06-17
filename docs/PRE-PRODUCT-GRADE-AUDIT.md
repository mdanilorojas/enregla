# EnRegla - Auditoria Pre-Product Grade

Fecha: 2026-06-16  
Branch: `pre-product-grade`  
Objetivo: convertir lo existente en un producto minimo, confiable y vendible, sin agregar nuevas funcionalidades.

## 1. Veredicto ejecutivo

EnRegla ya tiene una base real: React + TypeScript + Vite, Supabase, autenticacion, onboarding, permisos, sedes, documentos, links publicos, notificaciones por vencimiento, configuracion de cuenta/empresa y un sistema visual propio en transicion. La aplicacion compila, pasa lint, typecheck y tests unitarios actuales.

El problema no es falta de ideas. El riesgo principal es el contrario: demasiadas superficies visibles, algunas incompletas, hacen que el producto se sienta mas grande de lo que realmente esta verificado. Para salir al mercado no conviene crecerlo. Conviene comprimirlo.

La tesis de esta auditoria:

> EnRegla debe vender control operativo sobre permisos: que tengo vencido, que se vence pronto, que falta registrar, que documento respalda cada permiso y que puedo mostrarle a un inspector. Todo lo demas debe esconderse, simplificarse o verificarse antes de mercado.

## 2. Evidencia revisada

Se reviso estaticamente el repositorio local y se ejecutaron verificaciones de ingenieria.

Comandos ejecutados:

- `npm.cmd run lint`: pasa.
- `npm.cmd run typecheck`: pasa.
- `npm.cmd run test:run`: pasa, 3 archivos de test y 13 tests.
- `npm.cmd run build`: pasa.
- `npm.cmd audit --omit=dev`: falla por 2 vulnerabilidades high en `react-router` / `react-router-dom`.
- `npm.cmd run dev -- --host 127.0.0.1 --port 5173`: Vite arranca en primer plano. No se completo una inspeccion visual persistente en navegador porque los intentos de mantener el proceso en segundo plano dentro de PowerShell no dejaron el puerto escuchando.

Archivos y areas revisadas:

- Dashboard: `src/features/dashboard/DashboardView.tsx`, `src/lib/dashboard-metrics.ts`.
- Rutas: `src/App.tsx`.
- UI/tokens: `src/styles/atlassian-tokens.css`, `src/index.css`, componentes UI.
- Hooks y datos: `src/hooks/usePermits.ts`, `src/hooks/useLocations.ts`, `src/features/permits/AssigneePicker.tsx`.
- Settings: `src/features/settings/*`.
- Links publicos: `src/lib/api/publicLinks.ts`, `src/features/public-links/*`.
- Supabase: `supabase/migrations/*`, `supabase/functions/*`.
- Documentacion: `README.md`, `docs/core/PRODUCT.md`, `docs/deployment/email-notifications-deployment.md`, auditorias previas en `docs/superpowers/reviews/*`.

## 3. Principios de salida al mercado

Estas reglas deben gobernar todo el trabajo posterior:

1. Cero features nuevas.
2. Cada pantalla debe responder una pregunta operativa clara.
3. Toda accion visible debe funcionar, o se oculta.
4. Toda superficie publica debe estar protegida por token o retirada.
5. Todo flujo de datos debe tener una prueba minima: happy path, error path y frontera de seguridad.
6. Demo mode no puede debilitar produccion; debe ser una excepcion explicita y testeada.
7. La documentacion debe describir el producto actual, no el producto imaginado.

## 4. Producto minimo vendible

Para esta etapa, el producto deberia limitarse a:

- Login / demo / onboarding.
- Crear empresa y sedes.
- Ver permisos por sede.
- Registrar, editar, renovar y adjuntar documentos a permisos.
- Ver vencimientos y pendientes.
- Compartir una vista publica segura para inspeccion.
- Configurar empresa, perfil y preferencias esenciales.
- Enviar alertas de vencimiento si la infraestructura esta verificada.

Todo lo que no ayude directamente a esos flujos debe salir de la primera experiencia o quedar oculto en produccion.

## 5. Bloqueadores P0

### P0.1 Links publicos: exposicion anonima demasiado amplia

Archivos:

- `supabase/migrations/20260519000002_public_links_anon_access.sql`
- `src/lib/api/publicLinks.ts`
- `src/features/public-links/ShareLocationModal.tsx`

Hallazgo:

La politica `public_links_select_anon` permite a `anon` seleccionar links activos/no expirados. Las politicas `locations_select_anon` y `permits_select_anon` permiten leer sedes/permisos si existe algun link activo para esa empresa o ubicacion. El frontend consulta `public_links` por token y luego consulta `permits` directamente.

Riesgo:

Un cliente anonimo con la anon key podria enumerar links activos o consultar datos asociados a sedes/empresas con links activos sin que la politica este estrictamente atada al token solicitado.

Decision recomendada:

- Reemplazar acceso directo anonimo a tablas por un RPC `get_public_permits(token)` o equivalente `security definer`.
- Revocar `SELECT TO anon` sobre `public_links`, `locations`, `permits` y `documents` salvo lo estrictamente necesario.
- Validar token, expiracion, `is_active`, empresa, sede y documentos dentro del RPC.
- Agregar pruebas SQL que demuestren que un token A no lee datos de token B.
- Definir expiracion por defecto para nuevos links. Si no se implementa ahora, ocultar compartir en produccion.

### P0.2 Exportacion/eliminacion de empresa apunta a una columna inexistente

Archivos:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/20260521000003_data_export_rpc.sql`
- `supabase/migrations/20260521000004_delete_company_rpc.sql`
- `src/features/settings/PrivacyTab.tsx`
- `src/features/settings/DeleteCompanyDialog.tsx`

Hallazgo:

La tabla `documents` se define con `permit_id`, `file_path`, `file_name`, etc., pero no con `company_id`. Los RPC `export_company_data` y `delete_company` filtran o eliminan documentos con `d.company_id = p_company_id`.

Riesgo:

Exportar o eliminar datos de empresa puede fallar en runtime. Es una funcion sensible y visible en privacidad/configuracion.

Decision recomendada:

- Corregir los RPC para llegar a empresa por `documents.permit_id -> permits.company_id`.
- Agregar test SQL del RPC con documentos adjuntos.
- Si no se arregla antes de salida, ocultar exportacion/eliminacion en produccion.

### P0.3 Modelo de roles inconsistente: `owner` no existe en el CHECK original

Archivos:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/20260521000004_delete_company_rpc.sql`
- `src/features/settings/PrivacyTab.tsx`

Hallazgo:

`profiles.role` acepta `admin`, `operator`, `viewer`. Varias piezas posteriores esperan `owner`. `PrivacyTab` bloquea eliminacion si `profile.role !== 'owner'`, y `delete_company` intenta dejar al usuario con `role = 'owner'`.

Riesgo:

El owner real no existe para usuarios normales, la UI puede bloquear acciones de administracion, y el RPC podria violar el constraint.

Decision recomendada:

- Elegir un modelo unico antes de mercado.
- Opcion minima: no introducir `owner`; usar `admin` para todo y retirar textos/condiciones `owner`.
- Opcion mas grande: migrar formalmente a `owner/admin/operator/viewer`, con backfill, CHECK actualizado, UI y tests. Esto huele a expansion; para esta etapa conviene la opcion minima.

### P0.4 Invitaciones de equipo visibles sin Edge Function existente

Archivos:

- `src/features/settings/MembersTab.tsx`
- `supabase/functions/*`
- `supabase/migrations/20260513000009_company_invitations.sql`

Hallazgo:

La UI llama `functions/v1/send-invitation`, pero en `supabase/functions` solo existe `send-expiry-alerts`.

Riesgo:

La pantalla promete una accion que no puede completarse desde el backend desplegable del repo.

Decision recomendada:

- Para salida minima: ocultar invitaciones si no son imprescindibles.
- Si ya se prometieron: implementar Edge Function y pruebas, pero tratarlo como estabilizacion de superficie existente, no feature nueva.

### P0.5 Dependencias con vulnerabilidades high

Evidencia:

- `npm.cmd audit --omit=dev` reporta 2 vulnerabilidades high en `react-router` / `react-router-dom`.

Riesgo:

Hay advisories de RCE via dependencia vendorizada, open redirect, DoS y CSRF reportados por `npm audit`.

Decision recomendada:

- Ejecutar upgrade controlado de `react-router` / `react-router-dom`.
- Repetir `lint`, `typecheck`, `test:run`, `build` y smoke test de rutas.
- No salir a mercado con audit high en dependencias runtime.

## 6. Problemas P1

### P1.1 Dashboard: demasiadas preguntas en una pantalla

Archivo:

- `src/features/dashboard/DashboardView.tsx`

Hallazgo:

El dashboard mezcla onboarding checklist, encabezado de empresa, boton de crear permiso, boton de exportar reporte, gauge de compliance, barras KPI, vencimientos urgentes, una tarjeta financiera tipo invoice, multas evitadas y una grilla completa de sedes.

La pantalla no tiene una pregunta dominante. Compite entre:

- "Estoy cumpliendo?"
- "Que hago hoy?"
- "Cuanto debo?"
- "Que sede esta peor?"
- "Que me falta configurar?"
- "Quiero exportar?"

Riesgo:

El cliente siente control visual bajo, aunque los datos existan. La percepcion de caos reduce confianza en un producto de compliance.

Decision recomendada:

Redisenar el dashboard como centro de control minimo:

1. Estado general: una linea clara con "En control", "Atencion requerida" o "Riesgo critico".
2. Cola de accion: maximo 5 tareas priorizadas por riesgo y fecha.
3. Vencimientos proximos: tabla compacta, no tarjetas decorativas.
4. Resumen por sede: ranking corto de sedes con mayor riesgo.
5. Acciones primarias: una sola accion principal contextual.

Mover fuera del dashboard:

- Grilla completa de sedes: dejar en `/sedes`.
- Conceptos financieros si no estan contablemente verificados.
- Multas evitadas si son estimaciones no auditables.
- Onboarding checklist si el usuario ya completo onboarding.
- Exportar reporte si no tiene handler real.

### P1.2 Boton "Exportar reporte" sin accion

Archivo:

- `src/features/dashboard/DashboardView.tsx`

Hallazgo:

El boton aparece en el header del dashboard, pero no tiene `onClick` ni flujo conectado.

Decision recomendada:

Ocultarlo hasta que exista un reporte real. No convertirlo en nueva feature ahora.

### P1.3 Fetch duplicado y estado disperso

Archivos:

- `src/features/dashboard/DashboardView.tsx`
- `src/hooks/useLocations.ts`
- `src/hooks/usePermits.ts`
- `src/features/locations/LocationsGrid.tsx`
- `src/features/permits/AssigneePicker.tsx`

Hallazgo:

`DashboardView` llama `useLocations(companyId)` y `usePermits({ companyId })`. `useLocations` tambien llama `usePermits` para calcular riesgo. Luego `LocationsGrid` embebido vuelve a cargar sedes/permisos. Ademas, `AssigneePicker` invalida `['permits']` en TanStack Query, pero `usePermits` no usa TanStack Query.

Riesgo:

Mas llamadas de las necesarias, estados stale y mutaciones que no refrescan lo que el usuario ve.

Decision recomendada:

- Unificar hooks de permisos/sedes en TanStack Query.
- Usar una sola fuente de verdad por pantalla.
- El dashboard no debe montar `LocationsGrid`; debe recibir datos ya derivados o navegar a sedes.

### P1.4 Estado `en_tramite` inconsistente

Archivos:

- `supabase/migrations/001_initial_schema.sql`
- `src/lib/dashboard-metrics.ts`
- Tipos de permisos en frontend.

Hallazgo:

La BD permite `en_tramite`, el sistema sigue usandolo en tipos/rutas, pero `dashboard-metrics` fuerza `enTramite = 0` con comentario de que el estado fue removido.

Decision recomendada:

Elegir una sola verdad:

- Si `en_tramite` existe, medirlo y mostrarlo.
- Si no existe, migrar BD/tipos/UI y eliminar referencias.

### P1.5 Rutas internas/dev publicadas en produccion

Archivo:

- `src/App.tsx`

Hallazgo:

Existen rutas productivas para `/auth-test`, `/design-system` y `/design-system-showcase`.

Riesgo:

Ruido, superficie innecesaria y una sensacion de producto sin cerrar.

Decision recomendada:

- Removerlas del bundle productivo o protegerlas con flag `import.meta.env.DEV`.
- Eliminar o archivar HTMLs sueltos de showcase en la raiz.

### P1.6 Tipos Supabase obsoletos y uso de `any`

Archivos:

- `src/types/database.ts`
- `src/types/database.types.ts`
- `src/features/settings/PrivacyTab.tsx`
- `src/features/settings/DeleteCompanyDialog.tsx`
- `src/lib/api/publicLinks.ts`

Hallazgo:

Los tipos no reflejan todas las migraciones (`audit_logs`, `company_invitations`, RPCs nuevos, etc.). Hay casts `as any` alrededor de RPCs y tablas recientes.

Riesgo:

TypeScript deja de proteger contratos criticos. Los bugs de `documents.company_id` y roles se vuelven mas faciles de introducir.

Decision recomendada:

- Regenerar tipos desde Supabase.
- Prohibir `as any` en capa de datos salvo excepciones documentadas.
- Agregar chequeo de tipos de RPCs usados por UI.

### P1.7 Documentacion de alertas por email desactualizada

Archivos:

- `docs/deployment/email-notifications-deployment.md`
- `supabase/functions/send-expiry-alerts/index.ts`
- `supabase/functions/send-expiry-alerts/email-service.ts`

Hallazgo:

El codigo usa `https://app.enregla.ec`, `CRON_SECRET` y header `x-cron-secret`. La documentacion todavia menciona `enregla.app`, `Authorization: Bearer SERVICE_ROLE_KEY` y ejemplos antiguos.

Riesgo:

Deploy/cron configurado incorrectamente, alertas silenciosamente rotas.

Decision recomendada:

- Actualizar runbook a `.ec` y `x-cron-secret`.
- Verificar `RESEND_FROM` con dominio real; el fallback `onboarding@resend.dev` no es aceptable para produccion.
- Agregar prueba manual documentada de cron con `dry_run`.

## 7. Problemas P2

### P2.1 Tokens de color de riesgo con semantica incorrecta

Archivo:

- `src/styles/atlassian-tokens.css`

Hallazgo:

`--ds-orange-700`, `--ds-orange-800` y `--ds-orange-900` usan tonos rojos. `--ds-risk-alto-text` y `--ds-status-por-vencer-text` heredan ese valor.

Riesgo:

El sistema critico/alto/medio pierde distincion semantica. En compliance, color no es decoracion: es lenguaje operativo.

Decision recomendada:

- Corregir escala naranja real.
- Mantener rojo solo para critico/vencido.
- Agregar captura visual o test de tokens para estados de riesgo.

### P2.2 Letter spacing global negativo

Archivo:

- `src/index.css`

Hallazgo:

El body usa `letter-spacing: -0.015em`.

Riesgo:

Reduce legibilidad en interfaz densa de trabajo y contradice la direccion de diseno acordada.

Decision recomendada:

Usar `letter-spacing: 0` globalmente; ajustar solo encabezados especificos si hiciera falta.

### P2.3 Componentes decorativos muertos

Archivos:

- `src/components/ui/ComplianceWeatherCard.tsx`
- `src/components/ui/ComplianceInvoiceCard.tsx`

Hallazgo:

No aparecen referenciados por el resto del codigo. Ademas refuerzan metaforas visuales que pueden distraer del control operativo.

Decision recomendada:

Eliminar o archivar fuera del bundle. No revivirlos para el dashboard minimo.

### P2.4 Modal de compartir implementado a mano

Archivo:

- `src/features/public-links/ShareLocationModal.tsx`

Hallazgo:

Usa `role="dialog"` manual, pero no es evidente que tenga focus trap, Escape, scroll lock y comportamiento consistente con el sistema UI.

Decision recomendada:

Migrarlo al componente `Dialog` existente cuando se toque la seguridad de links publicos.

### P2.5 Login promete mas de lo verificado

Archivo:

- `src/features/auth/LoginView.tsx`

Hallazgo:

La pantalla comunica "Alertas inteligentes", "multi-sede en tiempo real" y "marco legal siempre actualizado". Algunas de esas promesas requieren infraestructura, actualizacion legal o realtime realmente probado.

Decision recomendada:

Reducir claims a lo que el producto puede demostrar hoy.

## 8. Auditorias previas: estado

Existen reportes anteriores utiles, pero ya no deben usarse como verdad unica.

- `docs/superpowers/reviews/2026-05-12-mega-audit/FINAL-REPORT.md`: parcialmente vigente. Varios problemas de rutas, tokens, settings y onboarding fueron corregidos, pero siguen vigentes la necesidad de reducir superficie y endurecer Supabase.
- `docs/superpowers/reviews/2026-05-13-product-flows-ux/FINAL-REPORT.md`: parcialmente vigente. Sigue vigente el diagnostico de friccion UX y falta de foco; algunas rutas y acciones muertas fueron resueltas.
- `docs/runbooks/pre-launch-checklist.md`: util como base, pero debe actualizarse con los bloqueadores actuales de links publicos, roles, RPCs, invitaciones y audit de dependencias.

Decision recomendada:

- Mantener este documento como fuente de verdad pre-salida.
- Mover auditorias previas a estado "historico" o anadirles una nota de superseded.

## 9. Documentacion y narrativa de producto

Hallazgo:

`README.md`, `docs/core/PRODUCT.md` y documentos en `docs/product/*` todavia hablan en lenguaje de roadmap, fases futuras o estructura vieja. Eso choca con la decision actual: no mas features; pulir y comprimir lo existente.

Riesgo:

Otra IA, un inversionista, un developer o el propio equipo puede ejecutar contra el producto equivocado.

Decision recomendada:

Reescribir documentacion central con esta jerarquia:

1. Que problema resuelve EnRegla hoy.
2. Que flujos existen y estan soportados.
3. Que esta explicitamente fuera de scope.
4. Como correr/verificar.
5. Como desplegar.
6. Que gates bloquean salida a mercado.

Texto de posicionamiento sugerido:

> EnRegla ayuda a empresas ecuatorianas a mantener bajo control sus permisos operativos por sede: vencimientos, documentos, estado de cumplimiento y evidencia compartible para inspecciones.

Evitar por ahora:

- "Legal OS".
- "Marco legal siempre actualizado".
- "Automatizacion inteligente".
- "Multi-tenant enterprise compliance suite".

## 10. Dashboard: brief de rediseño minimo

### Pregunta principal

El dashboard debe responder:

> Que requiere mi atencion hoy para mantener mis sedes en regla?

### Estructura recomendada

1. Barra de estado
   - Estado general.
   - Numero de asuntos criticos.
   - Proximo vencimiento relevante.
   - Fecha de ultima actualizacion.

2. Cola de accion
   - Maximo 5 items.
   - Orden: vencido > vence en 7 dias > faltante obligatorio > documento pendiente.
   - Cada item con accion directa: abrir permiso o sede.

3. Vencimientos proximos
   - Tabla compacta.
   - Columnas: permiso, sede, vence, estado, accion.

4. Riesgo por sede
   - Top 3 o top 5.
   - No grilla completa.

5. Resumen secundario
   - Vigentes, por vencer, vencidos, no registrados.
   - Solo numeros accionables.

### Eliminar del dashboard

- Tarjeta financiera/invoice salvo que haya contabilidad real.
- "Multas evitadas" salvo formula validada y explicada.
- Grafica o gauge si no ayuda a decidir.
- Grilla completa de sedes.
- CTA sin handler.
- Checklist de onboarding despues de completado.

### Principio visual

Corporativo moderno, claro, diurno, denso pero calmado. Nada de hero, nada de landing, nada de decoracion. El usuario debe sentir: "ya se que hacer".

## 11. Plan de ejecucion sin features nuevas

### Fase 0 - Congelar scope

Entregables:

- Declarar este documento como fuente de verdad.
- Marcar rutas/dev docs antiguas como historicas.
- Crear lista de superficies visibles en produccion.
- Decidir: esconder o arreglar cada superficie incompleta.

Exit criteria:

- Ningun trabajo nuevo que no corresponda a una superficie existente.
- README alineado con producto minimo.

### Fase 1 - Bloqueadores de seguridad y contratos

Entregables:

- Cerrar links publicos con RPC token-bound.
- Corregir RPCs de export/delete company.
- Resolver modelo `owner` vs `admin`.
- Ocultar o completar invitaciones.
- Actualizar dependencias vulnerables.
- Regenerar tipos Supabase.

Exit criteria:

- `npm audit --omit=dev` sin high/critical.
- Tests SQL de RLS/link publico pasan.
- TypeScript sin casts nuevos en capa de datos critica.

### Fase 2 - Dashboard minimo

Entregables:

- Reemplazar dashboard actual por centro de control accionable.
- Remover CTA muerto.
- Remover grilla completa embebida.
- Eliminar duplicacion de fetches obvia.
- Mantener solo metricas que soportan decision.

Exit criteria:

- En desktop/laptop/tablet, primera pantalla muestra estado, cola de accion y vencimientos sin abrumar.
- Ningun boton visible sin accion.
- Dashboard responde una pregunta unica.

### Fase 3 - Consistencia UI y datos

Entregables:

- Corregir tokens de riesgo.
- Eliminar letter spacing negativo global.
- Retirar componentes muertos.
- Gatear rutas dev.
- Unificar hooks prioritarios en TanStack Query.

Exit criteria:

- Rutas dev no aparecen en produccion.
- Estados de riesgo tienen colores correctos y consistentes.
- Mutaciones criticas refrescan UI.

### Fase 4 - QA de salida

Entregables:

- Playwright smoke tests.
- Tests de seguridad Supabase.
- Runbook deployment actualizado.
- Checklist pre-launch actualizado.

Exit criteria:

- Flujo demo completo pasa.
- Flujo usuario autenticado completo pasa.
- Usuario A no puede leer datos de empresa B.
- Link publico solo lee su token.
- Build, lint, typecheck, tests y audit pasan.

## 12. Matriz de pruebas necesaria

### Unit/component

- Dashboard deriva estados correctamente.
- Permisos vencidos/por vencer/no registrados aparecen en orden correcto.
- Botones primarios llaman handlers reales.
- Estados vacios son claros y no prometen acciones inexistentes.

### Integration frontend

- Onboarding crea empresa/sedes/permisos iniciales.
- Crear permiso, editar, renovar, adjuntar documento.
- Asignar responsable refresca UI.
- Preferencias de notificacion se guardan y recargan.
- Settings no muestra acciones sin backend.

### E2E Playwright

- Demo mode: entrar, ver dashboard, abrir sede, abrir permiso, subir documento, compartir si esta habilitado.
- Auth real: login, onboarding, CRUD basico.
- Public link: token valido ve solo lo permitido; token invalido/expirado no ve nada.
- Rutas dev: `/auth-test`, `/design-system`, `/design-system-showcase` no disponibles en produccion.

### Supabase/RLS

- Usuario de empresa A no lee empresas, sedes, permisos, documentos, links o logs de empresa B.
- Anon no lee datos privados.
- Demo company permite operaciones esperadas sin auth solo donde esta previsto.
- Storage `permits/` permite demo y aisla produccion.
- RPCs `export_company_data`, `delete_company`, `change_company_business_type`, `accept_company_invitation` tienen pruebas happy/error/security.

### Edge functions

- `send-expiry-alerts` rechaza requests sin `x-cron-secret`.
- `send-expiry-alerts` respeta dry-run.
- `RESEND_FROM` usa dominio verificado.
- Cron documentado con URL y headers correctos.

### Performance/bundle

- Budget por chunk definido.
- Revisar chunks grandes:
  - `supabase-*.js` cercano a 201 kB.
  - `NetworkMapPage-*.js` cercano a 184 kB.
  - `index-*.js` cercano a 217 kB.
  - CSS cercano a 112 kB.
- Confirmar que paginas no esenciales no cargan en dashboard.

### Accessibility

- Dialogs con focus trap y Escape.
- Tab order de dashboard y settings.
- Contraste de estados de riesgo.
- Estados loading/error con `aria-live` donde aplique.

## 13. Checklist "product grade"

No salir a mercado hasta que:

- No haya vulnerabilidades high/critical en dependencias runtime.
- No haya botones visibles sin accion.
- Links publicos esten atados a token en BD.
- Export/delete company no fallen por columnas inexistentes.
- Modelo de roles sea unico.
- Invitaciones esten ocultas o funcionando.
- Rutas dev esten fuera de produccion.
- Dashboard este comprimido a accion operativa.
- README y docs principales reflejen el producto actual.
- Runbook de email use dominio `.ec`, `CRON_SECRET` y `x-cron-secret`.
- Tests cubran RLS multiempresa.
- Tests cubran demo mode.
- Tests cubran public links.
- Playwright cubra flujo principal.

## 14. Instruccion para cualquier IA que ejecute este plan

No agregues features. No propongas roadmap nuevo. Trabaja de esta forma:

1. Lee este documento completo.
2. Haz una lista de superficies visibles en produccion.
3. Para cada superficie incompleta, decide: arreglar porque ya esta prometida o esconder porque no es esencial.
4. Empieza por P0.
5. Cada cambio de DB va en migracion.
6. Cada cambio de RLS debe probar demo y produccion.
7. Cada cambio visible debe tener estado loading/error/empty.
8. Antes de declarar terminado, corre:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
npm.cmd audit --omit=dev
```

9. Si tocas Supabase, agrega pruebas SQL o documenta exactamente como se verifico en la instancia.
10. Si tocas UI, revisa desktop, laptop y tablet.

## 15. Decision final recomendada

La salida correcta no es "mas EnRegla". Es "menos EnRegla, mas confiable".

El producto debe sentirse como una herramienta sobria de control: pocas decisiones, estados inequivocos, acciones que siempre hacen algo y datos que no se escapan. El dashboard actual es el simbolo del problema: tiene informacion, pero no calma. La version pre-product-grade debe hacer lo contrario: bajar ruido, subir confianza y dejar solo lo que ayuda a operar.
