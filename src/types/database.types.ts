// Types for Supabase Database Tables
// Update these types based on your actual database schema

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

// Add more table types as needed
// Example:
// export interface YourTable {
//   id: string;
//   ...
// }
