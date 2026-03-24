/**
 * Tipo placeholder para o banco de dados Supabase.
 * Sera gerado automaticamente pelo CLI do Supabase em modulos futuros.
 * Por enquanto, usar um tipo generico que nao bloqueia o typecheck.
 */
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
