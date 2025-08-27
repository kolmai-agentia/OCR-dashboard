'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DocumentData, Company, DocumentWithRelatedCompanies } from '@/types/database'
import { FileText, Building2, User, Truck, Package, Search } from 'lucide-react'

interface DocumentWithCompanies {
  id: string
  filename: string
  status: string
  created_at: string
  document_date?: string | null
  source?: 'historical' | 'new'
  companies: {
    expedidor?: Company
    destinatario?: Company
    transportista?: Company
  }
  [key: string]: unknown
}

export default function DocumentOverviewPage() {
  const [documents, setDocuments] = useState<DocumentWithCompanies[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDocumentOverview()
  }, [])

  const fetchDocumentOverview = async () => {
    try {
      // First, let's try a simpler approach - get documents first
      const { data: documentsData, error: docsError } = await supabase
        .from('cmr_documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('Error fetching documents:', docsError)
        return
      }

      if (!documentsData || documentsData.length === 0) {
        console.log('No documents found')
        setDocuments([])
        return
      }

      // Get document-company relationships with companies joined
      const { data: relationshipsData, error: relError } = await supabase
        .from('document_companies')
        .select(`
          document_id,
          expedidor:companies!document_companies_expedidor_id_fkey(
            id,
            empresa,
            direccion,
            telefono,
            email,
            website,
            tipo_camion,
            vehiculo
          ),
          destinatario:companies!document_companies_destinatario_id_fkey(
            id,
            empresa,
            direccion,
            telefono,
            email,
            website,
            tipo_camion,
            vehiculo
          ),
          transportista:companies!document_companies_transportista_id_fkey(
            id,
            empresa,
            direccion,
            telefono,
            email,
            website,
            tipo_camion,
            vehiculo
          )
        `)

      console.log('Documents data:', documentsData)
      console.log('Relationships data:', relationshipsData)

      if (relError) {
        console.error('Error fetching relationships:', relError)
        // Continue without relationships data
      }

      // Process the data to combine documents with their companies
      const enhancedDocuments = documentsData.map((doc: DocumentData) => {
        const companies: {
          expedidor?: Company
          destinatario?: Company
          transportista?: Company
        } = {
          expedidor: undefined,
          destinatario: undefined,
          transportista: undefined
        }

        // Find relationships for this document
        if (relationshipsData) {
          const docRelationship = (relationshipsData as DocumentWithRelatedCompanies[]).find(
            (rel) => rel.document_id === doc.id
          )

          console.log(`Document ${doc.id} relationship:`, docRelationship)

          if (docRelationship) {
            companies.expedidor = Array.isArray(docRelationship.expedidor) ? docRelationship.expedidor[0] : undefined
            companies.destinatario = Array.isArray(docRelationship.destinatario) ? docRelationship.destinatario[0] : undefined
            companies.transportista = Array.isArray(docRelationship.transportista) ? docRelationship.transportista[0] : undefined
          }
        }

        return {
          id: doc.id,
          filename: doc.filename || doc.nombre_archivo || 'Unknown Document',
          status: doc.status || doc.estado || doc.processing_status || 'completed',
          created_at: doc.created_at || doc.Created_At || new Date().toISOString(),
          document_date: doc.document_date || doc.fecha_documento || doc.date || null,
          source: (doc.source || doc.fuente || doc.origen || (doc.is_historical ? 'historical' : 'new')) as 'historical' | 'new',
          companies
        }
      })

      setDocuments(enhancedDocuments)
      console.log('Enhanced documents with companies:', enhancedDocuments)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companies.expedidor?.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companies.destinatario?.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companies.transportista?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'expedidor': return <Package className="h-4 w-4" />
      case 'destinatario': return <User className="h-4 w-4" />
      case 'transportista': return <Truck className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'expedidor': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'destinatario': return 'bg-green-100 text-green-800 border-green-200'
      case 'transportista': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8" />
          General
        </h1>
        <p className="mt-2 text-gray-600">
          View documents with their associated companies and roles
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search documents or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{document.filename}</h3>
                      {document.source && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          document.source === 'historical' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {document.source === 'historical' ? 'Historical' : 'New'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      Document: {document.document_date ? 
                        new Date(document.document_date).toLocaleDateString() : 
                        'Unknown'
                      } • Processed: {document.created_at ? 
                        new Date(document.created_at).toLocaleDateString() : 
                        'Unknown'
                      } • Status: {document.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Associated Companies</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['expedidor', 'destinatario', 'transportista'] as const).map((role) => {
                  const company = document.companies[role]
                  return (
                    <div key={role} className={`border rounded-lg p-4 ${getRoleColor(role)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon(role)}
                        <span className="font-medium text-sm capitalize">{role}</span>
                      </div>
                      {company ? (
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">
                            {company.empresa || 'Unknown Company'}
                          </p>
                          {company.direccion && (
                            <p className="text-sm text-gray-700 mb-1">{company.direccion}</p>
                          )}
                          {company.telefono && (
                            <p className="text-sm text-gray-600">📞 {company.telefono}</p>
                          )}
                          {company.website && (
                            <p className="text-sm text-gray-600">🌐 {company.website}</p>
                          )}
                          {company.vehiculo && (
                            <p className="text-sm text-gray-600">🚛 {company.vehiculo}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 italic">No company assigned</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-700">
              {searchTerm ? 'No documents match your search' : 'No documents found'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}