import { Shield, FileText, Building2, Users, AlertTriangle } from '@/lib/lucide-icons'
import { LegalCategoryCard } from './LegalCategoryCard'

const CATEGORIES = [
  {
    slug: 'funcionamiento',
    title: 'Funcionamiento',
    description: 'Permisos municipales y licencias de operación',
    icon: Building2,
    articleCount: 12,
  },
  {
    slug: 'sanitario',
    title: 'Sanitario',
    description: 'Permisos del Ministerio de Salud Pública',
    icon: FileText,
    articleCount: 8,
  },
  {
    slug: 'ambiental',
    title: 'Ambiental',
    description: 'Permisos del Ministerio del Ambiente',
    icon: Shield,
    articleCount: 15,
  },
  {
    slug: 'laboral',
    title: 'Laboral',
    description: 'Requisitos del Ministerio del Trabajo',
    icon: Users,
    articleCount: 10,
  },
  {
    slug: 'seguridad',
    title: 'Seguridad',
    description: 'Normativas de seguridad y bomberos',
    icon: AlertTriangle,
    articleCount: 6,
  },
]

export function LegalReferenceView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold">Marco Legal</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Referencia de normativas por categoría
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-300)]">
          {CATEGORIES.map(cat => (
            <LegalCategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </div>
    </div>
  )
}
