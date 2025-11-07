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
          country: string
          created_at: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          photo_reference: string | null
          place_id: string | null
          rating: number | null
          types: string[] | null
        }
        Insert: {
          country: string
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          photo_reference?: string | null
          place_id?: string | null
          rating?: number | null
          types?: string[] | null
        }
        Update: {
          country?: string
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          photo_reference?: string | null
          place_id?: string | null
          rating?: number | null
          types?: string[] | null
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
      itinerary_items: {
        Row: {
          created_at: string
          date: string
          day_number: number
          description: string | null
          id: string
          location: string | null
          time: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_number: number
          description?: string | null
          id?: string
          location?: string | null
          time?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_number?: number
          description?: string | null
          id?: string
          location?: string | null
          time?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      trip_share_role: ["viewer", "editor"],
    },
  },
} as const
