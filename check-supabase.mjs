import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqaqhapxqwkvninnyqiu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA5OTgxNSwiZXhwIjoyMDkxNjc1ODE1fQ.Ugp946oliHqOL81ML1QWrF9yaJUb2FQzew5E3KUlJ44';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔌 Conectando a Supabase...\n');

// 1. Check profiles
console.log('📋 Verificando profiles...');
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('*');

if (profilesError) {
  console.error('❌ Error al leer profiles:', profilesError.message);
} else {
  console.log(`✅ Profiles encontrados: ${profiles.length}`);
  profiles.forEach(p => {
    console.log(`   - ${p.email} (company_id: ${p.company_id || 'NULL'})`);
  });
}

// 2. Check companies
console.log('\n🏢 Verificando companies...');
const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('*');

if (companiesError) {
  console.error('❌ Error al leer companies:', companiesError.message);
} else {
  console.log(`✅ Companies encontradas: ${companies.length}`);
  companies.forEach(c => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });
}

// 3. Check locations
console.log('\n📍 Verificando locations...');
const { data: locations, error: locationsError } = await supabase
  .from('locations')
  .select('*');

if (locationsError) {
  console.error('❌ Error al leer locations:', locationsError.message);
} else {
  console.log(`✅ Locations encontradas: ${locations.length}`);
  locations.forEach(l => {
    console.log(`   - ${l.name} (company: ${l.company_id})`);
  });
}

// 4. Check permits
console.log('\n📄 Verificando permits...');
const { data: permits, error: permitsError } = await supabase
  .from('permits')
  .select('id, type, status, location_id');

if (permitsError) {
  console.error('❌ Error al leer permits:', permitsError.message);
} else {
  console.log(`✅ Permits encontrados: ${permits.length}`);

  // Group by status
  const byStatus = permits.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  console.log('   Status breakdown:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`);
  });
}

console.log('\n✨ Verificación completa!');
