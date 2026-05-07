# Follow-up: Legal Sources Registry

**Estado:** pendiente. Separado del rediseño de UI del Marco Legal para no mezclar scopes.

## Contexto

Durante el brainstorming del rediseño del Marco Legal (2026-05-07), el usuario señaló que el contenido actual de `src/data/legal-references.ts` fue resultado de una investigación de Claude (no validada sistemáticamente). Esto genera dos riesgos:

1. **Contenido potencialmente desactualizado**: leyes, artículos, URLs pueden haber cambiado.
2. **Sin trazabilidad**: no está registrado cuándo y dónde se consultó cada dato.

Decisión: el rediseño de UI avanza con el contenido actual. Este follow-up captura el trabajo de contenido.

## Alcance del proyecto

### 1. Research legal inicial
- Validar y/o corregir los 6 permisos ya documentados: `ruc`, `patente_municipal`, `bomberos`, `arcsa`, `uso_suelo`, `rotulacion`.
- Ampliar la cobertura para las 5 categorías visuales actuales: agregar al menos 1-2 permisos de **Ambiental**, **Laboral** y **Sanitario** (este último va más allá de ARCSA).
- Cada permiso debe tener: descripción, fuentes legales con artículos específicos, consecuencias, documentos requeridos, proceso, costo, links oficiales.

### 2. Sources registry (metadatos de verificación)
Extender el schema de `legal-references.ts` (o tabla DB nueva) con:
- `sourceUrl`: URL oficial donde se consultó el dato.
- `consultedAt`: fecha de última consulta manual.
- `lastVerifiedAt`: fecha de última verificación automática.
- `contentHash`: hash del texto relevante de la fuente (para detectar cambios).
- `verificationStatus`: `current` | `stale` | `broken` | `changed`.

### 3. Re-verificación periódica
- Cron (semanal o mensual) que:
  1. Haga fetch de cada `sourceUrl`.
  2. Compare `contentHash` con el guardado.
  3. Si cambió o la URL rompe, marque el registro y notifique.
- Dashboard interno para ver el estado de verificación de cada permiso.

### 4. Proceso de actualización documentado
- Donde registrar cuándo se hizo una consulta manual.
- Cómo validar que una fuente nueva es oficial.
- Cadencia recomendada de revisión por tipo de fuente (leyes cambian lento, ordenanzas más rápido).

## Por qué no está en el rediseño de UI

- Research legal toma tiempo significativo (días-semanas), no un sprint.
- Sistema de verificación es backend + infra (cron jobs, hashing, dashboard), no UI.
- Mezclar ambos proyectos hace que ninguno avance.

## Prerequisitos para comenzar este trabajo

- UI del Marco Legal ya funcionando y consumiendo `legal-references.ts`.
- Decisión sobre si el contenido vive en `.ts` (static) o en DB (`public.legal_references` y tablas relacionadas ya existen pero están vacías). Ver `docs/superpowers/specs/` para contexto del schema.

## Decisión al momento

Mientras tanto, el rediseño de UI usará `legal-references.ts` tal como está. Se documentará claramente en la UI (disclaimer) que el contenido es referencial y no sustituye asesoría legal. Los 6 permisos cubiertos quedarán visibles; categorías sin permisos mapeados se indican como "en preparación" o se ocultan.
