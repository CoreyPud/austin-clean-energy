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
    PostgrestVersion: "14.5"
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
      ae_service_area: {
        Row: {
          geom: unknown
          id: number
          source: string | null
          updated_at: string | null
        }
        Insert: {
          geom: unknown
          id: number
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          geom?: unknown
          id?: number
          source?: string | null
          updated_at?: string | null
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
      campaign_finance_summary: {
        Row: {
          contribution_count: number | null
          created_at: string
          cycle_year: number
          in_district_amount: number | null
          out_district_amount: number | null
          recipient: string
          sector_breakdown: Json | null
          top_employers: Json | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          contribution_count?: number | null
          created_at?: string
          cycle_year: number
          in_district_amount?: number | null
          out_district_amount?: number | null
          recipient: string
          sector_breakdown?: Json | null
          top_employers?: Json | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          contribution_count?: number | null
          created_at?: string
          cycle_year?: number
          in_district_amount?: number | null
          out_district_amount?: number | null
          recipient?: string
          sector_breakdown?: Json | null
          top_employers?: Json | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      council_districts: {
        Row: {
          district_name: string
          district_number: number
          geom: unknown
          source: string | null
          updated_at: string | null
        }
        Insert: {
          district_name: string
          district_number: number
          geom: unknown
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          district_name?: string
          district_number?: number
          geom?: unknown
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      council_members: {
        Row: {
          active: boolean
          created_at: string
          district: number
          finance_alias: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          district: number
          finance_alias?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          district?: number
          finance_alias?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      council_vote_dissents: {
        Row: {
          created_at: string
          id: string
          item_id: string
          vote_cast: string | null
          voter_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          vote_cast?: string | null
          voter_name: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          vote_cast?: string | null
          voter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_vote_dissents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "council_votes"
            referencedColumns: ["item_id"]
          },
        ]
      }
      council_votes: {
        Row: {
          abstain_count: number | null
          action_taken: string | null
          category: string | null
          classification_version: number | null
          classified_at: string | null
          confidence: string | null
          created_at: string
          is_climate: boolean | null
          item_description: string | null
          item_id: string
          item_kind: string | null
          meeting_date: string | null
          no_count: number | null
          other_counts: Json | null
          source_url: string | null
          summary: string | null
          updated_at: string
          yes_count: number | null
        }
        Insert: {
          abstain_count?: number | null
          action_taken?: string | null
          category?: string | null
          classification_version?: number | null
          classified_at?: string | null
          confidence?: string | null
          created_at?: string
          is_climate?: boolean | null
          item_description?: string | null
          item_id: string
          item_kind?: string | null
          meeting_date?: string | null
          no_count?: number | null
          other_counts?: Json | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string
          yes_count?: number | null
        }
        Update: {
          abstain_count?: number | null
          action_taken?: string | null
          category?: string | null
          classification_version?: number | null
          classified_at?: string | null
          confidence?: string | null
          created_at?: string
          is_climate?: boolean | null
          item_description?: string | null
          item_id?: string
          item_kind?: string | null
          meeting_date?: string | null
          no_count?: number | null
          other_counts?: Json | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string
          yes_count?: number | null
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
      election_calendar: {
        Row: {
          created_at: string
          districts_up: number[] | null
          election_date: string
          filing_close: string | null
          filing_open: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          districts_up?: number[] | null
          election_date: string
          filing_close?: string | null
          filing_open?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          districts_up?: number[] | null
          election_date?: string
          filing_close?: string | null
          filing_open?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      election_candidates: {
        Row: {
          candidate_name: string
          created_at: string
          district: number | null
          election_date: string
          finance_alias: string | null
          id: string
          updated_at: string
        }
        Insert: {
          candidate_name: string
          created_at?: string
          district?: number | null
          election_date: string
          finance_alias?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          candidate_name?: string
          created_at?: string
          district?: number | null
          election_date?: string
          finance_alias?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_candidates_election_date_fkey"
            columns: ["election_date"]
            isOneToOne: false
            referencedRelation: "election_calendar"
            referencedColumns: ["election_date"]
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
      lobbyist_clients: {
        Row: {
          business_desc: string | null
          client_name: string | null
          comp_category: string | null
          created_at: string
          id: string
          registrant: string | null
          registrant_id: string | null
          report_id: string | null
          row_id: string | null
          sector_tag: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          business_desc?: string | null
          client_name?: string | null
          comp_category?: string | null
          created_at?: string
          id?: string
          registrant?: string | null
          registrant_id?: string | null
          report_id?: string | null
          row_id?: string | null
          sector_tag?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          business_desc?: string | null
          client_name?: string | null
          comp_category?: string | null
          created_at?: string
          id?: string
          registrant?: string | null
          registrant_id?: string | null
          report_id?: string | null
          row_id?: string | null
          sector_tag?: string | null
          updated_at?: string
          year?: number | null
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tcad_properties: {
        Row: {
          centroid_lat: number | null
          centroid_lon: number | null
          comment: string | null
          council_district: number | null
          county: string | null
          dist_nearest_gas_plant_mi: number | null
          dist_proposed_peaker_mi: number | null
          estimated_roof_sqft: number | null
          has_solar: boolean | null
          in_ae: boolean | null
          land_type_desc: string | null
          market_value: number | null
          optimal_system_size_kw: number | null
          owned_or_rented: string | null
          owner_contact: string | null
          pid: string
          pid_int: number | null
          property_type: string | null
          py_owner_name: string | null
          roof_type: string | null
          situs_address: string | null
          situs_zip: string | null
          solar_buildable_kw: number | null
          solar_eligible_kw: number | null
          solar_fetched_at: string | null
          solar_imagery_date: string | null
          solar_imagery_quality: string | null
          solar_max_area_m2: number | null
          solar_max_panels: number | null
          solar_panel_capacity_w: number | null
          solar_panels_layout: Json | null
          solar_sunshine_hrs: number | null
          solar_sunshine_median: number | null
          stat_cd: string | null
          year_built: number | null
        }
        Insert: {
          centroid_lat?: number | null
          centroid_lon?: number | null
          comment?: string | null
          council_district?: number | null
          county?: string | null
          dist_nearest_gas_plant_mi?: number | null
          dist_proposed_peaker_mi?: number | null
          estimated_roof_sqft?: number | null
          has_solar?: boolean | null
          in_ae?: boolean | null
          land_type_desc?: string | null
          market_value?: number | null
          optimal_system_size_kw?: number | null
          owned_or_rented?: string | null
          owner_contact?: string | null
          pid: string
          pid_int?: number | null
          property_type?: string | null
          py_owner_name?: string | null
          roof_type?: string | null
          situs_address?: string | null
          situs_zip?: string | null
          solar_buildable_kw?: number | null
          solar_eligible_kw?: number | null
          solar_fetched_at?: string | null
          solar_imagery_date?: string | null
          solar_imagery_quality?: string | null
          solar_max_area_m2?: number | null
          solar_max_panels?: number | null
          solar_panel_capacity_w?: number | null
          solar_panels_layout?: Json | null
          solar_sunshine_hrs?: number | null
          solar_sunshine_median?: number | null
          stat_cd?: string | null
          year_built?: number | null
        }
        Update: {
          centroid_lat?: number | null
          centroid_lon?: number | null
          comment?: string | null
          council_district?: number | null
          county?: string | null
          dist_nearest_gas_plant_mi?: number | null
          dist_proposed_peaker_mi?: number | null
          estimated_roof_sqft?: number | null
          has_solar?: boolean | null
          in_ae?: boolean | null
          land_type_desc?: string | null
          market_value?: number | null
          optimal_system_size_kw?: number | null
          owned_or_rented?: string | null
          owner_contact?: string | null
          pid?: string
          pid_int?: number | null
          property_type?: string | null
          py_owner_name?: string | null
          roof_type?: string | null
          situs_address?: string | null
          situs_zip?: string | null
          solar_buildable_kw?: number | null
          solar_eligible_kw?: number | null
          solar_fetched_at?: string | null
          solar_imagery_date?: string | null
          solar_imagery_quality?: string | null
          solar_max_area_m2?: number | null
          solar_max_panels?: number | null
          solar_panel_capacity_w?: number | null
          solar_panels_layout?: Json | null
          solar_sunshine_hrs?: number | null
          solar_sunshine_median?: number | null
          stat_cd?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      tcad_roof_segments: {
        Row: {
          area_m2: number | null
          azimuth_deg: number | null
          center_lat: number | null
          center_lon: number | null
          ground_area_m2: number | null
          max_kw: number | null
          max_panels: number | null
          pid: string
          pitch_deg: number | null
          segment_index: number
          sunshine_max: number | null
          sunshine_median: number | null
          sunshine_quantiles: Json | null
          yearly_energy_kwh: number | null
        }
        Insert: {
          area_m2?: number | null
          azimuth_deg?: number | null
          center_lat?: number | null
          center_lon?: number | null
          ground_area_m2?: number | null
          max_kw?: number | null
          max_panels?: number | null
          pid: string
          pitch_deg?: number | null
          segment_index: number
          sunshine_max?: number | null
          sunshine_median?: number | null
          sunshine_quantiles?: Json | null
          yearly_energy_kwh?: number | null
        }
        Update: {
          area_m2?: number | null
          azimuth_deg?: number | null
          center_lat?: number | null
          center_lon?: number | null
          ground_area_m2?: number | null
          max_kw?: number | null
          max_panels?: number | null
          pid?: string
          pitch_deg?: number | null
          segment_index?: number
          sunshine_max?: number | null
          sunshine_median?: number | null
          sunshine_quantiles?: Json | null
          yearly_energy_kwh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tcad_roof_segments_pid_fkey"
            columns: ["pid"]
            isOneToOne: false
            referencedRelation: "tcad_properties"
            referencedColumns: ["pid"]
          },
        ]
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
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
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
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      enrich_solar_tcad_pids: {
        Args: { _limit?: number; _radius_deg?: number }
        Returns: number
      }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_parcel_pid_by_point: {
        Args: { _lat: number; _lon: number; _radius_deg?: number }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_council_cron_secret: { Args: never; Returns: string }
      get_sync_solar_cron_secret: { Args: never; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      haversine_mi: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      set_council_cron_secret: { Args: { _val: string }; Returns: undefined }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
