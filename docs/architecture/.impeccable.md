# Contexto de Diseño - EnRegla

## Users

**Audiencia principal**: Tres perfiles que convergen en necesidad de control y eficiencia:
1. **Gerentes/Administradores de empresas medianas** - Gestionan permisos y compliance para múltiples sedes durante jornada laboral en oficina
2. **Consultores legales/compliance** - Expertos que asesoran múltiples clientes y requieren herramienta que transmita expertise
3. **Dueños de pequeñas empresas** - Manejan su propio compliance sin equipo dedicado, necesitan simplicidad sin jerga técnica

**Contexto de uso**: Aplicación de trabajo diurna, usada en oficina durante horas laborales. Los usuarios están gestionando un aspecto crítico pero no urgente de su negocio: cumplimiento normativo, permisos, alertas de vencimiento.

**Job to be done**: Mantener el control sobre permisos y documentación legal de múltiples sedes/clientes, evitar sorpresas regulatorias, reducir la carga cognitiva del compliance.

## Brand Personality

**Tres palabras**: **Preciso, Confiable, Protector**

Como un escudo legal meticuloso y siempre alerta. EnRegla no es solo una herramienta administrativa, es el guardián silencioso que mantiene a las empresas en regla.

**Emoción objetivo**: **Confianza y control**  
La interfaz debe transmitir la sensación de tener todo bajo control, sin sorpresas. Como un dashboard financiero serio donde cada dato tiene su lugar y cada alerta tiene contexto.

## Aesthetic Direction

**Tono visual**: **Corporativo moderno** - Balance entre profesional y accesible. Sans humanista, colores brand vibrantes pero controlados. No intimidante como un software legal legacy, no genérico como una plantilla SaaS.

**Tema**: **Solo modo claro**  
Justificación: Usuarios trabajan en oficina durante el día. Aplicación profesional de gestión administrativa = contexto diurno. No hay caso de uso nocturno prioritario.

**Paleta**:
- **Brand**: Libertad creativa para rediseñar, pero el sistema debe sentirse profesional y distintivo
- **Funcional CRÍTICO**: Sistema de colores de riesgo debe mantenerse (crítico=rojo, alto=naranja, medio=amarillo, bajo=verde) - es semántico y funcional
- **Prohibido**: Paletas AI genéricas (cyan-on-dark, gradientes morados, neon, glassmorphism)

**Referencias conceptuales**:
- Despachos de abogados premium: refinamiento sin pretensión
- Dashboards enterprise-grade: densidad controlada, jerarquía clara
- Papelería legal: cremas, grises cálidos, tipografía precisa

**Anti-referencias**:
- Software legal legacy (anticuado, intimidante)
- Plantillas SaaS genéricas (sin personalidad)
- Dashboards con exceso de métricas hero y gradientes

## Design Principles

### 1. **Jerarquía Funcional sobre Decoración**
Cada elemento visual debe servir a la comprensión o la acción. Los colores de riesgo (crítico, alto, medio, bajo) son comunicación directa, no decoración. Las alertas deben ser claras sin ser alarmistas.

### 2. **Densidad Controlada**
Los usuarios gestionan múltiples sedes/clientes. La interfaz debe permitir ver suficiente información sin abrumar. Usa espaciado intencional: tight para datos relacionados, generous para separar contextos.

### 3. **Profesionalismo Accesible**
La app debe sentirse seria y capaz, pero no intimidante. Evita jerga innecesaria, pero mantén precisión técnica donde importa. El tono es "experto confiable" no "simplificado condescendiente".

### 4. **Confianza Visual**
Cada interacción debe reforzar la sensación de control. Estados claros (loading, success, error), feedback inmediato, sin sorpresas. Las alertas de vencimiento son informativas, no pánico.

### 5. **Consistencia Multi-Contexto**
El sistema debe funcionar igual de bien para:
- Un gerente revisando 5 sedes en una pantalla grande
- Un consultor chequeando un cliente específico en laptop
- Un dueño de PYME verificando su única locación en tablet

## Technical Constraints

- **Stack**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Existing**: Sistema de tokens con dos temas (professional/energetic) - considerar consolidar o redefinir
- **Typography actual**: Inter + SF Pro Display (revisar contra principios de font selection)
- **Accessibility**: WCAG AA mínimo, formularios deben ser keyboard-friendly
- **Performance**: Virtualización para listas largas (ya usa @tanstack/react-virtual)

## What Makes EnRegla Unforgettable?

**El factor diferenciador**: Una aplicación de compliance que NO genera ansiedad.  

La mayoría de software legal/compliance transmite urgencia constante o es genéricamente corporativo. EnRegla debe ser el punto medio: **serio sin ser sombrío, preciso sin ser intimidante, protector sin ser paternalista**.

La identidad visual debe comunicar: "Tienes un aliado experto, no un auditor mirando por encima de tu hombro."
