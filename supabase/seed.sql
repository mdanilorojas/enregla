-- PermitOps V1 Demo Seed Data
-- Supermaxi Ecuador with 3 locations, 12 permits, 1 public link
-- Demo user: demo@supermaxi.com / Demo2026!

-- ==============================================================================
-- IMPORTANT: Demo User Creation
-- ==============================================================================
-- Before running this seed, create the demo user in Supabase Auth:
-- Email: demo@supermaxi.com
-- Password: Demo2026!
-- Then replace 'DEMO_USER_AUTH_ID' below with the actual auth.users ID

-- ==============================================================================
-- 1. COMPANY DATA
-- ==============================================================================
INSERT INTO companies (id, name, business_type, city, location_count, regulatory_factors, created_at, updated_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Supermaxi Ecuador',
  'Retail',
  'Quito',
  3,
  '{"alimentos": true, "alcohol": true, "salud": false, "quimicos": false}'::jsonb,
  NOW() - INTERVAL '90 days',
  NOW()
);

-- ==============================================================================
-- 2. LOCATIONS DATA (3 sedes)
-- ==============================================================================

-- Location 1: El Bosque (all permits OK, bajo risk)
INSERT INTO locations (id, company_id, name, address, status, risk_level, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Supermaxi El Bosque',
  'Av. Eloy Alfaro N39-123, Quito',
  'operando',
  'bajo',
  NOW() - INTERVAL '85 days',
  NOW()
);

-- Location 2: Mall del Sol (1 por_vencer, medio risk, has public link)
INSERT INTO locations (id, company_id, name, address, status, risk_level, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Supermaxi Mall del Sol',
  'Av. Naciones Unidas 234, Quito',
  'operando',
  'medio',
  NOW() - INTERVAL '80 days',
  NOW()
);

-- Location 3: Norte (1 vencido, 1 faltante, alto risk)
INSERT INTO locations (id, company_id, name, address, status, risk_level, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Supermaxi Norte',
  'Av. 6 de Diciembre N35-45, Quito',
  'operando',
  'alto',
  NOW() - INTERVAL '75 days',
  NOW()
);

-- ==============================================================================
-- 3. PERMITS DATA (12 total: 4 per location)
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- LOCATION 1: EL BOSQUE (all vigente, all good)
-- -----------------------------------------------------------------------------

-- Patente Municipal
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae1',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440001',
  'Patente Municipal',
  'vigente',
  'PM-2026-EB-001234',
  '2026-01-15',
  '2026-12-31',
  'Municipio de Quito',
  'Renovación anual vigente',
  true,
  1,
  NOW() - INTERVAL '88 days',
  NOW()
);

-- RUC
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae2',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440001',
  'RUC',
  'vigente',
  '1791234567001',
  '2020-03-10',
  '2030-03-10',
  'Servicio de Rentas Internas (SRI)',
  'RUC permanente, verificado',
  true,
  1,
  NOW() - INTERVAL '88 days',
  NOW()
);

-- Permiso Sanitario ARCSA (alimentos = true)
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae3',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440001',
  'Permiso Sanitario (ARCSA)',
  'vigente',
  'ARCSA-2026-EB-45678',
  '2026-02-01',
  '2027-01-31',
  'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
  'Inspección sanitaria aprobada',
  true,
  1,
  NOW() - INTERVAL '72 days',
  NOW()
);

-- Permiso de Alcohol (alcohol = true)
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae4',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440001',
  'Permiso de Alcohol (SCPM)',
  'vigente',
  'SCPM-2026-EB-89012',
  '2026-01-20',
  '2026-12-31',
  'Superintendencia de Control del Poder de Mercado',
  'Venta de bebidas alcohólicas autorizada',
  true,
  1,
  NOW() - INTERVAL '83 days',
  NOW()
);

-- -----------------------------------------------------------------------------
-- LOCATION 2: MALL DEL SOL (3 vigente, 1 por_vencer - medio risk)
-- -----------------------------------------------------------------------------

-- Patente Municipal
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae5',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'Patente Municipal',
  'vigente',
  'PM-2026-MS-002345',
  '2026-01-10',
  '2026-12-31',
  'Municipio de Quito',
  'Renovación anual vigente',
  true,
  1,
  NOW() - INTERVAL '93 days',
  NOW()
);

-- RUC
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae6',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'RUC',
  'vigente',
  '1791234567001',
  '2020-03-10',
  '2030-03-10',
  'Servicio de Rentas Internas (SRI)',
  'RUC permanente, verificado',
  true,
  1,
  NOW() - INTERVAL '93 days',
  NOW()
);

-- Permiso Sanitario ARCSA
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'Permiso Sanitario (ARCSA)',
  'vigente',
  'ARCSA-2026-MS-56789',
  '2026-01-25',
  '2027-01-24',
  'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
  'Inspección sanitaria aprobada',
  true,
  1,
  NOW() - INTERVAL '78 days',
  NOW()
);

-- Permiso de Alcohol (WARNING: por_vencer en 15 días)
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae8',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'Permiso de Alcohol (SCPM)',
  'por_vencer',
  'SCPM-2025-MS-78901',
  '2025-04-30',
  CURRENT_DATE + INTERVAL '15 days',
  'Superintendencia de Control del Poder de Mercado',
  'ALERTA: Vence en 15 días - Programar renovación urgente',
  true,
  1,
  NOW() - INTERVAL '348 days',
  NOW()
);

