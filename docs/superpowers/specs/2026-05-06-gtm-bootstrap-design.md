# EnRegla GTM Bootstrap — Diseño del Sistema (v2)

**Fecha:** 2026-05-06
**Autor:** Danilo Rojas (Aura) + Claude
**Estado:** Draft para revisión — v2, iterado con feedback Danilo
**Horizonte:** 12 meses (2026-05-06 → 2027-05-06)
**Meta:** 200 clientes pagando año 1
**Dominio:** enregla.com · email comercial: hola@enregla.com
**Marca / estudio propietario:** Aura (alias comercial de Danilo Rojas)
**Target audience:** PYMES con 2-3 locales. Dueño operativo, jerga EC, sin equipo de compliance.

---

## 0. Resumen del cambio desde v1

Este spec v2 corrige cuatro ejes respecto al v1:

1. **Meta:** 1.000 → 200 clientes año 1 (realista con 70h/sem sprint).
2. **Sprint:** 90h → 70h/sem (6 días × ~12h, domingo off).
3. **Pilar 5 reformulado:** "Lo que los tramitadores no te dicen" → **"Después del permiso"**. Los tramitadores / enablers son aliados, no enemigos. EnRegla empieza DESPUÉS del trámite.
4. **Vector 4 renombrado:** "Caballo de Troya" → **"Socios con evidencia"**. Mismo mecanismo, tono de alianza.

Y cuatro decisiones nuevas:

5. **Dominio:** enregla.com (no .ec ni .app). Email: hola@enregla.com.
6. **Marca:** HashUI → Aura en footer.
7. **Landing:** rediseño completo en tono PYME, en repo separado `enregla-landing`, branch nueva.
8. **Repos:** dos repos separados. `enregla` = producto. `enregla-landing` = marketing.

---

## 1. Resumen ejecutivo

EnRegla es SaaS de compliance de permisos para PYMES multi-sede en Ecuador. Target real: **"Don Huevas" con 2-3 locales de comida** — dueño operativo, no tiene gerente legal, opera con permisos vencidos sin saberlo, el día que viene el inspector se le cae el negocio. Enterprise (Supermaxi, cadenas grandes) NO es target — ellos tienen procesos. Año 2+ podría venderles una versión automatizada por $50K/año, pero no ahora.

Sistema de 12 meses para llegar a 200 clientes pagando:
- **Motor (60%):** contenido orgánico PYME jugoso con avatar IA (Higgsfield). Jerga EC ("este man perdió plata", "le cayó ARCSA").
- **Apoyo (20%):** llamadas consentidas a números públicos de Google Maps.
- **Multiplicador (10%):** partnership con enablers (contadoras, tramitadores, consultores ARCSA). Relación complementaria, NO competitiva.
- **Palanca (10%):** "Socios con evidencia" — llegar al enabler con clientes ya en el producto.

**Presupuesto año 1 estimado:** $9K–12K total.
**MRR proyectado mes 12:** ~$9.800 (200 clientes × $49 promedio).

Principio ético: agresivo sin cruzar líneas. Nunca emails/WhatsApp a personas sin consentimiento. Primer toque siempre consentido.

---

## 2. Contexto del producto

### 2.1 Estado actual verificado en repo `enregla` (2026-05-06)

Features en producción (rama `feature/atlassian-ds-migration`, lista para merge):

- Dashboard con métricas + grid de sedes
- Sedes CRUD con risk scoring automático (crítico/alto/medio/bajo)
- Permisos: tabla con filtros, sort, paginación, export CSV
- Detalle de permiso con timeline
- Renovaciones: grid de meses expandibles
- Marco Legal: categorías navegables
- Mapa interactivo fullscreen (React Flow)
- Enlaces públicos de verificación con QR (para inspectores)
- Onboarding 3 pasos
- Login con Google OAuth
- Settings con 4 tabs

Pendiente crítico para GTM:

- **Email notifications (30/15/7 días):** código completo, falta deploy Edge Function + pg_cron. Es la promesa central del pitch. **Debe desplegarse antes de lanzar ads.**

### 2.2 Estado de `enregla-landing` (2026-05-06)

Landing React + Vite + Tailwind 4. Single page. Tono actual: enterprise/militar ("Sistema Operativo", "Despliegue Táctico"). **Se reescribirá completo** en branch `feature/pyme-redesign`.

### 2.3 Pitch del producto para target PYME

> "Guarda los PDFs de tus permisos. Te avisa antes de que venzan. Te da un QR para mostrar al inspector y que no joda. Todo en una pantalla."

Lo que vende más allá del pitch minimalista:
1. **Semáforo de riesgo** por sede (verde / amarillo / rojo).
2. **QR público** para inspecciones (el killer feature).
3. **Multi-sede** desde el día 1.

---

## 3. Decisiones estratégicas (v2)

| Tema | Decisión v2 |
|---|---|
| Meta año 1 | 200 clientes |
| Sprint inicial | 30 días × 70h/sem (6 días, domingo off) |
| Post-sprint | 10-15h/sem, modo mantenimiento |
| Motor principal | Contenido orgánico con avatar IA (Higgsfield) |
| Cara al micrófono | Avatar IA 90% · Danilo cara en LinkedIn mensual + página /sobre + diagnósticos en vivo desde mes 3 |
| Idioma | Español Ecuador con jerga ("plata", "chévere", "de una", "man") |
| Target | PYMES 2-3 locales, NO enterprise |
| Dominio | enregla.com |
| Marca | Aura (estudio) / EnRegla (producto) |
| Relación con enablers | Complementaria, NO competitiva |
| Apetito ético | Agresivo pero no ilegal ni reputacionalmente dañino |
| Primer toque comercial | Llamada a número público → consentimiento → WhatsApp/correo |

