import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getPublicLinkData, type PublicLinkData } from '@/lib/api/publicLinks';
import { PermitCard } from './PermitCard';
import { AlertCircle, MapPin } from 'lucide-react';

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <span className="sr-only">Cargando datos de verificación</span>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-gray-900 text-white py-4 px-6">
          <h1 className="text-xl font-semibold">🏢 EnRegla</h1>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Link No Válido
            </h2>
            <p className="text-gray-600 mb-4">
              Este link público no existe o ha sido desactivado.
            </p>
            <p className="text-sm text-gray-500">
              Contacta al administrador para obtener un link válido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-4 px-6">
        <h1 className="text-xl font-semibold">🏢 EnRegla</h1>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Location Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {data.location.name}
          </h2>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <MapPin className="h-4 w-4" />
            <p>{data.location.address}</p>
          </div>
        </div>

        <hr className="border-gray-100 mb-8" />

        {/* Permisos Vigentes */}
        {groupedPermits?.vigentes && groupedPermits.vigentes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos Vigentes ({groupedPermits.vigentes.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
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
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos por Vencer ({groupedPermits.porVencer.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
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
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos Vencidos ({groupedPermits.vencidos.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
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
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pendientes de Registro ({groupedPermits.pendientes.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
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
        {data.permits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Sin permisos registrados</p>
          </div>
        )}

        <hr className="border-gray-100 my-8" />

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500">
          <p className="mb-1">
            Última actualización: {format(new Date(), "dd MMM yyyy HH:mm")}
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🔒</span>
            Verificado por EnRegla
          </p>
        </footer>
      </div>
    </div>
  );
}
