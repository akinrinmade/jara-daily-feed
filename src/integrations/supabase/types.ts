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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coin_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          idempotency_key: string | null
          post_id: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          post_id?: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          post_id?: string | null
          source_type?: Database["public"]["Enums"]["coin_source_type"]
          user_id?: string
        }
        Relationships: []
      }
      coin_pool: {
        Row: {
          id: number
          remaining: number
          total_supply: number
          updated_at: string
        }
        Insert: {
          id?: number
          remaining?: number
          total_supply?: number
          updated_at?: string
        }
        Update: {
          id?: number
          remaining?: number
          total_supply?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_boosts: {
        Row: {
          amount: number
          booster_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          amount: number
          booster_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          amount?: number
          booster_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          current_rank: Database["public"]["Enums"]["app_rank"]
          id: string
          last_login_date: string | null
          location_state: string | null
          posts_read: number
          role: string | null
          saved_posts: string[] | null
          streak_days: number
          updated_at: string
          username: string
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          current_rank?: Database["public"]["Enums"]["app_rank"]
          id: string
          last_login_date?: string | null
          location_state?: string | null
          posts_read?: number
          role?: string | null
          saved_posts?: string[] | null
          streak_days?: number
          updated_at?: string
          username: string
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          current_rank?: Database["public"]["Enums"]["app_rank"]
          id?: string
          last_login_date?: string | null
          location_state?: string | null
          posts_read?: number
          role?: string | null
          saved_posts?: string[] | null
          streak_days?: number
          updated_at?: string
          username?: string
          xp_points?: number
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          author_id: string
          created_at: string
          id: string
          message: string | null
          post_id: string | null
          tipper_id: string
        }
        Insert: {
          amount: number
          author_id: string
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          tipper_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          tipper_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string; title: string; slug: string; content: string; excerpt: string
          category: Database["public"]["Enums"]["post_category"]
          image_url: string; is_premium: boolean; media_type: string; author_id: string
          views: number; shares: number; reactions_count: number; comments_count: number
          read_time: number; published: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; title: string; slug?: string; content: string; excerpt?: string
          category: Database["public"]["Enums"]["post_category"]
          image_url?: string; is_premium?: boolean; media_type?: string; author_id: string
          views?: number; shares?: number; reactions_count?: number; comments_count?: number
          read_time?: number; published?: boolean; created_at?: string; updated_at?: string
        }
        Update: {
          title?: string; slug?: string; content?: string; excerpt?: string
          category?: Database["public"]["Enums"]["post_category"]
          image_url?: string; is_premium?: boolean; media_type?: string
          views?: number; shares?: number; reactions_count?: number; comments_count?: number
          read_time?: number; published?: boolean; updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: { id: string; post_id: string; author_id: string; content: string; created_at: string }
        Insert: { id?: string; post_id: string; author_id: string; content: string; created_at?: string }
        Update: { content?: string }
        Relationships: []
      }
      post_reactions: {
        Row: { id: string; post_id: string; user_id: string; emoji: string; created_at: string }
        Insert: { id?: string; post_id: string; user_id: string; emoji: string; created_at?: string }
        Update: { emoji?: string }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string; user_id: string; type: string; title: string; description: string
          xp_amount: number | null; coin_amount: number | null; read: boolean; created_at: string
        }
        Insert: {
          id?: string; user_id: string; type: string; title: string; description?: string
          xp_amount?: number | null; coin_amount?: number | null; read?: boolean; created_at?: string
        }
        Update: { read?: boolean }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Database["public"]["Enums"]["app_rank"]
      }
      boost_post: {
        Args: { p_amount: number; p_booster_id: string; p_post_id: string }
        Returns: boolean
      }
      earn_coins:
        | {
            Args: {
              p_base_reward: number
              p_idempotency_key?: string
              p_post_id?: string
              p_source_type: Database["public"]["Enums"]["coin_source_type"]
              p_user_id: string
            }
            Returns: number
          }
        | {
            Args: {
              p_base_reward: number
              p_idempotency_key?: string
              p_post_id?: string
              p_source_type: string
              p_user_id: string
            }
            Returns: number
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      add_comment: {
        Args: { p_post_id: string; p_author_id: string; p_content: string }
        Returns: string
      }
      react_to_post: {
        Args: { p_post_id: string; p_user_id: string; p_emoji: string }
        Returns: boolean
      }
      increment_post_view: {
        Args: { p_post_id: string; p_user_id?: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_slug: {
        Args: { title: string }
        Returns: string
      }
      tip_author: {
        Args: {
          p_amount: number
          p_author_id: string
          p_message?: string
          p_post_id?: string
          p_tipper_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "view"
        | "click"
        | "share"
        | "comment"
        | "reaction"
        | "draft_creation"
        | "login"
        | "signup"
      app_rank: "JJC" | "Learner" | "Chairman" | "Odogwu"
      app_role: "admin" | "moderator" | "user"
      coin_source_type:
        | "read"
        | "like"
        | "share"
        | "comment"
        | "post"
        | "bonus"
        | "invite"
        | "spend"
      post_category: "Money" | "Hausa" | "Gist"
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
      activity_type: [
        "view",
        "click",
        "share",
        "comment",
        "reaction",
        "draft_creation",
        "login",
        "signup",
      ],
      app_rank: ["JJC", "Learner", "Chairman", "Odogwu"],
      app_role: ["admin", "moderator", "user"],
      coin_source_type: [
        "read",
        "like",
        "share",
        "comment",
        "post",
        "bonus",
        "invite",
        "spend",
      ],
      post_category: ["Money", "Hausa", "Gist"],
    },
  },
} as const
