# Evaluación — Instrumento de venta (Estudio de Cumplimiento)

**Fecha**: 2026-06-17
**Branch**: `feature/evaluacion`
**Estado**: Diseño aprobado, en implementación.

## 1. Propósito

Herramienta **interna (staff EnRegla)** para generar un *Estudio de Cumplimiento
Normativo* en PDF a partir de pocos datos de un negocio. Es el instrumento de venta:
en una reunión con un prospecto, el staff captura datos básicos del negocio y obtiene
un PDF profesional con todos los requisitos gubernamentales que ese negocio necesita
para operar en regla (permisos de funcionamiento, SRI, laboral/IESS y requisitos
sectoriales). Arranca con **clínicas**; el modelo soporta más tipos (restaurante,
gimnasio, etc.) sin cambios de código, solo datos.

## 2. Acceso y separación

- Visible solo para staff: gate `isStaff(profile)` = `profile.is_staff === true`
  (columna ya existente en `profiles`).
- Ruta `/evaluacion`, **fuera** del `AppLayout` de cliente, con layout propio mínimo
  (`EvaluacionLayout`): logo EnRegla + badge "Evaluación · Interno", sin sidebar de cliente.
- `StaffRoute` redirige a `/` a cualquier no-staff. Link de acceso discreto en el
  sidebar, solo renderizado si `is_staff`.

## 3. Modelo de datos (Supabase)

Migración autorada en `supabase/migrations/`. Tablas:

- `business_types`: catálogo (`slug`, `name`, `description`, `active`). Seed: `clinica`.
- `evaluation_input_fields`: campos a capturar por tipo (`business_type_id`, `key`,
  `label`, `type`, `options jsonb`, `required`, `help`, `sort`).
- `requirement_catalog`: requisitos por tipo (`business_type_id`, `code`, `area`,
  `name`, `authority`, `description`, `mandatory`, `renewal`, `legal_reference`,
  `applies_when jsonb`, `sort`).
- `evaluations`: instancia del estudio (`business_type_id`, `prospect_name`,
  `prospect_ruc`, `prospect_city`, `contact`, `inputs jsonb`, `created_by`,
  `location_id` y `company_id` **opcionales** para vincular a un cliente EnRegla
  existente, `created_at`).

RLS: solo `auth.uid()` con `profiles.is_staff = true`. No toca demo mode (additivo).

> **Fase actual**: el catálogo canónico vive además como módulo TS
> (`src/features/evaluacion/catalog/`) para permitir uso/prueba sin BD aplicada.
> La migración refleja exactamente ese seed; cuando se aplique, un hook puede
> preferir la BD. Persistencia de `evaluations` en `localStorage` mientras la
> migración no esté aplicada en el proyecto.

## 4. Arquitectura de componentes

| Unidad | Responsabilidad |
|---|---|
| `types.ts` | Tipos: `BusinessTypeDef`, `InputFieldDef`, `RequirementDef`, `Condition`, `InputValues`. |
| `catalog/clinica.ts` | Seed clínica (fields + requirements). Fundamentado en research ACESS/ARCSA/SRI/IESS. |
| `catalog/index.ts` | Registry `getBusinessType(slug)`, `listBusinessTypes()`. |
| `engine.ts` | `evaluateRequirements(bt, values)` — puro, filtra por `applies_when`, agrupa por área. TDD. |
| `storage.ts` | CRUD de `evaluations` en localStorage (swap a Supabase luego). |
| `StaffRoute.tsx` | Guard staff-only. |
| `EvaluacionLayout.tsx` | Layout aislado del de cliente. |
| `EvaluacionListView.tsx` | Lista de estudios + "Nueva evaluación". |
| `EvaluacionWizardView.tsx` | Wizard: tipo → datos prospecto + drivers → guardar. |
| `EstudioView.tsx` | Render del estudio + `window.print()` (CSS de impresión). |

## 5. Motor

`evaluateRequirements(bt, values)`:
1. Filtra `bt.requirements` por `appliesWhen` (todas las condiciones deben cumplir;
   ausencia ⇒ siempre aplica).
2. Agrupa por `area` en orden fijo: funcionamiento, sectorial, sri, laboral_iess.
3. Devuelve `{ area, label, items }[]`.

Condiciones soportadas: `eq`, `gt`, `gte`, `includes` (para multiselect).

## 6. Flujo de usuario

```
/evaluacion (lista)
  └─ "Nueva evaluación" → /evaluacion/nueva
       Paso 1: tipo de negocio (Clínica activo; otros "próximamente")
       Paso 2: datos del prospecto (razón social, RUC, ciudad, contacto)
                + drivers (m², #personal, servicios, ¿medicamentos?, ¿desechos?, ¿alimentos?)
                + (opcional) vincular a cliente EnRegla existente
       Paso 3: guardar → /evaluacion/:id
  └─ /evaluacion/:id (estudio)
       Vista del estudio renderizado → "Generar PDF" = window.print()
```

Errores: tipo sin seleccionar / campos requeridos vacíos bloquean avance.
Estudio inexistente → estado vacío con volver a la lista.

## 7. Seed clínica (research)

Drivers: `area_m2`, `staff_count`, `health_professionals`, `services[]`,
`handles_medications`, `generates_biohazard`, `sells_food`.

- **Funcionamiento** (siempre): uso de suelo, LUAE/patente, bomberos, permiso ACESS.
- **Sectorial**: registro profesionales ACESS (si profesionales>0); ARCSA/BPM (si
  medicamentos); contrato desechos biopeligrosos + licencia ambiental SUIA (si
  desechos); ARCSA alimentos (si vende alimentos).
- **SRI**: RUC, régimen RIMPE/General, facturación electrónica, declaraciones IVA/Renta.
- **Laboral/IESS**: afiliación IESS (si personal>0), riesgos del trabajo (si personal>0),
  reglamento SST (si personal≥10).

Fuentes: ACESS, ARCSA (controlsanitario.gob.ec), ExperTax consultorios médicos.

## 8. PDF

HTML estilizado con tokens del design system + hoja de impresión (`@media print`,
`@page`). Secciones: portada (logo + negocio + fecha) → resumen de datos → tablas por
área (requisito / autoridad / obligatorio / periodicidad / base legal) → cierre con
pitch EnRegla. Color de riesgo para obligatorio vs recomendado.

## 9. Fuera de alcance (ahora)

- Aplicar la migración (requiere auth MCP del usuario).
- Tipos distintos de clínica (modelo listo, solo faltan datos).
- Edición de catálogo desde UI (se hará por datos/migración).
