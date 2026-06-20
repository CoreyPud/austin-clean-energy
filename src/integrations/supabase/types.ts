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
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      cached_stats: {
        Row: {
          id: string
          label: string
          stat_type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          label: string
          stat_type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          label?: string
          stat_type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      data_match_results: {
        Row: {
          created_at: string
          id: string
          match_confidence: number | null
          match_type: string
          pir_installation_id: string | null
          reviewed_notes: string | null
          solar_installation_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type: string
          pir_installation_id?: string | null
          reviewed_notes?: string | null
          solar_installation_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type?: string
          pir_installation_id?: string | null
          reviewed_notes?: string | null
          solar_installation_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_match_results_pir_installation_id_fkey"
            columns: ["pir_installation_id"]
            isOneToOne: false
            referencedRelation: "pir_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_match_results_solar_installation_id_fkey"
            columns: ["solar_installation_id"]
            isOneToOne: false
            referencedRelation: "solar_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_match_results_solar_installation_id_fkey"
            columns: ["solar_installation_id"]
            isOneToOne: false
            referencedRelation: "solar_installations_view"
            referencedColumns: ["id"]
          },
        ]
      }
      ev_charging_stations: {
        Row: {
          access_code: string | null
          access_days_time: string | null
          city: string | null
          ev_connector_types: string | null
          ev_dc_fast_num: number
          ev_level1_evse_num: number
          ev_level2_evse_num: number
          ev_network: string | null
          ev_pricing: string | null
          facility_type: string | null
          id: number
          latitude: number
          longitude: number
          open_date: string | null
          open_year: number | null
          state: string | null
          station_name: string
          status_code: string | null
          street_address: string | null
          synced_at: string | null
          zip: string | null
        }
        Insert: {
          access_code?: string | null
          access_days_time?: string | null
          city?: string | null
          ev_connector_types?: string | null
          ev_dc_fast_num?: number
          ev_level1_evse_num?: number
          ev_level2_evse_num?: number
          ev_network?: string | null
          ev_pricing?: string | null
          facility_type?: string | null
          id: number
          latitude: number
          longitude: number
          open_date?: string | null
          open_year?: number | null
          state?: string | null
          station_name: string
          status_code?: string | null
          street_address?: string | null
          synced_at?: string | null
          zip?: string | null
        }
        Update: {
          access_code?: string | null
          access_days_time?: string | null
          city?: string | null
          ev_connector_types?: string | null
          ev_dc_fast_num?: number
          ev_level1_evse_num?: number
          ev_level2_evse_num?: number
          ev_network?: string | null
          ev_pricing?: string | null
          facility_type?: string | null
          id?: number
          latitude?: number
          longitude?: number
          open_date?: string | null
          open_year?: number | null
          state?: string | null
          station_name?: string
          status_code?: string | null
          street_address?: string | null
          synced_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      guide_pages: {
        Row: {
          category: string
          content: string
          created_at: string
          icon: string
          id: string
          meta_description: string
          published: boolean
          slug: string
          sort_order: number
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          icon?: string
          id?: string
          meta_description?: string
          published?: boolean
          slug: string
          sort_order?: number
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          icon?: string
          id?: string
          meta_description?: string
          published?: boolean
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      installation_corrections: {
        Row: {
          corrected_address: string | null
          corrected_applied_date: string | null
          corrected_completed_date: string | null
          corrected_description: string | null
          corrected_issued_date: string | null
          corrected_kw: number | null
          corrected_latitude: number | null
          corrected_longitude: number | null
          created_at: string | null
          id: string
          is_duplicate: boolean | null
          notes: string | null
          original_address: string | null
          original_applied_date: string | null
          original_completed_date: string | null
          original_description: string | null
          original_issued_date: string | null
          original_kw: number | null
          original_latitude: number | null
          original_longitude: number | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          corrected_address?: string | null
          corrected_applied_date?: string | null
          corrected_completed_date?: string | null
          corrected_description?: string | null
          corrected_issued_date?: string | null
          corrected_kw?: number | null
          corrected_latitude?: number | null
          corrected_longitude?: number | null
          created_at?: string | null
          id?: string
          is_duplicate?: boolean | null
          notes?: string | null
          original_address?: string | null
          original_applied_date?: string | null
          original_completed_date?: string | null
          original_description?: string | null
          original_issued_date?: string | null
          original_kw?: number | null
          original_latitude?: number | null
          original_longitude?: number | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          corrected_address?: string | null
          corrected_applied_date?: string | null
          corrected_completed_date?: string | null
          corrected_description?: string | null
          corrected_issued_date?: string | null
          corrected_kw?: number | null
          corrected_latitude?: number | null
          corrected_longitude?: number | null
          created_at?: string | null
          id?: string
          is_duplicate?: boolean | null
          notes?: string | null
          original_address?: string | null
          original_applied_date?: string | null
          original_completed_date?: string | null
          original_description?: string | null
          original_issued_date?: string | null
          original_kw?: number | null
          original_latitude?: number | null
          original_longitude?: number | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_files: {
        Row: {
          content: string
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      pir_installations: {
        Row: {
          address: string
          address_normalized: string | null
          created_at: string
          customer_type: string | null
          fuel_type: string | null
          id: string
          interconnection_date: string | null
          pir_number: string | null
          raw_data: Json | null
          system_kw: number | null
          technology: string | null
          updated_at: string
        }
        Insert: {
          address: string
          address_normalized?: string | null
          created_at?: string
          customer_type?: string | null
          fuel_type?: string | null
          id?: string
          interconnection_date?: string | null
          pir_number?: string | null
          raw_data?: Json | null
          system_kw?: number | null
          technology?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          address_normalized?: string | null
          created_at?: string
          customer_type?: string | null
          fuel_type?: string | null
          id?: string
          interconnection_date?: string | null
          pir_number?: string | null
          raw_data?: Json | null
          system_kw?: number | null
          technology?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plant_monthly_gen: {
        Row: {
          avg_mw: number | null
          period: string
          plantid: number
        }
        Insert: {
          avg_mw?: number | null
          period: string
          plantid: number
        }
        Update: {
          avg_mw?: number | null
          period?: string
          plantid?: number
        }
        Relationships: [
          {
            foreignKeyName: "plant_monthly_gen_plantid_fkey"
            columns: ["plantid"]
            isOneToOne: false
            referencedRelation: "power_plants"
            referencedColumns: ["plantid"]
          },
        ]
      }
      power_plants: {
        Row: {
          ae_pct: number | null
          avg_output_mw: number | null
          capacity_mw: number | null
          co2_tons: number | null
          commission_period: string | null
          county: string | null
          fuel: string | null
          latitude: number | null
          longitude: number | null
          owner: string | null
          plant_name: string | null
          plantid: number
          retirement_year: number | null
        }
        Insert: {
          ae_pct?: number | null
          avg_output_mw?: number | null
          capacity_mw?: number | null
          co2_tons?: number | null
          commission_period?: string | null
          county?: string | null
          fuel?: string | null
          latitude?: number | null
          longitude?: number | null
          owner?: string | null
          plant_name?: string | null
          plantid: number
          retirement_year?: number | null
        }
        Update: {
          ae_pct?: number | null
          avg_output_mw?: number | null
          capacity_mw?: number | null
          co2_tons?: number | null
          commission_period?: string | null
          county?: string | null
          fuel?: string | null
          latitude?: number | null
          longitude?: number | null
          owner?: string | null
          plant_name?: string | null
          plantid?: number
          retirement_year?: number | null
        }
        Relationships: []
      }
      proposed_peaker_sites: {
        Row: {
          id: number
          latitude: number
          longitude: number
          name: string
        }
        Insert: {
          id: number
          latitude: number
          longitude: number
          name: string
        }
        Update: {
          id?: number
          latitude?: number
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      solar_installations: {
        Row: {
          address: string
          applied_date: string | null
          calendar_year_issued: number | null
          completed_date: string | null
          contractor_city: string | null
          contractor_company: string | null
          council_district: string | null
          created_at: string | null
          description: string | null
          electrical_valuation: number | null
          id: string
          installed_kw: number | null
          issued_date: string | null
          jurisdiction: string | null
          latitude: number | null
          link: string | null
          longitude: number | null
          original_zip: string | null
          parcel_id: string | null
          permit_class: string | null
          permit_number: string | null
          project_id: string | null
          status_current: string | null
          tcad_pid: number | null
          total_job_valuation: number | null
          updated_at: string | null
          wcad_pid: number | null
        }
        Insert: {
          address: string
          applied_date?: string | null
          calendar_year_issued?: number | null
          completed_date?: string | null
          contractor_city?: string | null
          contractor_company?: string | null
          council_district?: string | null
          created_at?: string | null
          description?: string | null
          electrical_valuation?: number | null
          id?: string
          installed_kw?: number | null
          issued_date?: string | null
          jurisdiction?: string | null
          latitude?: number | null
          link?: string | null
          longitude?: number | null
          original_zip?: string | null
          parcel_id?: string | null
          permit_class?: string | null
          permit_number?: string | null
          project_id?: string | null
          status_current?: string | null
          tcad_pid?: number | null
          total_job_valuation?: number | null
          updated_at?: string | null
          wcad_pid?: number | null
        }
        Update: {
          address?: string
          applied_date?: string | null
          calendar_year_issued?: number | null
          completed_date?: string | null
          contractor_city?: string | null
          contractor_company?: string | null
          council_district?: string | null
          created_at?: string | null
          description?: string | null
          electrical_valuation?: number | null
          id?: string
          installed_kw?: number | null
          issued_date?: string | null
          jurisdiction?: string | null
          latitude?: number | null
          link?: string | null
          longitude?: number | null
          original_zip?: string | null
          parcel_id?: string | null
          permit_class?: string | null
          permit_number?: string | null
          project_id?: string | null
          status_current?: string | null
          tcad_pid?: number | null
          total_job_valuation?: number | null
          updated_at?: string | null
          wcad_pid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_solar_tcad_pid"
            columns: ["tcad_pid"]
            isOneToOne: false
            referencedRelation: "tcad_properties"
            referencedColumns: ["pid_int"]
          },
        ]
      }
      tcad_properties: {
        Row: {
          centroid_lat: number | null
          centroid_lon: number | null
          county: string | null
          dist_nearest_gas_plant_mi: number | null
          dist_proposed_peaker_mi: number | null
          estimated_roof_sqft: number | null
          has_solar: boolean | null
          in_ae: boolean | null
          land_type_desc: string | null
          market_value: number | null
          pid: string
          pid_int: number | null
          property_type: string | null
          py_owner_name: string | null
          situs_address: string | null
          situs_zip: string | null
          stat_cd: string | null
          year_built: number | null
        }
        Insert: {
          centroid_lat?: number | null
          centroid_lon?: number | null
          county?: string | null
          dist_nearest_gas_plant_mi?: number | null
          dist_proposed_peaker_mi?: number | null
          estimated_roof_sqft?: number | null
          has_solar?: boolean | null
          in_ae?: boolean | null
          land_type_desc?: string | null
          market_value?: number | null
          pid: string
          pid_int?: number | null
          property_type?: string | null
          py_owner_name?: string | null
          situs_address?: string | null
          situs_zip?: string | null
          stat_cd?: string | null
          year_built?: number | null
        }
        Update: {
          centroid_lat?: number | null
          centroid_lon?: number | null
          county?: string | null
          dist_nearest_gas_plant_mi?: number | null
          dist_proposed_peaker_mi?: number | null
          estimated_roof_sqft?: number | null
          has_solar?: boolean | null
          in_ae?: boolean | null
          land_type_desc?: string | null
          market_value?: number | null
          pid?: string
          pid_int?: number | null
          property_type?: string | null
          py_owner_name?: string | null
          situs_address?: string | null
          situs_zip?: string | null
          stat_cd?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          discontinued: boolean
          id: number
          make: string
          mi_per_kwh: number | null
          model: string
          mpg: number | null
          msrp: number | null
          range_mi: number | null
          type: string
          used_price: number | null
          year: number
        }
        Insert: {
          discontinued?: boolean
          id?: number
          make: string
          mi_per_kwh?: number | null
          model: string
          mpg?: number | null
          msrp?: number | null
          range_mi?: number | null
          type: string
          used_price?: number | null
          year: number
        }
        Update: {
          discontinued?: boolean
          id?: number
          make?: string
          mi_per_kwh?: number | null
          model?: string
          mpg?: number | null
          msrp?: number | null
          range_mi?: number | null
          type?: string
          used_price?: number | null
          year?: number
        }
        Relationships: []
      }
      volunteer_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          involvement_area: string
          name: string
          notes: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          involvement_area: string
          name: string
          notes?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          involvement_area?: string
          name?: string
          notes?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      solar_installations_view: {
        Row: {
          address: string | null
          applied_date: string | null
          calendar_year_issued: number | null
          completed_date: string | null
          contractor_city: string | null
          contractor_company: string | null
          correction_notes: string | null
          council_district: string | null
          created_at: string | null
          description: string | null
          electrical_valuation: number | null
          has_correction: boolean | null
          id: string | null
          installed_kw: number | null
          is_duplicate: boolean | null
          issued_date: string | null
          jurisdiction: string | null
          latitude: number | null
          link: string | null
          longitude: number | null
          original_zip: string | null
          permit_class: string | null
          permit_number: string | null
          project_id: string | null
          status_current: string | null
          total_job_valuation: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      solar_permits_by_year_class_zip: {
        Row: {
          permit_class: string | null
          solar_count: number | null
          year: number | null
          zip: string | null
        }
        Relationships: []
      }
      tcad_built_by_year_type_zip: {
        Row: {
          built_count: number | null
          property_type: string | null
          year: number | null
          zip: string | null
        }
        Relationships: []
      }
      tcad_solar_adoption_by_year: {
        Row: {
          built_commercial_count: number | null
          built_commercial_sqft: number | null
          built_count: number | null
          built_residential_count: number | null
          built_residential_sqft: number | null
          built_sqft: number | null
          cumulative_adoption_pct: number | null
          cumulative_built: number | null
          cumulative_built_commercial: number | null
          cumulative_built_commercial_sqft: number | null
          cumulative_built_residential: number | null
          cumulative_built_residential_sqft: number | null
          cumulative_built_sqft: number | null
          cumulative_solar: number | null
          cumulative_solar_commercial_sqft: number | null
          cumulative_solar_residential_sqft: number | null
          cumulative_solar_sqft: number | null
          solar_commercial_sqft: number | null
          solar_count: number | null
          solar_residential_sqft: number | null
          solar_sqft: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      enrich_solar_tcad_pids: {
        Args: { _limit?: number; _radius_deg?: number }
        Returns: number
      }
      find_parcel_pid_by_point: {
        Args: { _lat: number; _lon: number; _radius_deg?: number }
        Returns: string
      }
      get_sync_solar_cron_secret: { Args: never; Returns: string }
      haversine_mi: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
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
