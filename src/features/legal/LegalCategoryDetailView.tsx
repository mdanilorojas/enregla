import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card } from '@/components/ui/card'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { HelpCircle, Send } from '@/lib/lucide-icons'

interface CategoryContent {
  title: string
  description: string
  requirements: string[]
  relatedPermits: Array<{ id: string; name: string }>
}

const CONTENT: Record<string, CategoryContent> = {
  funcionamiento: {
    title: 'Funcionamiento',
    description: 'Los permisos de funcionamiento son emitidos por las municipalidades y autorizan la operación de establecimientos comerciales en una jurisdicción específica.',
    requirements: [
      'RUC vigente de la empresa',
      'Cédula del representante legal',
      'Certificado del cuerpo de bomberos',
      'Patente municipal al día',
      'Uso de suelo autorizado',
    ],
    relatedPermits: [
      { id: 'permit-1', name: 'Licencia Metropolitana Única' },
      { id: 'permit-2', name: 'Permiso Municipal' },
    ],
  },
  sanitario: {
    title: 'Sanitario',
    description: 'El Ministerio de Salud Pública regula la operación de establecimientos que manejan alimentos, medicamentos o servicios de salud.',
    requirements: [
      'Registro Sanitario ARCSA',
      'Certificado de Buenas Prácticas',
      'Análisis microbiológico de aguas',
      'Plan de manejo sanitario',
    ],
    relatedPermits: [{ id: 'permit-3', name: 'Permiso Sanitario' }],
  },
  ambiental: {
    title: 'Ambiental',
    description: 'Regulaciones del Ministerio del Ambiente (MAE) para actividades con impacto ambiental.',
    requirements: [
      'Estudio de Impacto Ambiental',
      'Plan de Manejo Ambiental',
      'Licencia Ambiental categoría correspondiente',
      'Registro de generador de desechos',
    ],
    relatedPermits: [{ id: 'permit-4', name: 'Licencia Ambiental' }],
  },
  laboral: {
    title: 'Laboral',
    description: 'Cumplimiento con el Ministerio del Trabajo respecto a empleados y condiciones laborales.',
    requirements: [
      'Reglamento Interno aprobado',
      'Afiliación al IESS de empleados',
      'Plan de seguridad ocupacional',
      'Décimos tercero y cuarto pagados',
    ],
    relatedPermits: [{ id: 'permit-5', name: 'Reglamento Interno' }],
  },
  seguridad: {
    title: 'Seguridad',
    description: 'Requisitos de seguridad, prevención de incendios y emergencias.',
    requirements: [
      'Permiso del Cuerpo de Bomberos',
      'Plan de emergencias aprobado',
      'Sistema contra incendios certificado',
      'Salidas de emergencia señalizadas',
    ],
    relatedPermits: [{ id: 'permit-6', name: 'Permiso Bomberos' }],
  },
}

export function LegalCategoryDetailView() {
  const { categoria } = useParams<{ categoria: string }>()
  const content = categoria ? CONTENT[categoria] : null

  if (!content) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-4xl mx-auto">
          <Banner variant="error">Categoría no encontrada</Banner>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-4xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Marco Legal', href: '/marco-legal' },
          { label: content.title },
        ]} />

        <h1 className="text-[var(--ds-font-size-500)] font-bold">{content.title}</h1>

        <Card className="p-[var(--ds-space-400)]">
          <p className="text-[var(--ds-font-size-200)] leading-relaxed">{content.description}</p>
        </Card>

        <Card className="p-[var(--ds-space-400)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Requisitos</h2>
          <ul className="space-y-[var(--ds-space-150)]">
            {content.requirements.map((req, i) => (
              <li key={i} className="flex gap-[var(--ds-space-150)]">
                <span className="w-6 h-6 bg-[var(--ds-blue-100)] text-[var(--ds-blue-700)] rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold shrink-0">{i + 1}</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </Card>

        {content.relatedPermits.length > 0 && (
          <Card className="p-[var(--ds-space-400)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Permisos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-150)]">
              {content.relatedPermits.map(p => (
                <div key={p.id} className="p-[var(--ds-space-200)] bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-100)]">
                  <div className="font-medium">{p.name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Banner variant="info">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-[var(--ds-space-100)]">
              <HelpCircle className="w-5 h-5" />
              <span>¿Necesitas ayuda con esta categoría?</span>
            </div>
            <Button variant="default" size="sm"><Send className="w-4 h-4" />Contactar</Button>
          </div>
        </Banner>
      </div>
    </div>
  )
}
