# Backups & disaster recovery — EnRegla

Cómo proteger los datos, qué hacer si pasa algo y cómo verificarlo periódicamente.

## 1. Estado actual de backups

| Capa | Mecanismo | Retención | Dónde |
|------|-----------|-----------|-------|
| Postgres (Supabase) | Backups diarios automáticos | 7 días (Free) → 14 días (Pro) | Dashboard → Database → Backups |
| Postgres (Supabase) | Point-in-Time Recovery (PITR) | 7 días — **requiere Pro plan + activación manual** | Dashboard → Database → Backups → Enable PITR |
| Storage objects | Replicación interna de Supabase | igual al plan | n/a |
| Migraciones de schema | Repo git | infinita | `supabase/migrations/` |
| Code | GitHub | infinita | repo `enregla` |

## 2. Acciones manuales obligatorias antes del lanzamiento

1. Subir a **Supabase Pro** (USD 25/mes mínimo).
2. Activar **PITR** en Dashboard → Database → Backups → "Enable Point-in-Time Recovery".
3. Configurar **retention** a 14 días.
4. Documentar la región del proyecto (`us-east-1` por defecto) en `docs/runbooks/infra.md` cuando exista.
5. Anotar en 1Password / vault del owner el correo del Supabase admin que tiene permiso de restore.

## 3. Backup manual ad-hoc (snapshot por seguridad)

Antes de migraciones destructivas o de tocar producción a mano:

```bash
# 1) Pedir credenciales temporales al owner (read-only basta para dump).
# 2) Volcar schema + data (usar pg_dump con --no-owner --no-privileges).
PGPASSWORD=*** pg_dump \
  --host=db.<project-ref>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --no-owner --no-privileges \
  --format=custom \
  --file=backup-$(date +%Y%m%d-%H%M).dump
```

Guardar el `.dump` en S3 privado (bucket `enregla-backups`), nunca en Drive/Slack.
Borrar el archivo local cuando ya no se necesite.

## 4. Restore desde backup automático

**Importante**: el restore en Supabase crea una nueva instancia, no sobreescribe la actual.
La app debe re-apuntar al nuevo host.

1. Dashboard → Database → Backups → seleccionar punto en el tiempo.
2. Click "Restore". Supabase crea proyecto nuevo con sufijo `-restored`.
3. Aplicar las últimas migraciones que no estén en el snapshot:
   ```sh
   supabase db push --db-url postgres://...@db.<new-ref>.supabase.co:5432/postgres
   ```
4. Validar: `SELECT count(*) FROM public.companies;` etc.
5. Cambiar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel para apuntar al proyecto restaurado.
6. Re-deploy de Vercel.
7. Smoke test: login, dashboard, crear permit, descarga CSV.

## 5. Verificación trimestral (DR drill)

Cada 3 meses (calendarizar):

1. Hacer un restore a un proyecto temporal.
2. Confirmar que se puede iniciar sesión y leer datos.
3. Documentar el tiempo total (RTO real) en este archivo.
4. Borrar el proyecto temporal.

| Fecha | RTO observado | Persona | Notas |
|-------|---------------|---------|-------|
| (sin ejecutar) |  |  |  |

## 6. Qué NO hacemos hoy (riesgos aceptados)

- **No exportamos audit_logs fuera de Supabase**. Si se pierde el proyecto se pierde el trail.
  Mitigación: PITR + dump trimestral a S3.
- **No hay réplica geográfica**. Toda la data vive en una región.
- **Storage objects** dependen 100% de la replicación interna de Supabase. No hacemos sync a S3 externo.

Si alguna de estas condiciones cambia (cliente regulado, escala, etc.) actualizar este runbook.

## 7. Contacto en incidente

- Owner: Mario Danilo Rojas
- Supabase support: support@supabase.com (Pro plan da SLA 24h hábil)
- Vercel support: vercel.com/help (Hobby = comunidad, Pro = email 24h)

## 8. Historial de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-05-21 | Documento inicial. PITR pendiente de activación. |
