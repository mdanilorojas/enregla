# Especificación de Diseño: Dashboard con Diseño Horizontal Fino y Estructura en Columnas

## Contexto del Proyecto y Objetivos
El objetivo es rediseñar la vista principal del Dashboard (`DashboardView.tsx`) para implementar la propuesta **"Héroe Horizontal Fino + Columnas"**. El diseño anterior colocaba el clima operativo (`ComplianceWeatherCard.tsx`) a la par del hub de acciones requeridas en dos columnas simétricas de alto impacto vertical (min-height 340px), lo cual ocupaba la mayor parte de la pantalla visible (fold) y desplazaba el listado de locales/sedes hacia abajo.

Con este rediseño:
1.  **ComplianceWeatherCard** se transforma en un banner superior horizontal delgado, de ancho completo, que conserva sus animaciones climáticas integradas pero con menor altura.
2.  El área principal del dashboard se distribuye en dos columnas asimétricas: **Locales/Sedes** a la izquierda y **Acciones Requeridas** a la derecha, mejorando notablemente la densidad de información y la usabilidad.

---

## 1. Diseño y Estructura de Componentes

### 1.1. Modificación de `ComplianceWeatherCard.tsx` (Banner Horizontal)
El componente se modificará para permitir un modo horizontal mediante una propiedad opcional (o adaptándolo directamente si es la única vista que lo consume). 

*   **Dimensiones y Altura:**
    *   La altura mínima del banner en pantallas de escritorio se reduce de `min-h-[340px]` a `min-h-[120px]` (o `130px` para acomodar la información holgadamente).
*   **Fondo y Animaciones:**
    *   Se conservan todos los canvas (`dustCanvasRef`, `warnCanvasRef`), nubes de tormenta, destellos de rayos y efectos CSS de fondo. Las animaciones ocuparán el fondo de toda la franja horizontal (`absolute inset-0`).
*   **Distribución del Contenido (`.content`):**
    *   Se utilizará una estructura flexible horizontal en pantallas medianas y grandes (`md:flex-row md:items-center md:justify-between gap-6`). En móviles, el contenido se apilará de forma fluida.
    *   **Bloque Izquierdo (Info y Estado):**
        *   Muestra el chip de estado (`chipLabel` con el color e indicador parpadeante correspondiente).
        *   Muestra el titular de cumplimiento (`headline`), adaptando su tamaño y peso tipográfico a un espacio más horizontal.
    *   **Bloque Derecho (Métricas y Acción):**
        *   Porcentaje general de cumplimiento (`percentage%`) con tamaño compacto pero legible (ej. `text-4xl` o `text-5xl` con tipografía fina).
        *   Un divisor vertical sutil (`w-[1px] h-8 bg-white/20`).
        *   Un botón de acción de estilo premium que diga `"Resolver alertas"`. Este botón tendrá el comportamiento de hacer foco/scroll hacia la columna de alertas o redirigir al listado general de permisos según corresponda.

### 1.2. Modificación de `DashboardView.tsx` (Layout Principal)
*   **Estructura Jerárquica:**
    1.  **Checklist de Onboarding** (si se muestra).
    2.  **Header Principal** (Nombre de la empresa, badge de giro comercial "Restaurante" animado, contadores de permisos y botón "+ Nuevo Permiso").
    3.  **Banner del Clima Horizontal** (`ComplianceWeatherCard` a ancho completo).
    4.  **Rejilla en Dos Columnas (Workspace Grid):**
        *   `grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`
        *   **Columna de Locales / Sedes (Izquierda, `lg:col-span-7` o `lg:col-span-8`):** Contiene el encabezado "Tus Locales y Estado por Sede" y el listado de tarjetas de sede (`DashboardLocationCard`). Para aprovechar mejor la distribución de dos columnas, el listado se renderizará en una grilla interna de 2 columnas (`grid grid-cols-1 md:grid-cols-2 gap-4`).
        *   **Columna de Acciones Requeridas (Derecha, `lg:col-span-5` o `lg:col-span-4`):** Contiene la tarjeta de Action Hub (`Card`) con el listado de alertas críticas.

---

## 2. Consistencia Visual y Sistema de Diseño (EnRegla Tokens)

Se respetan sin excepciones las directrices de `AGENTS.md`:
1.  **Modo Claro Único:** El dashboard operará únicamente bajo el tema claro diurno.
2.  **Tokens Tipográficos:**
    *   Textos principales: `text-[var(--ds-font-size-100)]`
    *   Detalles secundarios y metadatos: `text-[var(--ds-font-size-075)]`
3.  **Interactividad Sutil:**
    *   Las tarjetas de sedes clickeables no usarán escalados o sombras flotantes en hover (`hover:-translate-y-*` o `hover:shadow-overlay`).
    *   Se usarán transiciones sutiles de color de fondo y borde: `hover:bg-[var(--ds-neutral-50)] hover:border-[var(--ds-border-bold)]`.
4.  **Reutilización de UI-v2:** Uso estricto de `{ Card }`, `{ Button }` y `{ Badge }` importados de sus rutas oficiales en `@/components/ui/`.

---

## 3. Plan de Verificación y QA

### 3.1. Compilación y Tipado
*   Ejecutar `npm run typecheck` para verificar que no haya problemas de tipado en TypeScript.
*   Ejecutar `npm run build` para asegurar la correcta compilación y generación de bundles.

### 3.2. Pruebas Manuales Visuales
*   Verificar en el navegador que el banner horizontal se renderiza correctamente en los tres estados de clima:
    1.  **Soleado (`sunny`)**: Fondo degradado azul claro, halo del sol y partículas sutiles flotando.
    2.  **Nublado (`warn`)**: Fondo grisáceo, nubes de advertencia desplazándose, efecto mist.
    3.  **Tormenta (`err`)**: Fondo oscuro, nubes oscuras con efecto tormenta, destellos aleatorios de rayos y partículas.
*   Validar la responsividad:
    *   En resoluciones móviles (ancho < 768px), el banner horizontal apila el contenido de forma legible.
    *   El grid principal de 2 columnas se colapsa a una única columna vertical en móviles de forma ordenada.
*   Verificar que las tarjetas de sedes reaccionen al hover de forma limpia y consistente.
