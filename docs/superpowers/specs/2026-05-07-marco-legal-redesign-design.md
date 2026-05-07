# Marco Legal — Rediseño de UI (Fase A)

**Fecha:** 2026-05-07
**Estado:** spec aprobado, pendiente de plan de implementación
**Branch:** `feature/product-refinement`

## Contexto

La vista actual de Marco Legal (`/marco-legal`) muestra 5 categorías (Funcionamiento, Sanitario, Ambiental, Laboral, Seguridad) con contenido placeholder pobre (4-5 bullets por categoría hardcodeados en `LegalCategoryDetailView.tsx`). Al mismo tiempo existe `src/data/legal-references.ts` con 391 líneas de contenido legal rico por permiso (fuentes con artículos, consecuencias, proceso, documentos, costos, links oficiales) que no se consume en ningún lado. Las tablas DB `legal_references`, `legal_sources`, `legal_consequences`, `legal_required_documents`, `legal_process_steps` existen pero están vacías.

El usuario encontró la vista actual inservible. Queremos rediseñar la UI para que consuma el contenido rico que ya existe.

## Scope

**Incluido (Fase A):**
- Rediseño completo de la vista `/marco-legal` y sus rutas hijas.
- Consumo del contenido existente en `src/data/legal-references.ts`.
- Mapping explícito de `PermitType` → Category para poder filtrar.
- UI responsiva (desktop + mobile).

**Excluido (Fase B, ver follow-up):**
- Validación / investigación legal del contenido actual (queda como proyecto separado: `docs/superpowers/follow-ups/2026-05-07-legal-sources-registry.md`).
- Seed de las tablas DB `legal_*` (el contenido sigue estático en TypeScript en esta fase).
- Agregar permisos nuevos (Ambiental, Laboral, Sanitario extra más allá de ARCSA).
- Print/export PDF.
- UI de edición.

## Usuarios y usos

La UI debe servir 3 usos concurrentemente:

1. **Consulta rápida durante un trámite** — "Estoy sacando mi LUAE, ¿qué documentos piden?" → búsqueda rápida, salto directo al permiso.
2. **Aprendizaje del marco regulatorio** — "Soy nuevo, ¿qué normativa aplica a mi negocio?" → exploración por categorías, ver panorama completo.
3. **Respaldo frente a inspección** — "Un inspector me pide justificación" → ficha citable con código de ley, artículos, fuentes oficiales, disclaimer.

## Arquitectura de pantallas

Dos vistas únicamente:

### 1. Lista principal (`/marco-legal`)

Componentes de arriba hacia abajo:
- **Header:** título "Marco Legal", subtítulo dinámico con el total ("6 permisos registrados · 5 categorías").
- **SearchBar:** input con placeholder "Buscar 'RUC', 'bomberos', 'LUAE'...".
- **CategoryChips:** chips horizontales. Categorías vacías (count = 0) aparecen deshabilitadas con badge "Próximamente". El chip "Todos" está seleccionado por defecto.
- **PermitList:** lista vertical (1 columna mobile, 2 columnas desktop) de `PermitCard`. Cada card muestra: icono, nombre, entidad emisora, tag de categoría, tag de alcance (nacional/municipal).

### 2. Detalle de permiso (`/marco-legal/:permitType`)

Componentes de arriba hacia abajo:
- **Breadcrumb:** `Marco Legal / <nombre del permiso>`.
- **PermitHeader:** icono grande, nombre del permiso, entidad emisora, tags (categoría, alcance, costo si aplica).
- **Disclaimer:** banner amarillo siempre visible: "Información referencial. No sustituye asesoría legal profesional."
- **PermitDetailTabs:** 4 paneles con navegación por tabs en desktop, segmented control en mobile:
  - **Resumen:** descripción + puntos clave extraídos + facts grid (costo, vigencia/renovación).
  - **Legal:** lista de `LegalSourceCard` (ley, artículos, tipo, link al portal oficial).
  - **Proceso:** documentos requeridos + pasos típicos numerados + costo estimado.
  - **Riesgos:** consecuencias de incumplimiento como lista con énfasis visual (color rojo suave).

## Componentes nuevos

Ubicación: `src/features/legal/`

| Componente | Propósito |
|---|---|
| `LegalIndexView.tsx` | Reemplaza `LegalReferenceView.tsx`. Contiene SearchBar + CategoryChips + PermitList. |
| `PermitCard.tsx` | Tarjeta individual de permiso en la lista. |
| `PermitDetailView.tsx` | Reemplaza `LegalCategoryDetailView.tsx`. Lee `:permitType` de URL, renderiza header + tabs. |
| `PermitDetailTabs.tsx` | Maneja los 4 paneles. Responsivo (tabs ↔ segmented control). |
| `LegalSourceCard.tsx` | Card individual de fuente legal. |
| `CategoryChips.tsx` | Componente de chips filtrables reusable. |
| `LegalDisclaimer.tsx` | Banner de disclaimer reusable. |

