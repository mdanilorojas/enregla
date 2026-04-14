import { createClient } from '@supabase/supabase-js';

// Test with anon key (what the frontend uses)
const supabase = createClient(
  'https://zqaqhapxqwkvninnyqiu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTk4MTUsImV4cCI6MjA5MTY3NTgxNX0.OtyJmNiDhlLpuvNmox4qL0qMuwjbgn7R8yD4hkOUXAc'
);

console.log('🧪 Testing profile query WITHOUT auth (should return empty)...\n');

const timeout = setTimeout(() => {
  console.error('❌ Query TIMEOUT after 3s');
  console.error('   This means the query is hanging, likely RLS issue');
  process.exit(1);
}, 3000);

try {
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);

  clearTimeout(timeout);

  if (error) {
    console.error('❌ Query error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
  } else {
    console.log('✅ Query completed (returned', data ? data.length : 0, 'rows)');
    console.log('   This is expected - RLS should block unauthenticated queries');
  }
} catch (err) {
  clearTimeout(timeout);
  console.error('❌ Exception:', err.message);
}

process.exit(0);
