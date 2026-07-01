# Onboarding: Welcome + Tour (concepto corregido)

**Fecha:** 2026-06-24
**Estado:** Requerimiento capturado — pendiente de aprobación. NO implementado.
**Budget:** Capturado en modo conciso (usuario a 90% tokens). HTML companion + user-flow diagram pendientes para cuando haya budget.

## Problema / confusión a corregir

Se mezclaron 3 cosas distintas. Quedan separadas así:

| Concepto | Qué es | Escribe datos | Estado actual |
|---|---|---|---|
| **Setup wizard** | Alta de cuenta: crear empresa, RUC, ciudad, 1ª sede. Vive en `/setup` (`IncrementalWizard`). | **Sí** | Existe, en prod |
| **Welcome** | Pantalla "Hola, bienvenido a EnRegla" + overview de lo que puedes hacer. Educativa. | No | **No existe** |
| **Tour** | Coachmarks/spotlight sobre la plataforma **real** ("aquí se hace X"), estilo screenshot de Humanity ("Click here to add them"). | No | **No existe** |

> Lo que se construyó esta sesión (`TutorialTour` en `/tutorial`, replay read-only de los forms del setup) **no es el tour** — es un replay de formularios. Queda marcado para **reemplazar** por el tour real (ver Pendientes).

## Concepto objetivo (3 fases)

1. **Welcome** — Pantalla de bienvenida. "Hola, bienvenido a EnRegla." Muestra las capacidades (gestionar sedes, permisos, alertas de vencimiento, documentos). 1 pantalla/modal, CTA "Empezar recorrido" / "Saltar".
2. **Tour** — Recorrido guiado con coachmarks sobre la UI real: spotlight (fondo oscurecido) + tooltip que apunta a un elemento real, con "Siguiente"/"Saltar". Enseña **dónde** se hace cada cosa. ~4–6 pasos.
3. **Plataforma** — Al terminar o saltar el tour → app normal.

## Distinción de orden (a confirmar)

Secuencia first-run probable: **Setup (crear cuenta) → Welcome → Tour → Plataforma.**
El Setup sigue siendo el alta de datos; Welcome+Tour son educativos y van después de tener cuenta (el tour necesita la plataforma real con datos para apuntar a elementos).

## Re-trigger

El botón **"Ver tutorial"** (ya agregado en Configuración → Perfil) debe **re-lanzar el Tour** (no el replay de forms). El Welcome puede ofrecerse también desde ahí.

## Enfoque técnico recomendado (ponytail)

No hand-rollear el spotlight. Usar librería de tour:
- **driver.js** (recomendado): ~5kb, sin deps, framework-agnostic, spotlight + popover nativos. Lazy.
- Alt: `react-joyride` (más idiomático React, más pesado).

El Welcome sí es componente propio (pantalla simple, reutiliza tokens del design system).

## Pendientes / decisiones bloqueantes (para cuando haya budget)

1. **Orden:** ¿Setup → Welcome → Tour, o Welcome va antes del Setup?
2. **Pasos del tour:** ¿qué 4–6 elementos marcamos? (sugerencia: Dashboard, "agregar sede", "permisos por vencer", "subir documento", "configuración").
3. **Gating:** Tour automático solo 1ª vez (flag persistido en `profiles`, ej. `onboarding_tour_done`), re-lanzable por el botón. ¿Ok?
4. **Lib:** ¿driver.js (recomendado) o react-joyride?
5. **Qué hacer con `TutorialTour`/`/tutorial` actual:** reemplazar por tour real, o borrar.

## NO incluido (YAGNI por ahora)

- HTML companion + diagrama de user-flow (regla visual-first) → pendiente por budget de tokens.
- Plan de implementación (`writing-plans`) → tras aprobar este spec.
