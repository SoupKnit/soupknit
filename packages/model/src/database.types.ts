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
      Organisation: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workbook_data: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string
          files: Json
          id: string
          preview_data: Json | null
          project_id: string | null
          status: Database["public"]["Enums"]["status"]
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string
          files: Json
          id?: string
          preview_data?: Json | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["status"]
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string
          files?: Json
          id?: string
          preview_data?: Json | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project_and_workbook_data_table: {
        Args: {
          p_name: string
          p_user_id: string
        }
        Returns: number
      }
      create_project_workbook_data_table: {
        Args: {
          project_id: number
          user_id: string
        }
        Returns: undefined
      }
      create_user_projects_table: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      create_workbook_data_table: {
        Args: {
          project_id: string
        }
        Returns: undefined
      }
      delete_project:
        | {
            Args: {
              input_project_id: number
            }
            Returns: {
              workbook_data_deleted: number
              workbooks_deleted: number
              projects_deleted: number
            }[]
          }
        | {
            Args: {
              input_project_id: number
              input_user_id: string
            }
            Returns: {
              workbook_data_deleted: number
              workbooks_deleted: number
              projects_deleted: number
              file_name: string
              debug_info: string
            }[]
          }
      get_first_15_rows:
        | {
            Args: {
              p_project_id: number
              p_workbook_id: number
            }
            Returns: {
              row_number: number
              data: Json
            }[]
          }
        | {
            Args: {
              workbook_id: string
            }
            Returns: {
              row_number: number
              data: Json
              workbook_name: string
              workbook_file_type: string
              file_path: string
            }[]
          }
      insert_workbook_data:
        | {
            Args: {
              p_project_id: number
              p_workbook_id: number
              p_data: Json[]
            }
            Returns: undefined
          }
        | {
            Args: {
              p_project_id: string
              p_workbook_id: string
              p_data: Json[]
            }
            Returns: undefined
          }
    }
    Enums: {
      project_type:
        | "Classification"
        | "Regression"
        | "Clustering"
        | "Time Series"
      status: "draft" | "published" | "archived" | "deleted" | "in_review"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
