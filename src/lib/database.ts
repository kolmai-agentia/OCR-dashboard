import { supabase } from './supabase'

export async function getTableSchema() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_schema', 'public')
    .order('table_name')

  if (error) {
    console.error('Error fetching table schema:', error)
    return []
  }

  return data
}

export async function getTableColumns(tableName: string) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .order('ordinal_position')

  if (error) {
    console.error('Error fetching table columns:', error)
    return []
  }

  return data
}