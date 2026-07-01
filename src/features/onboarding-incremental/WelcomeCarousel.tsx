import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileCheck, CalendarClock, Building2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';

// Pantalla de bienvenida educativa (NO escribe datos). Carrusel de las 3
// capacidades principales → CTA "Crear mi cuenta" lleva al setup wizard.
// ponytail: carrusel hand-rolled (3 slides, sin lib).
const SLIDES = [
  {
    icon: MapPin,
    title: 'Todas tus sedes en un solo lugar',
    body: 'Registrá cada local y mirá su estado de cumplimiento de un vistazo.',
  },
  {
    icon: FileCheck,
    title: 'Permisos y documentos bajo control',
    body: 'Guardá cada permiso, subí sus documentos y sabé siempre qué te falta.',
  },
  {
    icon: CalendarClock,
    title: 'Avisos antes de cada vencimiento',
    body: 'Te alertamos con tiempo para que nada caduque por sorpresa.',
  },
];

export function WelcomeCarousel() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;

  const start = () => navigate('/setup');
  const next = () => (isLast ? start() : setIdx((i) => i + 1));

  const slide = SLIDES[idx];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] flex flex-col items-center justify-center px-[var(--ds-space-400)] py-[var(--ds-space-600)]">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="flex items-center gap-[var(--ds-space-150)] mb-[var(--ds-space-500)]">
          <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
            <Building2 size={20} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)] tracking-tight">
            EnRegla
          </span>
        </div>

        <h1 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)] tracking-tight">
          Hola 👋 Bienvenido a EnRegla
        </h1>
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-500)]">
          Tu negocio en regla, sin sorpresas. Esto es lo que vas a poder hacer:
        </p>

        <div className="w-full bg-[var(--ds-neutral-0)] border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] shadow-[var(--ds-shadow-raised)] p-[var(--ds-space-500)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[var(--ds-blue-50)] flex items-center justify-center mb-[var(--ds-space-300)]">
            <Icon className="w-7 h-7 text-[var(--ds-text-brand)]" aria-hidden="true" />
          </div>
          <h2 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
            {slide.title}
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] leading-relaxed">
            {slide.body}
          </p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-[var(--ds-space-075)] mt-[var(--ds-space-400)]" role="tablist" aria-label="Diapositivas">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Diapositiva ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === idx ? 'w-6 bg-[var(--ds-background-brand)]' : 'w-2 bg-[var(--ds-neutral-200)]'
              }`}
            />
          ))}
        </div>

        <div className="w-full flex flex-col gap-[var(--ds-space-150)] mt-[var(--ds-space-500)]">
          <Button onClick={next} className="w-full">
            {isLast ? 'Crear mi cuenta' : 'Siguiente'}
          </Button>
          <Button variant="ghost" onClick={start} className="w-full">
            Saltar
          </Button>
        </div>
      </div>
    </div>
  );
}