**Componentes eliminados:**
- `LegalCategoryCard.tsx` (la categoría ya no es una pantalla).
- La sección `CATEGORIES` de `LegalReferenceView.tsx` migra a `src/features/legal/categories.ts` como data de soporte.

## Data layer

### Fuente única

`src/data/legal-references.ts` se mantiene como fuente única. Se agrega al archivo:

```typescript
export type LegalCategory = 'funcionamiento' | 'sanitario' | 'ambiental' | 'laboral' | 'seguridad';

export const PERMIT_TO_CATEGORY: Record<PermitType, LegalCategory> = {
  ruc: 'funcionamiento',
  patente_municipal: 'funcionamiento',
  uso_suelo: 'funcionamiento',
  rotulacion: 'funcionamiento',
  bomberos: 'seguridad',
  arcsa: 'sanitario',
};

export const CATEGORY_META: Record<LegalCategory, { label: string; icon: string; description: string }> = {
  funcionamiento: { label: 'Funcionamiento', icon: 'Building2', description: '...' },
  seguridad:      { label: 'Seguridad',      icon: 'AlertTriangle', description: '...' },
  sanitario:      { label: 'Sanitario',      icon: 'FileText',      description: '...' },
  ambiental:      { label: 'Ambiental',      icon: 'Shield',        description: '...' },
  laboral:        { label: 'Laboral',        icon: 'Users',         description: '...' },
};
```

Las tablas DB `legal_*` quedan sin tocar en esta fase.

### Selectores derivados

En `src/features/legal/selectors.ts` (archivo nuevo):

```typescript
function getCategoryCount(category: LegalCategory): number
function getPermitsByCategory(category: LegalCategory | 'all'): LegalReference[]
function searchPermits(query: string): LegalReference[]
function getPermitByType(permitType: PermitType): LegalReference | null
```

Todo es in-memory, O(n) con n=6. No hace falta memo ni cache.

### Entidad emisora

Hoy `LegalReference.sources[0].entity` es la forma más confiable de obtener "quién emite". Agregar helper:

```typescript
function getIssuerShort(reference: LegalReference): string
// Ej: "Servicio de Rentas Internas (SRI)" → "SRI"
```

## Ruteo

Las rutas actuales `/marco-legal` y `/marco-legal/:categoria` se reemplazan por:

- `/marco-legal` → `LegalIndexView`
- `/marco-legal/:permitType` → `PermitDetailView`

Se elimina la ruta por categoría. Si alguna URL externa apunta a `/marco-legal/funcionamiento`, devuelve el 404 friendly.

## Estados y edge cases

| Estado | Comportamiento |
|---|---|
| Lista completa | 6 cards visibles, chip "Todos (6)" activo. |
| Filtro por chip con resultados | Lista filtrada + chip activo resaltado + contador en subtítulo. |
| Filtro por chip sin resultados | No pasa hoy (solo hay chips activos cuando hay ≥1 permiso). Vacías quedan deshabilitadas. |
| Búsqueda sin resultados | EmptyState con mensaje + botón "Limpiar búsqueda". |
| URL con `permitType` inválido | 404 friendly: "Este permiso no existe en nuestro registro" + link a volver. |
| Tab sin contenido (ej: sin `consequences` definidos) | Mostrar mensaje inline "Información no disponible para este permiso." |

## Responsivo

Breakpoint único: `md:` (Tailwind 768px), coherente con el resto del proyecto.

| Elemento | Desktop (`≥md`) | Mobile (`<md`) |
|---|---|---|
| Lista principal | Grid 2 columnas | 1 columna |
| Chips de categoría | Wrap normal | Scroll horizontal con overflow-x-auto |
| Search bar | Ancho completo de container | Ancho completo de pantalla |
| Detalle tabs | Tabs horizontales tradicionales | Segmented control iOS-style (4 segmentos iguales) |
| Header permiso | Icono grande + columna de texto | Igual pero más compacto |
| Facts grid | 2×N columnas | 1 columna |

## Accesibilidad

- Tabs / segmented control: ARIA `role="tablist"`, `role="tab"`, `aria-selected`, navegación con flechas.
- Chips: son `<button>` con `aria-pressed` para indicar filtro activo.
- Breadcrumb: `<nav aria-label="Breadcrumb">`.
- Search input: `<label>` oculto o `aria-label`.
- Disclaimer: `role="note"`.
- Links a portales externos: `rel="noopener noreferrer"`, `target="_blank"`, icono de "external link" visible.

