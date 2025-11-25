export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'commerciale' | 'lettore' | 'production' | 'sales' | 'customer_user' | 'lab'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'commerciale' | 'lettore' | 'production' | 'sales' | 'customer_user' | 'lab'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'commerciale' | 'lettore' | 'production' | 'sales' | 'customer_user' | 'lab'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_name: string
          code_prefix: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          province: string | null
          country: string
          vat_number: string | null
          tax_code: string | null
          payment_terms: string
          discount_percentage: number
          price_list_id: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
          codice_cliente: string | null
        }
        Insert: {
          id?: string
          company_name: string
          code_prefix?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          province?: string | null
          country?: string
          vat_number?: string | null
          tax_code?: string | null
          payment_terms?: string
          discount_percentage?: number
          price_list_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          codice_cliente?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          code_prefix?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          province?: string | null
          country?: string
          vat_number?: string | null
          tax_code?: string | null
          payment_terms?: string
          discount_percentage?: number
          price_list_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          codice_cliente?: string | null
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category: string | null
          unit: string
          base_price: number
          cost: number
          weight: number | null
          dimensions: string | null
          stock_quantity: number
          min_stock_level: number
          is_active: boolean
          image_url: string | null
          photo_url: string | null
          photo_thumb_url: string | null
          sds_url: string | null
          st_url: string | null
          brand_name: string | null
          client_product_code: string | null
          supplier_product_code: string | null
          barcode: string | null
          packaging_type: string | null
          regulation: string | null
          product_notes: string | null
          customer_id: string | null
          cartone: string | null
          pallet: string | null
          strati: number | null
          scadenza: string | null
          iva: number | null
          ean: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          category?: string | null
          unit?: string
          base_price?: number
          cost?: number
          weight?: number | null
          dimensions?: string | null
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
          image_url?: string | null
          photo_url?: string | null
          photo_thumb_url?: string | null
          sds_url?: string | null
          st_url?: string | null
          brand_name?: string | null
          client_product_code?: string | null
          supplier_product_code?: string | null
          barcode?: string | null
          packaging_type?: string | null
          regulation?: string | null
          product_notes?: string | null
          customer_id?: string | null
          cartone?: string | null
          pallet?: string | null
          strati?: number | null
          scadenza?: string | null
          iva?: number | null
          ean?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          category?: string | null
          unit?: string
          base_price?: number
          cost?: number
          weight?: number | null
          dimensions?: string | null
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
          image_url?: string | null
          photo_url?: string | null
          photo_thumb_url?: string | null
          sds_url?: string | null
          st_url?: string | null
          brand_name?: string | null
          client_product_code?: string | null
          supplier_product_code?: string | null
          barcode?: string | null
          packaging_type?: string | null
          regulation?: string | null
          product_notes?: string | null
          customer_id?: string | null
          cartone?: string | null
          pallet?: string | null
          strati?: number | null
          scadenza?: string | null
          iva?: number | null
          ean?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      price_lists: {
        Row: {
          id: string
          name: string
          description: string | null
          is_default: boolean
          valid_from: string
          valid_until: string | null
          currency: string
          is_active: boolean
          print_conditions: boolean
          payment_conditions: string | null
          shipping_conditions: string | null
          delivery_conditions: string | null
          brand_conditions: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_default?: boolean
          valid_from?: string
          valid_until?: string | null
          currency?: string
          is_active?: boolean
          print_conditions?: boolean
          payment_conditions?: string | null
          shipping_conditions?: string | null
          delivery_conditions?: string | null
          brand_conditions?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          valid_from?: string
          valid_until?: string | null
          currency?: string
          is_active?: boolean
          print_conditions?: boolean
          payment_conditions?: string | null
          shipping_conditions?: string | null
          delivery_conditions?: string | null
          brand_conditions?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      price_list_items: {
        Row: {
          id: string
          price_list_id: string
          product_id: string
          price: number
          discount_percentage: number
          min_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          price_list_id: string
          product_id: string
          price: number
          discount_percentage?: number
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          price_list_id?: string
          product_id?: string
          price?: number
          discount_percentage?: number
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          quote_number: string
          customer_id: string
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount: number
          tax_amount: number
          discount_amount: number
          notes: string | null
          valid_until: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          quote_number: string
          customer_id: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          valid_until: string
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          quote_number?: string
          customer_id?: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          valid_until?: string
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          quote_id: string | null
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          order_date: string
          delivery_date: string | null
          total_amount: number
          tax_amount: number
          discount_amount: number
          product_id: string | null
          notes: string | null
          shipping_address: string | null
          tracking_number: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          quote_id?: string | null
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          delivery_date?: string | null
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          product_id?: string | null
          shipping_cost?: number
          notes?: string | null
          shipping_address?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          quote_id?: string | null
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          delivery_date?: string | null
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          product_id?: string | null
          shipping_cost?: number
          notes?: string | null
          shipping_address?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_percentage: number
          total_price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          discount_percentage?: number
          total_price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          discount_percentage?: number
          total_price?: number
          notes?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      lab_raw_materials: {
        Row: {
          id: string
          code: string
          name: string
          supplier: string | null
          unit: string
          cost_per_unit: number
          density: number | null
          lead_time_days: number | null
          safety_notes: string | null
          sds_url: string | null
          attachments: Json
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          supplier?: string | null
          unit?: string
          cost_per_unit?: number
          density?: number | null
          lead_time_days?: number | null
          safety_notes?: string | null
          sds_url?: string | null
          attachments?: Json
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          supplier?: string | null
          unit?: string
          cost_per_unit?: number
          density?: number | null
          lead_time_days?: number | null
          safety_notes?: string | null
          sds_url?: string | null
          attachments?: Json
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lab_recipes: {
        Row: {
          id: string
          code: string
          name: string
          version: number
          status: string
          batch_size: number
          unit: string
          target_cost: number | null
          yield_percentage: number | null
          notes: string | null
          instructions: string | null
          attachments: Json
          created_by: string
          approved_by: string | null
          last_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          version?: number
          status?: string
          batch_size?: number
          unit?: string
          target_cost?: number | null
          yield_percentage?: number | null
          notes?: string | null
          instructions?: string | null
          attachments?: Json
          created_by: string
          approved_by?: string | null
          last_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          version?: number
          status?: string
          batch_size?: number
          unit?: string
          target_cost?: number | null
          yield_percentage?: number | null
          notes?: string | null
          instructions?: string | null
          attachments?: Json
          created_by?: string
          approved_by?: string | null
          last_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lab_recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          raw_material_id: string
          percentage: number
          quantity: number | null
          cost_share: number | null
          notes: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          raw_material_id: string
          percentage: number
          quantity?: number | null
          cost_share?: number | null
          notes?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          raw_material_id?: string
          percentage?: number
          quantity?: number | null
          cost_share?: number | null
          notes?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      lab_samples: {
        Row: {
          id: string
          recipe_id: string | null
          customer_id: string | null
          project_name: string
          status: 'draft' | 'pending' | 'in_progress' | 'ready' | 'sent' | 'approved' | 'rejected' | 'archived'
          priority: string
          customization_notes: string | null
          customizations: Json
          attachments: Json
          requested_by: string | null
          due_date: string | null
          produced_at: string | null
          shipped_at: string | null
          cost_override: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id?: string | null
          customer_id?: string | null
          project_name: string
          status?: 'draft' | 'pending' | 'in_progress' | 'ready' | 'sent' | 'approved' | 'rejected' | 'archived'
          priority?: string
          customization_notes?: string | null
          customizations?: Json
          attachments?: Json
          requested_by?: string | null
          due_date?: string | null
          produced_at?: string | null
          shipped_at?: string | null
          cost_override?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string | null
          customer_id?: string | null
          project_name?: string
          status?: 'draft' | 'pending' | 'in_progress' | 'ready' | 'sent' | 'approved' | 'rejected' | 'archived'
          priority?: string
          customization_notes?: string | null
          customizations?: Json
          attachments?: Json
          requested_by?: string | null
          due_date?: string | null
          produced_at?: string | null
          shipped_at?: string | null
          cost_override?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          customer_id: string | null
          customer_name: string | null
          type: 'appointment' | 'call' | 'reminder'
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          location: string | null
          notes: string | null
          reminder_minutes: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          customer_id?: string | null
          customer_name?: string | null
          type: 'appointment' | 'call' | 'reminder'
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          location?: string | null
          notes?: string | null
          reminder_minutes?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          customer_id?: string | null
          customer_name?: string | null
          type?: 'appointment' | 'call' | 'reminder'
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          location?: string | null
          notes?: string | null
          reminder_minutes?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      orders_with_profiles: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          quote_id: string | null
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          order_date: string
          delivery_date: string | null
          total_amount: number
          tax_amount: number
          discount_amount: number
          shipping_cost: number
          notes: string | null
          shipping_address: string | null
          tracking_number: string | null
          created_at: string
          updated_at: string
          created_by: string
          creator_full_name: string | null
          creator_email: string | null
        }
        Insert: {
          [_ in never]: never
        }
        Update: {
          [_ in never]: never
        }
      }
      lab_recipe_costs_view: {
        Row: {
          recipe_id: string
          code: string
          name: string
          version: number
          batch_size: number
          unit: string
          target_cost: number | null
          total_percentage: number
          total_quantity: number
          estimated_batch_cost: number
          estimated_unit_cost: number
          ingredients_count: number
          last_ingredient_update: string | null
          recipe_updated_at: string | null
        }
        Insert: {
          [_ in never]: never
        }
        Update: {
          [_ in never]: never
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'commerciale' | 'lettore' | 'label_user' | 'production' | 'sales' | 'customer_user' | 'lab'
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
      quote_status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
      lab_sample_status: 'draft' | 'pending' | 'in_progress' | 'ready' | 'sent' | 'approved' | 'rejected' | 'archived'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}