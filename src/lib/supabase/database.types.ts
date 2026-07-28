/**
 * Generated from the live schema — do not edit by hand.
 * Regenerate after every migration with the Supabase CLI or MCP:
 *   supabase gen types typescript --project-id htioqsxmbucefsfuiaro
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_users: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name_en: string;
          name_id: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name_en: string;
          name_id: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name_en?: string;
          name_id?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_name: string | null;
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          post_id: string;
          visitor_hash: string;
        };
        Insert: {
          author_name?: string | null;
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          post_id: string;
          visitor_hash: string;
        };
        Update: {
          author_name?: string | null;
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          post_id?: string;
          visitor_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: { created_at: string; post_id: string; visitor_hash: string };
        Insert: { created_at?: string; post_id: string; visitor_hash: string };
        Update: { created_at?: string; post_id?: string; visitor_hash?: string };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_slug_history: {
        Row: { changed_at: string; id: string; old_slug: string; post_id: string };
        Insert: { changed_at?: string; id?: string; old_slug: string; post_id: string };
        Update: { changed_at?: string; id?: string; old_slug?: string; post_id?: string };
        Relationships: [
          {
            foreignKeyName: "post_slug_history_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          body_en: string | null;
          body_id: string | null;
          category_id: string;
          cover_alt_en: string | null;
          cover_alt_id: string | null;
          cover_path: string | null;
          created_at: string;
          deleted_at: string | null;
          excerpt_en: string | null;
          excerpt_id: string | null;
          id: string;
          like_count: number;
          published_at: string | null;
          search_en: unknown;
          search_id: unknown;
          slug: string;
          source_locale: string;
          status: string;
          title_en: string | null;
          title_id: string | null;
          translation_status: string;
          updated_at: string;
        };
        Insert: {
          body_en?: string | null;
          body_id?: string | null;
          category_id: string;
          cover_alt_en?: string | null;
          cover_alt_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          excerpt_en?: string | null;
          excerpt_id?: string | null;
          id?: string;
          like_count?: number;
          published_at?: string | null;
          slug: string;
          source_locale?: string;
          status?: string;
          title_en?: string | null;
          title_id?: string | null;
          translation_status?: string;
          updated_at?: string;
        };
        Update: {
          body_en?: string | null;
          body_id?: string | null;
          category_id?: string;
          cover_alt_en?: string | null;
          cover_alt_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          excerpt_en?: string | null;
          excerpt_id?: string | null;
          id?: string;
          like_count?: number;
          published_at?: string | null;
          slug?: string;
          source_locale?: string;
          status?: string;
          title_en?: string | null;
          title_id?: string | null;
          translation_status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: { bucket: string; hits: number; window_start: string };
        Insert: { bucket: string; hits?: number; window_start: string };
        Update: { bucket?: string; hits?: number; window_start?: string };
        Relationships: [];
      };
      translation_runs: {
        Row: {
          billed_characters: number;
          created_at: string;
          direction: string;
          error_note: string | null;
          id: string;
          model: string;
          post_id: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          billed_characters?: number;
          created_at?: string;
          direction: string;
          error_note?: string | null;
          id?: string;
          model: string;
          post_id?: string | null;
          provider: string;
          status: string;
        };
        Update: {
          billed_characters?: number;
          created_at?: string;
          direction?: string;
          error_note?: string | null;
          id?: string;
          model?: string;
          post_id?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "translation_runs_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      translation_glossary: {
        Row: { created_at: string; id: string; note: string | null; term: string };
        Insert: { created_at?: string; id?: string; note?: string | null; term: string };
        Update: { created_at?: string; id?: string; note?: string | null; term?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      comment_rate_ok: {
        Args: { p_post_id: string; p_visitor_hash: string };
        Returns: boolean;
      };
      consume_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      has_liked: { Args: { p_post_id: string; p_visitor_hash: string }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      post_comment: {
        Args: {
          p_author_name: string | null;
          p_body: string;
          p_post_id: string;
          p_visitor_hash: string;
        };
        Returns: string;
      };
      post_is_live: {
        Args: { p: Database["public"]["Tables"]["posts"]["Row"] };
        Returns: boolean;
      };
      rename_post_slug: { Args: { p_new_slug: string; p_post_id: string }; Returns: undefined };
      toggle_like: { Args: { p_post_id: string; p_visitor_hash: string }; Returns: string };
      translation_characters_this_month: { Args: never; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
