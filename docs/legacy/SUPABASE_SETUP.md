# 🚀 Guía de Configuración Supabase

Esta guía te ayudará a configurar Supabase para tu aplicación React + Vercel.

## 📋 Tabla de Contenidos
1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Configurar Variables de Entorno](#2-configurar-variables-de-entorno)
3. [Configurar Base de Datos](#3-configurar-base-de-datos)
4. [Configurar Storage](#4-configurar-storage)
5. [Deploy en Vercel](#5-deploy-en-vercel)
6. [Uso en tu Aplicación](#6-uso-en-tu-aplicación)

---

## 1. Crear Proyecto en Supabase

### Paso 1.1: Crear cuenta
1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Regístrate con GitHub (recomendado) o email

### Paso 1.2: Crear proyecto
1. Click en "New Project"
2. Completa:
   - **Name:** `enregla` (o el nombre que prefieras)
   - **Database Password:** Genera una contraseña segura (guárdala)
   - **Region:** Elige la más cercana (ej: `South America (São Paulo)`)
3. Click "Create new project" (tarda ~2 minutos)

### Paso 1.3: Obtener credenciales
1. En el dashboard de tu proyecto, ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 2. Configurar Variables de Entorno

### Desarrollo Local

Abre el archivo `.env.local` y reemplaza con tus credenciales:

\`\`\`bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### Verificar
Ejecuta el proyecto localmente:
\`\`\`bash
npm run dev
\`\`\`

Si ves un error sobre variables de entorno faltantes, verifica que copiaste correctamente las credenciales.

---

## 3. Configurar Base de Datos

### 3.1 Crear tablas básicas

En Supabase Dashboard → **SQL Editor**, ejecuta este SQL:

\`\`\`sql
-- Tabla de perfiles de usuarios (se crea automáticamente al registrarse)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios solo pueden ver/editar su propio perfil
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

### 3.2 Crear tablas personalizadas (ejemplo)

\`\`\`sql
-- Ejemplo: Tabla de documentos
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede ver sus documentos
CREATE POLICY "Users can view own documents" 
  ON documents FOR SELECT 
  USING (auth.uid() = user_id);

-- Solo el dueño puede crear documentos
CREATE POLICY "Users can create own documents" 
  ON documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede actualizar sus documentos
CREATE POLICY "Users can update own documents" 
  ON documents FOR UPDATE 
  USING (auth.uid() = user_id);

-- Solo el dueño puede eliminar sus documentos
CREATE POLICY "Users can delete own documents" 
  ON documents FOR DELETE 
  USING (auth.uid() = user_id);
\`\`\`

---

## 4. Configurar Storage

### 4.1 Crear buckets

1. Ve a **Storage** en el dashboard de Supabase
2. Click "New bucket"
3. Crea estos buckets:

#### Bucket: `avatars` (público)
- **Name:** `avatars`
- **Public:** ✅ Activado
- Click "Create bucket"

#### Bucket: `documents` (privado)
- **Name:** `documents`
- **Public:** ❌ Desactivado
- Click "Create bucket"

### 4.2 Configurar políticas de Storage

Para el bucket `documents`, crea estas políticas:

\`\`\`sql
-- Permitir subir archivos (autenticados)
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir descargar archivos propios
CREATE POLICY "Users can download own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminar archivos propios
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
\`\`\`

---

## 5. Deploy en Vercel

### 5.1 Configurar variables de entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto `enregla`
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

5. Click "Save"

### 5.2 Re-deploy

Vercel hará un nuevo deploy automáticamente. Si no:
\`\`\`bash
git add .
git commit -m "Add Supabase configuration"
git push origin main
\`\`\`

---

## 6. Uso en tu Aplicación

### 6.1 Autenticación

\`\`\`tsx
import { LoginForm } from './components/Auth/LoginForm';

function App() {
  return <LoginForm />;
}
\`\`\`

### 6.2 Hook useAuth

\`\`\`tsx
import { useAuth } from './hooks/useAuth';

function Dashboard() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
\`\`\`

### 6.3 Subir archivos

\`\`\`tsx
import { FileUpload } from './components/Storage/FileUpload';

function DocumentUpload() {
  const handleSuccess = (urls: string[]) => {
    console.log('Uploaded files:', urls);
  };

  return (
    <FileUpload
      bucket="documents"
      multiple
      accept=".pdf,.png,.jpg"
      onSuccess={handleSuccess}
    />
  );
}
\`\`\`

### 6.4 Trabajar con la base de datos

\`\`\`tsx
import { supabase } from './lib/supabase';

// Crear un documento
async function createDocument(title: string, fileUrl: string) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      file_url: fileUrl,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener documentos del usuario
async function getUserDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Actualizar un documento
async function updateDocument(id: string, updates: Partial<Document>) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un documento
async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
\`\`\`

---

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

## 💰 Límites del Plan Gratuito

- **Base de datos:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/mes
- **Usuarios activos mensuales:** 50,000
- **Autenticaciones de API:** Ilimitadas

Para 100 clientes, esto es MÁS que suficiente. 🎉

## 🆘 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Invalid API key"
- Verifica que copiaste la **anon public key** completa
- No uses la `service_role` key en el frontend (es secreta)

### Error 401 en Storage
- Verifica que las políticas de Storage están configuradas
- Asegúrate de que el usuario está autenticado

---

¿Necesitas ayuda? Abre un issue en el repositorio.
