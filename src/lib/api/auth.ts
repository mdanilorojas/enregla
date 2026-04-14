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
  console.log('[getCurrentUser] Fetching user from Supabase...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('[getCurrentUser] User fetch error:', userError);
    throw userError;
  }
  if (!user) {
    console.log('[getCurrentUser] No user session found');
    return null;
  }

  console.log('[getCurrentUser] User found:', user.email, 'ID:', user.id);

  // Use maybeSingle() to handle potential duplicates gracefully
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[getCurrentUser] Profile fetch error:', profileError);
    throw profileError;
  }
  if (!profile) {
    console.warn('[getCurrentUser] No profile found for user:', user.id);
    return null;
  }

  console.log('[getCurrentUser] Profile found:', profile);

  return {
    user,
    profile,
  };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
