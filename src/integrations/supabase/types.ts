export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      attempt_private: {
        Row: {
          attempt_id: string;
          check_c: Json | null;
          created_at: string;
          decision: Json | null;
          diag_a: Json | null;
          hints: Json;
          solve_b: Json | null;
        };
        Insert: {
          attempt_id: string;
          check_c?: Json | null;
          created_at?: string;
          decision?: Json | null;
          diag_a?: Json | null;
          hints?: Json;
          solve_b?: Json | null;
        };
        Update: {
          attempt_id?: string;
          check_c?: Json | null;
          created_at?: string;
          decision?: Json | null;
          diag_a?: Json | null;
          hints?: Json;
          solve_b?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_private_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: true;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          attempt_index: number;
          case_id: string;
          created_at: string;
          error_label: string | null;
          first_error_line_id: string | null;
          hint_count: number;
          id: string;
          job_status: string;
          reason_codes: string[];
          recognized_lines: Json;
          revealed_level: number;
          student_id: string;
          student_message: string | null;
          updated_at: string;
          verdict: string | null;
          work_image_paths: string[];
        };
        Insert: {
          attempt_index: number;
          case_id: string;
          created_at?: string;
          error_label?: string | null;
          first_error_line_id?: string | null;
          hint_count?: number;
          id?: string;
          job_status?: string;
          reason_codes?: string[];
          recognized_lines?: Json;
          revealed_level?: number;
          student_id: string;
          student_message?: string | null;
          updated_at?: string;
          verdict?: string | null;
          work_image_paths?: string[];
        };
        Update: {
          attempt_index?: number;
          case_id?: string;
          created_at?: string;
          error_label?: string | null;
          first_error_line_id?: string | null;
          hint_count?: number;
          id?: string;
          job_status?: string;
          reason_codes?: string[];
          recognized_lines?: Json;
          revealed_level?: number;
          student_id?: string;
          student_message?: string | null;
          updated_at?: string;
          verdict?: string | null;
          work_image_paths?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "attempts_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          case_status: string;
          created_at: string;
          evaluated_count: number;
          help_message: string | null;
          help_requested: boolean;
          id: string;
          page: number;
          problem_image_path: string;
          problem_no: string;
          student_id: string;
          textbook: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          case_status?: string;
          created_at?: string;
          evaluated_count?: number;
          help_message?: string | null;
          help_requested?: boolean;
          id?: string;
          page: number;
          problem_image_path: string;
          problem_no: string;
          student_id: string;
          textbook: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          case_status?: string;
          created_at?: string;
          evaluated_count?: number;
          help_message?: string | null;
          help_requested?: boolean;
          id?: string;
          page?: number;
          problem_image_path?: string;
          problem_no?: string;
          student_id?: string;
          textbook?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          current_unit: string;
          display_name: string;
          grade: string;
          id: string;
          login_id: string;
        };
        Insert: {
          created_at?: string;
          current_unit?: string;
          display_name?: string;
          grade?: string;
          id: string;
          login_id: string;
        };
        Update: {
          created_at?: string;
          current_unit?: string;
          display_name?: string;
          grade?: string;
          id?: string;
          login_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
