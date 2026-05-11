-- Tabla catálogo de emisores de permisos
CREATE TABLE public.permit_issuers (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text UNIQUE NOT NULL,
  name                   text NOT NULL,
  short_name             text NOT NULL,
  scope                  text NOT NULL CHECK (scope IN ('nacional','municipal')),
  city                   text,
  portal_url             text,
  procedures_portal_url  text,
  contact_url            text,
  phone                  text,
  address                text,
  notes                  text,
  logo_url               text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- RLS: lectura pública, mutación solo service_role (staff)
ALTER TABLE public.permit_issuers ENABLE ROW LEVEL SECURITY;

CREATE POLICY issuers_select ON public.permit_issuers
  FOR SELECT TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.permit_issuers FROM anon, authenticated;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER issuers_set_updated_at
  BEFORE UPDATE ON public.permit_issuers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed con datos reales (scraping del 2026-05-10)
INSERT INTO public.permit_issuers (slug, name, short_name, scope, city, portal_url, phone, address) VALUES
  ('sri',
   'Servicio de Rentas Internas',
   'SRI',
   'nacional',
   NULL,
   'https://www.sri.gob.ec',
   '02 393 6300',
   'Plataforma Gubernamental Financiera, Av. Amazonas entre Unión Nacional de Periodistas y José Villalengua, Quito'),
  ('gad_quito',
   'Gobierno Autónomo Descentralizado del Distrito Metropolitano de Quito',
   'GAD Quito',
   'municipal',
   'Quito',
   'https://www.quito.gob.ec',
   '(593-2) 3952300 · 1800 510 510',
   'Venezuela entre Espejo y Chile, Quito 170101'),
  ('bomberos_quito',
   'Cuerpo de Bomberos del Distrito Metropolitano de Quito',
   'Bomberos Quito',
   'municipal',
   'Quito',
   'https://bomberosquito.gob.ec',
   '102 (emergencia)',
   NULL),
  ('arcsa',
   'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
   'ARCSA',
   'nacional',
   NULL,
   'https://www.controlsanitario.gob.ec',
   '+593 4 3727 440',
   'Sede principal Guayaquil; oficina en Quito'),
  ('msp',
   'Ministerio de Salud Pública',
   'MSP',
   'nacional',
   NULL,
   'https://www.salud.gob.ec',
   '(593-2) 381-4400',
   'Av. Quitumbe Ñan y Av. Amaru Ñan, Plataforma Gubernamental Desarrollo Social, Quito CP 170702');

-- URLs secundarias específicas
UPDATE public.permit_issuers SET procedures_portal_url = 'https://servicios.quito.gob.ec/' WHERE slug = 'gad_quito';
UPDATE public.permit_issuers SET procedures_portal_url = 'https://portalat.bomberosquito.gob.ec:8181' WHERE slug = 'bomberos_quito';
UPDATE public.permit_issuers SET procedures_portal_url = 'https://aplicaciones.controlsanitario.gob.ec/' WHERE slug = 'arcsa';
UPDATE public.permit_issuers SET contact_url = 'https://www.quito.gob.ec/?page_id=4451' WHERE slug = 'gad_quito';
UPDATE public.permit_issuers SET contact_url = 'https://www.contactociudadano.gob.ec' WHERE slug = 'arcsa';
