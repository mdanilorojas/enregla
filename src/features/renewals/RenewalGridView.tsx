import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermits } from '@/hooks/usePermits'
import { useLocations } from '@/hooks/useLocations'
import { resolveCompanyId } from '@/lib/demo'
import { YearSelector } from './YearSelector'
import { MonthCard, type MonthRenewal } from './MonthCard'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from '@/lib/lucide-icons'

export function RenewalGridView() {
  const { profile } = useAuth()
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined

  const { permits } = usePermits({ companyId })
  const { locations } = useLocations(companyId)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    permits.forEach(p => {
      if (p.expiry_date) years.add(new Date(p.expiry_date).getFullYear())
    })
    const current = new Date().getFullYear()
    years.add(current)
    years.add(current + 1)
    return Array.from(years).sort()
  }, [permits])

  const [year, setYear] = useState(new Date().getFullYear())

  const monthsData = useMemo(() => {
    const byMonth: Record<number, MonthRenewal[]> = {}
    permits.filter(p => p.is_active && p.expiry_date).forEach(p => {
      const date = new Date(p.expiry_date!)
      if (date.getFullYear() !== year) return

      const month = date.getMonth()
      if (!byMonth[month]) byMonth[month] = []

      const loc = locations.find(l => l.id === p.location_id)
      byMonth[month].push({
        permitId: p.id,
        permitType: (p as { type?: string }).type ?? 'Sin tipo',
        locationName: loc?.name ?? 'Sin sede',
        expiresAt: p.expiry_date!,
        status: (p.status as MonthRenewal['status']) ?? 'vigente',
      })
    })
    return byMonth
  }, [permits, locations, year])

  const monthsWithData = Object.keys(monthsData).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold">Renovaciones</h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              Calendario de vencimientos y renovaciones
            </p>
          </div>
          <YearSelector year={year} onYearChange={setYear} availableYears={availableYears} />
        </div>

        {monthsWithData.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={`Sin renovaciones en ${year}`}
            description="No hay permisos que venzan este año"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--ds-space-300)]">
            {monthsWithData.map(month => (
              <MonthCard key={month} month={month} year={year} renewals={monthsData[month]} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
