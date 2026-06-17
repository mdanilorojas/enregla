# Especificación de Diseño: Rediseño del Dashboard Principal

## Contexto del Proyecto y Objetivos
El objetivo de este cambio es rediseñar la vista principal del Dashboard de EnRegla (`/dashboard-test`) para reemplazar el anillo de cumplimiento radial por el componente animado basado en la metáfora climática (`ComplianceWeatherCard.tsx`). Este diseño unifica el estado general operativo con el listado de alertas de acciones inmediatas de manera intuitiva y consistente con la marca.

---

## 1. Decisiones de Diseño y Estructura (Layout)

### Distribución de Columnas Paralelas (Split Grid)
* El Dashboard adoptará una estructura de rejilla dividida en pantallas grandes (`lg:grid-cols-[1.2fr_1fr]` o `lg:grid-cols-2`).
* **Columna Izquierda: Clima de Cumplimiento (ComplianceWeatherCard)**:
  * Reemplaza el circular progress gauge.
  * Renderiza el componente [ComplianceWeatherCard](file:///c:/dev/enregla/src/components/ui/ComplianceWeatherCard.tsx).
  * Muestra de forma inmediata el "clima operativo" (Soleado, Nublado, Tormenta) reflejando el nivel de riesgo del negocio.
* **Columna Derecha: Hub de Acciones Requeridas (Alertas)**:
  * Lista las tareas y permisos que requieren atención ordenados por urgencia.
  * Mantiene una densidad de información controlada.

### Ubicaciones y Sedes
* Se despliega en la parte inferior en una cuadrícula completa independiente, manteniendo su diseño actual de tarjetas de sedes pero respetando las reglas de interactividad del sistema de diseño.

---

## 2. Lógica de Negocio y Mapeo del Clima

El estado del clima se deriva directamente del estado y la gravedad de los vencimientos de permisos utilizando un enfoque basado en riesgo:

| Estado del Clima | Condición lógica | Label del Chip | Mensaje del Headline |
| :--- | :--- | :--- | :--- |
| **Tormenta (`err`)** | Al menos 1 permiso vencido (`vencidos > 0`) | `"Riesgo Crítico"` | `"Atención: tienes permisos vencidos que requieren acción."` |
| **Nublado (`warn`)** | Cero vencidos, pero al menos 1 por vencer o sin registrar (`porVencer > 0 \|\| noRegistrado > 0`) | `"Alerta Operativa"` | `"Tienes permisos próximos a vencer o sin registrar."` |
| **Soleado (`sunny`)** | Todo al día (todos los permisos activos están vigentes o en trámite) | `"Operación Protegida"` | `"Tu operación se encuentra al día y segura."` |

---

## 3. Reglas de Consistencia y Diseño Visual

### Reutilización de Componentes y Tokens de Tipografía
* **Reutilización obligatoria**: Se deben importar y usar los componentes oficiales del sistema de diseño: `{ Card }` de `@/components/ui/card` y `{ Button }` de `@/components/ui/button`.
* **No HTML hardcodeado**: Prohibido reconstruir botones o tarjetas usando tags HTML planos y clases CSS ad-hoc.
* **Tokens de fuente**:
  * Título de los permisos: `text-[var(--ds-font-size-100)]` (base).
  * Metadatos e información secundaria: `text-[var(--ds-font-size-075)]` (subtle).
  * No se utilizarán clases de tamaños hardcodeadas (como `text-[11px]`, `text-[10px]`) o clases nativas directas de Tailwind sin tokenizar (como `text-xs`).

### Interactividad Sutil y Botones
* **Acciones en Listas**: Para la lista de acciones requeridas, se utilizarán botones limpios sin bordes pesados con la variante **`variant="subtle"`** o **`variant="link"`** de `<Button>`, evitando la acumulación de rectángulos bordeados en el listado.
* **Efectos Hover**: Para los elementos clickeables, se aplicarán transiciones de fondo suaves (`hover:bg-[var(--ds-neutral-50)]`) y bordes (`hover:border-[var(--ds-border-bold)]`). Queda **prohibido** el uso de transformaciones de escala o elevación de sombras (`hover:-translate-y-*` o `hover:shadow-overlay`) para evitar romper la consistencia con las tarjetas estáticas.
* **Paleta de Colores**: Se mantiene estrictamente el esquema de riesgo del negocio (rojo para crítico, naranja para alto, amarillo para medio, verde para bajo). Queda prohibido el uso de paletas AI genéricas (como fondos negros con luces de neón o gradientes morados).

---

## 4. Plan de Verificación

### Pruebas Automatizadas
* Verificar la lógica de cálculo del clima operativo mediante test unitarios en `DashboardTestView.test.tsx` (o archivo equivalente) para asegurar que el mapeo de `vencidos`, `porVencer` y `noRegistrado` a los estados `err`, `warn` y `sunny` sea correcto ante variaciones del estado de los permisos.

### Pruebas Manuales
1. Cambiar temporalmente los datos simulados o de la base de datos de pruebas para alternar los tres estados del clima (`sunny`, `warn`, `err`) y comprobar visualmente que las animaciones de canvas, partículas, nubes y rayos se ejecutan correctamente.
2. Validar que la vista sea completamente responsive y se adapte a dispositivos móviles, tablets y pantallas de escritorio.
3. Verificar que los hover de las tarjetas del listado sigan las pautas de interactividad sutil definidas.
