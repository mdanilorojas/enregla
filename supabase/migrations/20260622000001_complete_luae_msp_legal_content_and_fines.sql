-- Bucket A: completar data maestra de features existentes (marco legal + sanciones).
-- LUAE y MSP estaban asignados a negocios pero sin contenido en legal_references.
-- Contenido basado en la investigacion legal revisada por abogado (20-jun-2026) +
-- normativa ecuatoriana (Ordenanza 308 DMQ, COOTAD, Ley Organica de Salud).
-- Montos exactos quedan marcados como "confirmar con asesoria legal".

-- Idempotencia: limpiar luae/msp previos (hijos primero por si no hay cascade)
DELETE FROM legal_required_documents WHERE legal_reference_id IN (SELECT id FROM legal_references WHERE permit_type IN ('luae','msp'));
DELETE FROM legal_process_steps    WHERE legal_reference_id IN (SELECT id FROM legal_references WHERE permit_type IN ('luae','msp'));
DELETE FROM legal_sources          WHERE legal_reference_id IN (SELECT id FROM legal_references WHERE permit_type IN ('luae','msp'));
DELETE FROM legal_consequences     WHERE legal_reference_id IN (SELECT id FROM legal_references WHERE permit_type IN ('luae','msp'));
DELETE FROM legal_references WHERE permit_type IN ('luae','msp');

-- ============ LUAE ============
INSERT INTO legal_references (id, permit_type, description, frequency_basis, estimated_cost, disclaimer, applies_to, business_categories, government_portal_url, government_portal_name)
VALUES (
  'd1a1e000-0000-4000-8000-000000000001',
  'luae',
  'La Licencia Metropolitana Unica de Actividades Economicas (LUAE) habilita el ejercicio de actividades economicas en el Distrito Metropolitano de Quito. Integra en un solo tramite: patente municipal, permiso de bomberos, publicidad exterior (rotulos), uso de suelo y, cuando aplica, turismo y control sanitario. Se gestiona en linea y se renueva anualmente.',
  'Renovacion anual. Se rige por la Ordenanza Metropolitana No. 308 y normativa conexa del DMQ. El pago de la patente (componente de la LUAE) suele vencer en marzo.',
  'Variable. La LUAE no tiene tarifa unica: suma los componentes que integra (patente segun patrimonio, tasa de bomberos, publicidad exterior segun m2 de rotulo). Confirmar montos en el simulador del portal municipal y con asesoria legal.',
  'La LUAE es especifica del Distrito Metropolitano de Quito (Ordenanza 308). Otros cantones tienen licencias equivalentes con nombre y proceso distintos (p. ej. Tasa de Habilitacion en Guayaquil). Validar con el GAD correspondiente.',
  '{}',
  ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  'https://pam.quito.gob.ec',
  'Municipio de Quito (PAM)'
);

