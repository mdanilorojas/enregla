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

-- Función para auto-crear permisos al crear una sede
CREATE OR REPLACE FUNCTION auto_create_location_permits()
RETURNS TRIGGER AS $$
DECLARE
  company_business_type TEXT;
  permit_req RECORD;
BEGIN
  -- Obtener business_type de la empresa
  SELECT business_type INTO company_business_type
  FROM companies
  WHERE id = NEW.company_id;

  -- Si no encontramos business_type, retornar sin hacer nada
  -- (la sede quedará sin permisos, riesgo crítico después de 48h)
  IF company_business_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Crear permisos basados en el business_type
  FOR permit_req IN
    SELECT permit_type
    FROM permit_requirements
    WHERE business_type = company_business_type
  LOOP
    INSERT INTO permits (
      company_id,
      location_id,
      type,
      status,
      is_active
    ) VALUES (
      NEW.company_id,
      NEW.id,
      permit_req.permit_type,
      'no_registrado',
      true
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: ejecutar después de INSERT de location
CREATE TRIGGER trigger_auto_create_permits
  AFTER INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_location_permits();
