import { supabase } from '../supabase';
import type { Database } from '@/types/database';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
  role: 'admin' | 'operator' | 'viewer';
}

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export async function login(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;

  // Fetch profile - use maybeSingle() to handle potential duplicates
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('No profile found for user');

  return {
    user: data.user,
    profile,
  };
}

export async function register(data: RegisterData) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Create profile
  const profileData: ProfileInsert = {
    id: authData.user.id,
    company_id: data.companyId,
    full_name: data.fullName,
    role: data.role,
  };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(profileData as any)
    .select()
    .single();

  if (profileError) throw profileError;

  return {
    user: authData.user,
    profile,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    // console.log('[getCurrentUser] Step 1: Starting...');
    // console.log('[getCurrentUser] Step 2: Calling supabase.auth.getSession()...');

    // Use getSession() instead of getUser() - more reliable
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    // console.log('[getCurrentUser] Step 3: Session response received');

    if (sessionError) {
      console.error('[getCurrentUser] Session fetch error:', sessionError);
      throw sessionError;
    }
    if (!session) {
      // console.log('[getCurrentUser] No active session found');
      return null;
    }

    const user = session.user;
    // console.log('[getCurrentUser] Step 4: User found from session:', user.email, 'ID:', user.id);
    // console.log('[getCurrentUser] Step 5: Fetching profile...');

    // Use limit(1) instead of maybeSingle() to handle duplicates
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1);

    // console.log('[getCurrentUser] Step 6: Waiting for profile response...');
    const { data: profiles, error: profileError } = await profilePromise;
    // console.log('[getCurrentUser] Step 7: Profile response received');

    if (profileError) {
      console.error('[getCurrentUser] Profile fetch error:', profileError);
      throw profileError;
    }
    if (!profiles || profiles.length === 0) {
      // console.warn('[getCurrentUser] No profile found for user:', user.id);
      return null;
    }

    const profile = profiles[0] as Database['public']['Tables']['profiles']['Row'];
    // console.log('[getCurrentUser] Step 8: SUCCESS - Profile found:', user.email, 'Company:', profile.company_id);

    return {
      user,
      profile,
    };
  } catch (error) {
    console.error('[getCurrentUser] ERROR at some step:', error);
    throw error;
  }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
