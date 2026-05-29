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
          role: 'admin' | 'photographer' | 'member' | 'viewer'
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'photographer' | 'member' | 'viewer'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'photographer' | 'member' | 'viewer'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          event_date: string | null
          category: string | null
          is_public: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          event_date?: string | null
          category?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          event_date?: string | null
          category?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          event_id: string | null
          file_url: string
          media_type: 'photo' | 'video' | null
          uploaded_by: string | null
          tags: string[] | null
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          file_url: string
          media_type?: 'photo' | 'video' | null
          uploaded_by?: string | null
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          file_url?: string
          media_type?: 'photo' | 'video' | null
          uploaded_by?: string | null
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string | null
          media_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string | null
          media_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          content?: string
          created_at?: string
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
      user_role: 'admin' | 'photographer' | 'member' | 'viewer'
    }
  }
}
