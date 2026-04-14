-- Script para crear datos de demo para demo@enregla.ec
-- 3 sedes con permisos en varios estados

-- Primero, encontrar el company_id del usuario demo
DO $$
DECLARE
  v_company_id uuid;
  v_sede1_id uuid;
  v_sede2_id uuid;
  v_sede3_id uuid;
BEGIN
  -- Obtener company_id del usuario demo@enregla.ec
  SELECT company_id INTO v_company_id
  FROM user_profiles
  WHERE email = 'demo@enregla.ec';

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuario demo@enregla.ec no encontrado';
  END IF;

  -- Crear 3 sedes
  INSERT INTO locations (company_id, name, address, is_active)
  VALUES
    (v_company_id, 'Sede Principal - Quito', 'Av. Amazonas N24-03 y Wilson, Quito', true),
    (v_company_id, 'Sucursal Guayaquil', 'Av. 9 de Octubre 100 y Malecón, Guayaquil', true),
    (v_company_id, 'Oficina Cuenca', 'Calle Larga 4-92 y Borrero, Cuenca', true)
  RETURNING id INTO v_sede1_id;

  -- Obtener IDs de las otras sedes
  SELECT id INTO v_sede2_id FROM locations WHERE company_id = v_company_id AND name = 'Sucursal Guayaquil';
  SELECT id INTO v_sede3_id FROM locations WHERE company_id = v_company_id AND name = 'Oficina Cuenca';

  -- Crear permisos para Sede Principal (50% vigentes, 25% por vencer, 25% vencidos)
  -- Vigentes
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede1_id, 'Bomberos', 'BOMB-2024-001', 'vigente', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', true),
    (v_company_id, v_sede1_id, 'Funcionamiento', 'FUNC-2024-001', 'vigente', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', true),
    (v_company_id, v_sede1_id, 'Ambiental', 'AMB-2024-001', 'vigente', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', true),
    (v_company_id, v_sede1_id, 'Sanitario', 'SAN-2024-001', 'vigente', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '320 days', true);

  -- Por vencer
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede1_id, 'Uso de Suelo', 'USO-2024-001', 'por_vencer', CURRENT_DATE - INTERVAL '330 days', CURRENT_DATE + INTERVAL '35 days', true),
    (v_company_id, v_sede1_id, 'Patente Municipal', 'PAT-2024-001', 'por_vencer', CURRENT_DATE - INTERVAL '320 days', CURRENT_DATE + INTERVAL '45 days', true);

  -- Vencidos
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede1_id, 'Rotulación', 'ROT-2023-001', 'vencido', CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '35 days', true),
    (v_company_id, v_sede1_id, 'Publicidad', 'PUB-2023-001', 'vencido', CURRENT_DATE - INTERVAL '380 days', CURRENT_DATE - INTERVAL '15 days', true);

  -- Crear permisos para Sucursal Guayaquil (60% vigentes, 20% por vencer, 20% vencidos)
  -- Vigentes
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede2_id, 'Bomberos', 'BOMB-GYE-2024-001', 'vigente', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '345 days', true),
    (v_company_id, v_sede2_id, 'Funcionamiento', 'FUNC-GYE-2024-001', 'vigente', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '325 days', true),
    (v_company_id, v_sede2_id, 'Ambiental', 'AMB-GYE-2024-001', 'vigente', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '315 days', true);

  -- Por vencer
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede2_id, 'Uso de Suelo', 'USO-GYE-2024-001', 'por_vencer', CURRENT_DATE - INTERVAL '335 days', CURRENT_DATE + INTERVAL '30 days', true);

  -- Vencidos
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede2_id, 'Sanitario', 'SAN-GYE-2023-001', 'vencido', CURRENT_DATE - INTERVAL '420 days', CURRENT_DATE - INTERVAL '55 days', true);

  -- Crear permisos para Oficina Cuenca (40% vigentes, 30% por vencer, 30% no registrado)
  -- Vigentes
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede3_id, 'Bomberos', 'BOMB-CUE-2024-001', 'vigente', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '340 days', true),
    (v_company_id, v_sede3_id, 'Funcionamiento', 'FUNC-CUE-2024-001', 'vigente', CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE + INTERVAL '310 days', true);

  -- Por vencer
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, issue_date, expiry_date, is_active)
  VALUES
    (v_company_id, v_sede3_id, 'Ambiental', 'AMB-CUE-2024-001', 'por_vencer', CURRENT_DATE - INTERVAL '340 days', CURRENT_DATE + INTERVAL '25 days', true),
    (v_company_id, v_sede3_id, 'Uso de Suelo', 'USO-CUE-2024-001', 'por_vencer', CURRENT_DATE - INTERVAL '330 days', CURRENT_DATE + INTERVAL '35 days', true);

  -- No registrado (faltan estos permisos)
  INSERT INTO permits (company_id, location_id, permit_type, permit_number, status, is_active)
  VALUES
    (v_company_id, v_sede3_id, 'Sanitario', NULL, 'no_registrado', true),
    (v_company_id, v_sede3_id, 'Patente Municipal', NULL, 'no_registrado', true);

  RAISE NOTICE 'Datos de demo creados exitosamente para company_id: %', v_company_id;
END $$;
