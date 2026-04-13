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

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw profileError;

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
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

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
