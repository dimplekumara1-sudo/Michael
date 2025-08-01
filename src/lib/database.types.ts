export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          user_id: string
          event_date: string
          location: string
          event_type: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          gallery_link: string | null
          mega_link: string | null
          qr_code: string | null
          notes: string | null
          mobile: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_date: string
          location: string
          event_type: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          gallery_link?: string | null
          mega_link?: string | null
          qr_code?: string | null
          notes?: string | null
          mobile: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_date?: string
          location?: string
          event_type?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          gallery_link?: string | null
          mega_link?: string | null
          qr_code?: string | null
          notes?: string | null
          mobile?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          id: string
          booking_id: string
          title: string
          description: string | null
          cover_image: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          title: string
          description?: string | null
          cover_image?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          title?: string
          description?: string | null
          cover_image?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          mobile: string | null
          role: string
          avatar: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          mobile?: string | null
          role?: string
          avatar?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          mobile?: string | null
          role?: string
          avatar?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      media_posts: {
        Row: {
          id: string
          title: string
          caption: string
          media_type: 'image' | 'video'
          media_url: string
          thumbnail: string | null
          likes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          caption: string
          media_type: 'image' | 'video'
          media_url: string
          thumbnail?: string | null
          likes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          caption?: string
          media_type?: 'image' | 'video'
          media_url?: string
          thumbnail?: string | null
          likes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string
          mobile: string | null
          role: 'admin' | 'user'
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      handle_updated_at: {
        Args: {}
        Returns: undefined
      }
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      media_type: 'image' | 'video'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}