-- -----------------------------------------------------------------------------
-- LOCATION 3: NORTE (1 vencido, 1 no_registrado, 2 vigente - alto risk)
-- -----------------------------------------------------------------------------

-- Patente Municipal
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae9',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440003',
  'Patente Municipal',
  'vigente',
  'PM-2026-NT-003456',
  '2026-01-05',
  '2026-12-31',
  'Municipio de Quito',
  'Renovación anual vigente',
  true,
  1,
  NOW() - INTERVAL '98 days',
  NOW()
);

-- RUC
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90aea',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440003',
  'RUC',
  'vigente',
  '1791234567001',
  '2020-03-10',
  '2030-03-10',
  'Servicio de Rentas Internas (SRI)',
  'RUC permanente, verificado',
  true,
  1,
  NOW() - INTERVAL '98 days',
  NOW()
);

-- Permiso Sanitario ARCSA (PROBLEM: vencido hace 10 días)
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90aeb',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440003',
  'Permiso Sanitario (ARCSA)',
  'vencido',
  'ARCSA-2025-NT-67890',
  '2025-04-05',
  CURRENT_DATE - INTERVAL '10 days',
  'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
  'CRÍTICO: Permiso vencido - Renovación inmediata requerida',
  true,
  1,
  NOW() - INTERVAL '373 days',
  NOW() - INTERVAL '5 days'
);

-- Permiso de Alcohol (PROBLEM: no_registrado - faltante)
INSERT INTO permits (id, company_id, location_id, type, status, permit_number, issue_date, expiry_date, issuer, notes, is_active, version, created_at, updated_at)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90aec',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440003',
  'Permiso de Alcohol (SCPM)',
  'no_registrado',
  NULL,
  NULL,
  NULL,
  'Superintendencia de Control del Poder de Mercado',
  'CRÍTICO: Permiso no registrado - Iniciar trámite inmediatamente',
  true,
  1,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- ==============================================================================
-- 4. PUBLIC LINK DATA (1 for Mall del Sol)
-- ==============================================================================
INSERT INTO public_links (id, company_id, location_id, token, label, is_active, view_count, last_viewed_at, created_at, updated_at)
VALUES (
  '9b2c8b6a-0e3f-4d9e-8c7a-5f4e3d2c1b0a',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'demo-mall-del-sol-2026',
  'Inspector Municipal 2026',
  true,
  3,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 hours'
);

-- ==============================================================================
-- 5. USER PROFILE DATA
-- ==============================================================================
-- IMPORTANT: Replace 'DEMO_USER_AUTH_ID' with actual auth.users ID after creating demo user
--
-- Steps to complete:
-- 1. Create user in Supabase Auth Dashboard or via API:
--    - Email: demo@supermaxi.com
--    - Password: Demo2026!
-- 2. Get the user's UUID from auth.users table
-- 3. Run this INSERT with the actual UUID:
--
-- INSERT INTO profiles (id, company_id, full_name, role, is_active, created_at, updated_at)
-- VALUES (
--   'DEMO_USER_AUTH_ID',  -- Replace with actual auth.users UUID
--   'f47ac10b-58cc-4372-a567-0e02b2c3d479',
--   'Demo User',
--   'admin',
--   true,
--   NOW() - INTERVAL '90 days',
--   NOW()
-- );

-- ==============================================================================
-- SEED DATA SUMMARY
-- ==============================================================================
-- Company: Supermaxi Ecuador (f47ac10b-58cc-4372-a567-0e02b2c3d479)
--   - Business: Retail (Supermarket)
--   - Locations: 3
--   - Regulatory: alimentos + alcohol
--
-- Locations:
--   1. El Bosque (bajo) - All 4 permits vigente
--   2. Mall del Sol (medio) - 3 vigente, 1 por_vencer (expires in 15 days)
--   3. Norte (alto) - 2 vigente, 1 vencido, 1 no_registrado
--
-- Permits: 12 total (4 per location)
--   - Patente Municipal (all locations)
--   - RUC (all locations)
--   - Permiso Sanitario ARCSA (all locations - alimentos)
--   - Permiso de Alcohol SCPM (all locations - alcohol)
--
-- Public Link: 1 active
--   - Location: Mall del Sol
--   - Token: demo-mall-del-sol-2026
--   - Label: Inspector Municipal 2026
--   - View Count: 3
--   - URL: https://zqaqhapxqwkvninnyqiu.supabase.co/rest/v1/rpc/get_public_permits?link_token=demo-mall-del-sol-2026
--
-- Demo User: demo@supermaxi.com / Demo2026!
--   - Role: admin
--   - Company: Supermaxi Ecuador
--   - Note: Must be created in Supabase Auth first, then profile linked
--
-- ==============================================================================
-- TESTING CHECKLIST
-- ==============================================================================
-- [ ] Seed data applied successfully
-- [ ] Demo user created in Auth with email demo@supermaxi.com
-- [ ] Profile linked to company
-- [ ] Login works with demo credentials
-- [ ] Dashboard shows 3 locations
-- [ ] El Bosque shows "bajo" risk level (green)
-- [ ] Mall del Sol shows "medio" risk level (yellow) with 1 alert
-- [ ] Norte shows "alto" risk level (red) with 2 issues
-- [ ] Total 12 permits visible across all locations
-- [ ] Public link accessible without auth
-- [ ] Public link view count increments on access
-- [ ] Public link shows only vigente permits
-- ==============================================================================
