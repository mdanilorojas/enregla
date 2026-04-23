# EnRegla Project Instructions

## Design Context

### Users
**Audiencia principal**: Tres perfiles que convergen en necesidad de control y eficiencia:
1. **Gerentes/Administradores de empresas medianas** - Gestionan permisos y compliance para múltiples sedes durante jornada laboral en oficina
2. **Consultores legales/compliance** - Expertos que asesoran múltiples clientes y requieren herramienta que transmita expertise
3. **Dueños de pequeñas empresas** - Manejan su propio compliance sin equipo dedicado, necesitan simplicidad sin jerga técnica

**Contexto de uso**: Aplicación de trabajo diurna, usada en oficina durante horas laborales. Los usuarios están gestionando un aspecto crítico pero no urgente de su negocio: cumplimiento normativo, permisos, alertas de vencimiento.

### Brand Personality
**Tres palabras**: **Preciso, Confiable, Protector**

**Emoción objetivo**: **Confianza y control** - La interfaz debe transmitir la sensación de tener todo bajo control, sin sorpresas.

### Aesthetic Direction
**Tono visual**: **Corporativo moderno** - Balance entre profesional y accesible. Sans humanista, colores brand vibrantes pero controlados.

**Tema**: **Solo modo claro** (usuarios trabajan en oficina durante el día)

**Paleta**: Sistema de colores de riesgo debe mantenerse (crítico=rojo, alto=naranja, medio=amarillo, bajo=verde). Prohibido: paletas AI genéricas (cyan-on-dark, gradientes morados, neon).

### Design Principles
1. **Jerarquía Funcional sobre Decoración** - Cada elemento visual debe servir a la comprensión o la acción
2. **Densidad Controlada** - Suficiente información sin abrumar
3. **Profesionalismo Accesible** - Serio pero no intimidante
4. **Confianza Visual** - Estados claros, feedback inmediato, sin sorpresas
5. **Consistencia Multi-Contexto** - Debe funcionar igual de bien en desktop, laptop y tablet

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Custom UI-v2 component system (transitioning from Shadcn)
- **Styling**: Tailwind CSS + CSS custom properties for design tokens
- **State**: React hooks + context
- **Auth**: Google OAuth (implemented)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)

## Database Management

**CRITICAL**: All database changes must be handled by Claude with production-grade quality.

### Requirements
1. **Always use migrations** - Never make ad-hoc database changes
2. **Production-ready RLS policies** - Every policy must work for:
   - Demo mode (no authentication)
   - Production mode (authenticated users with proper company isolation)
3. **Storage policies included** - Don't forget storage.objects RLS for file uploads
4. **Test security boundaries** - Verify users can't access other companies' data
5. **Use mcp__supabase__execute_sql and mcp__supabase__apply_migration tools** - You have direct access

### Demo Mode Support
- Demo company ID: `50707999-f033-41c4-91c9-989966311972`
- All RLS policies must allow operations on this company without authentication
- Storage policies must allow uploads to `permits/` folder without auth
- Keep production security intact - demo mode is additive, not a bypass

### Policy Pattern
```sql
-- Example: Table RLS policy supporting both demo and production
CREATE POLICY "policy_name" ON table_name
FOR operation
USING (
  -- Demo company (no auth required)
  company_id = '50707999-f033-41c4-91c9-989966311972'
  OR
  -- Production (authenticated users for their company)
  (
    auth.uid() IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);
```

## Current Work

- **Active Branch**: `main`
- **Status**: Core features implementation
- **Focus**: Real-time data from Supabase, document uploads, demo mode
