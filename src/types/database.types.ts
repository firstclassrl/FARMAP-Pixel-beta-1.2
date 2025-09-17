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
          role: 'admin' | 'commerciale' | 'lettore'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'commerciale' | 'lettore'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'commerciale' | 'lettore'
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
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'commerciale' | 'lettore' | 'label_user'
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
      quote_status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}