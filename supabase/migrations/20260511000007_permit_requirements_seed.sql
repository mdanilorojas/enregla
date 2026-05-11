-- Limpia seed previo (20 filas actuales con formato viejo)
DELETE FROM public.permit_requirements;

-- Matriz 10×8. Formato:
--   (business_type, permit_type, is_mandatory, issuer_slug, required_role,
--    cost_min, cost_max, cost_notes, cost_updated_at,
--    fine_min, fine_max, fine_source, applies_when)
-- El issuer_id se resuelve con subquery a permit_issuers.

DO $$
DECLARE
  sri_id            uuid := (SELECT id FROM permit_issuers WHERE slug='sri');
  gad_quito_id      uuid := (SELECT id FROM permit_issuers WHERE slug='gad_quito');
  bomberos_id       uuid := (SELECT id FROM permit_issuers WHERE slug='bomberos_quito');
  arcsa_id          uuid := (SELECT id FROM permit_issuers WHERE slug='arcsa');
  msp_id            uuid := (SELECT id FROM permit_issuers WHERE slug='msp');
BEGIN

-- RUC (aplica a todos los giros)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'ruc', true, sri_id, 'representante_legal',
       0, 0, 'USD', 'Gratuito', '2026-01-01'::date,
       30, 1500, 'Ley RUC Art. 10 — multa por no inscripción o actualización'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Patente municipal (aplica a todos)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'patente_municipal', true, gad_quito_id, 'anyone',
       25, 25000, 'USD', 'Varía por patrimonio declarado: 1.5 por mil hasta máx 25.000', '2026-01-01'::date,
       100, 500, 'Código Municipal Art. 26 — multa por no pago anual'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Uso de suelo (todos menos food_truck)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'uso_suelo', true, gad_quito_id, 'representante_legal',
       50, 200, 'USD', 'Varía por zona y metros cuadrados', '2026-01-01'::date
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- LUAE (todos, food_truck opcional)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'luae', true, gad_quito_id, 'representante_legal',
       120, 120, 'USD', '2026-01-01'::date,
       200, 1000, 'Ordenanza Metropolitana de LUAE — multa por no obtener/renovar'
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
VALUES ('food_truck', 'luae', false, gad_quito_id, 'representante_legal',
        120, 120, 'USD', 'Aplicable según ordenanza vigente', '2026-01-01'::date);

-- Bomberos (aplica a todos)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'bomberos', true, bomberos_id, 'anyone',
       50, 200, 'USD', '2026-01-01'::date,
       100, 500, 'Reglamento Prevención Incendios — multa por no permiso'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- ARCSA (aplica a food + farmacia; opcional consultorio + salón)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'arcsa', true, arcsa_id, 'tecnico_responsable',
       40, 100, 'USD', '2026-01-01'::date,
       500, 5000, 'Ley de Vigilancia Sanitaria Art. 147 — multas por infracciones'
FROM unnest(ARRAY['restaurante','food_truck','cafeteria','panaderia','bar','farmacia']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'arcsa', false, arcsa_id, 'tecnico_responsable',
       40, 100, 'USD', 'Requerido si se venden productos con registro sanitario', '2026-01-01'::date
FROM unnest(ARRAY['consultorio','salon_belleza']) AS bt;

-- Rotulación (condicional — applies_when no NULL, is_mandatory=false)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at, applies_when)
SELECT bt, 'rotulacion', false, gad_quito_id, 'anyone',
       30, 150, 'USD', '2026-01-01'::date,
       'Requerido si el local tiene letrero o rótulo exterior'
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Permiso MSP (consultorio, farmacia obligatorio; gimnasio, salón opcional)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'msp', true, msp_id, 'tecnico_responsable',
       60, 150, 'USD', '2026-01-01'::date,
       500, 3000, 'Ley Orgánica de Salud Art. 6 — sanciones por funcionamiento sin permiso'
FROM unnest(ARRAY['consultorio','farmacia']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'msp', false, msp_id, 'tecnico_responsable',
       60, 150, 'USD', 'Requerido si se ofrecen servicios de salud', '2026-01-01'::date
FROM unnest(ARRAY['gimnasio','salon_belleza']) AS bt;

END $$;