## Design tokens

Reuso total del sistema actual `--ds-*`:
- Brand: `--ds-background-brand` (#0f265c).
- Backgrounds: `--ds-neutral-50` para la página, `white` para cards.
- Bordes: `--ds-border`, `--ds-border-bold` en hover.
- Tags de categoría: `--ds-blue-soft` (fondo) + `--ds-blue-text` (texto).
- Disclaimer: tonos amarillo suaves (proponer `--ds-yellow-100` / `--ds-yellow-700` si no existen; si no, inline).
- Consecuencias (riesgos): `--ds-red-100` / `--ds-red-500`.

Sin iconos custom: todo viene de `lucide-icons` mapeado en `src/lib/lucide-icons`.

## User flow

Ver diagrama renderizado en el HTML companion (`2026-05-07-marco-legal-redesign-design.html`). Resumen:

```
Entry points:
  - Sidebar "Marco Legal" → /marco-legal
  - Link desde ficha de permiso en otras vistas (dashboard, sedes) → /marco-legal/:permitType
  - URL directa compartida → /marco-legal/:permitType

Flow principal:
  /marco-legal
    ├── buscar texto
    │     ├── con resultados → lista filtrada
    │     └── sin resultados → EmptyState + CTA limpiar
    ├── seleccionar chip de categoría (con contenido)
    │     └── lista filtrada por categoría
    ├── click en chip "Próximamente"
    │     └── no-op (chip deshabilitado)
    └── click en PermitCard → /marco-legal/:permitType

/marco-legal/:permitType
    ├── permitType válido
    │     ├── tab Resumen (default) → descripción + puntos clave + facts
    │     ├── tab Legal → lista de fuentes con artículos y links
    │     ├── tab Proceso → documentos + pasos + costo
    │     ├── tab Riesgos → consecuencias (estética roja suave)
    │     └── click breadcrumb "Marco Legal" → volver
    └── permitType inválido → 404 friendly + link volver

Link externo en tab Legal:
    click → nueva pestaña al portal oficial (sri.gob.ec, etc.)
```

## Testing

Tests sugeridos con Vitest + Testing Library:

- `selectors.test.ts`
  - Cuenta correcta por categoría.
  - Búsqueda case-insensitive y con acentos (RUC, Patente, bomberos…).
  - `getPermitByType` devuelve null para key inválida.
- `LegalIndexView.test.tsx`
  - Renderiza 6 cards al inicio.
  - Chip "Funcionamiento" filtra a 4.
  - Buscar "bomberos" deja solo ese permiso.
  - Buscar "XXX" muestra EmptyState.
- `PermitDetailView.test.tsx`
  - `:permitType = 'ruc'` renderiza el header correcto.
  - Tab "Legal" muestra las 3 fuentes del RUC.
  - `:permitType = 'inexistente'` renderiza 404 friendly.
- Responsive: tests visuales manuales al final (no snapshots).

## Migración

Una sola rama de trabajo (`feature/product-refinement`), sin feature flag.

1. Crear componentes nuevos sin tocar los viejos.
2. Cambiar las rutas en `AppRouter` para apuntar a los nuevos.
3. Borrar los archivos viejos (`LegalCategoryCard.tsx`, `LegalCategoryDetailView.tsx`, `LegalReferenceView.tsx`).
4. Commit único que hace el swap completo.

No hay datos de usuarios en las tablas `legal_*` (están vacías), así que no hay migración de datos.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Contenido de `legal-references.ts` puede estar desactualizado | Disclaimer visible + Proyecto B (Legal Sources Registry) lo aborda sistemáticamente. |
| Mobile segmented control con 4 tabs puede quedar apretado en pantallas <360px | Usar labels cortos ("Resumen", "Legal", "Proceso", "Riesgos") y font-size responsive. Fallback: abreviar a 2-3 caracteres si `<320px`. |
| Búsqueda client-side no escala si crece el contenido | Acceptable con 6 registros. Si Fase B lleva el contenido a 30+, migrar a DB con ILIKE. |
| Categorías vacías ("Próximamente") pueden confundir | Chip deshabilitado + tooltip "Contenido en preparación". |

## Checklist de completitud

- [x] Scope claramente Fase A / Fase B separados.
- [x] Componentes nombrados con ubicación.
- [x] Data flow descrito con tipos.
- [x] Mapping de categorías explícito.
- [x] Estados y edge cases cubiertos.
- [x] Responsivo con breakpoints concretos.
- [x] Accesibilidad definida.
- [x] Testing sugerido.
- [x] Migración pensada (swap atómico).
- [x] User flow diagramado (ver HTML companion).
- [x] Riesgos documentados.
