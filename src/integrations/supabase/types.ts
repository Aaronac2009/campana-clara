export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          attribution: string
          author: string
          created_at: string
          created_by: string
          id: string
          institution_id: string
          kind: string
          license: string
          mime: string
          size_bytes: number
          source_url: string
          storage_path: string
          tags: string[]
          title: string
          verified_at: string | null
        }
        Insert: {
          attribution?: string
          author?: string
          created_at?: string
          created_by?: string
          id?: string
          institution_id: string
          kind: string
          license?: string
          mime: string
          size_bytes: number
          source_url?: string
          storage_path: string
          tags?: string[]
          title?: string
          verified_at?: string | null
        }
        Update: {
          attribution?: string
          author?: string
          created_at?: string
          created_by?: string
          id?: string
          institution_id?: string
          kind?: string
          license?: string
          mime?: string
          size_bytes?: number
          source_url?: string
          storage_path?: string
          tags?: string[]
          title?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          detail: Json
          id: number
          institution_id: string | null
          target: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          detail?: Json
          id?: never
          institution_id?: string | null
          target: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          detail?: Json
          id?: never
          institution_id?: string | null
          target?: string
        }
        Relationships: []
      }
      campaign_versions: {
        Row: {
          author: string | null
          campaign_id: string
          created_at: string
          id: string
          institution_id: string
          snapshot: Json
        }
        Insert: {
          author?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          institution_id: string
          snapshot: Json
        }
        Update: {
          author?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          institution_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaign_versions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          content_en: Json
          content_es: Json
          created_at: string
          created_by: string
          data: Json
          id: string
          institution_id: string
          local_id: string | null
          sources: string
          status: string
          title_en: string
          title_es: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_en?: Json
          content_es?: Json
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          institution_id: string
          local_id?: string | null
          sources?: string
          status?: string
          title_en?: string
          title_es?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_en?: Json
          content_es?: Json
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          institution_id?: string
          local_id?: string | null
          sources?: string
          status?: string
          title_en?: string
          title_es?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: string
          name: string
          region: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          name: string
          region?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          name?: string
          region?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          institution_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          institution_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          institution_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          locale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          locale?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          locale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          campaign_id: string
          comment: string
          created_at: string
          decision: string
          id: string
          institution_id: string
          lang: string
          reviewer: string
        }
        Insert: {
          campaign_id: string
          comment?: string
          created_at?: string
          decision: string
          id?: string
          institution_id: string
          lang: string
          reviewer: string
        }
        Update: {
          campaign_id?: string
          comment?: string
          created_at?: string
          decision?: string
          id?: string
          institution_id?: string
          lang?: string
          reviewer?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          institution_id: string
          layout: Json
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          institution_id: string
          layout?: Json
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          institution_id?: string
          layout?: Json
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_member_by_email: {
        Args: {
          _email: string
          _inst: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      create_institution: {
        Args: { _kind: string; _name: string; _region: string }
        Returns: string
      }
      decide_review: {
        Args: {
          _campaign: string
          _comment: string
          _decision: string
          _lang: string
        }
        Returns: string
      }
      has_inst_role: {
        Args: {
          _inst: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _uid: string
        }
        Returns: boolean
      }
      inst_role: {
        Args: { _inst: string; _uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_member: { Args: { _inst: string; _uid: string }; Returns: boolean }
      is_platform_admin: { Args: { _uid: string }; Returns: boolean }
      shares_institution: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "reviewer" | "reader"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "reviewer", "reader"],
    },
  },
} as const
