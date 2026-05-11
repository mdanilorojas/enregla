-- Ampliar business_type de 4 a 12 valores
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_business_type_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_business_type_check CHECK (business_type IN (
    'restaurante',
    'retail',
    'food_truck',
    'consultorio',
    'cafeteria',
    'panaderia',
    'bar',
    'farmacia',
    'gimnasio',
    'salon_belleza',
    'oficina',
    'otro'
  ));

COMMENT ON COLUMN public.companies.business_type IS
  'Tipo de negocio. Define permisos aplicables via permit_requirements.business_type.';
