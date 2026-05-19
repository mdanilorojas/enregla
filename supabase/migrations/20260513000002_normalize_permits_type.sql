-- Normalizar permits.type a slugs snake_case.
-- Evidencia: 18 valores distintos con duplicados por casing.
-- Resultado: dashboard joina correctamente con permit_requirements.permit_type.

UPDATE permits SET type = 'bomberos' WHERE type IN ('Bomberos');
UPDATE permits SET type = 'patente_municipal' WHERE type IN ('Patente Municipal');
UPDATE permits SET type = 'ruc' WHERE type IN ('RUC');
UPDATE permits SET type = 'uso_suelo' WHERE type IN ('Uso de Suelo');
UPDATE permits SET type = 'arcsa' WHERE type IN ('Permiso Sanitario (ARCSA)', 'Sanitario');
UPDATE permits SET type = 'rotulacion' WHERE type IN ('Rotulación');
UPDATE permits SET type = 'ambiental' WHERE type IN ('Ambiental');
UPDATE permits SET type = 'permiso_funcionamiento' WHERE type IN ('Funcionamiento');
UPDATE permits SET type = 'permiso_alcohol' WHERE type IN ('Permiso de Alcohol (SCPM)');
UPDATE permits SET type = 'permiso_quimicos' WHERE type IN ('Permiso Químicos (CONSEP)');
UPDATE permits SET type = 'publicidad' WHERE type IN ('Publicidad');

ALTER TABLE permits DROP CONSTRAINT IF EXISTS permits_type_check;
ALTER TABLE permits
  ADD CONSTRAINT permits_type_check
  CHECK (type IN (
    'arcsa','bomberos','luae','msp','patente_municipal','rotulacion','ruc','uso_suelo',
    'ambiental','permiso_funcionamiento','permiso_alcohol','permiso_quimicos',
    'permiso_movilidad','publicidad'
  ));
