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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_donors: {
        Row: {
          available: boolean
          blood_group: string
          city: string
          created_at: string
          full_name: string
          id: string
          last_donation_date: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          blood_group: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          last_donation_date?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          blood_group?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          last_donation_date?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergencies: {
        Row: {
          address: string | null
          ai_first_aid: string[] | null
          ai_recommendation: string | null
          ai_summary: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          latitude: number | null
          live_status: string
          location_updated_at: string | null
          longitude: number | null
          notes: string | null
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          ai_first_aid?: string[] | null
          ai_recommendation?: string | null
          ai_summary?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          latitude?: number | null
          live_status?: string
          location_updated_at?: string | null
          longitude?: number | null
          notes?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          ai_first_aid?: string[] | null
          ai_recommendation?: string | null
          ai_summary?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          latitude?: number | null
          live_status?: string
          location_updated_at?: string | null
          longitude?: number | null
          notes?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_alert_deliveries: {
        Row: {
          channel: string
          contact_email: string | null
          contact_id: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          emergency_id: string
          error: string | null
          id: string
          kind: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          contact_email?: string | null
          contact_id?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          emergency_id: string
          error?: string | null
          id?: string
          kind?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          contact_email?: string | null
          contact_id?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          emergency_id?: string
          error?: string | null
          id?: string
          kind?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alert_deliveries_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_guardian: boolean
          name: string
          phone: string
          position: number
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_guardian?: boolean
          name: string
          phone: string
          position?: number
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_guardian?: boolean
          name?: string
          phone?: string
          position?: number
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_events: {
        Row: {
          created_at: string
          detail: string | null
          emergency_id: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          emergency_id: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          emergency_id?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_events_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_places: {
        Row: {
          address: string | null
          category: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          place_key: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          place_key: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          place_key?: string
          user_id?: string
        }
        Relationships: []
      }
      guardian_sessions: {
        Row: {
          active: boolean
          created_at: string
          emergency_id: string
          expires_at: string | null
          guardian_contact_id: string | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emergency_id: string
          expires_at?: string | null
          guardian_contact_id?: string | null
          guardian_email?: string | null
          guardian_name: string
          guardian_phone?: string | null
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emergency_id?: string
          expires_at?: string | null
          guardian_contact_id?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_sessions_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_sessions_guardian_contact_id_fkey"
            columns: ["guardian_contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          emergency_id: string
          id: string
          latitude: number
          longitude: number
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          emergency_id: string
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          emergency_id?: string
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          crash_detection: boolean
          created_at: string
          current_city: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          home_address: string | null
          id: string
          language: string
          location_sharing: boolean
          medical_conditions: string | null
          medications: string | null
          notify_emergency: boolean
          notify_safety_tips: boolean
          notify_system: boolean
          onboarding_completed: boolean
          phone: string | null
          safety_score: number
          theme: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          crash_detection?: boolean
          created_at?: string
          current_city?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          home_address?: string | null
          id: string
          language?: string
          location_sharing?: boolean
          medical_conditions?: string | null
          medications?: string | null
          notify_emergency?: boolean
          notify_safety_tips?: boolean
          notify_system?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          safety_score?: number
          theme?: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          crash_detection?: boolean
          created_at?: string
          current_city?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          home_address?: string | null
          id?: string
          language?: string
          location_sharing?: boolean
          medical_conditions?: string | null
          medications?: string | null
          notify_emergency?: boolean
          notify_safety_tips?: boolean
          notify_system?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          safety_score?: number
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_checkins: {
        Row: {
          confirmed_at: string | null
          created_at: string
          due_at: string
          emergency_id: string | null
          id: string
          label: string
          note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          due_at: string
          emergency_id?: string | null
          id?: string
          label: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          due_at?: string
          emergency_id?: string | null
          id?: string
          label?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_checkins_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          active: boolean
          created_at: string
          emergency_id: string | null
          expires_at: string | null
          id: string
          kind: string
          token: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emergency_id?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          token: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emergency_id?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_donor_phone: { Args: { _donor_id: string }; Returns: string }
      get_guardian_view: {
        Args: { _emergency_id: string; _token: string }
        Returns: Json
      }
      get_shared_location: { Args: { _token: string }; Returns: Json }
      get_shared_profile: { Args: { _token: string }; Returns: Json }
      get_shared_track: {
        Args: { _token: string }
        Returns: {
          accuracy: number
          created_at: string
          latitude: number
          longitude: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_blood_donors: {
        Args: { _city?: string; _group?: string }
        Returns: {
          available: boolean
          blood_group: string
          city: string
          full_name: string
          id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
