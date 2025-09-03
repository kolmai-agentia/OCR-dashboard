// Database type definitions based on actual schema from database.sql

// cmr_documents table
export interface CmrDocument {
  id: string
  filename: string
  document_date?: string // date
  ocr_confidence?: number // numeric 0-1
  error_message?: string
  processing_date?: string // timestamp
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'low_quality'
  cost_gemini?: number // numeric
  api_details?: Record<string, unknown> // jsonb
  created_at?: string // timestamp
  updated_at?: string // timestamp
  unitary_usage_serpapi?: number // numeric
  unitary_usage_hunter?: number // numeric
  unitary_usage_firecrawl?: number // numeric
}

// companies table  
export interface Company {
  id: string
  empresa: string // NOT 'name' - it's 'empresa' in the schema!
  direccion?: string
  telefono?: string
  email?: string
  website?: string
  role?: 'expedidor' | 'destinatario' | 'transportista'
  tipo_camion?: string
  vehiculo?: string
  first_seen?: string // date
  times_seen?: number // integer
  created_at?: string // timestamp
  updated_at?: string // timestamp
}

// document_companies junction table
export interface DocumentCompanies {
  id: string
  document_id: string
  expedidor_id?: string
  destinatario_id?: string
  transportista_id?: string
}

// For Supabase joins - companies can come back as arrays or objects
export interface DocumentWithRelatedCompanies {
  document_id: string
  expedidor?: Company[] | Company | null
  destinatario?: Company[] | Company | null
  transportista?: Company[] | Company | null
}

// Error document interface
export interface ApiErrorDocument {
  id: string
  filename?: string
  api_details?: Record<string, unknown>
  processing_date?: string
  status?: string
}

// Recent documents for dashboard
export interface RecentDocument {
  id: string
  filename: string
  created_at: string
}

// Legacy interfaces for backward compatibility (items that might come from old data)
export interface CompanyData extends Company {
  // Legacy field mappings
  name?: string
  Name?: string
  company_name?: string
  nombre?: string
  address?: string
  Address?: string
  city?: string
  City?: string
  ciudad?: string
  country?: string
  Country?: string
  pais?: string
  phone?: string
  Phone?: string
  correo?: string
  Email?: string
  web?: string
  Website?: string
  tax_id?: string
  taxId?: string
  tax_number?: string
  nif?: string
  cif?: string
  vat_number?: string
  fiscal_id?: string
  Created_At?: string
  ID?: string
  [key: string]: unknown
}

export interface DocumentData extends CmrDocument {
  // Legacy field mappings
  nombre_archivo?: string
  file_name?: string
  documento?: string
  file_path?: string
  ruta_archivo?: string
  path?: string
  processing_status?: string
  estado?: string
  confianza?: number
  confidence?: number
  extracted_text?: string
  texto_extraido?: string
  text?: string
  procesado_en?: string
  fecha_documento?: string
  date?: string
  mensaje_error?: string
  gemini_cost?: number
  ocr_cost?: number
  costo_gemini?: number
  Created_At?: string
  ID?: string
  [key: string]: unknown
}