import { useState } from 'react';
import { MessageSquare, Loader2, CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { createPermitServiceLead } from '@/lib/api/onboarding';
import { buildWhatsappUrl } from '@/lib/whatsapp';

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '';

export interface GetItForYouFormProps {
  permitType: string;
  permitLabel: string;
  nombre: string;
  email: string;
  negocio: string;
  ciudad?: string;
}

export function GetItForYouForm({
  permitType, permitLabel, nombre, email, negocio, ciudad,
}: GetItForYouFormProps) {
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waUrl = buildWhatsappUrl(
    WHATSAPP_NUMBER,
    `Hola, quiero que me ayuden a sacar el permiso "${permitLabel}".\n\nEmpresa: ${negocio}`,
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createPermitServiceLead({ nombre, email, telefono, negocio, ciudad, permitType });
      setSent(true);
    } catch (err) {
      console.error('createPermitServiceLead error:', err);
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Banner variant="success" title="¡Listo!">
        Recibimos tu solicitud para el permiso {permitLabel}. Te contactamos pronto al {email}.
      </Banner>
    );
  }

  return (
    <div className="space-y-[var(--ds-space-150)]">
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
        Dejanos tu teléfono y nosotros tramitamos el <b>{permitLabel}</b> por vos. Te contactamos
        al {email}.
      </p>
      <input
        type="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono (opcional)"
        disabled={loading}
        className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]"
      />
      {error && <Banner variant="error">{error}</Banner>}
      <div className="flex flex-wrap gap-[var(--ds-space-100)]">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Enviar solicitud
        </Button>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" type="button">
              <MessageSquare className="w-4 h-4" />
              WhatsApp directo
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
