import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, FileText, RefreshCw, Upload } from '@/lib/lucide-icons'
import type { Permit } from '@/types/database'

interface Props {
  permits: Permit[]
  locationsById: Map<string, { id: string; name: string }>
  max?: number
}

interface InboxItem {
  id: string
  permitId: string
  priority: number
  severity: 'critical' | 'warning' | 'info'
  icon: typeof AlertTriangle
  title: string
  subtitle: string
  actionLabel: string
  actionHref: string
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function buildInbox(permits: Permit[], locationsById: Map<string, { id: string; name: string }>): InboxItem[] {
  const items: InboxItem[] = []

  for (const p of permits) {
    if (!p.is_active) continue
    const locName = p.location_id ? locationsById.get(p.location_id)?.name ?? 'Sin sede' : 'Sin sede'
    const typeLabel = p.type

    if (p.status === 'vencido') {
      const days = daysUntil(p.expiry_date)
      items.push({
        id: `${p.id}-vencido`,
        permitId: p.id,
        priority: 1000 + (days == null ? 0 : Math.abs(days)),
        severity: 'critical',
        icon: AlertTriangle,
        title: `${typeLabel} · ${locName}`,
        subtitle: days == null ? 'Permiso vencido' : `Venció hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`,
        actionLabel: 'Renovar',
        actionHref: `/permisos/${p.id}?action=renew`,
      })
      continue
    }

    if (p.status === 'por_vencer') {
      const days = daysUntil(p.expiry_date)
      items.push({
        id: `${p.id}-por_vencer`,
        permitId: p.id,
        priority: 500 - (days ?? 30),
        severity: 'warning',
        icon: Clock,
        title: `${typeLabel} · ${locName}`,
        subtitle: days == null ? 'Por vencer pronto' : `Vence en ${days} día${days === 1 ? '' : 's'}`,
        actionLabel: 'Renovar',
        actionHref: `/permisos/${p.id}?action=renew`,
      })
      continue
    }

    if (p.status === 'no_registrado') {
      items.push({
        id: `${p.id}-no_registrado`,
        permitId: p.id,
        priority: 200,
        severity: 'info',
        icon: FileText,
        title: `${typeLabel} · ${locName}`,
        subtitle: 'Sin documento registrado',
        actionLabel: 'Subir documento',
        actionHref: `/permisos/${p.id}`,
      })
      continue
    }

    if (p.status === 'en_tramite') {
      items.push({
        id: `${p.id}-en_tramite`,
        permitId: p.id,
        priority: 100,
        severity: 'info',
        icon: RefreshCw,
        title: `${typeLabel} · ${locName}`,
        subtitle: 'En trámite · da seguimiento',
        actionLabel: 'Ver',
        actionHref: `/permisos/${p.id}`,
      })
    }
  }

  return items.sort((a, b) => b.priority - a.priority)
}

export function TodayInbox({ permits, locationsById, max = 5 }: Props) {
  const items = useMemo(() => buildInbox(permits, locationsById), [permits, locationsById])
  const visible = items.slice(0, max)
  const remaining = items.length - visible.length

  if (items.length === 0) {
    return (
      <Card className="p-[var(--ds-space-400)]">
        <div className="flex items-start gap-[var(--ds-space-200)]">
          <div className="w-10 h-10 rounded-full bg-[var(--ds-green-50)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--ds-green-700)]" />
          </div>
          <div>
            <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">
              Todo al día
            </h2>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
              No hay permisos que requieran acción hoy. Te avisamos cuando algo se acerque al vencimiento.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-[var(--ds-space-300)]">
      <div className="flex items-center justify-between mb-[var(--ds-space-250)]">
        <div>
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">
            Hoy · {items.length} {items.length === 1 ? 'acción pendiente' : 'acciones pendientes'}
          </h2>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-1">
            Ordenado por urgencia. Atiende primero los permisos vencidos.
          </p>
        </div>
        <Link to="/permisos" className="text-[var(--ds-font-size-075)] text-[var(--ds-text-brand)] hover:underline">
          Ver todos →
        </Link>
      </div>

      <ul className="space-y-[var(--ds-space-100)]">
        {visible.map((it) => {
          const Icon = it.icon
          const severityStyle =
            it.severity === 'critical'
              ? 'bg-[var(--ds-red-50)] text-[var(--ds-red-700)]'
              : it.severity === 'warning'
                ? 'bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]'
                : 'bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)]'
          const badgeVariant =
            it.severity === 'critical'
              ? 'status-vencido'
              : it.severity === 'warning'
                ? 'status-por-vencer'
                : 'status-no-registrado'

          return (
            <li
              key={it.id}
              className="flex items-center gap-[var(--ds-space-200)] p-[var(--ds-space-200)] rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] hover:border-[var(--ds-border-bold)] bg-white transition-colors"
            >
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${severityStyle}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[var(--ds-space-100)] flex-wrap">
                  <span className="font-medium text-[var(--ds-font-size-100)] text-[var(--ds-text)] truncate">
                    {it.title}
                  </span>
                  <Badge variant={badgeVariant}>{it.subtitle}</Badge>
                </div>
              </div>
              <Link to={it.actionHref}>
                <Button variant={it.severity === 'critical' ? 'default' : 'outline'} size="sm">
                  {it.actionLabel === 'Renovar' && <RefreshCw className="w-4 h-4" />}
                  {it.actionLabel === 'Subir documento' && <Upload className="w-4 h-4" />}
                  {it.actionLabel}
                </Button>
              </Link>
            </li>
          )
        })}
      </ul>

      {remaining > 0 && (
        <div className="mt-[var(--ds-space-200)] text-center">
          <Link to="/permisos" className="text-[var(--ds-font-size-100)] text-[var(--ds-text-brand)] hover:underline">
            Ver {remaining} {remaining === 1 ? 'acción más' : 'acciones más'}
          </Link>
        </div>
      )}
    </Card>
  )
}
