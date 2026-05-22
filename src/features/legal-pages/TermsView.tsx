const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? 'soporte@enregla.ec'

export function TermsView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <article className="max-w-3xl mx-auto bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-400)] space-y-[var(--ds-space-300)]">
        <header>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
            Términos y condiciones
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)]">
            Versión preliminar. Última actualización: 21 de mayo de 2026.
          </p>
        </header>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">1. Servicio</h2>
          <p>
            EnRegla ofrece una herramienta SaaS para gestión de permisos operativos en Ecuador.
            La información de costos, plazos y exigencias regulatorias se ofrece a título
            informativo y referencial; la responsabilidad final del cumplimiento recae sobre la
            empresa usuaria y sus asesores legales.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">2. Cuenta y acceso</h2>
          <p>
            Sos responsable de la confidencialidad de tu contraseña y de la actividad realizada
            desde tu cuenta. Notificá inmediatamente cualquier acceso no autorizado a{' '}
            <a
              href={`mailto:${supportEmail}`}
              className="text-[var(--ds-text-brand)] underline"
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">3. Suscripción</h2>
          <p>
            El plan se factura por adelantado. Una vez vencido el período de prueba gratuita el
            acceso queda restringido hasta confirmar el pago. La cancelación se realiza
            escribiendo al equipo de soporte; los pagos ya realizados no son reembolsables salvo
            indicación contraria.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">4. Limitación de responsabilidad</h2>
          <p>
            EnRegla se ofrece "tal cual". No garantizamos disponibilidad ininterrumpida ni que
            la información regulatoria esté siempre completa o actualizada. Bajo ninguna
            circunstancia EnRegla asumirá responsabilidad por sanciones administrativas,
            multas, lucro cesante o daños indirectos derivados del uso de la plataforma.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">5. Datos y privacidad</h2>
          <p>
            El tratamiento de datos personales se rige por nuestra Política de privacidad.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">6. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Te avisaremos por correo cualquier cambio
            material con al menos 15 días de anticipación.
          </p>
        </section>
      </article>
    </div>
  )
}
