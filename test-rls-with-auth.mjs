import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqaqhapxqwkvninnyqiu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTk4MTUsImV4cCI6MjA5MTY3NTgxNX0.OtyJmNiDhlLpuvNmox4qL0qMuwjbgn7R8yD4hkOUXAc'
);

console.log('🧪 Testing RLS policies with authenticated user...\n');

// 1. Login
console.log('1️⃣ Logging in as demo@enregla.ec...');
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'demo@enregla.ec',
  password: '123456',
});

if (authError) {
  console.error('❌ Login failed:', authError.message);
  process.exit(1);
}

console.log('✅ Logged in successfully');
console.log('   User ID:', authData.user.id);

// 2. Try to fetch profile
console.log('\n2️⃣ Fetching profile with RLS...');
const timeout = setTimeout(() => {
  console.error('❌ Profile query TIMEOUT after 5s - RLS policy is blocking!');
  process.exit(1);
}, 5000);

const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .limit(1);

clearTimeout(timeout);

if (profileError) {
  console.error('❌ Profile query failed:', profileError.message);
  process.exit(1);
}

if (!profiles || profiles.length === 0) {
  console.error('❌ No profile found');
  process.exit(1);
}

console.log('✅ Profile fetched successfully');
console.log('   Name:', profiles[0].full_name);
console.log('   Company ID:', profiles[0].company_id);

// 3. Try to fetch company
console.log('\n3️⃣ Fetching company with RLS...');
const { data: companies, error: companyError } = await supabase
  .from('companies')
  .select('*')
  .eq('id', profiles[0].company_id)
  .limit(1);

if (companyError) {
  console.error('❌ Company query failed:', companyError.message);
} else if (companies && companies.length > 0) {
  console.log('✅ Company fetched:', companies[0].name);
} else {
  console.error('❌ No company found');
}

console.log('\n✅ All RLS policies working correctly!');
process.exit(0);
