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
      bookings: {
        Row: {
          address: string | null
          amount: number | null
          booking_number: string
          checkin_date: string | null
          checkout_date: string | null
          created_at: string
          email: string | null
          guest_name: string | null
          id: string
          lang: string | null
          phone: string | null
          raw: Json | null
          tent_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amount?: number | null
          booking_number: string
          checkin_date?: string | null
          checkout_date?: string | null
          created_at?: string
          email?: string | null
          guest_name?: string | null
          id?: string
          lang?: string | null
          phone?: string | null
          raw?: Json | null
          tent_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amount?: number | null
          booking_number?: string
          checkin_date?: string | null
          checkout_date?: string | null
          created_at?: string
          email?: string | null
          guest_name?: string | null
          id?: string
          lang?: string | null
          phone?: string | null
          raw?: Json | null
          tent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      breakfast_deliveries: {
        Row: {
          booking_number: string
          created_at: string
          delivered_at: string | null
          delivered_by: string | null
          delivery_date: string
          id: string
          kind: string
          note: string | null
          sms_error: string | null
          sms_status: string | null
          status: string
          tent_id: string
          updated_at: string
        }
        Insert: {
          booking_number: string
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date: string
          id?: string
          kind?: string
          note?: string | null
          sms_error?: string | null
          sms_status?: string | null
          status?: string
          tent_id: string
          updated_at?: string
        }
        Update: {
          booking_number?: string
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date?: string
          id?: string
          kind?: string
          note?: string | null
          sms_error?: string | null
          sms_status?: string | null
          status?: string
          tent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          visitor_email: string
          visitor_name: string
          visitor_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_email: string
          visitor_name: string
          visitor_token: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_email?: string
          visitor_name?: string
          visitor_token?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_number: string
          checked_in_at: string
          id: string
          lang: string
          tent_id: string
          user_agent: string | null
        }
        Insert: {
          booking_number: string
          checked_in_at?: string
          id?: string
          lang: string
          tent_id: string
          user_agent?: string | null
        }
        Update: {
          booking_number?: string
          checked_in_at?: string
          id?: string
          lang?: string
          tent_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      cleaning_issues: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          photo_path: string | null
          resolved: boolean
          session_id: string | null
          tent_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          photo_path?: string | null
          resolved?: boolean
          session_id?: string | null
          tent_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          photo_path?: string | null
          resolved?: boolean
          session_id?: string | null
          tent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_issues_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cleaning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_sessions: {
        Row: {
          arrival_booking: string | null
          checklist: Json
          cleaning_date: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          guests: number | null
          id: string
          sofa_bed_needed: boolean
          status: string
          tent_id: string
          updated_at: string
        }
        Insert: {
          arrival_booking?: string | null
          checklist?: Json
          cleaning_date?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          guests?: number | null
          id?: string
          sofa_bed_needed?: boolean
          status?: string
          tent_id: string
          updated_at?: string
        }
        Update: {
          arrival_booking?: string | null
          checklist?: Json
          cleaning_date?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          guests?: number | null
          id?: string
          sofa_bed_needed?: boolean
          status?: string
          tent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      click_events: {
        Row: {
          created_at: string
          element_id: string | null
          element_text: string | null
          event_name: string
          id: string
          metadata: Json | null
          path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          event_name: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sms_outbox: {
        Row: {
          body: string
          booking_number: string | null
          cleaning_date_key: string
          created_at: string
          error: string | null
          id: string
          lang: string
          provider_id: string | null
          sent_at: string | null
          status: string
          tent_id: string
          to_phone: string | null
        }
        Insert: {
          body: string
          booking_number?: string | null
          cleaning_date_key?: string
          created_at?: string
          error?: string | null
          id?: string
          lang?: string
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          tent_id: string
          to_phone?: string | null
        }
        Update: {
          body?: string
          booking_number?: string | null
          cleaning_date_key?: string
          created_at?: string
          error?: string | null
          id?: string
          lang?: string
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          tent_id?: string
          to_phone?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tent_stays: {
        Row: {
          adults: number
          booking_number: string
          breakfast: boolean
          checkin_date: string
          checkout_date: string
          children: number
          created_at: string
          dietary: string[]
          dietary_note: string | null
          email: string | null
          fikapase: boolean
          guest_name: string | null
          guests: number | null
          id: string
          lang: string
          late_checkout: boolean
          note: string | null
          phone: string | null
          raw: Json | null
          room_id: string | null
          tent_id: string
        }
        Insert: {
          adults?: number
          booking_number: string
          breakfast?: boolean
          checkin_date: string
          checkout_date: string
          children?: number
          created_at?: string
          dietary?: string[]
          dietary_note?: string | null
          email?: string | null
          fikapase?: boolean
          guest_name?: string | null
          guests?: number | null
          id?: string
          lang?: string
          late_checkout?: boolean
          note?: string | null
          phone?: string | null
          raw?: Json | null
          room_id?: string | null
          tent_id: string
        }
        Update: {
          adults?: number
          booking_number?: string
          breakfast?: boolean
          checkin_date?: string
          checkout_date?: string
          children?: number
          created_at?: string
          dietary?: string[]
          dietary_note?: string | null
          email?: string | null
          fikapase?: boolean
          guest_name?: string | null
          guests?: number | null
          id?: string
          lang?: string
          late_checkout?: boolean
          note?: string | null
          phone?: string | null
          raw?: Json | null
          room_id?: string | null
          tent_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_chat_by_token: { Args: { p_token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_valid_checkin_booking: {
        Args: { p_booking_number: string; p_tent_id: string }
        Returns: boolean
      }
      lookup_booking_for_checkin: {
        Args: { p_booking_number: string }
        Returns: {
          lang: string
          tent_id: string
        }[]
      }
      lookup_booking_for_checkin_by_name: {
        Args: { p_name: string }
        Returns: {
          booking_number: string
          lang: string
          tent_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      post_visitor_chat_message: {
        Args: { p_body: string; p_token: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_stay_dietary: {
        Args: {
          p_booking_number: string
          p_dietary: string[]
          p_dietary_note: string
          p_tent_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "cleaner" | "breakfast"
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
      app_role: ["admin", "moderator", "user", "cleaner", "breakfast"],
    },
  },
} as const
