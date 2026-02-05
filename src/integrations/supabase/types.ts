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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          id: string
          name: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          end_date: string | null
          id: string
          member_id: string | null
          period: string
          start_date: string
          target_amount: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          end_date?: string | null
          id?: string
          member_id?: string | null
          period?: string
          start_date?: string
          target_amount: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          end_date?: string | null
          id?: string
          member_id?: string | null
          period?: string
          start_date?: string
          target_amount?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          location: string | null
          member_id: string | null
          payment_method: string | null
          person: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          location?: string | null
          member_id?: string | null
          payment_method?: string | null
          person?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          location?: string | null
          member_id?: string | null
          payment_method?: string | null
          person?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      family_members_safe: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      verify_member_pin: {
        Args: { member_name: string; pin_hash_input: string }
        Returns: {
          created_at: string
          id: string
          name: string
        }[]
      }
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
