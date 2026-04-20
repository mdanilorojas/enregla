# 🧹 Plan de Limpieza VERIFICADO

**Fecha:** 2026-04-15  
**Status:** ✅ Verificado - Seguro para ejecutar

---

## ✅ VERIFICACIÓN COMPLETADA

He verificado cada archivo/carpeta con:
- ✅ Búsqueda de imports en todo el codebase
- ✅ Revisión de contenido para lógica única
- ✅ Comparación con migraciones de Supabase
- ✅ Verificación de uso en features activas

---

## 🗑️ BORRAR (100% seguro)

### Archivos de testing/debug (10 archivos)
**Verificación:** No están importados en ningún archivo de código

```bash
# Archivos .mjs de testing
rm check-profile-schema.mjs
rm check-rls-policies.mjs  
rm check-supabase.mjs
rm setup-rls-policies.mjs
rm test-profile-query-simple.mjs
rm test-rls-with-auth.mjs

# Archivos SQL temporales (ya están en migraciones)
rm check-profiles.sql
rm fix-documents-rls.sql      # Duplica migration 006
rm fix-rls-policies.sql

# Archivo HTML de testing
rm test-auth.html
```

### Componente no usado (1 carpeta)
**Verificación:** Grep confirmó cero imports

```bash
rm -rf src/components/Storage/
```

### Carpeta con path roto (1 carpeta)
```bash
rm -rf "D:enreglasrcstyles"
```

**Total a borrar:** 12 items

---

## 📦 ARCHIVAR (mover a docs/legacy/)

### Documentación legacy del root (7 archivos)
**Razón:** Son reports/audits antiguos, útiles como referencia histórica

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

---

## ⚠️ NO BORRAR - EN USO ACTIVO

Estos inicialmente parecían duplicados pero están en uso:

- ❌ **NO** borrar `src/components/layout-v2/` → usado en App.tsx
- ❌ **NO** borrar `src/components/ui-v2/` → usado en features-v2/
- ❌ **NO** borrar `features-v2/` → arquitectura activa en desarrollo

---

## 🚀 SCRIPT DE EJECUCIÓN SEGURA

```bash
#!/bin/bash

echo "🧹 Iniciando limpieza del codebase..."

# 1. Crear backup
echo "📸 Creando checkpoint..."
git add -A
git commit -m "checkpoint: antes de limpieza del codebase"

# 2. Crear carpeta legacy
echo "📦 Creando carpeta docs/legacy..."
mkdir -p docs/legacy

# 3. Archivar documentación
echo "📚 Archivando documentación legacy..."
mv DASHBOARD_CLEAN_CARDS_FIX.md docs/legacy/ 2>/dev/null
mv DASHBOARD_SPACING_IMPROVEMENTS.md docs/legacy/ 2>/dev/null
mv deep-research-report.md docs/legacy/ 2>/dev/null
mv DESIGN_SYSTEM.md docs/legacy/ 2>/dev/null
mv DESIGN_SYSTEM_IMPLEMENTATION.md docs/legacy/ 2>/dev/null
mv PRODUCT_PROJECT_AUDIT.md docs/legacy/ 2>/dev/null
mv SUPABASE_SETUP.md docs/legacy/ 2>/dev/null

# 4. Borrar archivos de testing
echo "🗑️  Borrando archivos de testing..."
rm -f check-profile-schema.mjs
rm -f check-rls-policies.mjs
rm -f check-supabase.mjs
rm -f setup-rls-policies.mjs
rm -f test-profile-query-simple.mjs
rm -f test-rls-with-auth.mjs
rm -f check-profiles.sql
rm -f fix-documents-rls.sql
rm -f fix-rls-policies.sql
rm -f test-auth.html

# 5. Borrar componentes no usados
echo "🗑️  Borrando componentes sin uso..."
rm -rf src/components/Storage/

# 6. Borrar carpeta rota (si existe)
echo "🗑️  Limpiando carpetas rotas..."
rm -rf "D:enreglasrcstyles" 2>/dev/null

# 7. Verificar que compile
echo "🔨 Verificando build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build exitoso - Todo OK"
  
  # 8. Commit final
  git add -A
  git commit -m "chore: limpiar archivos legacy y de testing

- Eliminar 10 archivos de testing y debug (.mjs, .sql, .html)
- Eliminar componente Storage sin uso
- Archivar 7 documentos legacy a docs/legacy/
- Limpiar carpetas rotas del root

Verificado: cero imports, build exitoso"
  
  echo "🎉 Limpieza completada exitosamente"
else
  echo "❌ Build falló - revirtiendo cambios"
  git reset --hard HEAD
fi
```

---

## 📊 RESUMEN FINAL

| Acción | Items | Estado |
|--------|-------|--------|
| 🗑️ Borrar | 12 items | ✅ Verificado seguro |
| 📦 Archivar | 7 archivos | ✅ Preserva historia |
| ⚠️ Mantener | layout-v2, ui-v2 | ✅ En uso activo |

**Resultado:** Codebase limpio sin perder información valiosa
