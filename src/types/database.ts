export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          business_type: string;
          city: string;
          location_count: number;
          regulatory_factors: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          business_type: string;
          city: string;
          location_count?: number;
          regulatory_factors?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          business_type?: string;
          city?: string;
          location_count?: number;
          regulatory_factors?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          address: string;
          status: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          address: string;
          status: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          address?: string;
          status?: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level?: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at?: string;
          updated_at?: string;
        };
      };
      permits: {
        Row: {
          id: string;
          company_id: string;
          location_id: string;
          type: string;
          status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          issuer: string | null;
          notes: string | null;
          is_active: boolean;
          version: number;
          superseded_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          location_id: string;
          type: string;
          status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          is_active?: boolean;
          version?: number;
          superseded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          location_id?: string;
          type?: string;
          status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          is_active?: boolean;
          version?: number;
          superseded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          permit_id: string;
          file_path: string;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          permit_id: string;
          file_path: string;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          permit_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
      };
      public_links: {
        Row: {
          id: string;
          company_id: string;
          location_id: string | null;
          token: string;
          label: string;
          is_active: boolean;
          view_count: number;
          last_viewed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          location_id?: string | null;
          token: string;
          label: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          location_id?: string | null;
          token?: string;
          label?: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          role: 'admin' | 'operator' | 'viewer';
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          role: 'admin' | 'operator' | 'viewer';
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          role?: 'admin' | 'operator' | 'viewer';
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_public_permits: {
        Args: {
          link_token: string;
        };
        Returns: {
          location_name: string;
          location_address: string;
          permit_type: string;
          permit_number: string;
          status: string;
          issue_date: string;
          expiry_date: string;
          issuer: string;
        }[];
      };
    };
  };
}

// Helper types
export type Company = Database['public']['Tables']['companies']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Permit = Database['public']['Tables']['permits']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type PublicLink = Database['public']['Tables']['public_links']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type PermitStatus = Permit['status'];
export type LocationStatus = Location['status'];
export type RiskLevel = Location['risk_level'];
export type UserRole = Profile['role'];