---

## 4. Arquitectura del sistema — 4 vectores (v2)

### 4.1 Vector 1 — Partnership con enablers (10%, activa mes 4)

**Qué son los enablers:** contadoras, tramitadores, consultores ARCSA/sanitarios, consultores de bomberos, asesores administrativos. Son los que hacen el trámite — sacan el PDF del permiso.

**Filosofía fundamental (nuevo en v2):** EnRegla NO compite con ellos. El trámite es vital y no es nuestro negocio. **El PDF que el enabler entrega es DONDE empieza EnRegla**, no donde termina. Nosotros:
- Guardamos el PDF
- Seguimos la fecha de caducidad
- Alertamos antes de que venza
- Lo mostramos en el QR público al inspector
- Lo ordenamos en el dashboard multi-sede

El enabler sigue cobrando por sus trámites. EnRegla les da retención del cliente (el cliente vuelve cada vez que necesita renovar) + visibilidad profesional para la cartera del enabler.

**Modelos:**
1. **Referral partner** — el enabler refiere clientes a EnRegla. Comisión 20% primer pago + retención de su cliente.
2. **Co-delivery partner** — enabler hace trámite, EnRegla da capa digital. Revenue-share.
3. **White-label** — fase tardía (post mes 9), solo con volumen mínimo.

**Por qué se activa en mes 4:** ciclo largo, necesitas prueba social (30+ clientes, testimonios) para que un enabler te tome en serio. Antes, te ven como pitch más.

**Meta año 1:** 5 enablers en pilot, 20-40 clientes referidos.

### 4.2 Vector 2 — Contenido orgánico PYME con avatar IA (60%)

Producción en batch mensual con Higgsfield. Tono PYME jugoso, jerga EC, historias concretas.

**Plataformas (prioridad):**
1. **TikTok** `@enregla.ec` — volumen, dueños PYMES
2. **Instagram Reels** `@enregla` — repurpose directo
3. **YouTube Shorts** — SEO long-tail
4. **LinkedIn** (personal + empresa) — Danilo cara, B2B partners
5. **Facebook Reels** — audiencia más vieja de dueños

**6 pilares rotando:**

| # | Pilar | Descripción | Tono |
|---|---|---|---|
| 1 | **Cosas que te clausuran** | Horror stories 20-40s. Casos reales de clausuras | Directo, miedo calibrado |
| 2 | **Detrás del permiso** | Explainers 40-60s de trámites EC (LUAE, patente, tasa, ARCSA, bomberos) | Experto accesible |
| 3 | **Demo de 30 segundos** | Screen recording + voz avatar mostrando el producto | Claro, calmo |
| 4 | **El dueño dice** | Testimonios clientes reales (desde mes 3) | Conversacional |
| 5 | **Después del permiso** (v2) | El PDF del permiso NO es el final. Qué hacer con él. Cómo trabajar con tu enabler | Complementario, NO antagonista a enablers |
| 6 | **Diagnóstico en vivo** | Danilo cara, analiza negocio real con permiso (1/mes) | Auténtico |

**Cadencia objetivo (post-sprint):**
- 6 originales/semana + 7 repurposes = 13 piezas/semana
- Año 1 total: ~312 originales + ~350 repurposes = ~660 piezas

**Stack:**
- Scripts: Claude/ChatGPT con prompts (anexo A)
- Avatar + voz: Higgsfield
- Edit: CapCut con templates
- Publicación: Metricool (scheduled)
- Analytics: nativo + spreadsheet

**Meta año 1:** 8K seguidores TikTok, 3K IG, ~120 clientes convertidos desde orgánico.

### 4.3 Vector 3 — Call center legal (20%, semana 2+)

Llamadas a números públicos de restaurantes/cafés/retail en Quito. Script corto: ofrecer demo + 30 días gratis, pedir WhatsApp/correo con consentimiento explícito.

**Ejecución:**
- Semana 1: scrape 500 negocios (Quito, restaurantes/cafés/retail)
- Semana 2+: 15 llamadas/día × 5 días = 75 llamadas/semana (ajustado a 70h/sem)
- Tasa éxito esperada: 15-20% → 11-15 leads/sem
- Conversión a cliente: 10-15% → 1-2 clientes/sem

**Meta año 1:** 3K llamadas hechas, 400 leads con consentimiento, 50-80 clientes.

### 4.4 Vector 4 — Socios con evidencia (10%, mes 3+)

Renombrado desde "Caballo de Troya". Mecanismo igual, tono de alianza.

**Qué es:** usar los primeros 30-50 clientes como evidencia concreta cuando te acercas a un enabler. "Tengo 5 de tus clientes ya usando EnRegla. ¿Trabajamos juntos?" Oferta de colaboración, no amenaza.

**Por qué funciona:** llegas con cartera del enabler ya en tu producto. Él te ve como complemento tangible, no como vendedor frío.

