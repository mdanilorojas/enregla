import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqaqhapxqwkvninnyqiu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA5OTgxNSwiZXhwIjoyMDkxNjc1ODE1fQ.Ugp946oliHqOL81ML1QWrF9yaJUb2FQzew5E3KUlJ44',
  {
    db: { schema: 'public' }
  }
);

console.log('🔧 Configurando políticas RLS en Supabase...\n');

const policies = [
  // Enable RLS
  `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE companies ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE locations ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE permits ENABLE ROW LEVEL SECURITY;`,

  // Drop existing policies if any
  `DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;`,
  `DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;`,
  `DROP POLICY IF EXISTS "Users can view their company" ON companies;`,
  `DROP POLICY IF EXISTS "Users can view locations from their company" ON locations;`,
  `DROP POLICY IF EXISTS "Users can view permits from their company" ON permits;`,

  // PROFILES policies
  `CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);`,

  `CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);`,

  // COMPANIES policy
  `CREATE POLICY "Users can view their company"
    ON companies FOR SELECT
    USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));`,

  // LOCATIONS policy
  `CREATE POLICY "Users can view locations from their company"
    ON locations FOR SELECT
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));`,

  // PERMITS policy
  `CREATE POLICY "Users can view permits from their company"
    ON permits FOR SELECT
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));`,
];

// Execute each policy
for (const sql of policies) {
  const shortSql = sql.substring(0, 60) + '...';
  process.stdout.write(`⏳ ${shortSql} `);

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    // Since exec_sql might not exist, try direct query
    if (error && error.message.includes('exec_sql')) {
      // Fall back to direct SQL execution via a custom endpoint
      // This won't work either, so we'll need to tell user to run manually
      console.log('⚠️  (need manual execution)');
    } else if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      console.log('✅');
    }
  } catch (err) {
    console.log('⚠️  (need manual execution)');
  }
}

console.log('\n⚠️  El SDK de Supabase no permite ejecutar DDL (CREATE POLICY) directamente.');
console.log('📋 Por favor ejecuta este SQL manualmente en el SQL Editor:\n');
console.log('👉 https://supabase.com/dashboard/project/zqaqhapxqwkvninnyqiu/sql/new\n');
console.log('Copia y pega este bloque completo:\n');
console.log('─'.repeat(80));
console.log(policies.join('\n\n'));
console.log('─'.repeat(80));
