import { Banner } from '@/components/ui/banner';

export function LegalDisclaimer() {
  return (
    <Banner variant="warning" role="note">
      <span>
        <strong>Información referencial.</strong>{' '}
        El marco legal se actualiza constantemente. Este contenido no sustituye
        asesoría legal profesional ni consulta directa a las entidades emisoras.
      </span>
    </Banner>
  );
}