**Ejecución:**
- Mes 3: identificar, entre los primeros clientes, quién es su contador/tramitador
- Mes 4: contactar a los enablers con evidencia de su cartera
- Meta: 3 enablers cerrados así en meses 4-6

---

## 5. Curva realista de 12 meses — 200 clientes

### 5.1 Fases

| Fase | Meses | Clientes acum. | MRR est. | Foco |
|---|---|---|---|---|
| **Validación** | 1-2 | 2-8 | $200 | Contenido orgánico, 20 entrevistas, hooks |
| **Señal** | 3-4 | 15-25 | $800 | Identificar hooks virales, primeros enablers |
| **Inflexión** | 5-6 | 40-70 | $2.500 | Primeros ads pagados, Vector 4 activado |
| **Tracción** | 7-9 | 100-140 | $5.500 | Enablers firmados, contenido compuesto |
| **Escala** | 10-12 | 170-200 | $9.800 | Expansión Cuenca/GYE (registro virtual), white-label con enablers |

Break-even proyectado: mes 4-5.

### 5.2 Presupuesto detallado año 1

| Categoría | Mes 1 | Mes 2-3 | Mes 4-6 | Mes 7-9 | Mes 10-12 | Total |
|---|---|---|---|---|---|---|
| Ads (Meta/Google) | $400 | $400 | $600 | $900 | $1.500 | $8.100 |
| Higgsfield | $40 | $80 | $120 | $120 | $120 | $480 |
| Herramientas (Metricool, Resend, Cal.com, PostHog) | $50 | $80 | $100 | $120 | $150 | $540 |
| WhatsApp Business API (Wati) | $0 | $49 | $100 | $150 | $200 | $447 |
| Stock, fonts, dominios | $100 | $20 | $20 | $20 | $20 | $180 |
| Comisiones enablers | $0 | $0 | $50 | $200 | $500 | $750 |
| **Total mensual promedio** | **$590** | **$629** | **$990** | **$1.510** | **$2.490** | — |
| **Total año 1** | — | — | — | — | — | **~$10.500** |

### 5.3 MRR proyectado (asumiendo $49 promedio con mix Basic/Standard)

| Mes | Clientes acum. | MRR | Ingresos mes | Cash flow neto |
|---|---|---|---|---|
| 1 | 3 | $147 | $147 | -$443 |
| 3 | 18 | $882 | $882 | +$253 |
| 6 | 55 | $2.695 | $2.695 | +$1.705 |
| 9 | 120 | $5.880 | $5.880 | +$4.370 |
| 12 | 200 | $9.800 | $9.800 | +$7.310 |

Año 1 revenue proyectado: **~$45-55K.** ROI sano para un sprint inicial intenso.

---

## 6. Plan de contenido año 1

### 6.1 Estructura general

Cada semana publica 6 originales + 7 repurposes. El sprint mes 1 produce 3 meses de contenido en banco.

### 6.2 Primeras 12 semanas

Ver anexo C con scripts completos. Pilar 5 reformulado con tono complementario a enablers.

### 6.3 Semanas 13-52

Ver anexo B con template + temas por temporada de compliance EC.

---

## 7. Entregables técnicos — arquitectura de 2 repos

### 7.1 Repo `enregla-landing` (marketing — TODOS los entregables públicos)

**Branch `main`:** landing actual (enterprise) — queda intacta durante transición.
**Branch nueva `feature/pyme-redesign`:** rediseño completo + nuevas rutas.

**Estructura post-redesign:**

```
enregla-landing/
├── src/
│   ├── App.tsx              # rewrite: tono PYME jugoso
│   ├── pages/
│   │   ├── Home.tsx         # landing principal rediseñada
│   │   ├── Diagnostico.tsx  # customer-facing diagnóstico
│   │   ├── Partners.tsx     # B2B para enablers
│   │   └── Sobre.tsx        # Danilo cara, fundador
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── Problema.tsx
│   │   ├── ComoFunciona.tsx
│   │   ├── Pricing.tsx      # NUEVO — falta en landing actual
│   │   ├── FAQ.tsx
│   │   ├── Testimonios.tsx  # NUEVO — desde mes 3
│   │   └── CTA.tsx
│   └── lib/
│       └── leads.ts          # integración Supabase (mismo proyecto que producto)
├── public/
└── ...
```

**Rutas finales:**
- `enregla.com/` — landing principal (tono PYME)
- `enregla.com/diagnostico` — CTA diagnóstico 7 días
- `enregla.com/partners` — B2B enablers
- `enregla.com/sobre` — Danilo fundador
- `app.enregla.com` — apunta al producto (repo `enregla`)

**Tono del rediseño (nuevo):**

ANTES (enterprise):
> "Control operativo para permisos y cumplimiento multi-sede."
> "Despliegue Operativo"
> "Ventaja Táctica"

DESPUÉS (PYME jugoso):
> "Tu negocio, siempre en regla. Sin sustos."
> "Así funciona"
> "Lo que te protege"

Regla: si el dueño de un café con 2 locales no entiende una palabra de la landing, esa palabra se va.

**Footer:** Aura (no HashUI). Email: hola@enregla.com.

### 7.2 Repo `enregla` (producto — solo CRM interno)

