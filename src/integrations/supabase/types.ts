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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      historial_actividad: {
        Row: {
          accion: string
          created_at: string
          detalle: string | null
          elemento: string | null
          email: string
          id: string
          nombre: string | null
          user_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          detalle?: string | null
          elemento?: string | null
          email: string
          id?: string
          nombre?: string | null
          user_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          detalle?: string | null
          elemento?: string | null
          email?: string
          id?: string
          nombre?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string | null
          rol: Database["public"]["Enums"]["app_rol"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre?: string | null
          rol?: Database["public"]["Enums"]["app_rol"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          rol?: Database["public"]["Enums"]["app_rol"]
          updated_at?: string
        }
        Relationships: []
      }
      permisos_usuario: {
        Row: {
          created_at: string
          id: string
          permiso: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permiso: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permiso?: Database["public"]["Enums"]["app_permission"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          anio: number
          caja: string
          cilindrada: string | null
          color: string | null
          combustible: string
          consumo: string | null
          created_at: string
          descripcion: string | null
          destacado: boolean
          equipamiento: string[]
          estado: string
          fecha_publicacion: string
          galeria: string[]
          garantia: string | null
          id: string
          imagen_url: string | null
          km: number
          marca: string
          modelo: string
          potencia_hp: number | null
          precio: number
          precio_contado: number | null
          precio_financiado: number | null
          publicado: boolean
          slug: string
          tipo: string
          tipo_motor: string | null
          torque_nm: number | null
          traccion: string
          ubicacion: string
          updated_at: string
          vendido: boolean
          version: string | null
          video_url: string | null
          vistas: number
        }
        Insert: {
          anio: number
          caja: string
          cilindrada?: string | null
          color?: string | null
          combustible: string
          consumo?: string | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          equipamiento?: string[]
          estado?: string
          fecha_publicacion?: string
          galeria?: string[]
          garantia?: string | null
          id?: string
          imagen_url?: string | null
          km?: number
          marca: string
          modelo: string
          potencia_hp?: number | null
          precio: number
          precio_contado?: number | null
          precio_financiado?: number | null
          publicado?: boolean
          slug: string
          tipo: string
          tipo_motor?: string | null
          torque_nm?: number | null
          traccion: string
          ubicacion?: string
          updated_at?: string
          vendido?: boolean
          version?: string | null
          video_url?: string | null
          vistas?: number
        }
        Update: {
          anio?: number
          caja?: string
          cilindrada?: string | null
          color?: string | null
          combustible?: string
          consumo?: string | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          equipamiento?: string[]
          estado?: string
          fecha_publicacion?: string
          galeria?: string[]
          garantia?: string | null
          id?: string
          imagen_url?: string | null
          km?: number
          marca?: string
          modelo?: string
          potencia_hp?: number | null
          precio?: number
          precio_contado?: number | null
          precio_financiado?: number | null
          publicado?: boolean
          slug?: string
          tipo?: string
          tipo_motor?: string | null
          torque_nm?: number | null
          traccion?: string
          ubicacion?: string
          updated_at?: string
          vendido?: boolean
          version?: string | null
          video_url?: string | null
          vistas?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      asegurar_perfil: {
        Args: never
        Returns: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string | null
          rol: Database["public"]["Enums"]["app_rol"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      es_super_admin: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_actividad: {
        Args: { _accion: string; _detalle?: string; _elemento?: string }
        Returns: undefined
      }
      tiene_permiso: {
        Args: {
          _permiso: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "vehiculos_crear"
        | "vehiculos_editar"
        | "vehiculos_eliminar"
        | "vehiculos_vender"
        | "precios_editar"
        | "estadisticas_editar"
        | "promociones_editar"
        | "imagenes_editar"
        | "videos_editar"
        | "textos_editar"
        | "contacto_editar"
        | "testdrive_gestionar"
        | "consultas_gestionar"
        | "panel_estadisticas"
        | "usuarios_gestionar"
        | "acceso_total"
      app_rol: "super_admin" | "admin" | "empleado"
      app_role: "admin" | "moderator" | "user"
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
      app_permission: [
        "vehiculos_crear",
        "vehiculos_editar",
        "vehiculos_eliminar",
        "vehiculos_vender",
        "precios_editar",
        "estadisticas_editar",
        "promociones_editar",
        "imagenes_editar",
        "videos_editar",
        "textos_editar",
        "contacto_editar",
        "testdrive_gestionar",
        "consultas_gestionar",
        "panel_estadisticas",
        "usuarios_gestionar",
        "acceso_total",
      ],
      app_rol: ["super_admin", "admin", "empleado"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
