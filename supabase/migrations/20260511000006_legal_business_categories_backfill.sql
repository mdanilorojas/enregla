-- Backfill: llenar business_categories y government_portal_url/name en legal_references.
-- El TS source (src/data/legal-references.ts) no trae estos campos; los ponemos
-- según la matriz MVP del spec dominio-v2. Esto habilita el filtro "solo mi giro"
-- en el Marco Legal (T13).

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  government_portal_url = 'https://www.sri.gob.ec',
  government_portal_name = 'SRI'
WHERE permit_type = 'ruc';

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  government_portal_url = 'https://servicios.quito.gob.ec/',
  government_portal_name = 'GAD Quito'
WHERE permit_type = 'patente_municipal';

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  government_portal_url = 'https://servicios.quito.gob.ec/',
  government_portal_name = 'GAD Quito'
WHERE permit_type = 'uso_suelo';

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  government_portal_url = 'https://bomberosquito.gob.ec',
  government_portal_name = 'Bomberos Quito'
WHERE permit_type = 'bomberos';

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','salon_belleza'],
  government_portal_url = 'https://www.controlsanitario.gob.ec',
  government_portal_name = 'ARCSA'
WHERE permit_type = 'arcsa';

UPDATE public.legal_references SET
  business_categories = ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  government_portal_url = 'https://servicios.quito.gob.ec/',
  government_portal_name = 'GAD Quito'
WHERE permit_type = 'rotulacion';
