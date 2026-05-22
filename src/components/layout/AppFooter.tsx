import { Link } from 'react-router-dom'

const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? 'soporte@enregla.ec'
const statusUrl = (import.meta.env.VITE_STATUS_URL as string | undefined) ?? null

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--ds-border)] bg-[var(--ds-neutral-0)] px-[var(--ds-space-300)] py-[var(--ds-space-200)] mt-[var(--ds-space-400)]">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[var(--ds-space-150)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
        <div>
          © {new Date().getFullYear()} EnRegla · Cumplimiento operativo para empresas en Ecuador.
        </div>
        <nav className="flex flex-wrap items-center gap-[var(--ds-space-200)]">
          <a
            href={`mailto:${supportEmail}`}
            className="hover:text-[var(--ds-text)] underline-offset-2 hover:underline"
          >
            Soporte
          </a>
          {statusUrl && (
            <a
              href={statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ds-text)] underline-offset-2 hover:underline"
            >
              Estado del servicio
            </a>
          )}
          <Link
            to="/privacidad"
            className="hover:text-[var(--ds-text)] underline-offset-2 hover:underline"
          >
            Privacidad
          </Link>
          <Link
            to="/terminos"
            className="hover:text-[var(--ds-text)] underline-offset-2 hover:underline"
          >
            Términos
          </Link>
        </nav>
      </div>
    </footer>
  )
}
