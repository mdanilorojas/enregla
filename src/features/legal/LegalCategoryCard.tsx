import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'

export interface LegalCategoryCardProps {
  slug: string
  title: string
  description: string
  icon: LucideIcon
  articleCount: number
}

function LegalCategoryCardComponent({ slug, title, description, icon: Icon, articleCount }: LegalCategoryCardProps) {
  return (
    <Link
      to={`/marco-legal/${slug}`}
      className="block rounded-[var(--ds-radius-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
      aria-label={`Ver categoría ${title}: ${articleCount} artículos`}
    >
      <Card interactive className="p-[var(--ds-space-300)] h-full">
        <div className="flex items-start gap-[var(--ds-space-200)] h-full">
          <div className="w-10 h-10 bg-[var(--ds-blue-50)] rounded-[var(--ds-radius-200)] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[var(--ds-blue-600)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--ds-font-size-200)] text-[var(--ds-text)] mb-[var(--ds-space-050)]">{title}</h3>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]">{description}</p>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)]">{articleCount} artículos</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--ds-text-subtlest)] mt-1" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  )
}

export const LegalCategoryCard = memo(LegalCategoryCardComponent)
