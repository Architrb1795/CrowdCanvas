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
      face_matches: {
        Row: {
          id: string
          face_profile_id: string
          media_face_id: string
          media_id: string
          similarity_score: number
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          face_profile_id: string
          media_face_id: string
          media_id: string
          similarity_score: number
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          face_profile_id?: string
          media_face_id?: string
          media_id?: string
          similarity_score?: number
          status?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_matches_face_profile_id_fkey"
            columns: ["face_profile_id"]
            isOneToOne: false
            referencedRelation: "face_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_matches_media_face_id_fkey"
            columns: ["media_face_id"]
            isOneToOne: false
            referencedRelation: "media_faces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_matches_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          }
        ]
      }
      face_profiles: {
        Row: {
          id: string
          user_id: string
          embedding: string
          consent_given: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          embedding: string
          consent_given?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          embedding?: string
          consent_given?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      media_faces: {
        Row: {
          id: string
          media_id: string
          embedding: string
          bounding_box: Json | null
          confidence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          media_id: string
          embedding: string
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          embedding?: string
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_faces_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          }
        ]
      }
      recognition_jobs: {
        Row: {
          id: string
          media_id: string
          status: string | null
          faces_found: number | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          media_id: string
          status?: string | null
          faces_found?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          media_id?: string
          status?: string | null
          faces_found?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recognition_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
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
          watermark_enabled: boolean | null
          watermark_logo_url: string | null
          watermark_opacity: number | null
          watermark_size: number | null
          watermark_style: string | null
          watermark_text: string | null
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
          watermark_enabled?: boolean | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_style?: string | null
          watermark_text?: string | null
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
          watermark_enabled?: boolean | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_style?: string | null
          watermark_text?: string | null
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
          views_count?: number
          shares_count?: number
          downloads_count?: number
          ai_style?: string | null
          ai_confidence?: number | null
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
          views_count?: number
          shares_count?: number
          downloads_count?: number
          ai_style?: string | null
          ai_confidence?: number | null
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
          views_count?: number
          shares_count?: number
          downloads_count?: number
          ai_style?: string | null
          ai_confidence?: number | null
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
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          media_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
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
      shares: {
        Row: {
          id: string
          media_id: string | null
          user_id: string | null
          share_type: 'copy_link' | 'whatsapp' | 'twitter' | 'facebook' | 'download'
          created_at: string
          is_watermarked: boolean | null
        }
        Insert: {
          id?: string
          media_id?: string | null
          user_id?: string | null
          share_type: 'copy_link' | 'whatsapp' | 'twitter' | 'facebook' | 'download'
          created_at?: string
          is_watermarked?: boolean | null
        }
        Update: {
          id?: string
          media_id?: string | null
          user_id?: string | null
          share_type?: 'copy_link' | 'whatsapp' | 'twitter' | 'facebook' | 'download'
          created_at?: string
          is_watermarked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      media_favourites: {
        Row: {
          id: string
          user_id: string
          media_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_favourites_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_privacy_settings: {
        Row: {
          user_id: string
          hide_tagged_photos: boolean | null
          require_tag_approval: boolean | null
          disable_tagging: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          hide_tagged_photos?: boolean | null
          require_tag_approval?: boolean | null
          disable_tagging?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          hide_tagged_photos?: boolean | null
          require_tag_approval?: boolean | null
          disable_tagging?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      photo_user_tags: {
        Row: {
          id: string
          media_id: string
          tagged_user_id: string
          tagged_by_user_id: string
          x_coordinate: number
          y_coordinate: number
          status: 'pending' | 'approved' | 'rejected' | 'removed' | null
          created_at: string
        }
        Insert: {
          id?: string
          media_id: string
          tagged_user_id: string
          tagged_by_user_id: string
          x_coordinate: number
          y_coordinate: number
          status?: 'pending' | 'approved' | 'rejected' | 'removed' | null
          created_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          tagged_user_id?: string
          tagged_by_user_id?: string
          x_coordinate?: number
          y_coordinate?: number
          status?: 'pending' | 'approved' | 'rejected' | 'removed' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_user_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_user_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_user_tags_tagged_by_user_id_fkey"
            columns: ["tagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          type: 'tag_request' | 'tag_approved' | 'photo_saved'
          media_id: string | null
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          type: 'tag_request' | 'tag_approved' | 'photo_saved'
          media_id?: string | null
          is_read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string | null
          type?: 'tag_request' | 'tag_approved' | 'photo_saved'
          media_id?: string | null
          is_read?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
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
      share_type_enum: 'copy_link' | 'whatsapp' | 'twitter' | 'facebook' | 'download'
      tag_status: 'pending' | 'approved' | 'rejected' | 'removed'
      notification_type: 'tag_request' | 'tag_approved' | 'photo_saved'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
