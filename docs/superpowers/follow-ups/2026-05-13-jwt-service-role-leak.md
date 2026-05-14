# Follow-up · Rotar JWT service_role filtrado + purgar git

**Fecha creación:** 2026-05-13
**Severidad:** P0 · Security
**Estado:** PENDIENTE
**Owner:** founder (action requerida en Supabase dashboard)

## Problema

El commit `6bf483c` (abril 2026) introdujo un JWT `service_role` completo en un archivo de documentación público:

```
docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266
```

**JWT decoded:**
- `role: service_role` (bypass total de RLS)
- `ref: zqaqhapxqwkvninnyqiu` (proyecto EnRegla prod)
- `exp: 2091` (válido ~65 años)

## Riesgo

Cualquier persona con acceso al repo público puede:
- Leer todas las tablas (`permits`, `profiles`, `companies`, `documents`, `notification_logs`, etc.)
- Escribir/borrar cualquier fila
- Ejecutar RPCs SECURITY DEFINER
- Acceder al Storage privado
- Bypass completo de las policies que arreglamos en fase A

## Plan de remediación

### Paso 1 · Rotar la key (INTERACTIVO)

1. Ir a https://supabase.com/dashboard/project/zqaqhapxqwkvninnyqiu/settings/api
2. Click "Reset service_role key" (o botón equivalente)
3. Confirmar
4. Actualizar env var en cada lugar que use la key vieja:
   - Vercel: `SUPABASE_SERVICE_ROLE_KEY` (producción + previews)
   - Edge functions secrets: `SUPABASE_SERVICE_ROLE_KEY` (automático si Supabase lo propaga)
   - `.env.local` de desarrollo (si aplica)
5. Verificar que `send-expiry-alerts` y `submit-lead` siguen funcionando tras rotación

### Paso 2 · Purgar git history

Con key ya rotada, el JWT histórico queda inútil. Pero seguirá siendo recogido por scanners. Purgar:

```bash
# Instalar git-filter-repo si no está
pip install git-filter-repo

# Desde C:\dev\enregla
git filter-repo --path docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md --invert-paths --force

# Restaurar el archivo limpio desde el head actual
git restore --source=HEAD docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md 2>/dev/null || true

# Re-agregar remote (filter-repo lo limpia)
git remote add origin https://github.com/<user>/enregla.git

# Force push
git push --force-with-lease origin feat/dominio-v2
```

Alternativa más quirúrgica: solo borrar la línea del JWT:

```bash
git filter-repo --replace-text <(echo 'eyJ***REDACTED***==>REDACTED') --force
```

### Paso 3 · Pre-commit secret scan

Para que no vuelva a pasar:

```bash
# Instalar pre-commit + detect-secrets
pip install pre-commit detect-secrets

# Crear .pre-commit-config.yaml
cat > .pre-commit-config.yaml <<'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Scan baseline
detect-secrets scan > .secrets.baseline

# Instalar hook
pre-commit install
```

O usar `trufflehog` en GitHub Actions CI:

```yaml
# .github/workflows/secret-scan.yml
name: Secret scan
on: [push, pull_request]
jobs:
  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

## Riesgos de la purga

- **Force push reescribe historia**: cualquier clone abierto se desincroniza. Requiere avisar a colaboradores.
- **Backups externos** (GitHub forks, caché de scanners): no se purgan. La rotación de la key es lo que cuenta, no el purge.
- **Tags firmados**: si había alguno apuntando al commit `6bf483c`, habrá que recrearlos.

## Verificación post-fix

```bash
# El archivo ya no debe contener el JWT
git log --all --oneline -p -- docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md | grep -c "eyJ"
# Esperado: 0

# Supabase advisor debe dejar de reportar "service role leak" si tiene esa categoría
```

## Timeline sugerido

- **Hoy**: rotar la key (5 min interactivo)
- **+24h**: verificar que todo sigue funcionando con key nueva
- **+48h**: purgar git history
- **+1 semana**: añadir pre-commit scan en CI