Nuevo:
- `/internal/crm` — tablero de prospectos/partners (requiere auth)
- Tabla Supabase `leads` (compartida con landing)
- Tabla Supabase `partners` (para CRM)

No se tocan features del producto. El producto ya está listo.

### 7.3 Deploy pendiente crítico (día 1)

En repo `enregla`:
- Deploy Edge Function `send-expiry-alerts`
- Configurar pg_cron 8AM UTC
- Resend API key en env vars
- Test end-to-end

Sin esto funcionando, no se lanza ni un dólar en ads.

### 7.4 Scraping de prospectos

En repo `enregla` (script interno):
- `scripts/scrape-leads.ts` con Google Places API
- 1.000 negocios Quito (restaurantes/cafés/retail)
- Output CSV para import al CRM

Costo: ~$20 único.

### 7.5 Carpeta `gtm/` en repo `enregla`

```
gtm/
├── content/
│   ├── pilares.md
│   ├── templates-scripts.md
│   ├── calendario-52-semanas.md
│   └── scripts/semana-01/ ... semana-12/
├── partners/ (enablers)
│   ├── README.md
│   ├── partner-icp-scorecard.md
│   ├── partner-outreach-whatsapp.md
│   ├── partner-call-script.md
│   ├── partner-meeting-script.md
│   ├── objections-and-responses.md
│   ├── pilot-plan-14-days.md
│   ├── partner-economics.md
│   ├── one-page-partner-proposal.md
│   ├── demo-narrative.md
│   └── sales-assets/
│       ├── whatsapp-short.md
│       ├── whatsapp-long.md
│       ├── cold-call-script.md
│       ├── meeting-agenda.md
│       ├── follow-up-message.md
│       ├── pilot-close-message.md
│       └── partner-agreement-basic-terms.md
├── calls/
│   ├── script-call-center-legal.md
│   ├── script-objeciones.md
│   └── script-post-llamada-wa.md
└── ads/
    ├── meta-campaign-structure.md
    ├── google-campaign-structure.md
    └── creative-copy-sets.md
```

---

## 8. Sprint de 30 días — 70h/semana

6 días × ~12h/día = 72h/sem. Domingo off. Sábado ligero.

### Semana 1 (días 1-7) — Fundación

| Día | 8h mañana | 4h tarde |
|---|---|---|
| 1 (lun) | Deploy email notifications | Setup Higgsfield avatar |
| 2 (mar) | Branch `feature/pyme-redesign` en enregla-landing | Empezar rewrite Hero + Problema |
| 3 (mié) | Rewrite resto de landing (ComoFunciona, Plataforma, Vista Inspección, CTA) | Páginas `/diagnostico` + `/partners` |
| 4 (jue) | Página `/sobre` + footer Aura + email correcto | Tabla `leads` Supabase + form |
| 5 (vie) | CRM interno MVP en repo `enregla` | Cal.com + Resend integración |
| 6 (sáb · ligero) | QA del redesign + push a GitHub | — |
| 7 (dom) | OFF | OFF |

Output semana 1: landing PYME live en staging, infra de captura lista.

### Semana 2 (días 8-14) — Arrancar contenido

| Día | Foco |
|---|---|
| 8-10 | Scrape 500 prospectos Google Places + primer batch 15 videos Higgsfield |
| 11-12 | Primeras 30 llamadas del call center + 10 videos más |
| 13 (sáb) | Campaña Meta Ads $100 lanzada con copy del pilar 1 |
| 14 (dom) | OFF |

### Semana 3 (días 15-21) — Escalar producción

- 75 llamadas más
- 30 videos producidos (batch mes 2)
- Primeras 5-10 reuniones con leads calientes
- Vector 1: 3 primeros enablers contactados (cold, sin evidencia aún — semilla)

### Semana 4 (días 22-30) — Cierre

- Batch final 30 videos (completa 3 meses en banco ≈ 90 originales)
- Cierre primeras ventas (meta: 2-8 clientes)
- Retrospectiva + plan meses 2-3

**Output sprint día 30:**
- Landing PYME deployed en `enregla.com`
- 3 meses de contenido en banco (~90 piezas originales)
- Infraestructura completa (landings + CRM + funnel + tracking)
- ~180 llamadas hechas
- 30-50 leads con consentimiento
- 2-8 clientes pagando
- 2-3 conversaciones de enabler iniciadas

---

## 9. Métricas y decisiones cada 4 semanas

### 9.1 Leading (semanales)

- Piezas contenido publicadas
- Views totales
- Engagement rate
- Llamadas hechas
- Demos agendadas
- CPM / CTR ads

### 9.2 Lagging (mensuales)

- Seguidores nuevos
- Leads nuevos (form diagnóstico)
- Demos completados
- Clientes nuevos
- MRR
- CAC blended
- Churn

### 9.3 North Star

**MRR al día 365.** Meta: **~$9.800/mes** con 200 clientes × $49 promedio.

### 9.4 Puntos de decisión mensuales

- ¿Qué pilar pegó más? Duplicar. Qué no pegó, matar.
- ¿CAC < LTV/3? Subir ads. Si no, pausar.
- ¿Tasa conversión llamada→cliente > 10%? Mantener.
- ¿Vector 1 generando reuniones? Si no, esperar más prueba social.

---

