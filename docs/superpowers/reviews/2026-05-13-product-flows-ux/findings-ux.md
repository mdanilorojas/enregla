# Hallazgos — UX / Design / Copy

**Fecha:** 2026-05-13 · **Agente:** auditor UX
**Scope:** copy, jerarquía visual, design tokens, estados, mobile, brand voice

Ver tabla consolidada en sección 4 del [FINAL-REPORT.md](./FINAL-REPORT.md).

## 20 findings UX nuevos

### Alta severidad (7)
- **UX-A1 Voseo mezclado** — "Subí", "Arrastrá", "Probá" (Arg/Uy) conviven con tuteo castellano. Ecuador usa tuteo/usted, no voseo
- **UX-A2 Feedback inconsistente** — `react-hot-toast` + `<Banner>` inline + `window.confirm`/`alert` coexisten. Diálogos nativos rompen estética corporativa
- **UX-A3 Metáfora clima contradice brand** — `ComplianceWeatherCard` 642 LOC con nubes, rayos, partículas. Brand personality es "preciso, confiable, protector" — la meteorología es emocional
- **UX-A4 Tokens bypass** — WeatherCard e InvoiceCard inyectan `<style>` con hex hardcoded (`#6ab0ff`, `#0f265c`, `#16a34a`), border-radius `16px` fijo
- **UX-A5 Empty states incoherentes** — 3 tipos distintos: componente DS, hardcoded en DocumentList, tercer local en LegalIndexView. `LocationDocumentsTab` es solo empty permanente
- **UX-A6 Onboarding sin escape** — Sin skip, sin "guardar y salir", sin "podés volver luego". Recompensa tras 3 pasos: dashboard vacío
- **UX-A7 Brand leak** — "PermitOps" + "Compliance" (inglés) + logo "PM"

### Media severidad (8)
- **UX-A8** Mapa + Sedes duplicados en sidebar
- **UX-A9** Copy dashboard coloquial ("Ponte las pilas", "te pueden clausurar") para audiencia consultores legales
- **UX-A10** ProfileTab uncontrolled inputs + botones sin onClick
- **UX-A11** Números formato `'en-US'.replace(/,/g, ' ')` → espacios. EC usa `.`
- **UX-A12** Dos formatos de fecha coexisten en misma vista
- **UX-A13** Iconos ambiguos: `Building2` = logo + sede; `FileText` = permiso + doc
- **UX-A14** PermitTable tipografía 11px headers; columna "Responsable" hardcoded '-'
- **UX-A15** Marco Legal matriz usa colores Tailwind crudos; códigos R/O/T sin leyenda

### Baja severidad (5)
- **UX-A16** Mobile: sidebar oculto sin burger en login; toggle cambia ícono por breakpoint
- **UX-A17** Dashboard jerarquía invertida: métrica principal subordinada a % 96px y nube animada
- **UX-A18** Copy dice "normativa ecuatoriana" pero matriz solo Quito
- **UX-A19** Footer "Los exactos los ves en cada permiso" sin CTA
- **UX-A20** 6 ciudades hardcoded sin "Otra"

## Patterns que funcionan
- `EmptyState` component (DS)
- Breadcrumb en detalles
- Stepper + ProgressStepper dual onboarding
- Skip-to-content link
- Validación RUC live con Banner
- RenewPermitModal comparativa actual vs nueva

## Brand voice — Veredicto
4 registros conviven sin guía:
1. Corporativo serio ("Accede a tu panel de compliance")
2. Voseo argentino-uruguayo ("Subí", "Arrastrá", "Probá")
3. Tuteo neutro ("¿Cómo te llamas?")
4. Coloquial alarmista ("Ponte las pilas")

**Recomendación:** tuteo neutro ecuatoriano. Alertas factual-directas estilo "Este permiso venció hace 12 días. Riesgo: clausura del local. Multa estimada: $200–$500."

## Oportunidades de diferenciación
1. Panel de control (semáforo + sparklines) en vez de metáfora clima
2. Cronograma de protección (Gantt 12 meses)
3. Dossier PDF firmado "auditoría-ready"
4. Riesgo contextual por permit ("Sin esto: clausura + multa $X según Art. Z")
5. Voz "asesor compliance"
6. Señales de precisión (timestamps, versión marco legal, "datos validados DD/MM")