INSERT INTO legal_required_documents (legal_reference_id, document, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000001','RUC en PDF',0),
('d1a1e000-0000-4000-8000-000000000001','Numero de predio o clave catastral del inmueble',1),
('d1a1e000-0000-4000-8000-000000000001','Cedula del representante legal (ambos lados)',2),
('d1a1e000-0000-4000-8000-000000000001','Certificado de compatibilidad de uso de suelo (ICUS)',3),
('d1a1e000-0000-4000-8000-000000000001','Permiso de bomberos vigente',4),
('d1a1e000-0000-4000-8000-000000000001','Nombre comercial del establecimiento',5),
('d1a1e000-0000-4000-8000-000000000001','Metraje del rotulo / publicidad exterior',6),
('d1a1e000-0000-4000-8000-000000000001','Horario de atencion',7),
('d1a1e000-0000-4000-8000-000000000001','Area util del establecimiento',8),
('d1a1e000-0000-4000-8000-000000000001','Correo electronico activo y numero de telefono',9),
('d1a1e000-0000-4000-8000-000000000001','Acuerdo de Uso de Medios Electronicos firmado',10);

INSERT INTO legal_process_steps (legal_reference_id, step, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000001','Reunir la direccion exacta y los datos catastrales del inmueble (numero de predio / clave catastral)',0),
('d1a1e000-0000-4000-8000-000000000001','Verificar la compatibilidad de uso de suelo (ICUS) para la actividad — paso previo obligatorio',1),
('d1a1e000-0000-4000-8000-000000000001','Crear o activar el usuario en el portal municipal PAM Quito',2),
('d1a1e000-0000-4000-8000-000000000001','Actualizar los datos del usuario municipal',3),
('d1a1e000-0000-4000-8000-000000000001','Descargar, firmar y cargar el Acuerdo de Uso de Medios Electronicos',4),
('d1a1e000-0000-4000-8000-000000000001','Activar los tramites electronicos',5),
('d1a1e000-0000-4000-8000-000000000001','Llenar la solicitud de LUAE y adjuntar la documentacion',6),
('d1a1e000-0000-4000-8000-000000000001','Pagar las tasas correspondientes (patente, bomberos, publicidad)',7),
('d1a1e000-0000-4000-8000-000000000001','Recibir la emision de la LUAE',8);

INSERT INTO legal_consequences (legal_reference_id, consequence, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000001','Clausura del establecimiento por la Agencia Metropolitana de Control',0),
('d1a1e000-0000-4000-8000-000000000001','Multa por ejercer actividad economica sin licencia',1),
('d1a1e000-0000-4000-8000-000000000001','Imposibilidad de operar legalmente y de obtener otros permisos',2),
('d1a1e000-0000-4000-8000-000000000001','Acumulacion de intereses sobre la patente no pagada',3);

INSERT INTO legal_sources (legal_reference_id, name, short_name, type, articles, entity, scope, url, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000001','Ordenanza Metropolitana No. 308 — Licencia Metropolitana Unica de Actividades Economicas','Ordenanza LUAE Quito','ordenanza','Regimen de la LUAE: integra patente, bomberos, publicidad exterior y uso de suelo en un solo tramite','Municipio del Distrito Metropolitano de Quito','municipal','https://www.quito.gob.ec',0),
('d1a1e000-0000-4000-8000-000000000001','Codigo Organico de Organizacion Territorial, Autonomia y Descentralizacion','COOTAD','ley_organica','Art. 546-551 (patente municipal, componente de la LUAE)','Gobiernos Autonomos Descentralizados (GAD)','nacional','https://www.finanzas.gob.ec',1);

-- ============ MSP ============
INSERT INTO legal_references (id, permit_type, description, frequency_basis, estimated_cost, disclaimer, applies_to, business_categories, government_portal_url, government_portal_name)
VALUES (
  'd1a1e000-0000-4000-8000-000000000002',
  'msp',
  'Permiso o licencia del Ministerio de Salud Publica (MSP) y/o ARCSA para establecimientos sujetos a control sanitario: consultorios y establecimientos de salud, farmacias y servicios con componente de salud. Habilita el funcionamiento sanitario del local e incluye obligaciones de manejo de desechos.',
  'Vigencia y renovacion segun el tipo de establecimiento (generalmente anual), conforme a la Ley Organica de Salud y los reglamentos del MSP/ARCSA.',
  'Variable segun el tipo y categoria del establecimiento. Confirmar montos con asesoria legal.',
  'El permiso aplicable depende de la actividad: los establecimientos de salud se licencian ante el MSP; otros establecimientos sujetos a vigilancia obtienen el Permiso de Funcionamiento de ARCSA. Validar el caso especifico.',
  '{}',
  ARRAY['consultorio','farmacia','gimnasio','salon_belleza'],
  'https://www.salud.gob.ec',
  'Ministerio de Salud Publica'
);

INSERT INTO legal_required_documents (legal_reference_id, document, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000002','RUC',0),
('d1a1e000-0000-4000-8000-000000000002','Titulo o registro del profesional responsable tecnico',1),
('d1a1e000-0000-4000-8000-000000000002','Nombramiento del representante legal (si es persona juridica)',2),
('d1a1e000-0000-4000-8000-000000000002','Contrato de arrendamiento o escritura del local',3),
('d1a1e000-0000-4000-8000-000000000002','Planos del establecimiento',4),
('d1a1e000-0000-4000-8000-000000000002','Certificados de salud del personal',5),
('d1a1e000-0000-4000-8000-000000000002','Permiso de bomberos vigente',6),
('d1a1e000-0000-4000-8000-000000000002','Registro como generador de desechos sanitarios',7),
('d1a1e000-0000-4000-8000-000000000002','Plan de gestion de desechos / residuos',8);

INSERT INTO legal_process_steps (legal_reference_id, step, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000002','Verificar la categoria del establecimiento y el permiso aplicable (MSP o ARCSA)',0),
('d1a1e000-0000-4000-8000-000000000002','Designar al responsable tecnico con titulo habilitante',1),
('d1a1e000-0000-4000-8000-000000000002','Reunir la documentacion del local y del personal',2),
('d1a1e000-0000-4000-8000-000000000002','Registrar al establecimiento como generador de desechos sanitarios',3),
('d1a1e000-0000-4000-8000-000000000002','Presentar la solicitud en la plataforma del MSP/ARCSA',4),
('d1a1e000-0000-4000-8000-000000000002','Aprobar la inspeccion sanitaria',5),
('d1a1e000-0000-4000-8000-000000000002','Recibir la emision del permiso/licencia',6);

INSERT INTO legal_consequences (legal_reference_id, consequence, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000002','Clausura sanitaria del establecimiento',0),
('d1a1e000-0000-4000-8000-000000000002','Multa por funcionar sin permiso sanitario',1),
('d1a1e000-0000-4000-8000-000000000002','Suspension de actividades',2),
('d1a1e000-0000-4000-8000-000000000002','Responsabilidad por manejo indebido de desechos',3);

INSERT INTO legal_sources (legal_reference_id, name, short_name, type, articles, entity, scope, url, display_order) VALUES
('d1a1e000-0000-4000-8000-000000000002','Ley Organica de Salud','LOS','ley_organica','Regimen de permisos de funcionamiento y control sanitario de establecimientos','Ministerio de Salud Publica','nacional','https://www.salud.gob.ec',0),
('d1a1e000-0000-4000-8000-000000000002','Reglamento para establecimientos sujetos a control y vigilancia sanitaria','Reglamento ARCSA','reglamento','Permiso de funcionamiento de establecimientos sujetos a vigilancia sanitaria','ARCSA','nacional','https://www.controlsanitario.gob.ec',1),
('d1a1e000-0000-4000-8000-000000000002','Reglamento de gestion de desechos generados en establecimientos de salud','Reglamento desechos sanitarios','reglamento','Obligaciones de generador de desechos sanitarios','MSP / Ministerio del Ambiente','nacional','https://www.salud.gob.ec',2);

-- ============ Documentar sanciones faltantes (27 filas sin multa) ============
-- No se inventan montos; se documenta la BASE LEGAL de la sancion (lo que pide el doc).
UPDATE permit_requirements SET fine_source = 'Ordenanza Metropolitana de Publicidad Exterior (DMQ): retiro del rotulo y multa por publicidad sin autorizacion. Monto variable segun ordenanza; confirmar con el GAD.'
WHERE permit_type = 'rotulacion' AND fine_source IS NULL;

UPDATE permit_requirements SET fine_source = 'COOTAD y ordenanzas de uso de suelo: la incompatibilidad bloquea la LUAE y habilita clausura por uso no compatible. Monto variable; confirmar con el GAD.'
WHERE permit_type = 'uso_suelo' AND fine_source IS NULL;

UPDATE permit_requirements SET fine_source = 'Ley Organica de Salud / Reglamento ARCSA: clausura y multa por funcionamiento sin permiso sanitario. Monto variable.'
WHERE permit_type = 'arcsa' AND fine_source IS NULL;

UPDATE permit_requirements SET fine_source = 'Ordenanza Metropolitana No. 308 (Quito): clausura por la Agencia Metropolitana de Control por operar sin LUAE. Monto variable.'
WHERE permit_type = 'luae' AND fine_source IS NULL;

UPDATE permit_requirements SET fine_source = 'Ley Organica de Salud: clausura sanitaria y multa por establecimiento de salud sin permiso. Monto variable.'
WHERE permit_type = 'msp' AND fine_source IS NULL;
