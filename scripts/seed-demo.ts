/**
 * PermitOps V1 Demo Seed Script
 *
 * Seeds database with Supermaxi Ecuador demo data:
 * - 1 company (Supermaxi Ecuador)
 * - 3 locations (El Bosque, Mall del Sol, Norte)
 * - 12 permits (4 per location)
 * - 1 public link (Mall del Sol)
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Prerequisites:
 *   - Supabase project configured
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 *   - Demo user created: demo@supermaxi.com / Demo2026!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase/types';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqaqhapxqwkvninnyqiu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fixed UUIDs for demo data
const COMPANY_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const LOCATION_IDS = {
  el_bosque: '550e8400-e29b-41d4-a716-446655440001',
  mall_del_sol: '550e8400-e29b-41d4-a716-446655440002',
  norte: '550e8400-e29b-41d4-a716-446655440003',
};

async function seedCompany() {
  console.log('📦 Seeding company...');

  const { data, error } = await supabase
    .from('companies')
    .insert({
      id: COMPANY_ID,
      name: 'Supermaxi Ecuador',
      business_type: 'Retail',
      city: 'Quito',
      location_count: 3,
      regulatory_factors: {
        alimentos: true,
        alcohol: true,
        salud: false,
        quimicos: false,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error seeding company:', error.message);
    throw error;
  }

  console.log('✅ Company created:', data.name);
  return data;
}

async function seedLocations() {
  console.log('📍 Seeding locations...');

  const locations = [
    {
      id: LOCATION_IDS.el_bosque,
      company_id: COMPANY_ID,
      name: 'Supermaxi El Bosque',
      address: 'Av. Eloy Alfaro N39-123, Quito',
      status: 'operando' as const,
      risk_level: 'bajo' as const,
    },
    {
      id: LOCATION_IDS.mall_del_sol,
      company_id: COMPANY_ID,
      name: 'Supermaxi Mall del Sol',
      address: 'Av. Naciones Unidas 234, Quito',
      status: 'operando' as const,
      risk_level: 'medio' as const,
    },
    {
      id: LOCATION_IDS.norte,
      company_id: COMPANY_ID,
      name: 'Supermaxi Norte',
      address: 'Av. 6 de Diciembre N35-45, Quito',
      status: 'operando' as const,
      risk_level: 'alto' as const,
    },
  ];

  const { data, error } = await supabase
    .from('locations')
    .insert(locations)
    .select();

  if (error) {
    console.error('❌ Error seeding locations:', error.message);
    throw error;
  }

  console.log(`✅ Created ${data.length} locations`);
  return data;
}

async function seedPermits() {
  console.log('📋 Seeding permits...');

  // Calculate dates
  const today = new Date();
  const in15Days = new Date(today);
  in15Days.setDate(today.getDate() + 15);
  const ago10Days = new Date(today);
  ago10Days.setDate(today.getDate() - 10);

  const permits = [
    // EL BOSQUE - All vigente (bajo risk)
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.el_bosque,
      type: 'Patente Municipal',
      status: 'vigente' as const,
      permit_number: 'PM-2026-EB-001234',
      issue_date: '2026-01-15',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      notes: 'Renovación anual vigente',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.el_bosque,
      type: 'RUC',
      status: 'vigente' as const,
      permit_number: '1791234567001',
      issue_date: '2020-03-10',
      expiry_date: '2030-03-10',
      issuer: 'Servicio de Rentas Internas (SRI)',
      notes: 'RUC permanente, verificado',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.el_bosque,
      type: 'Permiso Sanitario (ARCSA)',
      status: 'vigente' as const,
      permit_number: 'ARCSA-2026-EB-45678',
      issue_date: '2026-02-01',
      expiry_date: '2027-01-31',
      issuer: 'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
      notes: 'Inspección sanitaria aprobada',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.el_bosque,
      type: 'Permiso de Alcohol (SCPM)',
      status: 'vigente' as const,
      permit_number: 'SCPM-2026-EB-89012',
      issue_date: '2026-01-20',
      expiry_date: '2026-12-31',
      issuer: 'Superintendencia de Control del Poder de Mercado',
      notes: 'Venta de bebidas alcohólicas autorizada',
      is_active: true,
      version: 1,
    },

    // MALL DEL SOL - 3 vigente, 1 por_vencer (medio risk)
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.mall_del_sol,
      type: 'Patente Municipal',
      status: 'vigente' as const,
      permit_number: 'PM-2026-MS-002345',
      issue_date: '2026-01-10',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      notes: 'Renovación anual vigente',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.mall_del_sol,
      type: 'RUC',
      status: 'vigente' as const,
      permit_number: '1791234567001',
      issue_date: '2020-03-10',
      expiry_date: '2030-03-10',
      issuer: 'Servicio de Rentas Internas (SRI)',
      notes: 'RUC permanente, verificado',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.mall_del_sol,
      type: 'Permiso Sanitario (ARCSA)',
      status: 'vigente' as const,
      permit_number: 'ARCSA-2026-MS-56789',
      issue_date: '2026-01-25',
      expiry_date: '2027-01-24',
      issuer: 'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
      notes: 'Inspección sanitaria aprobada',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.mall_del_sol,
      type: 'Permiso de Alcohol (SCPM)',
      status: 'por_vencer' as const,
      permit_number: 'SCPM-2025-MS-78901',
      issue_date: '2025-04-30',
      expiry_date: in15Days.toISOString().split('T')[0],
      issuer: 'Superintendencia de Control del Poder de Mercado',
      notes: 'ALERTA: Vence en 15 días - Programar renovación urgente',
      is_active: true,
      version: 1,
    },

    // NORTE - 2 vigente, 1 vencido, 1 no_registrado (alto risk)
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.norte,
      type: 'Patente Municipal',
      status: 'vigente' as const,
      permit_number: 'PM-2026-NT-003456',
      issue_date: '2026-01-05',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      notes: 'Renovación anual vigente',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.norte,
      type: 'RUC',
      status: 'vigente' as const,
      permit_number: '1791234567001',
      issue_date: '2020-03-10',
      expiry_date: '2030-03-10',
      issuer: 'Servicio de Rentas Internas (SRI)',
      notes: 'RUC permanente, verificado',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.norte,
      type: 'Permiso Sanitario (ARCSA)',
      status: 'vencido' as const,
      permit_number: 'ARCSA-2025-NT-67890',
      issue_date: '2025-04-05',
      expiry_date: ago10Days.toISOString().split('T')[0],
      issuer: 'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
      notes: 'CRÍTICO: Permiso vencido - Renovación inmediata requerida',
      is_active: true,
      version: 1,
    },
    {
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.norte,
      type: 'Permiso de Alcohol (SCPM)',
      status: 'no_registrado' as const,
      permit_number: null,
      issue_date: null,
      expiry_date: null,
      issuer: 'Superintendencia de Control del Poder de Mercado',
      notes: 'CRÍTICO: Permiso no registrado - Iniciar trámite inmediatamente',
      is_active: true,
      version: 1,
    },
  ];

  const { data, error } = await supabase
    .from('permits')
    .insert(permits)
    .select();

  if (error) {
    console.error('❌ Error seeding permits:', error.message);
    throw error;
  }

  console.log(`✅ Created ${data.length} permits`);
  return data;
}

async function seedPublicLink() {
  console.log('🔗 Seeding public link...');

  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  const { data, error } = await supabase
    .from('public_links')
    .insert({
      company_id: COMPANY_ID,
      location_id: LOCATION_IDS.mall_del_sol,
      token: 'demo-mall-del-sol-2026',
      label: 'Inspector Municipal 2026',
      is_active: true,
      view_count: 3,
      last_viewed_at: twoHoursAgo.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error seeding public link:', error.message);
    throw error;
  }

  console.log('✅ Public link created:', data.token);
  console.log(`   URL: ${SUPABASE_URL}/rest/v1/rpc/get_public_permits?link_token=${data.token}`);
  return data;
}

async function checkDemoUser() {
  console.log('👤 Checking for demo user...');

  const { data: { user }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.warn('⚠️  Could not check for demo user (requires service role key)');
    console.log('   Please create manually: demo@supermaxi.com / Demo2026!');
    return null;
  }

  const demoUser = user?.find(u => u.email === 'demo@supermaxi.com');

  if (demoUser) {
    console.log('✅ Demo user exists:', demoUser.email);
    return demoUser;
  } else {
    console.log('⚠️  Demo user not found');
    console.log('   Create in Supabase Dashboard: demo@supermaxi.com / Demo2026!');
    return null;
  }
}

async function seedUserProfile(userId: string) {
  console.log('👤 Seeding user profile...');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      company_id: COMPANY_ID,
      full_name: 'Demo User',
      role: 'admin',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error seeding profile:', error.message);
    throw error;
  }

  console.log('✅ User profile created:', data.full_name);
  return data;
}

async function clearExistingData() {
  console.log('🧹 Clearing existing demo data...');

  // Delete in reverse order of dependencies
  await supabase.from('public_links').delete().eq('company_id', COMPANY_ID);
  await supabase.from('documents').delete().eq('permit_id', COMPANY_ID); // Note: company_id not directly on documents
  await supabase.from('permits').delete().eq('company_id', COMPANY_ID);
  await supabase.from('locations').delete().eq('company_id', COMPANY_ID);
  await supabase.from('profiles').delete().eq('company_id', COMPANY_ID);
  await supabase.from('companies').delete().eq('id', COMPANY_ID);

  console.log('✅ Existing data cleared');
}

async function main() {
  console.log('🌱 Starting PermitOps V1 Demo Seed Script\n');

  try {
    // Clear existing data first
    await clearExistingData();
    console.log('');

    // Seed core data
    await seedCompany();
    await seedLocations();
    await seedPermits();
    await seedPublicLink();

    console.log('');

    // Check for demo user and create profile if exists
    const demoUser = await checkDemoUser();
    if (demoUser) {
      try {
        await seedUserProfile(demoUser.id);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log('ℹ️  Profile already exists for demo user');
        } else {
          throw error;
        }
      }
    }

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   • Company: Supermaxi Ecuador');
    console.log('   • Locations: 3 (El Bosque, Mall del Sol, Norte)');
    console.log('   • Permits: 12 (4 per location)');
    console.log('   • Public Links: 1 (Mall del Sol)');
    console.log('   • Demo User: demo@supermaxi.com / Demo2026!');
    console.log('');
    console.log('🔗 Public Link URL:');
    console.log(`   ${SUPABASE_URL}/rest/v1/rpc/get_public_permits?link_token=demo-mall-del-sol-2026`);
    console.log('');
    console.log('✅ Ready for demo!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
main();
