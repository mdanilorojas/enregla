import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getPublicLinkData, type PublicLinkData } from '@/lib/api/publicLinks';
import { PermitCard } from './PermitCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, MapPin, Shield } from '@/lib/lucide-icons';

export function PublicVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const result = await getPublicLinkData(token);
        if (!result) {
          setError(true);
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Error loading public link data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Group permits by status
  const groupedPermits = useMemo(() => {
    if (!data) return null;

    const vigentes = data.permits.filter(p => p.status === 'vigente')
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });

    const porVencer = data.permits.filter(p => p.status === 'por_vencer')
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });

    const vencidos = data.permits.filter(p => p.status === 'vencido')
      .sort((a, b) => {
        if (!a.expiry_date) return -1;
        if (!b.expiry_date) return 1;
        return b.expiry_date.localeCompare(a.expiry_date);
      });

    const pendientes = data.permits.filter(p => p.status === 'no_registrado')
      .sort((a, b) => a.type.localeCompare(b.type));

    return { vigentes, porVencer, vencidos, pendientes };
  }, [data]);

  // Public header shared across states
  const PublicHeader = () => (
    <header className="bg-white border-b border-[var(--ds-border)] p-[var(--ds-space-300)]">
      <div className="max-w-4xl mx-auto flex items-center gap-[var(--ds-space-150)]">
        <div className="w-8 h-8 rounded-[var(--ds-radius-100)] bg-[var(--ds-background-brand)] flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-semibold text-[var(--ds-text)]">EnRegla - Verificación</h1>
      </div>
    </header>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] flex items-center justify-center">
        <div className="text-[var(--ds-text-subtle)]" role="status" aria-live="polite">
          <span className="sr-only">Cargando datos de verificación</span>
          Verificando permiso...
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)]">
        <PublicHeader />
        <main className="max-w-2xl mx-auto p-[var(--ds-space-400)]">
          <Card className="p-[var(--ds-space-600)] text-center">
            <AlertCircle className="h-12 w-12 text-[var(--ds-red-500)] mx-auto mb-[var(--ds-space-200)]" />
            <div className="text-[var(--ds-red-500)] font-bold text-[var(--ds-font-size-300)]">
              Link No Válido
            </div>
            <p className="text-[var(--ds-text-subtle)] mt-[var(--ds-space-150)]">
              Este link público no existe o ha sido desactivado.
            </p>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)]">
              Contacta al administrador para obtener un link válido.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const totalPermits = data.permits.length;
  const vigentesCount = groupedPermits?.vigentes.length ?? 0;
  const porVencerCount = groupedPermits?.porVencer.length ?? 0;
  const vencidosCount = groupedPermits?.vencidos.length ?? 0;
  const pendientesCount = groupedPermits?.pendientes.length ?? 0;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)]">
      <PublicHeader />

      <main className="max-w-4xl mx-auto p-[var(--ds-space-400)]">
        {/* Location info card */}
        <Card className="p-[var(--ds-space-600)] mb-[var(--ds-space-400)]">
          <div className="flex flex-wrap items-start justify-between gap-[var(--ds-space-300)]">
            <div className="min-w-0">
              <h2 className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
                {data.location.name}
              </h2>
              <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)]">
                <MapPin className="h-4 w-4" />
                <p className="text-[var(--ds-font-size-100)]">{data.location.address}</p>
              </div>
            </div>

            {totalPermits > 0 && (
              <div className="flex flex-wrap gap-[var(--ds-space-100)]">
                {vigentesCount > 0 && (
                  <Badge variant="status-vigente" size="lg">
                    {vigentesCount} Vigente{vigentesCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {porVencerCount > 0 && (
                  <Badge variant="status-por-vencer" size="lg">
                    {porVencerCount} Por vencer
                  </Badge>
                )}
                {vencidosCount > 0 && (
                  <Badge variant="status-vencido" size="lg">
                    {vencidosCount} Vencido{vencidosCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {pendientesCount > 0 && (
                  <Badge variant="status-no-registrado" size="lg">
                    {pendientesCount} Pendiente{pendientesCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Permisos Vigentes */}
        {groupedPermits?.vigentes && groupedPermits.vigentes.length > 0 && (
          <section className="mb-[var(--ds-space-400)]">
            <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
              Permisos Vigentes ({groupedPermits.vigentes.length})
            </h3>
            <div className="grid gap-[var(--ds-space-200)] md:grid-cols-2">
              {groupedPermits.vigentes.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Permisos por Vencer */}
        {groupedPermits?.porVencer && groupedPermits.porVencer.length > 0 && (
          <section className="mb-[var(--ds-space-400)]">
            <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
              Permisos por Vencer ({groupedPermits.porVencer.length})
            </h3>
            <div className="grid gap-[var(--ds-space-200)] md:grid-cols-2">
              {groupedPermits.porVencer.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Permisos Vencidos */}
        {groupedPermits?.vencidos && groupedPermits.vencidos.length > 0 && (
          <section className="mb-[var(--ds-space-400)]">
            <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
              Permisos Vencidos ({groupedPermits.vencidos.length})
            </h3>
            <div className="grid gap-[var(--ds-space-200)] md:grid-cols-2">
              {groupedPermits.vencidos.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pendientes de Registro */}
        {groupedPermits?.pendientes && groupedPermits.pendientes.length > 0 && (
          <section className="mb-[var(--ds-space-400)]">
            <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
              Pendientes de Registro ({groupedPermits.pendientes.length})
            </h3>
            <div className="grid gap-[var(--ds-space-200)] md:grid-cols-2">
              {groupedPermits.pendientes.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* No permits */}
        {totalPermits === 0 && (
          <Card className="p-[var(--ds-space-600)] text-center">
            <p className="text-[var(--ds-text-subtle)]">Sin permisos registrados</p>
          </Card>
        )}

        {/* Verification timestamp */}
        <Card className="p-[var(--ds-space-300)] mt-[var(--ds-space-400)]">
          <div className="flex items-center justify-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--ds-green-500)]" />
            Verificado el {format(new Date(), "dd MMM yyyy HH:mm")}
          </div>
        </Card>

        <footer className="text-center mt-[var(--ds-space-400)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          Powered by{' '}
          <a
            href="https://enregla.com"
            className="text-[var(--ds-text-brand)] hover:underline"
          >
            EnRegla
          </a>
        </footer>
      </main>
    </div>
  );
}
