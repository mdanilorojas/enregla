# 🗂️ Plan de Reorganización de Archivos de Configuración

## Análisis del Root Actual

### ✅ DEBEN QUEDARSE en root (estándar de proyecto):
- `package.json` - npm config
- `package-lock.json` - npm lock
- `tsconfig.json` - TypeScript base config
- `tsconfig.app.json` - TypeScript app config
- `tsconfig.node.json` - TypeScript node config
- `vite.config.ts` - Vite bundler config
- `tailwind.config.js` - Tailwind CSS config
- `eslint.config.js` - ESLint config
- `vercel.json` - Deploy config (Vercel espera esto en root)
- `README.md` - Documentación principal
- `.gitignore` - Git config

### 📁 CREAR: config/ (centralizar configs de herramientas)

#### Mover a `config/`:
- `.mcp.json` → `config/mcp.json`
- `components.json` → `config/shadcn.json` (más descriptivo)
- `skills-lock.json` → `config/skills-lock.json`

### 📁 CREAR: docs/project/ (docs del proyecto)

#### Mover a `docs/project/`:
- `ESTADO-2026-04-14.md` → `docs/project/status-2026-04-14.md`
- `CLEANUP_PLAN.md` → `docs/project/cleanup-plan.md`
- `CLEANUP_PLAN_VERIFIED.md` → `docs/project/cleanup-plan-verified.md`

---

## 🎯 Estructura Final Deseada

```
enregla/
├── config/                    # ⭐ NUEVA - Configuraciones de herramientas
│   ├── mcp.json              # MCP servers config
│   ├── shadcn.json           # shadcn/ui config (antes components.json)
│   └── skills-lock.json      # Claude skills lock
│
├── docs/
│   ├── legacy/               # Docs históricos (ya existe)
│   ├── project/              # ⭐ NUEVA - Docs del proyecto
│   │   ├── status-2026-04-14.md
│   │   ├── cleanup-plan.md
│   │   └── cleanup-plan-verified.md
│   └── superpowers/          # Plans y specs (ya existe)
│
├── src/                      # Código fuente
├── public/                   # Assets públicos
├── supabase/                 # Migraciones y config DB
├── scripts/                  # Scripts de desarrollo
│
├── package.json              # ✅ Se queda
├── package-lock.json         # ✅ Se queda
├── vite.config.ts            # ✅ Se queda
├── tailwind.config.js        # ✅ Se queda
├── eslint.config.js          # ✅ Se queda
├── tsconfig*.json            # ✅ Se quedan (3 archivos)
├── vercel.json               # ✅ Se queda
├── README.md                 # ✅ Se queda
└── .gitignore                # ✅ Se queda
```

---

## 🚀 Script de Ejecución

```bash
#!/bin/bash

echo "🗂️  Reorganizando archivos de configuración..."

# 1. Crear carpetas
echo "📁 Creando estructura de carpetas..."
mkdir -p config
mkdir -p docs/project

# 2. Mover configs de herramientas
echo "⚙️  Moviendo configuraciones a config/..."
mv .mcp.json config/mcp.json
mv components.json config/shadcn.json
mv skills-lock.json config/skills-lock.json

# 3. Mover docs del proyecto
echo "📚 Moviendo documentos a docs/project/..."
mv ESTADO-2026-04-14.md docs/project/status-2026-04-14.md
mv CLEANUP_PLAN.md docs/project/cleanup-plan.md
mv CLEANUP_PLAN_VERIFIED.md docs/project/cleanup-plan-verified.md

# 4. Actualizar referencias en código si es necesario
echo "🔧 Verificando referencias..."
# Claude Code busca .mcp.json en root, puede que necesitemos crear symlink
# O mover de vuelta .mcp.json si Claude lo requiere

echo "✅ Reorganización completada"
echo ""
echo "📊 Nuevo estado del root:"
ls -1 | grep -E "\.(json|js|ts|md)$"
```

---

## ⚠️ ADVERTENCIAS

### .mcp.json
- **INVESTIGAR**: Claude Code puede requerir `.mcp.json` en root
- **Solución**: Si falla, crear symlink o dejarlo en root

### components.json (shadcn)
- **INVESTIGAR**: El CLI de shadcn puede buscar `components.json` en root
- **Solución**: Si falla, crear symlink o dejarlo en root

### skills-lock.json
- **INVESTIGAR**: Superpowers puede requerir este archivo en root
- **Solución**: Si falla, crear symlink o dejarlo en root

---

## 🧪 Plan de Prueba

Después de reorganizar:

1. ✅ Verificar que compile: `npm run build`
2. ✅ Verificar Claude Code MCP: probar conexión Supabase
3. ✅ Verificar shadcn: `npx shadcn@latest add button` (test)
4. ✅ Verificar skills: recargar Claude y ver si skills funcionan

Si algo falla → revertir ese archivo específico al root

---

## 📋 Decisión Recomendada

**OPCIÓN A - Conservadora (recomendada):**
- Mover solo los docs del proyecto a `docs/project/`
- Dejar `.mcp.json`, `components.json`, `skills-lock.json` en root
- **Razón**: Estas herramientas pueden tener paths hardcodeados

**OPCIÓN B - Agresiva:**
- Mover todo y crear symlinks si es necesario
- Más limpio pero requiere más pruebas

¿Cuál prefieres?
