# Follow-up: cerrar gap del proceso de verificación

**Fecha:** 2026-05-10
**Origen:** Post-mortem del incidente durante la auditoría pre-producción.

## Qué pasó

Se declaró "GO para venta" tras fix de 20 BLOCKERs. En la primera carga del dev server apareció un 403 porque la migración de lockdown de SECURITY DEFINER revocó `user_company_id()` de anon/authenticated sin notar que `profiles_select` y `companies_select` la llaman.

Los 3 agentes "verificadores" leyeron `pg_policies`/`storage.buckets`/`pg_proc` (forma), pero no ejecutaron queries como role anon/authenticated (comportamiento). Tests, lint, build y advisors pasaron limpios — igual había un bug crítico.

## Causa raíz

Tres capas:

1. **Operacional**: No se invocó el skill `superpowers:verification-before-completion` al cerrar, aunque estaba disponible.
2. **Cognitiva**: Sesgo de "ya hice suficiente" tras 20 fixes + tests + advisors.
3. **De contrato**: El CLAUDE.md pedía "start dev server before reporting complete for UI/frontend changes" — se interpretó como "esto es auditoría, no UI" y se saltó.

## Pendiente de implementar (cuando haya ganas)

Elegir una o combinar:

### A — Definition of Done en CLAUDE.md
Agregar a `C:\dev\enregla\CLAUDE.md`:

```markdown
## Definition of Done

A task is NEVER complete until:
1. `npm run dev` has been started AND
2. At least one end-to-end user flow has been manually executed AND
3. The exact output of that execution is quoted in the final message.

Words like "GO", "listo", "completado", "production-ready", "ready to ship"
are forbidden in the final message unless conditions 1-3 are satisfied.
```

Ventaja: elimina ambigüedad lingüística. Desventaja: requiere que el agente re-lea CLAUDE.md al cerrar (no garantizado).

### B — Hook en `~/.claude/settings.json`
`Stop` hook que imprime un gate de verificación cuando el agente está por terminar:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "echo 'VERIFICATION GATE: if your final message declares completion without evidence of E2E smoke test (dev server + real flow executed), return to work.'"
      }]
    }]
  }
}
```

Ventaja: mecánico, no depende de memoria del agente. Desventaja: se dispara en TODAS las conversaciones.

### C — Skill/template propio para auditorías
Crear `docs/superpowers/templates/audit-verification-checklist.md` con los pasos obligatorios tras migraciones:

- `SET ROLE anon; SELECT ...` para cada query que la app hace como anon
- `SET ROLE authenticated; SELECT ...` para las del path autenticado
- `npm run dev` + login real + primer mutation
- Capturar output textual en el reporte

Ventaja: reusable para futuras auditorías. Desventaja: depende de que el agente lo invoque.

## Recomendación

A + B combinadas: CLAUDE.md define el contrato ("forbidden words"), hook lo impone mecánicamente.
C es opcional pero útil si vas a hacer más auditorías.

## Prioridad

Media. No bloquea desarrollo. Previene repetir el incidente del 2026-05-10.
