-- Tabla de mapeo categoría → permisos requeridos
CREATE TABLE IF NOT EXISTS permit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  permit_type TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_type, permit_type)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_permit_requirements_business_type ON permit_requirements(business_type);
CREATE INDEX idx_permit_requirements_permit_type ON permit_requirements(permit_type);

-- Restaurante / Cafetería
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('restaurante', 'ruc'),
  ('restaurante', 'patente_municipal'),
  ('restaurante', 'uso_suelo'),
  ('restaurante', 'bomberos'),
  ('restaurante', 'arcsa');

-- Retail General
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('retail', 'ruc'),
  ('retail', 'patente_municipal'),
  ('retail', 'uso_suelo'),
  ('retail', 'bomberos');

-- Consultorio / Clínica
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('consultorio', 'ruc'),
  ('consultorio', 'patente_municipal'),
  ('consultorio', 'uso_suelo'),
  ('consultorio', 'bomberos'),
  ('consultorio', 'arcsa'),
  ('consultorio', 'permiso_ministerio_salud');

-- Food Truck
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('food_truck', 'ruc'),
  ('food_truck', 'patente_municipal'),
  ('food_truck', 'bomberos'),
  ('food_truck', 'arcsa'),
  ('food_truck', 'permiso_movilidad');