## 10. Riesgos y mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|
| Contenido PYME no pega | Alta | Crítico | 6 pilares diversificados, pivotar mes 2 |
| Higgsfield se ve fake | Media | Alto | Mix screen recordings + Danilo cara momentos clave |
| Enablers se sienten amenazados | Media | Alto | Pilar 5 complementario, nunca atacar, siempre "EnRegla empieza DESPUÉS" |
| LOPDP enforcement aumenta | Baja | Alto | Primer toque solo números públicos + consentimiento |
| Ban WhatsApp | Media | Medio | Wati (WhatsApp Business API), no personal |
| Competidor copia | Baja | Medio | Velocidad + moat en contenido acumulado + enablers |
| Danilo quema post-sprint | Media | Alto | Batch = 3 meses colchón + modo mantenimiento desde mes 2 |
| Ads no rinden a $100/sem | Alta | Bajo | Expectativa baja, presupuesto testing |
| Primeros clientes churnean | Media | Alto | Email notifications perfecto desde día 1 |
| Landing rediseño tarda | Media | Medio | Scope cerrado semana 1, push progresivo |

---

## 11. Lo que NO está en este plan

- Email masivo sin consentimiento → viola LOPDP + ética
- Perfiles falsos → Danilo lo descartó, protege reputación
- WhatsApp masivo sin opt-in → viola TOS + ética
- Contratar host humano → avatar IA cumple
- Expansión otros países año 1 → foco Ecuador
- Features nuevas del producto año 1 → producto es suficiente, foco comercial
- Ads a $15K/mes → presupuesto real es $400-1.500/mes
- Cerrar 1.000 clientes año 1 → ajustado a 200 realista
- Enterprise sales año 1 → target PYME, enterprise para año 2+
- Atacar enablers → son aliados potenciales, Pilar 5 complementario

---

## 12. User flow — cliente PYME final

Ver HTML companion (sección 06) con diagrama completo.

## 13. User flow — enabler (partner)

Ver HTML companion (sección 06) con diagrama completo.

---

## 14. Dependencias y orden de ejecución

```
Día 1: Deploy email notifications (bloquea todo)
  │
  ├─ Día 2-4: Rediseño landing PYME en enregla-landing
  │
  ├─ Día 5: CRM + funnel + form
  │
  ├─ Día 6-7: Primer batch contenido + lanzar ads $100/sem
  │
  ├─ Día 8-14: Call center arranca + batch continuo
  │
  └─ Día 22-30: Cierre primeras ventas + retrospectiva
```

---

## Anexo A — Prompts sistematizados (v2 tono PYME)

### A.1 Pilar 1 — Cosas que te clausuran

```
Actúa como copywriter de TikTok, mercado Ecuador, audiencia dueños de restaurantes/cafés
con 25-55 años, 1-3 locales, tono "Don Huevas" — se habla normal, jerga EC.

Script 30-40 segundos estructura:
- 0-1s: Hook chocante en jerga EC
- 1-25s: Desarrollo, qué pasó
- 25-30s: Giro/consecuencia (clausura, multa, pérdida)
- 30-40s: CTA "En EnRegla te avisamos 30 días antes. Link en bio."

Tema: [INSERTAR]
Jerga obligatoria: plata, chévere, man, de una, clausura, inspector, cayó, jodió
EVITAR: jerga corporativa (operativo, regulatorio, cumplimiento, compliance, estrategia)
Voz: directa, como que le estás contando a un pana
Entrega: JSON con campos hook, cuerpo, cta, duracion_estimada_s
```

### A.2 Pilar 2 — Detrás del permiso

```
Actúa como experto en trámites municipales Quito, explicando a dueños PYMES que nunca
han hecho este trámite.

Script 50-60 segundos:
- 0-3s: Título claro "Cómo sacar [PERMISO] en Quito 2026"
- 3-15s: Qué necesitas (lista rápida, jerga normal)
- 15-35s: Paso a paso
- 35-50s: Cuánto cuesta + cuánto tarda de verdad
- 50-60s: CTA suave "Link en bio si quieres organizar todos tus permisos"

Permiso: [LUAE / Patente / Tasa / ARCSA / Bomberos / Uso de Suelo / Permiso Ambiental]
Tono: experto pero sin poses, sin jerga legal innecesaria
Entrega: JSON
```

### A.3 Pilar 3 — Demo 30s

```
Voiceover 30s que acompañe screen recording de EnRegla mostrando:
1. Dashboard con semáforo de riesgo
2. Click en sede crítica (roja)
3. Timeline de permisos
4. QR de verificación pública

Estructura:
- 0-5s: Problema ("¿Sabes qué permisos te están por vencer?")
- 5-25s: Solución en acción, narrando lo que se ve
- 25-30s: CTA ("30 días gratis. Link en bio.")

Tono: profesional pero cercano
Entrega: JSON con timestamps
```

### A.4 Pilar 5 (v2) — Después del permiso

