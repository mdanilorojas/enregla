# EnRegla - React + TypeScript + Vite + Supabase

Aplicación web desarrollada con React, TypeScript, Vite y Supabase para gestión de documentos y autenticación de usuarios.

## 🚀 Stack Tecnológico

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS

## 📦 Instalación

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
\`\`\`

## ⚙️ Configuración de Supabase

Ver la guía completa en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Quick Start:

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia las credenciales a `.env.local`
3. Ejecuta los scripts SQL para crear las tablas
4. ¡Listo para usar!

## 🏗️ Arquitectura

\`\`\`
┌─────────────────┐         ┌─────────────────────┐
│   Frontend      │────────>│     Supabase        │
│   React/Vite    │   API   │  • PostgreSQL       │
│   (Vercel)      │         │  • Auth             │
│                 │         │  • Storage          │
└─────────────────┘         └─────────────────────┘
```

## 📁 Estructura del Proyecto

\`\`\`
enregla/
├── src/
│   ├── components/
│   │   ├── Auth/           # Componentes de autenticación
│   │   └── Storage/        # Componentes de subida de archivos
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts     # Cliente de Supabase
│   │   ├── auth.ts         # Utilidades de autenticación
│   │   └── storage.ts      # Utilidades de Storage
│   └── ...
├── .env.example            # Ejemplo de variables de entorno
├── .env.local              # Variables de entorno (no commitear)
└── SUPABASE_SETUP.md       # Guía de configuración
\`\`\`

## 🔐 Características

- ✅ Autenticación de usuarios (email/password)
- ✅ Gestión de sesiones
- ✅ Subida de archivos (PDFs, PNGs, etc.)
- ✅ Storage privado y público
- ✅ Base de datos PostgreSQL
- ✅ Row Level Security (RLS)

## 🚢 Deployment

### Vercel (Frontend)

\`\`\`bash
# Conecta tu repositorio a Vercel
# Configura las variables de entorno en Vercel Dashboard
# Deploy automático en cada push a main
\`\`\`

Ver más detalles en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md#5-deploy-en-vercel)

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
