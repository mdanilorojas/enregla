# 🗂️ Reorganización Detallada del Root

## Resumen Ejecutivo

**Archivos que PODEMOS mover a `config/`:** 5 archivos
- ✅ `eslint.config.js`
- ✅ `tailwind.config.js`
- ✅ `vite.config.ts`
- ✅ `tsconfig.json`
- ✅ `tsconfig.app.json`
- ✅ `tsconfig.node.json`

**Archivos que NO podemos mover:** 9 archivos + carpetas
- ❌ `.env*` - Vite los busca en root
- ❌ `.gitignore` - Git lo requiere en root
- ❌ `package*.json` - npm lo requiere en root
- ❌ `index.html` - Vite lo requiere en root
- ❌ `README.md` - Convención de GitHub
- ❌ `vercel.json` - Vercel lo requiere en root
- ❌ `.mcp.json` - Claude Code lo busca en root
- ❌ `components.json` - shadcn CLI lo busca en root
- ❌ `skills-lock.json` - Superpowers lo busca en root

---

## 📋 Plan de Ejecución

### FASE 1: Mover archivos de configuración (SEGURO)

#### 1. eslint.config.js → config/eslint.config.js

**Referencias a actualizar:**
```json
// package.json
"lint": "eslint . --config config/eslint.config.js"
```

**Comando:**
```bash
mkdir -p config
mv eslint.config.js config/eslint.config.js
```

#### 2. tailwind.config.js → config/tailwind.config.js

**Referencias a actualizar:**
```json
// components.json (línea 7)
"tailwind": {
  "config": "config/tailwind.config.js",
  ...
}
```

**Comando:**
```bash
mv tailwind.config.js config/tailwind.config.js
```

#### 3. vite.config.ts → config/vite.config.ts

**Referencias a actualizar:**
```json
// package.json
"dev": "vite --config config/vite.config.ts",
"build": "tsc -b && vite build --config config/vite.config.ts",
"preview": "vite preview --config config/vite.config.ts"
```

**Comando:**
```bash
mv vite.config.ts config/vite.config.ts
```

#### 4. tsconfig*.json → config/tsconfig*.json

**Archivos a mover:**
- `tsconfig.json` → `config/tsconfig.json`
- `tsconfig.app.json` → `config/tsconfig.app.json`
- `tsconfig.node.json` → `config/tsconfig.node.json`

**Referencias a actualizar:**

```json
// package.json
"build": "tsc -b config/tsconfig.json && vite build --config config/vite.config.ts",
```

```json
// config/tsconfig.json
{
  "extends": "./tsconfig.app.json",  // Actualizar path relativo
  "references": [
    { "path": "./tsconfig.node.json" }  // Actualizar path relativo
  ]
}
```

```json
// config/vite.config.ts (si existe referencia)
// Ajustar imports si es necesario
```

**Comandos:**
```bash
mv tsconfig.json config/tsconfig.json
mv tsconfig.app.json config/tsconfig.app.json
mv tsconfig.node.json config/tsconfig.node.json
```

---

## 🎯 Estructura Final

```
enregla/
├── config/                          # ⭐ NUEVA
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
│
├── .env*                            # Variables de entorno
├── .gitignore
├── .mcp.json                        # Claude Code config
├── components.json                  # shadcn config
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── skills-lock.json                 # Superpowers config
├── vercel.json
│
├── docs/
├── public/
├── scripts/
├── src/
└── supabase/
```

---

## 🚀 Script de Ejecución Completo

```bash
#!/bin/bash

echo "🗂️  Reorganizando archivos de configuración..."

# 1. Crear checkpoint
git add -A
git commit -m "checkpoint: antes de reorganizar configs"

# 2. Crear carpeta config
mkdir -p config

# 3. Mover archivos
mv eslint.config.js config/
mv tailwind.config.js config/
mv vite.config.ts config/
mv tsconfig.json config/
mv tsconfig.app.json config/
mv tsconfig.node.json config/

# 4. Actualizar package.json
cat > /tmp/package-patch.json << 'EOF'
{
  "scripts": {
    "dev": "vite --config config/vite.config.ts",
    "build": "tsc -b config/tsconfig.json && vite build --config config/vite.config.ts",
    "lint": "eslint . --config config/eslint.config.js",
    "preview": "vite preview --config config/vite.config.ts"
  }
}
EOF

# Aplicar parche a package.json (manual o con jq)
echo "⚠️  MANUAL: Actualizar scripts en package.json"

# 5. Actualizar components.json
# Cambiar "config": "tailwind.config.js" → "config": "config/tailwind.config.js"
echo "⚠️  MANUAL: Actualizar tailwind.config path en components.json"

# 6. Actualizar config/tsconfig.json
# Cambiar extends y references para usar paths relativos
echo "⚠️  MANUAL: Actualizar extends/references en config/tsconfig.json"

# 7. Verificar build
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build exitoso"
  git add -A
  git commit -m "chore: mover configs a carpeta config/

- Mover eslint.config.js, tailwind.config.js, vite.config.ts
- Mover tsconfig*.json a config/
- Actualizar referencias en package.json y components.json
- Build verificado"
else
  echo "❌ Build falló - revirtiendo"
  git reset --hard HEAD
fi
```

---

## ⚠️ ADVERTENCIAS

### TypeScript Config
- Los paths `extends` y `references` deben ser relativos desde `config/`
- El IDE (VS Code) puede necesitar reiniciarse para reconocer los nuevos paths

### Vite Config
- Algunos plugins pueden tener paths hardcodeados
- Verificar que los aliases `@/` sigan funcionando

### ESLint Config
- Verificar que los patterns de archivos sigan siendo correctos
- Puede necesitar ajustar `ignorePatterns`

---

## 🧪 Checklist de Verificación

Después de mover:

- [ ] `npm run dev` inicia correctamente
- [ ] `npm run build` compila sin errores
- [ ] `npm run lint` ejecuta ESLint correctamente
- [ ] TypeScript intellisense funciona en VS Code
- [ ] Tailwind CSS se aplica correctamente
- [ ] Hot reload (HMR) funciona
- [ ] `npx shadcn@latest add button` funciona (test shadcn CLI)

---

## 📊 Beneficios

**Antes:**
- 16 archivos en root (configs + docs + env)

**Después:**
- 10 archivos en root (solo esenciales que NO se pueden mover)
- 6 configs organizados en `config/`

**Reducción:** 37.5% menos archivos en root