```
Actúa como asesor que respeta a tramitadores/contadores pero conoce el hueco operativo
que existe DESPUÉS de que ellos entregan el permiso.

Regla fundamental: NO atacar a tramitadores ni contadores. Son profesionales que hacen un trabajo vital.
El mensaje es: el PDF del permiso es SOLO el comienzo. Qué pasa después es donde está el hueco.

Script 40-50 segundos:
- 0-3s: Hook que respeta al enabler ("Tu tramitador hizo el trabajo. ¿Y ahora?")
- 3-30s: Revelar el hueco (quién le da seguimiento al PDF, quién avisa 30 días antes, quién organiza los 15 permisos de 3 sedes)
- 30-45s: La solución complementaria (tu tramitador + EnRegla)
- 45-50s: CTA

Tema específico: [INSERTAR]
Tono: conciliador, "somos equipo", respeto al enabler
Entrega: JSON
```

### A.5 Pilar 6 — Diagnóstico en vivo

```
Danilo (cara real, no avatar) analiza negocio real con permiso.

Script 60-90s:
- 0-5s: Presenta el negocio
- 5-45s: Muestra 3 hallazgos (1 cosa que está bien, 1 cosa por vencer, 1 que ya venció)
- 45-75s: Qué hacer en cada caso
- 75-90s: CTA

Tono: auténtico, conversacional, con Don [Dueño]
Entrega: guión + prompts para b-roll
```

---

## Anexo B — Template semanal (semanas 13-52)

```markdown
## Semana N (fecha inicio – fecha fin)

**Tema de la semana:** [INSERTAR]

### Lunes — Pilar 1 (Cosas que te clausuran)
### Martes — Pilar 2 (Detrás del permiso)
### Miércoles — Pilar 5 (Después del permiso)   [v2: tono complementario]
### Jueves — Pilar 1 (segundo)
### Viernes — Pilar 3 (Demo 30s)
### Sábado — Pilar 2 (segundo) o Pilar 4 (desde mes 3)
### Domingo — preparación próxima semana
```

### Temas por temporada de compliance EC

| Semanas | Tema macro | Relevancia temporal |
|---|---|---|
| 13-17 | Inspecciones ARCSA | Temporada alta inspecciones sanitarias |
| 18-22 | Renovaciones patente municipal | Vencimientos Q2 |
| 23-27 | Permisos bomberos | Post-renovaciones municipales |
| 28-32 | Cierre fiscal + permisos | Mitad año |
| 33-37 | Temporada alta gastronomía | Inspecciones sanitarias |
| 38-42 | Eventos navideños | Permisos para eventos |
| 43-47 | Planificación año siguiente | Q4 |
| 48-52 | Balance compliance + proyección | Cierre año |

---

## Anexo C — Primeras 12 semanas con scripts (v2)

### Semana 1 (2026-05-06 → 2026-05-12) — "El caos es real"

Producción en sprint. Publicación empieza semana 2.

**Lunes — Pilar 1**
- Hook: "Este man perdió tres mil dólares en un día. Por no saber esto."
- Cuerpo: Café en La Mariscal, vino ARCSA sorpresa, sanitario vencido 2 meses. Clausura 30 días.
- CTA: "¿Sabes cuándo vencen tus permisos? Te aviso 30 días antes."

**Martes — Pilar 2**
- Tema: Cómo sacar la LUAE en Quito 2026
- Desglose: RUC + predial + uso de suelo → Municipio online → $100-500 → 10-30 días

**Miércoles — Pilar 5 (v2)**
- Hook: "Tu contador es un crack en impuestos. Pero los permisos no son su tema."
- Cuerpo: El contador hace lo suyo (impuestos). El tramitador hace lo suyo (trámites). Pero cuando el PDF del permiso te lo entregan... ¿dónde queda? Ese hueco es el que llenamos.
- Cierre: "Tu contador + tu tramitador + EnRegla. Equipo."

**Jueves — Pilar 1**
- Hook: "Cerraron una cadena de pollo por un permiso vencido en UNA sola sede."
- Caso: cadena 5 sedes, 1 con bomberos vencido, inspección → clausura → redes sociales → daño toda la marca.

**Viernes — Pilar 3**
- Feature: Dashboard con semáforo
- Voz: "Verde: tranquilo. Amarillo: atento. Rojo: urgente. Toda tu operación en un vistazo."

**Sábado — Pilar 2**
- Tema: Cómo sacar permiso sanitario ARCSA para restaurante

### Semana 2 (2026-05-13 → 2026-05-19) — "Permisos que nadie sabe que existen"

**Lunes — Pilar 1**
- Hook: "A este restaurante lo jodió un permiso que ni sabía que existía."
- Cuerpo: Tasa de Habilitación anual. Muchos solo sacan LUAE y creen estar.

**Martes — Pilar 2**
- Tema: Tasa de Habilitación municipal — qué es y por qué casi nadie la conoce

**Miércoles — Pilar 5 (v2)**
- Hook: "El tramitador te entrega el PDF. Y después, ¿qué?"
- Cuerpo: El trabajo del tramitador termina cuando te entrega el papel. Lo que pasa ese PDF, dónde queda guardado, quién lo cuida, quién te avisa antes de la siguiente renovación — eso es lo tuyo. O lo nuestro.

**Jueves — Pilar 1**
- Hook: "Esta panadería perdió el local. Ni por no pagar."
- Cuerpo: Uso de suelo incompatible descubierto en inspección.

**Viernes — Pilar 3**
- Feature: QR público de verificación
- Voz: "Cuando viene el inspector, le muestras un QR. Escanea. Todo verificado. Siguiente."

**Sábado — Pilar 2**
- Tema: Permiso de bomberos para locales — cómo, cuánto, cuándo

