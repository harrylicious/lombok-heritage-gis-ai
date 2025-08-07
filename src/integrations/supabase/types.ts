export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          analysis_type: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          error_message: string | null
          id: string
          image_id: string | null
          model_version: string
          processed_by: string | null
          processing_time_ms: number | null
          results: Json
          site_id: string
          status: Database["public"]["Enums"]["analysis_status"] | null
        }
        Insert: {
          analysis_type: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_id?: string | null
          model_version: string
          processed_by?: string | null
          processing_time_ms?: number | null
          results: Json
          site_id: string
          status?: Database["public"]["Enums"]["analysis_status"] | null
        }
        Update: {
          analysis_type?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_id?: string | null
          model_version?: string
          processed_by?: string | null
          processing_time_ms?: number | null
          results?: Json
          site_id?: string
          status?: Database["public"]["Enums"]["analysis_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "site_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_analysis_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conservation_projects: {
        Row: {
          budget: number | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          funding_source: string | null
          id: string
          lead_organization: string | null
          outcomes: string | null
          progress_percentage: number | null
          project_name: string
          project_type: string | null
          site_id: string
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          funding_source?: string | null
          id?: string
          lead_organization?: string | null
          outcomes?: string | null
          progress_percentage?: number | null
          project_name: string
          project_type?: string | null
          site_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          funding_source?: string | null
          id?: string
          lead_organization?: string | null
          outcomes?: string | null
          progress_percentage?: number | null
          project_name?: string
          project_type?: string | null
          site_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conservation_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conservation_projects_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conservation_projects_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_practices: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          documentation_level: string | null
          id: string
          local_name: string | null
          materials_used: string[] | null
          name: string
          practice_type: string | null
          practitioners_count: number | null
          related_sites: string[] | null
          seasonal_timing: string | null
          threat_level: string | null
          tools_required: string[] | null
          transmission_method: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation_level?: string | null
          id?: string
          local_name?: string | null
          materials_used?: string[] | null
          name: string
          practice_type?: string | null
          practitioners_count?: number | null
          related_sites?: string[] | null
          seasonal_timing?: string | null
          threat_level?: string | null
          tools_required?: string[] | null
          transmission_method?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation_level?: string | null
          id?: string
          local_name?: string | null
          materials_used?: string[] | null
          name?: string
          practice_type?: string | null
          practitioners_count?: number | null
          related_sites?: string[] | null
          seasonal_timing?: string | null
          threat_level?: string | null
          tools_required?: string[] | null
          transmission_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_practices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cultural_sites: {
        Row: {
          accessibility_info: string | null
          address: string | null
          altitude: number | null
          category_id: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          cultural_significance_score: number | null
          description: string | null
          district: string | null
          entrance_fee: number | null
          established_year: number | null
          historical_significance: string | null
          id: string
          is_active: boolean | null
          is_unesco_site: boolean | null
          latitude: number
          local_name: string | null
          longitude: number
          name: string
          postal_code: string | null
          preservation_status:
            | Database["public"]["Enums"]["preservation_status"]
            | null
          province: string | null
          regency: string | null
          tourism_popularity_score: number | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          village: string | null
          visiting_hours: string | null
          website_url: string | null
        }
        Insert: {
          accessibility_info?: string | null
          address?: string | null
          altitude?: number | null
          category_id?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          cultural_significance_score?: number | null
          description?: string | null
          district?: string | null
          entrance_fee?: number | null
          established_year?: number | null
          historical_significance?: string | null
          id?: string
          is_active?: boolean | null
          is_unesco_site?: boolean | null
          latitude: number
          local_name?: string | null
          longitude: number
          name: string
          postal_code?: string | null
          preservation_status?:
            | Database["public"]["Enums"]["preservation_status"]
            | null
          province?: string | null
          regency?: string | null
          tourism_popularity_score?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          village?: string | null
          visiting_hours?: string | null
          website_url?: string | null
        }
        Update: {
          accessibility_info?: string | null
          address?: string | null
          altitude?: number | null
          category_id?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          cultural_significance_score?: number | null
          description?: string | null
          district?: string | null
          entrance_fee?: number | null
          established_year?: number | null
          historical_significance?: string | null
          id?: string
          is_active?: boolean | null
          is_unesco_site?: boolean | null
          latitude?: number
          local_name?: string | null
          longitude?: number
          name?: string
          postal_code?: string | null
          preservation_status?:
            | Database["public"]["Enums"]["preservation_status"]
            | null
          province?: string | null
          regency?: string | null
          tourism_popularity_score?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          village?: string | null
          visiting_hours?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_sites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "heritage_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultural_sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cultural_sites_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      heritage_categories: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      historical_records: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string | null
          event_description: string | null
          event_title: string
          historical_period: string | null
          id: string
          significance_level: number | null
          site_id: string
          sources: string[] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_description?: string | null
          event_title: string
          historical_period?: string | null
          id?: string
          significance_level?: number | null
          site_id: string
          sources?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_description?: string | null
          event_title?: string
          historical_period?: string | null
          id?: string
          significance_level?: number | null
          site_id?: string
          sources?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "historical_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          expertise: string[] | null
          full_name: string
          id: string
          is_verified: boolean | null
          location: string | null
          organization: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          expertise?: string[] | null
          full_name: string
          id?: string
          is_verified?: boolean | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          expertise?: string[] | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      route_sites: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean | null
          route_id: string
          sequence_order: number
          site_id: string
          special_notes: string | null
          visit_duration_minutes: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean | null
          route_id: string
          sequence_order: number
          site_id: string
          special_notes?: string | null
          visit_duration_minutes?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean | null
          route_id?: string
          sequence_order?: number
          site_id?: string
          special_notes?: string | null
          visit_duration_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "route_sites_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "tourism_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_media: {
        Row: {
          capture_date: string | null
          created_at: string
          description: string | null
          file_type: string
          file_url: string
          id: string
          is_primary: boolean | null
          metadata: Json | null
          photographer: string | null
          site_id: string
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          capture_date?: string | null
          created_at?: string
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          photographer?: string | null
          site_id: string
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          capture_date?: string | null
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          photographer?: string | null
          site_id?: string
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_media_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_media_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_reviews: {
        Row: {
          accessibility_rating: number | null
          created_at: string
          cultural_authenticity_rating: number | null
          helpful_votes: number | null
          id: string
          is_verified: boolean | null
          rating: number
          recommended_time_to_visit: string | null
          review_text: string | null
          site_id: string
          title: string | null
          updated_at: string
          user_id: string
          visit_date: string | null
        }
        Insert: {
          accessibility_rating?: number | null
          created_at?: string
          cultural_authenticity_rating?: number | null
          helpful_votes?: number | null
          id?: string
          is_verified?: boolean | null
          rating: number
          recommended_time_to_visit?: string | null
          review_text?: string | null
          site_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          visit_date?: string | null
        }
        Update: {
          accessibility_rating?: number | null
          created_at?: string
          cultural_authenticity_rating?: number | null
          helpful_votes?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          recommended_time_to_visit?: string | null
          review_text?: string | null
          site_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_reviews_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "cultural_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_reviews_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_with_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tourism_routes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          ending_point_lat: number | null
          ending_point_lng: number | null
          estimated_cost: number | null
          guide_required: boolean | null
          id: string
          is_active: boolean | null
          max_group_size: number | null
          name: string
          recommended_season: string | null
          route_coordinates: Json | null
          route_type: string | null
          starting_point_lat: number | null
          starting_point_lng: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          ending_point_lat?: number | null
          ending_point_lng?: number | null
          estimated_cost?: number | null
          guide_required?: boolean | null
          id?: string
          is_active?: boolean | null
          max_group_size?: number | null
          name: string
          recommended_season?: string | null
          route_coordinates?: Json | null
          route_type?: string | null
          starting_point_lat?: number | null
          starting_point_lng?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          ending_point_lat?: number | null
          ending_point_lng?: number | null
          estimated_cost?: number | null
          guide_required?: boolean | null
          id?: string
          is_active?: boolean | null
          max_group_size?: number | null
          name?: string
          recommended_season?: string | null
          route_coordinates?: Json | null
          route_type?: string | null
          starting_point_lat?: number | null
          starting_point_lng?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      sites_with_categories: {
        Row: {
          accessibility_info: string | null
          address: string | null
          ai_analysis_count: number | null
          altitude: number | null
          average_rating: number | null
          category_color: string | null
          category_description: string | null
          category_id: string | null
          category_name: string | null
          contact_info: string | null
          created_at: string | null
          created_by: string | null
          cultural_significance_score: number | null
          description: string | null
          district: string | null
          entrance_fee: number | null
          established_year: number | null
          historical_significance: string | null
          id: string | null
          is_active: boolean | null
          is_unesco_site: boolean | null
          latitude: number | null
          local_name: string | null
          longitude: number | null
          name: string | null
          postal_code: string | null
          preservation_status:
            | Database["public"]["Enums"]["preservation_status"]
            | null
          province: string | null
          regency: string | null
          review_count: number | null
          tourism_popularity_score: number | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          village: string | null
          visiting_hours: string | null
          website_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_sites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "heritage_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultural_sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cultural_sites_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analysis_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "requires_review"
      heritage_category:
        | "architecture"
        | "traditional_house"
        | "mosque"
        | "temple"
        | "craft_center"
        | "ceremony_site"
        | "historical_site"
        | "cultural_landscape"
        | "traditional_market"
      preservation_status:
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "critical"
        | "restored"
        | "under_restoration"
      user_role:
        | "admin"
        | "researcher"
        | "guide"
        | "tourist"
        | "local_authority"
        | "cultural_expert"
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
      analysis_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "requires_review",
      ],
      heritage_category: [
        "architecture",
        "traditional_house",
        "mosque",
        "temple",
        "craft_center",
        "ceremony_site",
        "historical_site",
        "cultural_landscape",
        "traditional_market",
      ],
      preservation_status: [
        "excellent",
        "good",
        "fair",
        "poor",
        "critical",
        "restored",
        "under_restoration",
      ],
      user_role: [
        "admin",
        "researcher",
        "guide",
        "tourist",
        "local_authority",
        "cultural_expert",
      ],
    },
  },
} as const
