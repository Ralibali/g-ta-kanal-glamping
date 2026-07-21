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
      addon_orders: {
        Row: {
          addon_id: string
          booking_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          quantity: number
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          swish_reminder_2h_at: string | null
          swish_reminder_30m_at: string | null
          total_sek: number
          unit_price_sek: number
          updated_at: string
        }
        Insert: {
          addon_id: string
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          swish_reminder_2h_at?: string | null
          swish_reminder_30m_at?: string | null
          total_sek: number
          unit_price_sek: number
          updated_at?: string
        }
        Update: {
          addon_id?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          swish_reminder_2h_at?: string | null
          swish_reminder_30m_at?: string | null
          total_sek?: number
          unit_price_sek?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_orders_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          active: boolean
          created_at: string
          description_en: string | null
          description_sv: string | null
          id: string
          max_quantity: number
          name_en: string
          name_sv: string
          price_sek: number
          slug: string
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_sv?: string | null
          id?: string
          max_quantity?: number
          name_en: string
          name_sv: string
          price_sek: number
          slug: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_sv?: string | null
          id?: string
          max_quantity?: number
          name_en?: string
          name_sv?: string
          price_sek?: number
          slug?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      be_addons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          legacy_addon_id: string | null
          max_quantity: number
          name: string
          name_en: string | null
          price: number
          price_type: string
          property_id: string
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          legacy_addon_id?: string | null
          max_quantity?: number
          name: string
          name_en?: string | null
          price?: number
          price_type?: string
          property_id: string
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          legacy_addon_id?: string | null
          max_quantity?: number
          name?: string
          name_en?: string | null
          price?: number
          price_type?: string
          property_id?: string
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "be_addons_legacy_addon_id_fkey"
            columns: ["legacy_addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "be_addons_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "be_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      be_booking_addons: {
        Row: {
          addon_id: string
          booking_id: string
          created_at: string
          line_total: number
          price_type: string
          quantity: number
          unit_price: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          created_at?: string
          line_total?: number
          price_type?: string
          quantity?: number
          unit_price: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          created_at?: string
          line_total?: number
          price_type?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "be_booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "be_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "be_booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "be_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      be_bookings: {
        Row: {
          addons_total: number
          checkin_date: string
          checkout_date: string
          created_at: string
          external_id: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_token: string
          guests: number | null
          ical_source_id: string | null
          ical_uid: string | null
          id: string
          language: string
          notes: string | null
          payment_amount: number | null
          payment_method: string
          payment_ref: string | null
          payment_status: string
          property_id: string
          public_token: string
          source: string
          status: string
          stripe_session_id: string | null
          total_amount: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          addons_total?: number
          checkin_date: string
          checkout_date: string
          created_at?: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_token?: string
          guests?: number | null
          ical_source_id?: string | null
          ical_uid?: string | null
          id?: string
          language?: string
          notes?: string | null
          payment_amount?: number | null
          payment_method?: string
          payment_ref?: string | null
          payment_status?: string
          property_id: string
          public_token?: string
          source?: string
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          addons_total?: number
          checkin_date?: string
          checkout_date?: string
          created_at?: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_token?: string
          guests?: number | null
          ical_source_id?: string | null
          ical_uid?: string | null
          id?: string
          language?: string
          notes?: string | null
          payment_amount?: number | null
          payment_method?: string
          payment_ref?: string | null
          payment_status?: string
          property_id?: string
          public_token?: string
          source?: string
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "be_bookings_ical_source_id_fkey"
            columns: ["ical_source_id"]
            isOneToOne: false
            referencedRelation: "be_ical_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "be_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "be_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "be_bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "be_units"
            referencedColumns: ["id"]
          },
        ]
      }
      be_ical_sources: {
        Row: {
          active: boolean
          created_at: string
          events_count: number
          id: string
          last_error: string | null
          last_status: string | null
          last_synced_at: string | null
          name: string
          property_id: string
          unit_id: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events_count?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name: string
          property_id: string
          unit_id: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events_count?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name?: string
          property_id?: string
          unit_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "be_ical_sources_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "be_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "be_ical_sources_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "be_units"
            referencedColumns: ["id"]
          },
        ]
      }
      be_properties: {
        Row: {
          active: boolean
          checkin_time: string
          checkout_time: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          directions: string | null
          house_rules: string | null
          id: string
          name: string
          review_url: string | null
          slug: string
          swish_number: string | null
          updated_at: string
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          active?: boolean
          checkin_time?: string
          checkout_time?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          directions?: string | null
          house_rules?: string | null
          id?: string
          name: string
          review_url?: string | null
          slug?: string
          swish_number?: string | null
          updated_at?: string
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          active?: boolean
          checkin_time?: string
          checkout_time?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          directions?: string | null
          house_rules?: string | null
          id?: string
          name?: string
          review_url?: string | null
          slug?: string
          swish_number?: string | null
          updated_at?: string
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: []
      }
      be_units: {
        Row: {
          active: boolean
          base_price: number
          capacity: number
          cleaning_fee: number
          created_at: string
          description: string | null
          door_code: string | null
          external_ref: string | null
          ical_feed_token: string
          id: string
          legacy_tent_id: string | null
          min_stay: number
          monthly_mult: number[]
          name: string
          property_id: string
          sort_order: number
          updated_at: string
          weekend_pct: number
        }
        Insert: {
          active?: boolean
          base_price?: number
          capacity?: number
          cleaning_fee?: number
          created_at?: string
          description?: string | null
          door_code?: string | null
          external_ref?: string | null
          ical_feed_token?: string
          id?: string
          legacy_tent_id?: string | null
          min_stay?: number
          monthly_mult?: number[]
          name: string
          property_id: string
          sort_order?: number
          updated_at?: string
          weekend_pct?: number
        }
        Update: {
          active?: boolean
          base_price?: number
          capacity?: number
          cleaning_fee?: number
          created_at?: string
          description?: string | null
          door_code?: string | null
          external_ref?: string | null
          ical_feed_token?: string
          id?: string
          legacy_tent_id?: string | null
          min_stay?: number
          monthly_mult?: number[]
          name?: string
          property_id?: string
          sort_order?: number
          updated_at?: string
          weekend_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "be_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "be_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          amount: number | null
          booking_number: string
          checkin_date: string | null
          checkout_date: string | null
          country_code: string | null
          created_at: string
          email: string | null
          guest_first_name: string | null
          guest_name: string | null
          id: string
          lang: string | null
          language: string | null
          nights: number | null
          phone: string | null
          public_token: string | null
          raw: Json | null
          reminder_5d_sent_at: string | null
          sirvoy_booking_no: string | null
          tent_id: string | null
          tent_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amount?: number | null
          booking_number: string
          checkin_date?: string | null
          checkout_date?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          guest_first_name?: string | null
          guest_name?: string | null
          id?: string
          lang?: string | null
          language?: string | null
          nights?: number | null
          phone?: string | null
          public_token?: string | null
          raw?: Json | null
          reminder_5d_sent_at?: string | null
          sirvoy_booking_no?: string | null
          tent_id?: string | null
          tent_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amount?: number | null
          booking_number?: string
          checkin_date?: string | null
          checkout_date?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          guest_first_name?: string | null
          guest_name?: string | null
          id?: string
          lang?: string | null
          language?: string | null
          nights?: number | null
          phone?: string | null
          public_token?: string | null
          raw?: Json | null
          reminder_5d_sent_at?: string | null
          sirvoy_booking_no?: string | null
          tent_id?: string | null
          tent_name?: string | null
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
          prepared_at: string | null
          prepared_by: string | null
          prepared_quantity: number | null
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
          prepared_at?: string | null
          prepared_by?: string | null
          prepared_quantity?: number | null
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
          prepared_at?: string | null
          prepared_by?: string | null
          prepared_quantity?: number | null
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
      cleaner_profiles: {
        Row: {
          active: boolean
          bank_account: string | null
          created_at: string
          display_name: string
          email: string | null
          full_name: string | null
          hourly_rate: number
          personnummer: string | null
          sort_order: number
          updated_at: string
          user_id: string
          vacation_pct: number
        }
        Insert: {
          active?: boolean
          bank_account?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number
          personnummer?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
          vacation_pct?: number
        }
        Update: {
          active?: boolean
          bank_account?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number
          personnummer?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
          vacation_pct?: number
        }
        Relationships: []
      }
      cleaning_assignments: {
        Row: {
          assigned_user_id: string
          created_at: string
          created_by: string | null
          note: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          assigned_user_id: string
          created_at?: string
          created_by?: string | null
          note?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          assigned_user_id?: string
          created_at?: string
          created_by?: string | null
          note?: string | null
          updated_at?: string
          work_date?: string
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
      early_checkin_flags: {
        Row: {
          active: boolean
          booking_id: string | null
          created_at: string
          date: string
          id: string
          tent_id: string
        }
        Insert: {
          active?: boolean
          booking_id?: string | null
          created_at?: string
          date: string
          id?: string
          tent_id: string
        }
        Update: {
          active?: boolean
          booking_id?: string | null
          created_at?: string
          date?: string
          id?: string
          tent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "early_checkin_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      employee_availability: {
        Row: {
          created_at: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          work_date?: string
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
      prearrival_messages: {
        Row: {
          booking_id: string
          channel: string
          error: string | null
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          booking_id: string
          channel: string
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          booking_id?: string
          channel?: string
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prearrival_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      self_clean_dates: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          note: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          note?: string | null
        }
        Relationships: []
      }
      short_links: {
        Row: {
          booking_id: string | null
          clicks: number
          created_at: string
          id: string
          slug: string
          target_url: string
        }
        Insert: {
          booking_id?: string | null
          clicks?: number
          created_at?: string
          id?: string
          slug: string
          target_url: string
        }
        Update: {
          booking_id?: string | null
          clicks?: number
          created_at?: string
          id?: string
          slug?: string
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
          breakfast_addon_quantity: number
          breakfast_csv_quantity: number
          checkin_date: string
          checkout_date: string
          children: number
          created_at: string
          dietary: string[]
          dietary_note: string | null
          email: string | null
          fikapase: boolean
          fikapase_addon_quantity: number
          fikapase_csv_quantity: number
          guest_name: string | null
          guests: number | null
          id: string
          import_source: string
          imported_at: string
          lang: string
          late_checkout: boolean
          late_checkout_addon: boolean
          late_checkout_csv: boolean
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
          breakfast_addon_quantity?: number
          breakfast_csv_quantity?: number
          checkin_date: string
          checkout_date: string
          children?: number
          created_at?: string
          dietary?: string[]
          dietary_note?: string | null
          email?: string | null
          fikapase?: boolean
          fikapase_addon_quantity?: number
          fikapase_csv_quantity?: number
          guest_name?: string | null
          guests?: number | null
          id?: string
          import_source?: string
          imported_at?: string
          lang?: string
          late_checkout?: boolean
          late_checkout_addon?: boolean
          late_checkout_csv?: boolean
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
          breakfast_addon_quantity?: number
          breakfast_csv_quantity?: number
          checkin_date?: string
          checkout_date?: string
          children?: number
          created_at?: string
          dietary?: string[]
          dietary_note?: string | null
          email?: string | null
          fikapase?: boolean
          fikapase_addon_quantity?: number
          fikapase_csv_quantity?: number
          guest_name?: string | null
          guests?: number | null
          id?: string
          import_source?: string
          imported_at?: string
          lang?: string
          late_checkout?: boolean
          late_checkout_addon?: boolean
          late_checkout_csv?: boolean
          note?: string | null
          phone?: string | null
          raw?: Json | null
          room_id?: string | null
          tent_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          ended_at: string | null
          hours: number | null
          id: string
          note: string | null
          source: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ended_at?: string | null
          hours?: number | null
          id?: string
          note?: string | null
          source?: string
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ended_at?: string | null
          hours?: number | null
          id?: string
          note?: string | null
          source?: string
          started_at?: string
          updated_at?: string
          user_id?: string
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
      all_bookings_v: {
        Row: {
          checkin_date: string | null
          checkout_date: string | null
          created_at: string | null
          engine: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string | null
          language: string | null
          legacy_tent_id: string | null
          nights: number | null
          payment_status: string | null
          public_token: string | null
          reference: string | null
          status: string | null
          total_amount: number | null
          unit_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_assign_missing_tents: {
        Args: never
        Returns: {
          assigned_tent: string
          booking_number: string
        }[]
      }
      be_check_availability: {
        Args: { p_checkin: string; p_checkout: string; p_property_slug: string }
        Returns: {
          available: boolean
          base_price: number
          capacity: number
          cleaning_fee: number
          unit_id: string
          unit_name: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      find_free_tent: {
        Args: {
          p_checkin: string
          p_checkout: string
          p_exclude_booking?: string
        }
        Returns: string
      }
      get_breakfast_booking_notes: {
        Args: { p_booking_numbers: string[] }
        Returns: {
          booking_number: string
          guest_name: string
          raw: Json
        }[]
      }
      get_chat_by_token: { Args: { p_token: string }; Returns: Json }
      get_cleaner_salary: {
        Args: { p_from: string; p_to: string; p_user_id: string }
        Returns: {
          gross: number
          hourly_rate: number
          hours: number
          total: number
          vacation_pay: number
          vacation_pct: number
        }[]
      }
      get_stay_by_token: { Args: { p_token: string }; Returns: Json }
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
      list_bookings_missing_contact: {
        Args: { p_window_days?: number }
        Returns: {
          booking_number: string
          checkin_date: string
          guest_name: string
          has_email: boolean
          has_phone: boolean
          id: string
          tent_id: string
        }[]
      }
      list_cleaner_display_names: {
        Args: never
        Returns: {
          display_name: string
          sort_order: number
          user_id: string
        }[]
      }
      list_tents_for_booking: {
        Args: { p_booking_number: string }
        Returns: {
          tent_id: string
        }[]
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
      recalculate_booking_addon_sync: {
        Args: { p_booking_id: string; p_slug: string }
        Returns: undefined
      }
      recalculate_booking_operation_quantities: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      recalculate_operations_for_booking_numbers: {
        Args: { p_booking_numbers: string[] }
        Returns: undefined
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
