# Pre-launch checklist — acciones manuales en Supabase / Vercel

Cosas que las migraciones de la repo **no** tocan y hay que ejecutar a mano antes de habilitar el cobro.

## 1. Email verification (Supabase Auth)

`supabase/config.toml` ya tiene `enable_confirmations = true`, pero ese archivo
solo aplica a `supabase start` local. En **Cloud** hay que ir a:

> Supabase Dashboard → Authentication → Providers → Email →
> "Confirm email" = **enabled**

Después confirmar:
- Template "Confirm signup" personalizado con marca EnRegla.
- Site URL = `https://app.enregla.ec`.
- Redirect URLs whitelist incluye `https://app.enregla.ec/auth/callback`.

## 2. Migraciones nuevas a aplicar

```
20260521000000_change_business_type_rpc.sql
20260521000001_demo_helper_and_delete_policies.sql
20260521000002_audit_logs.sql
20260521000003_data_export_rpc.sql
20260521000004_delete_company_rpc.sql
```

Aplicar con:

```sh
supabase db push
```

Verificar después en SQL editor:

```sql
-- 1. RPCs existen
SELECT proname FROM pg_proc WHERE proname IN (
  'change_company_business_type',
  'export_company_data',
  'delete_company',
  'log_audit_event'
);

-- 2. Helper demo existe
SELECT public.is_demo_company('50707999-f033-41c4-91c9-989966311972'::uuid);  -- true
SELECT public.is_demo_company('00000000-0000-0000-0000-000000000000'::uuid);  -- false

-- 3. Delete policies presentes
SELECT policyname, cmd FROM pg_policies
 WHERE tablename IN ('locations','permits','documents')
   AND cmd = 'DELETE'
 ORDER BY tablename;

-- 4. audit_logs table + triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'audit_%';
```

## 3. WhatsApp comercial

En Vercel → project enregla → Environment Variables agregar:

- `VITE_WHATSAPP_NUMBER` = `593XXXXXXXXX` (E.164 sin +)
- `VITE_WHATSAPP_DISPLAY` = `+593 X XXX XXXX`

Si no se setean, el botón "Contratar por WhatsApp" se renderiza deshabilitado.

## 4. PITR / backups

Habilitar PITR en Supabase Pro plan: Dashboard → Database → Backups →
Point-in-Time Recovery. Documentar retention y restore steps en otro runbook.

## 5. LOPDP — verificación manual

1. /settings → tab Privacidad.
2. "Descargar mis datos (JSON)" → archivo se descarga, contiene secciones
   `company`, `profiles`, `locations`, `permits`, `documents`, `audit_logs`.
3. Login con usuario que NO sea owner → botón "Eliminar empresa" deshabilitado y
   banner "Solo el dueño puede eliminarla".
4. Como owner: abrir dialog → escribir nombre incorrecto → bloqueado.
5. Escribir nombre correcto → confirmar → empresa eliminada, usuario redirigido
   a `/setup`, datos ya no aparecen al volver a entrar.

## 6. Cambio destructivo de business_type — verificación manual

1. Crear cuenta de prueba con tipo "restaurante".
2. Crear sede + que se generen permits default.
3. Ir a /settings → Empresa → Cambiar tipo.
4. Probar: nombre incorrecto → bloqueado.
5. Probar: nombre correcto → confirmar → permits viejos eliminados, nuevos creados según farmacia.
6. Verificar toast con conteo y que dashboard refleje los nuevos permits.
