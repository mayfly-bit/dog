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
      dogs: {
        Row: {
          id: string
          name: string
          breed: string
          gender: 'male' | 'female'
          birth_date: string
          status: 'owned' | 'sold' | 'deceased' | 'returned'
          photo_urls: string[]
          sire_id: string | null
          dam_id: string | null
          created_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          breed: string
          gender: 'male' | 'female'
          birth_date: string
          status?: 'owned' | 'sold' | 'deceased' | 'returned'
          photo_urls?: string[]
          sire_id?: string | null
          dam_id?: string | null
          created_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          breed?: string
          gender?: 'male' | 'female'
          birth_date?: string
          status?: 'owned' | 'sold' | 'deceased' | 'returned'
          photo_urls?: string[]
          sire_id?: string | null
          dam_id?: string | null
          created_at?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      purchases: {
        Row: {
          id: string
          dog_id: string
          price: number
          purchase_date: string
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          dog_id: string
          price: number
          purchase_date: string
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          dog_id?: string
          price?: number
          purchase_date?: string
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      sales: {
        Row: {
          id: string
          dog_id: string
          price: number
          sale_date: string
          buyer_info: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          dog_id: string
          price: number
          sale_date: string
          buyer_info?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          dog_id?: string
          price?: number
          sale_date?: string
          buyer_info?: string | null
          created_at?: string
          user_id?: string
        }
      }
      expenses: {
        Row: {
          id: string
          dog_id: string
          category: 'medical' | 'food' | 'grooming' | 'other'
          amount: number
          date: string
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          dog_id: string
          category: 'medical' | 'food' | 'grooming' | 'other'
          amount: number
          date: string
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          dog_id?: string
          category?: 'medical' | 'food' | 'grooming' | 'other'
          amount?: number
          date?: string
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      litters: {
        Row: {
          id: string
          sire_id: string
          dam_id: string
          birth_date: string
          puppy_ids: string[]
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sire_id: string
          dam_id: string
          birth_date: string
          puppy_ids: string[]
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sire_id?: string
          dam_id?: string
          birth_date?: string
          puppy_ids?: string[]
          created_at?: string
          user_id?: string
        }
      }
      health_records: {
        Row: {
          id: string
          dog_id: string
          type: 'vaccination' | 'checkup' | 'treatment'
          date: string
          description: string
          document_url: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          dog_id: string
          type: 'vaccination' | 'checkup' | 'treatment'
          date: string
          description: string
          document_url?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          dog_id?: string
          type?: 'vaccination' | 'checkup' | 'treatment'
          date?: string
          description?: string
          document_url?: string | null
          created_at?: string
          user_id?: string
        }
      }
      growth_timeline: {
        Row: {
          id: string
          dog_id: string
          event_date: string
          photo_url: string | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          dog_id: string
          event_date: string
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          dog_id?: string
          event_date?: string
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      dog_qrcodes: {
        Row: {
          dog_id: string
          qrcode_url: string
          updated_at: string
        }
        Insert: {
          dog_id: string
          qrcode_url: string
          updated_at?: string
        }
        Update: {
          dog_id?: string
          qrcode_url?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 