### Semana 3 (2026-05-20 → 2026-05-26) — "El costo real"

**Lunes — Pilar 1**
- Hook: "Calculé cuánto pierdes por un día de clausura. Peor de lo que crees."
- Cuerpo: Ventas + empleados pagados sin trabajar + daño reputacional. Promedio $800-1500/día.

**Martes — Pilar 2**
- Tema: Permiso ambiental municipal — quién lo necesita

**Miércoles — Pilar 5 (v2)**
- Hook: "Tu tramitador es bueno. Pero no puede estar 24/7 recordándote cada fecha."
- Cuerpo: Reconocer el valor del tramitador. Identificar el hueco temporal: entre entregar el permiso y la próxima renovación, el PDF queda "flotando". EnRegla es el custodio de ese tiempo.

**Jueves — Pilar 1**
- Hook: "Dos clausuras en seis meses. El local cerró definitivo."

**Viernes — Pilar 3**
- Feature: Email notifications 30/15/7 días
- Voz: "Treinta días antes. Quince. Siete. A ti y a tu equipo. Nadie se escuda en 'no sabía'."

**Sábado — Pilar 2**
- Tema: Uso de suelo — el permiso que casi nadie verifica antes de arrendar

### Semana 4 (2026-05-27 → 2026-06-02) — "La mentalidad del dueño ordenado"

**Lunes — Pilar 1**
- Hook: "Mi cliente tenía doce sedes. Solo tres estaban realmente en regla."

**Martes — Pilar 2**
- Tema: Cronograma anual de permisos para un restaurante en Quito

**Miércoles — Pilar 5 (v2)**
- Hook: "Cómo aprovechar al máximo a tu contadora y tu tramitador."
- Cuerpo: Dividir responsabilidades claro. Contadora = impuestos. Tramitador = trámite. EnRegla = memoria institucional y alertas. Los tres te cuidan.

**Jueves — Pilar 1**
- Hook: "Le dijeron 'todo en orden' tres años. No era verdad."

**Viernes — Pilar 3**
- Feature: Timeline de renovaciones
- Voz: "Qué vence en 30, 60, 90 días. Planificación, no pánico."

**Sábado — Pilar 2**
- Tema: Qué pasa legalmente si operas con permiso vencido

### Semana 5 (2026-06-03 → 2026-06-09) — "Las primeras historias reales"

Para esta semana deberías tener 5-10 clientes. Pedir testimonios.

**Lunes — Pilar 1**
- Hook: "Este café casi cierra. Se salvó por algo simple."

**Martes — Pilar 2**
- Tema: LUAE vs Patente vs Tasa — diferencias que todos confunden

**Miércoles — Pilar 5 (v2)**
- Hook: "Tres roles que tu negocio necesita (y probablemente ya tienes dos)."
- Cuerpo: Contador + Tramitador + Custodio digital. Explicar el gap del tercero.

**Jueves — Pilar 1**
- Hook: "Una multa de bomberos que se convirtió en cierre definitivo."

**Viernes — Pilar 3**
- Feature: Mapa interactivo multi-sede
- Voz: "Si tienes varias sedes, este mapa te muestra cuáles están en regla. Un vistazo, toda la operación."

**Sábado — Pilar 2**
- Tema: Documentos que te pide ARCSA en inspección sorpresa

### Semana 6 (2026-06-10 → 2026-06-16) — "Multi-sede es otro juego"

**Lunes — Pilar 1**
- Hook: "Una sede vencida arrastra a toda la marca."

**Martes — Pilar 2**
- Tema: Cómo gestionar permisos si tienes más de una sede

**Miércoles — Pilar 5 (v2)**
- Hook: "Por qué ningún software de contabilidad te organiza permisos."
- Cuerpo: No es culpa del software — los permisos operativos son OTRO dominio. Complementar.

**Jueves — Pilar 1**
- Hook: "El error número uno al abrir tu segunda sede."

**Viernes — Pilar 3**
- Feature: Upload masivo PDFs
- Voz: "Sube 50 PDFs de golpe. EnRegla los organiza por sede, tipo, fecha."

**Sábado — Pilar 2**
- Tema: Checklist completo de permisos para abrir una sede nueva en Quito

### Semana 7 (2026-06-17 → 2026-06-23) — "Inspecciones"

**Lunes — Pilar 1**
- Hook: "Me contó un inspector qué buscan primero cuando entran."

**Martes — Pilar 2**
- Tema: Cómo prepararte para una inspección ARCSA

**Miércoles — Pilar 5 (v2)**
- Hook: "Cuando el tramitador no existe, el compliance tampoco."
- Cuerpo: PYMES que NO tienen tramitador fijo. Qué riesgo corren. Cómo tener proceso sin persona fija.

**Jueves — Pilar 1**
- Hook: "Una inspección por denuncia anónima la tumbó."

**Viernes — Pilar 3**
- Feature: QR en vitrina
- Voz: "Imprime este QR. Pégalo en la entrada. El inspector escanea. Ve todo en orden. Siguiente."

**Sábado — Pilar 2**
- Tema: Qué decir (y qué NO decir) cuando llega un inspector

### Semana 8 (2026-06-24 → 2026-06-30) — "El dueño que ya aprendió"

