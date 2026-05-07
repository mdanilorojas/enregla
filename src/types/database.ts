export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          business_type: string
          city: string
          created_at: string | null
          id: string
          location_count: number | null
          name: string
          ruc: string | null
          updated_at: string | null
        }
        Insert: {
          business_type: string
          city: string
          created_at?: string | null
          id?: string
          location_count?: number | null
          name: string
          ruc?: string | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string
          city?: string
          created_at?: string | null
          id?: string
          location_count?: number | null
          name?: string
          ruc?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          permit_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          permit_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          permit_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          ciudad: string | null
          created_at: string | null
          email: string
          id: string
          negocio: string
          nombre: string
          notas: string | null
          num_sedes: number | null
          referrer: string | null
          source: string
          status: string
          telefono: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          ciudad?: string | null
          created_at?: string | null
          email: string
          id?: string
          negocio: string
          nombre: string
          notas?: string | null
          num_sedes?: number | null
          referrer?: string | null
          source: string
          status?: string
          telefono?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          ciudad?: string | null
          created_at?: string | null
          email?: string
          id?: string
          negocio?: string
          nombre?: string
          notas?: string | null
          num_sedes?: number | null
          referrer?: string | null
          source?: string
          status?: string
          telefono?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      legal_consequences: {
        Row: {
          consequence: string
          created_at: string | null
          display_order: number | null
          id: string
          legal_reference_id: string | null
        }
        Insert: {
          consequence: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          legal_reference_id?: string | null
        }
        Update: {
          consequence?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          legal_reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_consequences_legal_reference_id_fkey"
            columns: ["legal_reference_id"]
            isOneToOne: false
            referencedRelation: "legal_references"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_process_steps: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          legal_reference_id: string | null
          step: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          legal_reference_id?: string | null
          step: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          legal_reference_id?: string | null
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_process_steps_legal_reference_id_fkey"
            columns: ["legal_reference_id"]
            isOneToOne: false
            referencedRelation: "legal_references"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_references: {
        Row: {
          application_form_url: string | null
          applies_to: string[] | null
          business_categories: string[] | null
          created_at: string | null
          description: string
          disclaimer: string | null
          estimated_cost: string | null
          frequency_basis: string
          government_portal_name: string | null
          government_portal_url: string | null
          help_guide_url: string | null
          id: string
          permit_type: string
          updated_at: string | null
        }
        Insert: {
          application_form_url?: string | null
          applies_to?: string[] | null
          business_categories?: string[] | null
          created_at?: string | null
          description: string
          disclaimer?: string | null
          estimated_cost?: string | null
          frequency_basis: string
          government_portal_name?: string | null
          government_portal_url?: string | null
          help_guide_url?: string | null
          id?: string
          permit_type: string
          updated_at?: string | null
        }
        Update: {
          application_form_url?: string | null
          applies_to?: string[] | null
          business_categories?: string[] | null
          created_at?: string | null
          description?: string
          disclaimer?: string | null
          estimated_cost?: string | null
          frequency_basis?: string
          government_portal_name?: string | null
          government_portal_url?: string | null
          help_guide_url?: string | null
          id?: string
          permit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_required_documents: {
        Row: {
          created_at: string | null
          display_order: number | null
          document: string
          id: string
          legal_reference_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          document: string
          id?: string
          legal_reference_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          document?: string
          id?: string
          legal_reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_required_documents_legal_reference_id_fkey"
            columns: ["legal_reference_id"]
            isOneToOne: false
            referencedRelation: "legal_references"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_sources: {
        Row: {
          articles: string | null
          created_at: string | null
          display_order: number | null
          entity: string
          id: string
          legal_reference_id: string | null
          name: string
          scope: string
          short_name: string
          type: string
          url: string | null
        }
        Insert: {
          articles?: string | null
          created_at?: string | null
          display_order?: number | null
          entity: string
          id?: string
          legal_reference_id?: string | null
          name: string
          scope: string
          short_name: string
          type: string
          url?: string | null
        }
        Update: {
          articles?: string | null
          created_at?: string | null
          display_order?: number | null
          entity?: string
          id?: string
          legal_reference_id?: string | null
          name?: string
          scope?: string
          short_name?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_sources_legal_reference_id_fkey"
            columns: ["legal_reference_id"]
            isOneToOne: false
            referencedRelation: "legal_references"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          risk_level: string
          status: string
          updated_at: string | null
        }
        Insert: {
          address: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          risk_level: string
          status: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          risk_level?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string | null
          email_status: string
          error_message: string | null
          id: string
          notification_type: string
          permit_id: string
          resend_message_id: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_status: string
          error_message?: string | null
          id?: string
          notification_type: string
          permit_id: string
          resend_message_id?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_status?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          permit_id?: string
          resend_message_id?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          digest_enabled: boolean | null
          email_enabled: boolean | null
          expiry_alerts_enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_enabled?: boolean | null
          email_enabled?: boolean | null
          expiry_alerts_enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_enabled?: boolean | null
          email_enabled?: boolean | null
          expiry_alerts_enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          assigned_to: string | null
          ciudad: string | null
          contacto_nombre: string | null
          created_at: string | null
          email: string | null
          id: string
          nombre_negocio: string
          notas: string | null
          potencial_clientes_estimado: number | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          score_acceso_decision_makers: number | null
          score_complementariedad: number | null
          score_confianza_clientes: number | null
          score_dolor_frecuente: number | null
          score_mindset_comercial: number | null
          score_riesgo_mal_partner: number | null
          score_total: number | null
          score_velocidad_ejecucion: number | null
          score_velocidad_referir: number | null
          status: string
          telefono: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          ciudad?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre_negocio: string
          notas?: string | null
          potencial_clientes_estimado?: number | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          score_acceso_decision_makers?: number | null
          score_complementariedad?: number | null
          score_confianza_clientes?: number | null
          score_dolor_frecuente?: number | null
          score_mindset_comercial?: number | null
          score_riesgo_mal_partner?: number | null
          score_total?: number | null
          score_velocidad_ejecucion?: number | null
          score_velocidad_referir?: number | null
          status?: string
          telefono?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          ciudad?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre_negocio?: string
          notas?: string | null
          potencial_clientes_estimado?: number | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          score_acceso_decision_makers?: number | null
          score_complementariedad?: number | null
          score_confianza_clientes?: number | null
          score_dolor_frecuente?: number | null
          score_mindset_comercial?: number | null
          score_riesgo_mal_partner?: number | null
          score_total?: number | null
          score_velocidad_ejecucion?: number | null
          score_velocidad_referir?: number | null
          status?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_requirements: {
        Row: {
          business_type: string
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          permit_type: string
        }
        Insert: {
          business_type: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          permit_type: string
        }
        Update: {
          business_type?: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          permit_type?: string
        }
        Relationships: []
      }
      permits: {
        Row: {
          archived_at: string | null
          company_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuer: string | null
          location_id: string | null
          notes: string | null
          permit_number: string | null
          status: string
          superseded_by: string | null
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          location_id?: string | null
          notes?: string | null
          permit_number?: string | null
          status: string
          superseded_by?: string | null
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          location_id?: string | null
          notes?: string | null
          permit_number?: string | null
          status?: string
          superseded_by?: string | null
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_links: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          label: string
          last_viewed_at: string | null
          location_id: string | null
          token: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          last_viewed_at?: string | null
          location_id?: string | null
          token: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          last_viewed_at?: string | null
          location_id?: string | null
          token?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_links_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_expiring_permits: {
        Args: never
        Returns: {
          company_id: string
          expiry_date: string
          location_name: string
          notification_type: string
          permit_id: string
          type: string
        }[]
      }
      get_legal_reference: { Args: { p_permit_type: string }; Returns: Json }
      get_public_permits: {
        Args: { link_token: string }
        Returns: {
          address: string
          expiry_date: string
          issue_date: string
          issuer: string
          location_name: string
          permit_number: string
          permit_type: string
          status: string
        }[]
      }
      user_company_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// -----------------------------------------------
// Helper type aliases (used throughout the app)
// -----------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Company = Database["public"]["Tables"]["companies"]["Row"]
export type Location = Database["public"]["Tables"]["locations"]["Row"]
export type Permit = Database["public"]["Tables"]["permits"]["Row"]
export type Document = Database["public"]["Tables"]["documents"]["Row"]
export type PublicLink = Database["public"]["Tables"]["public_links"]["Row"]
export type PermitRequirement = Database["public"]["Tables"]["permit_requirements"]["Row"]
