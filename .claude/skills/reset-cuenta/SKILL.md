---
name: reset-cuenta
description: Resetea una cuenta de prueba de EnRegla en Supabase para volver a correr el onboarding desde cero, SIN borrar la cuenta de Google. Borra la empresa del usuario (cascada a sedes/permisos/invitaciones/links) y limpia su profile. Trigger phrases - el usuario dice "resetea mi cuenta", "borra mi cuenta de prueba", "RESET cuenta", "ELIMINA cuenta", "reset onboarding", "quiero probar el onboarding de nuevo", o pasa un email de prueba a resetear.
---

# Reset cuenta de prueba (EnRegla)

Resetea una cuenta para re-probar el onboarding **sin tocar la cuenta de Google**.
El usuario sigue logueado; solo recarga la app y el onboarding corre de nuevo.

## Cuándo

El usuario quiere probar el flujo de onboarding (welcome → setup → tour) de cero
y se topa con que ya tiene empresa creada. NO hay que borrar la cuenta de Google
ni re-loguear: basta limpiar los datos de la app en Supabase.

## Email por defecto

Si el usuario no especifica, usar `mariodanilorojas@gmail.com` (su cuenta de pruebas).

## Qué hace (y por qué es seguro)

Borra la **empresa** del usuario. Por las FKs del schema, eso CASCADEA a:
`locations`, `permits`, `company_invitations`, `public_links`. Y pone en NULL
`profiles.company_id` (FK SET NULL). Además limpia `profiles.full_name = ''`
(la columna es NOT NULL, por eso `''` y no `NULL`) para que el onboarding
arranque en el paso welcome. **No** borra `auth.users` → la sesión de Google
sigue viva.

`full_name = ''` y `company_id = NULL` → `OnboardingRoute` manda a `/bienvenida`
(carrusel) y el wizard arranca en el paso de nombre.

## Procedimiento

1. (Opcional, recomendado) Mostrar qué se va a borrar:

```sql
SELECT p.full_name, c.name AS company,
       (SELECT count(*) FROM locations l WHERE l.company_id = c.id) AS sedes,
       (SELECT count(*) FROM permits pm WHERE pm.company_id = c.id) AS permisos
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = '<EMAIL>';
```

2. Ejecutar el reset (vía `mcp__supabase__execute_sql`). Una sola sentencia
   atómica (CTE + UPDATE) + limpieza de leads:

```sql
WITH u AS (
  SELECT id FROM auth.users WHERE email = '<EMAIL>'
), del AS (
  DELETE FROM companies
  WHERE id IN (SELECT company_id FROM profiles WHERE id IN (SELECT id FROM u))
  RETURNING id
)
UPDATE profiles SET company_id = NULL, full_name = ''
WHERE id IN (SELECT id FROM u);
```

```sql
DELETE FROM leads WHERE email = '<EMAIL>' AND source = 'onboarding';
```

3. Verificar:

```sql
SELECT p.full_name, p.company_id
FROM profiles p JOIN auth.users u ON u.id = p.id
WHERE u.email = '<EMAIL>';
-- esperado: full_name = '', company_id = null
```

4. Decirle al usuario: **recargá la app** (seguís logueado con Google) → el
   onboarding arranca desde cero.

## Notas

- `full_name` es NOT NULL → siempre `''`, nunca `NULL`.
- Si el usuario insiste en borrar también la cuenta de auth (raro, no hace
  falta): `DELETE FROM auth.users WHERE email = '<EMAIL>';` — esto obliga a
  re-loguear con Google. Por defecto NO hacerlo.
- Corre contra la DB de producción (es donde se prueba: el OAuth de los preview
  está roto). Scope estricto al email dado.
