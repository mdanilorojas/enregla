import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqaqhapxqwkvninnyqiu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetDemoPassword() {
  const demoEmail = 'demo@enregla.ec';
  const newPassword = 'Demo123!';

  console.log(`Resetting password for ${demoEmail}...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    '4bb8066b-0807-4eb7-81a8-29436b6875ea',
    { password: newPassword }
  );

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✓ Password updated successfully');
  console.log(`  Email: ${demoEmail}`);
  console.log(`  Password: ${newPassword}`);
}

resetDemoPassword();
