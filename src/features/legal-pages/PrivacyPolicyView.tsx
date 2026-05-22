const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? 'soporte@enregla.ec'

export function PrivacyPolicyView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <article className="max-w-3xl mx-auto bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-400)] space-y-[var(--ds-space-300)]">
        <header>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
            Política de privacidad
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)]">
            Versión preliminar. Última actualización: 21 de mayo de 2026.
          </p>
        </header>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">Datos que tratamos</h2>
          <p>
            EnRegla almacena la información que ingresás como administrador de tu empresa: datos
            de la empresa (nombre, RUC, ciudad, tipo de negocio), sedes, permisos, documentos y
            registros de auditoría asociados a esa actividad. También guardamos tu correo
            electrónico, nombre y rol dentro de la empresa para autenticación.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">Para qué los usamos</h2>
          <ul className="list-disc pl-[var(--ds-space-300)] space-y-[var(--ds-space-050)]">
            <li>Operar la plataforma: mostrarte permisos, alertas y reportes.</li>
            <li>Notificarte sobre vencimientos por correo electrónico.</li>
            <li>Auditoría de cambios para cumplimiento normativo.</li>
            <li>Soporte técnico y comunicación contractual.</li>
          </ul>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">Tus derechos (LOPDP)</h2>
          <p>
            En cumplimiento con la Ley Orgánica de Protección de Datos Personales del Ecuador
            podés ejercer los derechos de acceso, rectificación, eliminación, oposición y
            portabilidad. Desde tu cuenta podés:
          </p>
          <ul className="list-disc pl-[var(--ds-space-300)] space-y-[var(--ds-space-050)]">
            <li>Descargar tus datos en formato JSON desde Configuración → Privacidad.</li>
            <li>Eliminar permanentemente tu empresa desde Configuración → Privacidad.</li>
          </ul>
          <p>
            Para cualquier otra solicitud escribí a{' '}
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
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">Subcontratistas</h2>
          <p>
            Usamos Supabase (base de datos y almacenamiento) y Vercel (hosting) como
            procesadores. Los datos se almacenan en infraestructura cifrada en reposo y en
            tránsito.
          </p>
        </section>

        <section className="space-y-[var(--ds-space-150)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold">Contacto</h2>
          <p>
            Responsable del tratamiento: EnRegla. Contacto:{' '}
            <a
              href={`mailto:${supportEmail}`}
              className="text-[var(--ds-text-brand)] underline"
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  )
}
