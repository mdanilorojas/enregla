# Google OAuth Setup - EnRegla

## Problema Actual

Al hacer login con Google desde `https://app.enregla.ec/login`, aparece el error:

```
Unsafe attempt to load URL http://localhost:3000/ from frame with URL chrome-error://chromewebdata/
```

**Causa**: Las Redirect URLs en Supabase están configuradas solo para `localhost`, no para producción.

---

## Solución: Configurar Redirect URLs en Supabase

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **EnRegla**
3. En el menú lateral, ve a **Authentication** → **URL Configuration**

### Paso 2: Agregar Redirect URLs de Producción

En la sección **Redirect URLs**, agrega las siguientes URLs (una por línea):

```
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
https://app.enregla.ec/auth/callback
```

**Importante**: 
- Mantén las URLs de localhost para desarrollo
- Agrega la URL de producción (`https://app.enregla.ec/auth/callback`)
- Cada URL debe estar en una línea separada

### Paso 3: Verificar Site URL

En la misma página, verifica que **Site URL** esté configurada como:

```
https://app.enregla.ec
```

Esta es la URL a la que Supabase redirige después de confirmar email, reset password, etc.

### Paso 4: Guardar Cambios

1. Haz clic en **Save**
2. Espera 1-2 minutos para que los cambios se propaguen

---

## Verificación

### Test en Producción

1. Ve a `https://app.enregla.ec/login`
2. Haz clic en "Continuar con Google"
3. Completa el flujo de Google OAuth
4. Deberías ser redirigido correctamente a `https://app.enregla.ec/auth/callback`
5. La app debería procesarte y llevarte a `/setup` (nuevo usuario) o `/` (usuario existente)

### Test en Desarrollo

1. Ve a `http://localhost:5173/login`
2. Haz clic en "Continuar con Google"
3. Deberías ser redirigido a `http://localhost:5173/auth/callback`

---

## Configuración Adicional (Opcional)

### Configurar Google Cloud Console

Si necesitas actualizar las Authorized redirect URIs en Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Encuentra tu OAuth 2.0 Client ID
5. En **Authorized redirect URIs**, agrega:
   ```
   https://<tu-proyecto-id>.supabase.co/auth/v1/callback
   ```

**Nota**: Supabase maneja esto automáticamente si usaste su integración de Google OAuth.

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: La redirect URI no está autorizada en Google Cloud Console o Supabase.

**Solución**:
1. Verifica que `https://app.enregla.ec/auth/callback` esté en la lista de Redirect URLs en Supabase
2. Si el error persiste, verifica Google Cloud Console (ver sección anterior)

### Error: "Invalid redirect URI"

**Causa**: Typo en la URL o falta el protocolo `https://`

**Solución**: Verifica que la URL sea exactamente `https://app.enregla.ec/auth/callback`

### El callback funciona pero hay un error después

**Causa**: Problema en el código de `AuthCallback.tsx`, no en la configuración de OAuth.

**Solución**: Revisa los logs del navegador (Console) para ver el error específico.

---

## Variables de Entorno

Asegúrate de que tu `.env` (desarrollo) y variables de entorno de Vercel (producción) tengan:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Verificar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas
4. Si hiciste cambios, redeploya la app

---

## Flujo OAuth Completo

```
Usuario hace clic en "Continuar con Google"
  ↓
signInWithGoogle() en lib/auth.ts
  ↓
redirectTo: ${window.location.origin}/auth/callback
  ↓
Usuario es redirigido a Google
  ↓
Usuario autentica con Google
  ↓
Google redirige a: https://app.enregla.ec/auth/callback#access_token=...
  ↓
AuthCallback.tsx procesa el hash
  ↓
supabase.auth.getSession() extrae la sesión
  ↓
Se verifica si el usuario tiene profile en la DB
  ↓
Si tiene profile → navigate('/')
Si NO tiene profile → navigate('/setup')
```

---

## Checklist Post-Configuración

- [ ] Redirect URLs agregadas en Supabase
- [ ] Site URL configurada como `https://app.enregla.ec`
- [ ] Variables de entorno verificadas en Vercel
- [ ] Test exitoso en producción
- [ ] Test exitoso en desarrollo

---

## Referencias

- [Supabase Auth - OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
