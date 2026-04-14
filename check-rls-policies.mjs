import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqaqhapxqwkvninnyqiu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA5OTgxNSwiZXhwIjoyMDkxNjc1ODE1fQ.Ugp946oliHqOL81ML1QWrF9yaJUb2FQzew5E3KUlJ44'
);

console.log('🔍 Checking RLS policies...\n');

// Query to check RLS policies
const { data, error } = await supabase.rpc('exec', {
  sql: `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `
});

if (error) {
  console.error('❌ Error querying policies:', error.message);

  // Try alternative query
  console.log('\n🔄 Trying alternative query method...\n');

  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tables) {
    console.log('📋 Tables in public schema:', tables.map(t => t.table_name).join(', '));
  }
} else {
  console.log('✅ RLS Policies found:\n');
  console.log(JSON.stringify(data, null, 2));
}
