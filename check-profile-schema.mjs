import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqaqhapxqwkvninnyqiu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA5OTgxNSwiZXhwIjoyMDkxNjc1ODE1fQ.Ugp946oliHqOL81ML1QWrF9yaJUb2FQzew5E3KUlJ44'
);

console.log('🔍 Verificando estructura de profiles...\n');

const { data: profiles, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Error:', error.message);
} else if (profiles.length > 0) {
  console.log('📋 Campos en profiles:');
  console.log(JSON.stringify(profiles[0], null, 2));
} else {
  console.log('⚠️ No hay profiles en la tabla');
}

// Get auth user
console.log('\n👤 Verificando auth user...');
const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('❌ Error:', authError.message);
} else {
  console.log(`✅ Usuarios auth: ${users.length}`);
  users.forEach(u => {
    console.log(`   - ${u.email} (ID: ${u.id})`);
  });
}
