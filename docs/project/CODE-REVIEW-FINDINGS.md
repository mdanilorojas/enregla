# Code Review Findings - feature/ui-v2

**Fecha**: 2026-04-20  
**Reviewer**: Claude Code (Code Reviewer agent)  
**Score**: 6/10 - Merge-able con fixes críticos

---

## 🚨 BLOCKER - MUST FIX ANTES DE MERGE

### 1. Badge Component API Mismatch ⛔
**Archivo**: `src/features-v2/locations/LocationCardV2.tsx:161,172`  
**Severidad**: CRÍTICO - Causará crashes en runtime

**Problema**:
```tsx
// INCORRECTO - Badge no acepta prop "color"
<Badge color={getStatusColor(location.status)}>
<Badge color={riskConfig.color}>
```

**Solución**:
```tsx
// CORRECTO - Badge acepta prop "variant"
<Badge variant={getStatusVariant(location.status)}>
<Badge variant={riskConfig.variant}>
```

**Impacto**: Badges se verán sin estilo, confundirán usuarios.

---

### 2. Mock Profile Hardcoded ⛔
**Archivo**: `src/hooks/useAuth.ts:44-54`  
**Severidad**: CRÍTICO - Seguridad + datos incorrectos

**Problema**:
```ts
const mockProfile = {
  company_id: '50707999-f033-41c4-91c9-989966311972', // Hardcoded!
  role: 'admin' as const, // Todos son admin!
  // ...
};
```

**Solución**:
- Fetch real profile desde tabla `profiles`
- Manejar usuarios nuevos sin profile → redirect a /setup
- Eliminar hardcoded company_id

**Impacto**: Usuarios ven datos de otra empresa, riesgo seguridad.

---

### 3. Google OAuth Sin Validación ⛔
**Archivo**: `src/features/auth/LoginView.tsx:49-60`  
**Severidad**: CRÍTICO - Feature fallará

**Problema**:
- No valida que `VITE_SUPABASE_URL` esté configurado
- Botón visible aunque OAuth no esté setup
- Falla silenciosamente

**Solución**:
```tsx
{import.meta.env.VITE_SUPABASE_URL && (
  <Button onClick={handleGoogleLogin}>
    Continuar con Google
  </Button>
)}
```

**Impacto**: Usuarios clickean botón → nada pasa o error.

---

## 🟡 SHOULD FIX - Mejoras Importantes

### 4. Network v2 Importa de Features Viejas
**Archivo**: `src/features-v2/network/NetworkMapViewV2.tsx:1-4`  
**Problema**: Coupling entre v1 y v2

**Recomendación**: Copiar componentes compartidos a features-v2 o components/

---

### 5. Circular Dependency useLocations ↔ usePermits
**Archivo**: `src/hooks/useLocations.ts:12,44`  
**Problema**: Re-renders excesivos

**Recomendación**: Memoizar con `useMemo` o calcular risk en backend

---

### 6. Design Tokens Duplicados
**Archivos**: `src/index.css` + `src/styles/design-tokens.css`  
**Problema**: Colores definidos en dos lugares

**Recomendación**: Consolidar en UN solo archivo

---

### 7. Features Incompletas (v1/v2 Mezcladas)
**Problema**: Dashboard y Sedes tienen v2, pero Permisos/Renovaciones/Tareas solo v1

**Recomendación**: Feature flag o banner "v2 próximamente"

---

## ✅ LO BUENO - Praise

- Build pasa limpio (TypeScript 6.0 + Vite 8.0)
- Tests pasan (8/8 vitest)
- Componentes shadcn bien integrados
- Arquitectura de componentes sólida
- Feature flags para rollout gradual
- Documentación extensa (15+ docs)

---

## 🎯 Estrategia de Merge Recomendada

### Opción A: Fix + Merge (RECOMENDADO)

**Tiempo estimado**: 1-2 horas

1. ✅ Arreglar Badge color→variant (15 min)
2. ✅ Arreglar mock profile en useAuth (30 min)
3. ✅ Validar Google OAuth env vars (15 min)
4. ✅ Merge con UI_VERSION=v1 en producción
5. ✅ Habilitar v2 gradualmente

**Ventaja**: Merge rápido, bugs críticos resueltos.

---

### Opción B: Merge As-Is (RIESGOSO)

1. Merge inmediato
2. Deploy con v1 activo
3. Hotfix bugs en producción

**Desventaja**: Riesgo si alguien activa v2 antes del hotfix.

---

### Opción C: Polish Completo (MÁS SEGURO)

1. Fix críticos + medianos
2. Completar feature parity v2
3. E2E testing
4. Beta con 5-10 usuarios
5. Merge

**Desventaja**: 2-3 días más de trabajo.

---

## 📋 Action Items

### CRÍTICO (Hacer AHORA):
- [ ] Fix Badge prop en LocationCardV2.tsx
- [ ] Fix mock profile en useAuth.ts
- [ ] Validar Google OAuth setup

### IMPORTANTE (Post-merge):
- [ ] Consolidar design tokens
- [ ] Memoizar risk calculation
- [ ] Mover componentes compartidos a v2

### NICE-TO-HAVE:
- [ ] Completar v2 parity (Legal, Renewals, Tasks)
- [ ] E2E tests para flows críticos
- [ ] Font preloading

---

**Veredicto Final**: 6/10 - Sólida base, 3 bugs críticos a corregir.

**Recomendación**: Arreglar los 3 blockers (1-2h), luego merge con feature flag OFF.

**Generado por**: Claude Code Reviewer Agent  
**Revisado**: 61,589 tokens, 44 tool uses, 336s
