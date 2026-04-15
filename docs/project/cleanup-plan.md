# 🧹 Plan de Limpieza del Codebase

**Fecha:** 2026-04-15
**Objetivo:** Limpiar archivos legacy, duplicados y de testing del proyecto

---

## ✅ MANTENER (están en uso activo)

### Carpetas activas en `src/`:
- ✅ `features/` - Features principales (dashboard, locations, permits, etc.)
- ✅ `features-v2/` - Nueva arquitectura en desarrollo
- ✅ `components/layout/` - Layout actual en uso
- ✅ `components/ui/` - UI components en uso
- ✅ `components/Auth/` - Usado en App.tsx
- ✅ `components/documents/` - Gestión de documentos

### Documentación a mantener:
- ✅ `README.md` - Documentación principal
- ✅ `ESTADO-2026-04-14.md` - Estado actual del proyecto
- ✅ `docs/` - Carpeta de documentación organizada

---

## 🗑️ BORRAR DEFINITIVAMENTE

### Archivos de testing y desarrollo (root):
```bash
rm check-profiles.sql
rm check-profile-schema.mjs
rm check-rls-policies.mjs
rm check-supabase.mjs
rm setup-rls-policies.mjs
rm test-auth.html
rm test-profile-query-simple.mjs
rm test-rls-with-auth.mjs
rm fix-documents-rls.sql
rm fix-rls-policies.sql
```

### Componentes duplicados no utilizados:
```bash
rm -rf src/components/layout-v2/
rm -rf src/components/ui-v2/
```

### Carpeta misteriosa (path roto):
```bash
rm -rf "D:enreglasrcstyles"
```

### Storage component no usado:
```bash
rm -rf src/components/Storage/
```

**Total a borrar:** ~13 archivos/carpetas

---

## 📦 ARCHIVAR (mover a docs/legacy/)

### Documentación legacy del root:
```bash
mkdir -p docs/legacy
mv DASHBOARD_CLEAN_CARDS_FIX.md docs/legacy/
mv DASHBOARD_SPACING_IMPROVEMENTS.md docs/legacy/
mv deep-research-report.md docs/legacy/
mv DESIGN_SYSTEM.md docs/legacy/
mv DESIGN_SYSTEM_IMPLEMENTATION.md docs/legacy/
mv PRODUCT_PROJECT_AUDIT.md docs/legacy/
mv SUPABASE_SETUP.md docs/legacy/
```

**Total a archivar:** 7 archivos de documentación

---

## 📊 RESUMEN

| Acción | Cantidad | Tipo |
|--------|----------|------|
| 🗑️ Borrar | 13 items | Archivos de testing/dev + componentes duplicados |
| 📦 Archivar | 7 archivos | Documentación legacy |
| ✅ Mantener | Todo lo demás | Código y docs activos |

---

## 🚀 EJECUCIÓN

### Paso 1: Crear backup
```bash
git add -A
git commit -m "checkpoint: antes de limpieza del codebase"
```

### Paso 2: Ejecutar limpieza
```bash
# Borrar archivos de testing
rm check-*.{sql,mjs} test-*.{html,mjs} fix-*.sql setup-*.mjs

# Borrar componentes duplicados
rm -rf src/components/layout-v2 src/components/ui-v2 src/components/Storage

# Borrar carpeta rota
rm -rf "D:enreglasrcstyles"

# Archivar docs
mkdir -p docs/legacy
mv DASHBOARD_*.md DESIGN_*.md PRODUCT_*.md SUPABASE_*.md deep-research-report.md docs/legacy/
```

### Paso 3: Verificar que todo compile
```bash
npm run build
```

### Paso 4: Commit final
```bash
git add -A
git commit -m "chore: limpiar archivos legacy y duplicados

- Eliminar archivos de testing y desarrollo (check-*, test-*, fix-*)
- Eliminar componentes duplicados (layout-v2, ui-v2)
- Archivar documentación legacy a docs/legacy/
- Limpiar carpetas rotas del root"
```

---

## ⚠️ NOTAS

- **NO** borrar nada de `features-v2/` porque está en uso activo
- **NO** tocar `components/Auth/` porque App.tsx lo necesita
- Los archivos `.env*` son configuración activa - no tocar
- La carpeta `docs/` tiene documentación organizada - mantener
