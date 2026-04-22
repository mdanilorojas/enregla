# Custom Domain Setup - Supabase Auth

## Objetivo

Cambiar el dominio de OAuth de:
```
https://zqaqhapxqwkvninnyqiu.supabase.co
```

A un dominio personalizado:
```
https://auth.enregla.ec
```

---

## Requisitos

- ✅ Plan **Pro** de Supabase ($25/mes) - Custom domains solo disponibles en Pro
- ✅ Acceso a configuración DNS de `enregla.ec`
- ✅ Certificado SSL (Supabase lo genera automáticamente con Let's Encrypt)

---

## Pasos de Configuración

### Paso 1: Upgrade a Supabase Pro (si aún no lo tienes)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **EnRegla**
3. Ve a **Settings** → **Billing**
4. Haz clic en **Upgrade to Pro** ($25/mes)

### Paso 2: Configurar Custom Domain en Supabase

1. En el dashboard de Supabase, ve a **Settings** → **Custom Domains**
2. Haz clic en **Add custom domain**
3. Ingresa el dominio: `auth.enregla.ec`
4. Supabase te mostrará los registros DNS que necesitas crear:

   ```
   Type: CNAME
   Name: auth
   Value: zqaqhapxqwkvninnyqiu.supabase.co
   TTL: 3600 (o automático)
   ```

### Paso 3: Configurar DNS en tu proveedor

#### Si usas Cloudflare:

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona el dominio `enregla.ec`
3. Ve a **DNS** → **Records**
4. Haz clic en **Add record**
5. Configura:
   - **Type**: CNAME
   - **Name**: auth
   - **Target**: zqaqhapxqwkvninnyqiu.supabase.co
   - **Proxy status**: DNS only (⚠️ IMPORTANTE: No usar Cloudflare Proxy para este CNAME)
   - **TTL**: Auto
6. Haz clic en **Save**

#### Si usas otro proveedor DNS:

1. Accede al panel de tu proveedor DNS (GoDaddy, Namecheap, Route53, etc.)
2. Busca la sección de **DNS Management** o **DNS Records**
3. Agrega un registro CNAME:
   - **Host/Name**: `auth`
   - **Points to/Value**: `zqaqhapxqwkvninnyqiu.supabase.co`
   - **TTL**: 3600 (1 hora) o el valor mínimo permitido

### Paso 4: Verificar DNS (esperar propagación)

Esto puede tomar entre **5 minutos a 48 horas** dependiendo de tu proveedor DNS.

Para verificar si el DNS se propagó:

```bash
# En terminal (Windows PowerShell, Mac/Linux terminal)
nslookup auth.enregla.ec

# O usa herramientas online:
# https://dnschecker.org
```

Deberías ver que `auth.enregla.ec` apunta a `zqaqhapxqwkvninnyqiu.supabase.co`.

### Paso 5: Activar el Custom Domain en Supabase

1. Regresa a Supabase Dashboard → **Settings** → **Custom Domains**
2. Verás tu dominio `auth.enregla.ec` con estado **Pending verification**
3. Haz clic en **Verify DNS**
4. Si el DNS se propagó correctamente, el estado cambiará a **Generating SSL certificate**
5. Espera 2-5 minutos mientras Supabase genera el certificado SSL con Let's Encrypt
6. Estado final: **Active** ✅

### Paso 6: Actualizar Google OAuth Redirect URIs

Una vez que `auth.enregla.ec` esté activo:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Edita tu OAuth 2.0 Client ID
5. En **Authorized redirect URIs**, agrega:
   ```
   https://auth.enregla.ec/auth/v1/callback
   ```
6. **Opcional**: Puedes remover la URI vieja `https://zqaqhapxqwkvninnyqiu.supabase.co/auth/v1/callback` una vez que verifiques que todo funciona

### Paso 7: Actualizar Supabase Redirect URLs

1. En Supabase Dashboard → **Authentication** → **URL Configuration**
2. Las redirect URLs NO cambian (siguen siendo `https://app.enregla.ec/auth/callback`)
3. El custom domain solo afecta la comunicación entre tu app y Supabase, no las redirects finales

### Paso 8: Actualizar Variables de Entorno

**NO necesitas cambiar nada en tu código** si usas las variables de entorno correctamente.

Tu `.env` debería tener:
```env
VITE_SUPABASE_URL=https://zqaqhapxqwkvninnyqiu.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Supabase maneja el custom domain internamente. Tu app seguirá usando `VITE_SUPABASE_URL` normal.

---

## Verificación Final

### Test 1: Probar OAuth en producción

1. Ve a `https://app.enregla.ec/login`
2. Haz clic en "Continuar con Google"
3. Verás en la barra de direcciones: `https://auth.enregla.ec/...` (en lugar de `zqaqhapxqwkvninnyqiu.supabase.co`)
4. Completa el flujo
5. Deberías regresar a tu app exitosamente

### Test 2: Verificar certificado SSL

En el navegador, haz clic en el candado 🔒 cuando estés en `auth.enregla.ec` y verifica:
- ✅ Certificado emitido por: Let's Encrypt
- ✅ Válido para: `auth.enregla.ec`
- ✅ Sin advertencias de seguridad

---

## Troubleshooting

### Error: "DNS verification failed"

**Causa**: El DNS no se ha propagado o el CNAME está mal configurado.

**Solución**:
1. Verifica con `nslookup auth.enregla.ec`
2. Si usas Cloudflare, asegúrate de que **Proxy status = DNS only** (nube gris, no naranja)
3. Espera más tiempo (hasta 48h en algunos casos)

### Error: "SSL certificate generation failed"

**Causa**: Let's Encrypt no pudo validar el dominio.

**Solución**:
1. Verifica que `auth.enregla.ec` sea accesible públicamente
2. No uses firewalls que bloqueen el puerto 80 (necesario para validación ACME)
3. Contacta a soporte de Supabase si persiste

### Error: "redirect_uri_mismatch" después de configurar custom domain

**Causa**: Google Cloud Console no tiene la nueva URI registrada.

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Agrega `https://auth.enregla.ec/auth/v1/callback` a Authorized redirect URIs

---

## Costos

- **Supabase Pro**: $25/mes (incluye custom domains ilimitados)
- **Dominio enregla.ec**: Ya lo tienes
- **Certificado SSL**: Gratis (Let's Encrypt vía Supabase)

**Total adicional**: $25/mes (solo el upgrade a Pro)

---

## Alternativa: Sin Custom Domain

Si prefieres no pagar $25/mes adicionales, **el dominio autogenerado funciona perfectamente**:

- ✅ Seguro (HTTPS con certificado válido)
- ✅ Oficial de Supabase
- ✅ Sin costo adicional
- ❌ Se ve "raro" para usuarios (pero la mayoría no lo nota)

La mayoría de apps SaaS usan dominios autogenerados de sus proveedores de auth (Auth0, Firebase, Supabase, etc.) sin problema.

---

## Referencias

- [Supabase Custom Domains Docs](https://supabase.com/docs/guides/platform/custom-domains)
- [Google OAuth Redirect URIs](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)
