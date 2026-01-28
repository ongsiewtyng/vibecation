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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          address: string | null
          check_in: string
          check_out: string
          confirmation_number: string | null
          cost: number | null
          created_at: string
          id: string
          is_ai_suggested: boolean | null
          name: string
          notes: string | null
          trip_id: string
        }
        Insert: {
          address?: string | null
          check_in: string
          check_out: string
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          is_ai_suggested?: boolean | null
          name: string
          notes?: string | null
          trip_id: string
        }
        Update: {
          address?: string | null
          check_in?: string
          check_out?: string
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          is_ai_suggested?: boolean | null
          name?: string
          notes?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      airlines_cache: {
        Row: {
          country: string | null
          iata: string
          icao: string | null
          logo_url: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          iata: string
          icao?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          iata?: string
          icao?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      airports_cache: {
        Row: {
          city: string | null
          country: string | null
          iata: string
          icao: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          iata: string
          icao?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          iata?: string
          icao?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      attractions: {
        Row: {
          city: string | null
          country: string
          created_at: string | null
          description: string | null
          formatted_address: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          photo_reference: string | null
          place_id: string | null
          rating: number | null
          types: Json | null
          user_ratings_total: number | null
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string | null
          description?: string | null
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          photo_reference?: string | null
          place_id?: string | null
          rating?: number | null
          types?: Json | null
          user_ratings_total?: number | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          photo_reference?: string | null
          place_id?: string | null
          rating?: number | null
          types?: Json | null
          user_ratings_total?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          notes: string | null
          trip_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          notes?: string | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_tickets: {
        Row: {
          airline: string
          arrival_time: string
          booking_ref: string
          created_at: string | null
          departure_time: string
          flight_date: string
          flight_number: string
          from_city: string
          from_code: string
          id: string
          passenger: string
          seat: string
          to_city: string
          to_code: string
          travel_class: string
          user_id: string | null
        }
        Insert: {
          airline: string
          arrival_time: string
          booking_ref: string
          created_at?: string | null
          departure_time: string
          flight_date: string
          flight_number: string
          from_city: string
          from_code: string
          id?: string
          passenger: string
          seat: string
          to_city: string
          to_code: string
          travel_class: string
          user_id?: string | null
        }
        Update: {
          airline?: string
          arrival_time?: string
          booking_ref?: string
          created_at?: string | null
          departure_time?: string
          flight_date?: string
          flight_number?: string
          from_city?: string
          from_code?: string
          id?: string
          passenger?: string
          seat?: string
          to_city?: string
          to_code?: string
          travel_class?: string
          user_id?: string | null
        }
        Relationships: []
      }
      itinerary_items: {
        Row: {
          created_at: string
          date: string
          day_number: number
          description: string | null
          id: string
          is_ai_suggested: boolean | null
          location: string | null
          time: string | null
          time_of_day: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_number: number
          description?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          location?: string | null
          time?: string | null
          time_of_day?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_number?: number
          description?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          location?: string | null
          time?: string | null
          time_of_day?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item: string
          packed: boolean
          trip_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item: string
          packed?: boolean
          trip_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item?: string
          packed?: boolean
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      public_trip_links: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          share_token: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_token: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_trip_links_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_cells: {
        Row: {
          col_index: number
          created_at: string
          format: Json | null
          formula: string | null
          id: string
          row_index: number
          sheet_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          col_index: number
          created_at?: string
          format?: Json | null
          formula?: string | null
          id?: string
          row_index: number
          sheet_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          col_index?: number
          created_at?: string
          format?: Json | null
          formula?: string | null
          id?: string
          row_index?: number
          sheet_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sheet_cells_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_grid_config: {
        Row: {
          col_count: number
          column_widths: Json | null
          created_at: string
          frozen_cols: number | null
          frozen_rows: number | null
          id: string
          row_count: number
          row_heights: Json | null
          sheet_id: string
          updated_at: string
        }
        Insert: {
          col_count?: number
          column_widths?: Json | null
          created_at?: string
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          row_count?: number
          row_heights?: Json | null
          sheet_id: string
          updated_at?: string
        }
        Update: {
          col_count?: number
          column_widths?: Json | null
          created_at?: string
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          row_count?: number
          row_heights?: Json | null
          sheet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_grid_config_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: true
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheets: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          position: number
          title: string
          type: Database["public"]["Enums"]["sheet_type"]
          updated_at: string
          workbook_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          type?: Database["public"]["Enums"]["sheet_type"]
          updated_at?: string
          workbook_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          type?: Database["public"]["Enums"]["sheet_type"]
          updated_at?: string
          workbook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheets_workbook_id_fkey"
            columns: ["workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      template_attractions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          place_id: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          place_id?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          place_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_attractions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "trip_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_itinerary_items: {
        Row: {
          created_at: string
          day_number: number
          description: string | null
          id: string
          location: string | null
          template_id: string
          time: string | null
          title: string
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          location?: string | null
          template_id: string
          time?: string | null
          title: string
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          location?: string | null
          template_id?: string
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_itinerary_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "trip_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_packing_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item: string
          template_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item: string
          template_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_packing_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "trip_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transports: {
        Row: {
          arrival_time: string | null
          confirmation_number: string | null
          cost: number | null
          created_at: string
          departure_time: string
          from_location: string
          id: string
          notes: string | null
          to_location: string
          trip_id: string
          type: string
        }
        Insert: {
          arrival_time?: string | null
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          departure_time: string
          from_location: string
          id?: string
          notes?: string | null
          to_location: string
          trip_id: string
          type: string
        }
        Update: {
          arrival_time?: string | null
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          departure_time?: string
          from_location?: string
          id?: string
          notes?: string | null
          to_location?: string
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_budget_categories: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string
          currency: string
          id: string
          is_ai_suggested: boolean | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          category: string
          created_at?: string
          currency?: string
          id?: string
          is_ai_suggested?: boolean | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string
          currency?: string
          id?: string
          is_ai_suggested?: boolean | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_budget_categories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_shares: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["trip_share_role"]
          shared_with_email: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["trip_share_role"]
          shared_with_email: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["trip_share_role"]
          shared_with_email?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_templates: {
        Row: {
          country: string
          created_at: string
          description: string | null
          destination: string
          duration_days: number
          id: string
          is_featured: boolean | null
          name: string
          season: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          destination: string
          duration_days: number
          id?: string
          is_featured?: boolean | null
          name: string
          season?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          destination?: string
          duration_days?: number
          id?: string
          is_featured?: boolean | null
          name?: string
          season?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: number | null
          country: string
          created_at: string
          destination: string
          end_date: string
          id: string
          notes: string | null
          owner_id: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          country: string
          created_at?: string
          destination: string
          end_date: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          country?: string
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          home_currency: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          home_currency?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          home_currency?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          country: string
          created_at: string
          id: string
          notes: string | null
          place: string
          priority: number | null
          tags: string[] | null
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          notes?: string | null
          place: string
          priority?: number | null
          tags?: string[] | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          place?: string
          priority?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      workbooks: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          title: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          title?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          title?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workbooks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sheet_type: "itinerary" | "blank" | "budget" | "places" | "packing"
      trip_share_role: "viewer" | "editor"
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
      sheet_type: ["itinerary", "blank", "budget", "places", "packing"],
      trip_share_role: ["viewer", "editor"],
    },
  },
} as const
