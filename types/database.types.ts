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
          email: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'photographer' | 'member' | 'viewer'
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'photographer' | 'member' | 'viewer'
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          bio?: string | null
          created_at?: string
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
      event_members: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          role: 'owner' | 'admin' | 'uploader' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          role?: 'owner' | 'admin' | 'uploader' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          role?: 'owner' | 'admin' | 'uploader' | 'viewer'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          event_date: string | null
          category: string | null
          location: string | null
          cover_url: string | null
          is_public: boolean
          created_by: string | null
          created_at: string
          ai_summary: string | null
          ai_highlights: Json | null
          event_story: Json | null
          event_tags: string[] | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          event_date?: string | null
          category?: string | null
          location?: string | null
          cover_url?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          ai_summary?: string | null
          ai_highlights?: Json | null
          event_story?: Json | null
          event_tags?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          event_date?: string | null
          category?: string | null
          location?: string | null
          cover_url?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          ai_summary?: string | null
          ai_highlights?: Json | null
          event_story?: Json | null
          event_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      event_role_requests: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          requested_role: 'owner' | 'admin' | 'uploader' | 'viewer' | null
          status: 'pending' | 'approved' | 'rejected' | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          requested_role?: 'owner' | 'admin' | 'uploader' | 'viewer' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          requested_role?: 'owner' | 'admin' | 'uploader' | 'viewer' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_role_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
          thumbnail_url: string | null
          cloudinary_public_id: string | null
          file_size: number | null
          width: number | null
          height: number | null
          duration: number | null
          mime_type: string | null
          upload_status: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_status: string | null
          updated_at: string | null
          ai_tags: string[] | null
          faces_detected: Json | null
          ai_caption: string | null
          ai_summary: string | null
          ai_objects: string[] | null
          ocr_text: string | null
          scene_type: string | null
          mood: string | null
          people_count: number | null
          dominant_colors: string[] | null
          similarity_group: string | null
          ai_processed: boolean | null
          ai_processed_at: string | null
          embedding: string | null
          processing_error: string | null
          processing_version: string | null
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
          thumbnail_url?: string | null
          cloudinary_public_id?: string | null
          file_size?: number | null
          width?: number | null
          height?: number | null
          duration?: number | null
          mime_type?: string | null
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_status?: string | null
          updated_at?: string | null
          ai_tags?: string[] | null
          faces_detected?: Json | null
          ai_caption?: string | null
          ai_summary?: string | null
          ai_objects?: string[] | null
          ocr_text?: string | null
          scene_type?: string | null
          mood?: string | null
          people_count?: number | null
          dominant_colors?: string[] | null
          similarity_group?: string | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          embedding?: string | null
          processing_error?: string | null
          processing_version?: string | null
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
          thumbnail_url?: string | null
          cloudinary_public_id?: string | null
          file_size?: number | null
          width?: number | null
          height?: number | null
          duration?: number | null
          mime_type?: string | null
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_status?: string | null
          updated_at?: string | null
          ai_tags?: string[] | null
          faces_detected?: Json | null
          ai_caption?: string | null
          ai_summary?: string | null
          ai_objects?: string[] | null
          ocr_text?: string | null
          scene_type?: string | null
          mood?: string | null
          people_count?: number | null
          dominant_colors?: string[] | null
          similarity_group?: string | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          embedding?: string | null
          processing_error?: string | null
          processing_version?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "likes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "comments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      user_role: 'admin' | 'photographer' | 'member' | 'viewer'
      event_member_role: 'owner' | 'admin' | 'uploader' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