**Lunes — Pilar 1**
- Hook: "La primera vez que te clausuran aprendes. La segunda te jubilas."

**Martes — Pilar 2**
- Tema: Permisos especiales para venta de alcohol

**Miércoles — Pilar 5 (v2)**
- Hook: "Cómo elegir un buen tramitador (sin quemarte)."
- Cuerpo: 5 señales de un tramitador profesional. Honrar a los buenos del gremio.

**Jueves — Pilar 1**
- Hook: "Los tres cierres que marcaron mi forma de ver el compliance."

**Viernes — Pilar 3**
- Feature: Notificaciones a todo el equipo
- Voz: "Tu contador, tu gerente, tu tramitador. Todos reciben la alerta. Nadie queda afuera."

**Sábado — Pilar 2**
- Tema: Diferencias en permisos entre Quito, Guayaquil y Cuenca

### Semana 9 (2026-07-01 → 2026-07-07) — "Profesionalizar tu operación"

**Lunes — Pilar 1**
- Hook: "Antes tenía los permisos en una carpeta de WhatsApp. Casi cerré dos veces."

**Martes — Pilar 2**
- Tema: Permisos por industria — restaurante vs retail vs servicio

**Miércoles — Pilar 5 (v2)**
- Hook: "Tu contador no revisa permisos. Y está bien. Ese no es su trabajo."
- Cuerpo: Respetar el scope de cada profesional. No exigirle al contador que cuide permisos operativos. EnRegla llena ese gap explícito.

**Jueves — Pilar 1**
- Hook: "Lo que descubrió en el diagnóstico fue peor que la inspección que temía."

**Viernes — Pilar 3**
- Feature: Historial de cambios
- Voz: "Quién subió qué. Cuándo. Quién marcó renovado. Transparencia."

**Sábado — Pilar 2**
- Tema: Cómo renovar tu permiso de bomberos sin ir personalmente

### Semana 10 (2026-07-08 → 2026-07-14) — "Primeros testimonios"

**Lunes — Pilar 1**
- Hook: "Este dueño tiene 3 sedes. Nunca más multa."

**Martes — Pilar 2**
- Tema: Calendario real de un restaurante — qué vence cuándo

**Miércoles — Pilar 5 (v2)**
- Hook: "El combo que todo dueño debería tener: contador + tramitador + sistema."
- Cuerpo: Presentar la tríada como best practice del sector.

**Jueves — Pilar 1**
- Hook: "La multa que recibió por error se convirtió en su mejor decisión."

**Viernes — Pilar 3**
- Feature: Todo el producto en 30s (demo completa)

**Sábado — Pilar 2**
- Tema: Qué hacer si un permiso ya está vencido hoy

### Semana 11 (2026-07-15 → 2026-07-21) — "El rol del enabler (bien usado)"

Semana de transición. Contenido también atrae partners.

**Lunes — Pilar 1**
- Hook: "Cuando tramitador y cliente están desconectados, pierden los dos."

**Martes — Pilar 2**
- Tema: Cómo trabajar bien con tu tramitador — tu lado de la mesa

**Miércoles — Pilar 5 (v2)** · **Tono especialmente cuidado esta semana**
- Hook: "Tramitadores, contadores, asesores: este contenido es también para ustedes."
- Cuerpo: Invitar explícitamente a enablers. "Si tienes clientes con 2-3 locales, EnRegla te da retención y visibilidad. Hablemos."
- CTA: Landing `/partners`

**Jueves — Pilar 1**
- Hook: "Cliente y tramitador se echaban la culpa. Ninguno tenía la información."

**Viernes — Pilar 3**
- Feature: Cómo un tramitador puede usar EnRegla para sus clientes

**Sábado — Pilar 2**
- Tema: Qué esperar (realmente) de un tramitador profesional

### Semana 12 (2026-07-22 → 2026-07-28) — "Cierre primer ciclo"

**Lunes — Pilar 1**
- Hook: "Después de 3 meses publicando, esto es lo que he aprendido."
- Especial reflexión meta, genera conexión.

**Martes — Pilar 2**
- Tema: Los 10 permisos que todo restaurante en Quito debería conocer

**Miércoles — Pilar 5 (v2)**
- Hook: "Después de 12 semanas hablando de permisos, el mensaje final es este: no lo hagas solo."
- Cuerpo: Cierre del ciclo. Equipo = tú + contador + tramitador + sistema. EnRegla es la pieza digital de ese equipo.

**Jueves — Pilar 1**
- Hook: "La historia que me convenció de construir EnRegla."
- Especial: **Danilo cara** (excepción al avatar).

**Viernes — Pilar 3**
- Feature: Diagnóstico en 7 días
- CTA fuerte del diagnóstico.

**Sábado — Pilar 6 (primer diagnóstico en vivo)**
- Danilo cara, con dueño real, con permiso.
- 60-90s versión corta, video largo en YouTube.

---

## Siguientes pasos

1. **Revisión del HTML visual v2** — Danilo lee y da feedback
2. **Revisión del mockup de landing PYME** — archivo aparte, aprueba ANTES de que se toque `enregla-landing`
3. **Ajustes si hay cambios**
4. **Invocar `writing-plans`** para plan de implementación del sprint 30 días
5. **Día 1:** Deploy email notifications + branch `feature/pyme-redesign`

---

**Fin del documento v2.**
