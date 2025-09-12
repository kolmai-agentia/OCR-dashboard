'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DocumentData } from '@/types/database'
import { FileText, Search, Eye, Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface DocumentDisplay {
  id: string
  filename: string
  file_path?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'low_quality'
  ocr_confidence?: number
  extracted_text?: string
  created_at: string
  processed_at?: string
  document_date?: string
  error_message?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<DocumentDisplay | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      // Try different possible table names for documents
      const tableNames = ['cmr_documents', 'documents', 'documentos', 'files', 'archivos', 'cmr', 'cmrs']
      let documentsData = []
      let foundTable = null

      for (const tableName of tableNames) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })

          console.log(`Checking table ${tableName}:`, { error, count, dataLength: data?.length })

          if (!error && data && data.length > 0) {
            documentsData = data
            foundTable = tableName
            console.log(`Found ${data.length} documents in table: ${tableName}`, data)
            break
          } else if (!error && count !== null && count > 0) {
            // Table exists but maybe ordering failed, try without order
            const { data: dataNoOrder } = await supabase
              .from(tableName)
              .select('*')

            if (dataNoOrder && dataNoOrder.length > 0) {
              documentsData = dataNoOrder
              foundTable = tableName
              console.log(`Found ${dataNoOrder.length} documents in table: ${tableName} (no order)`, dataNoOrder)
              break
            }
          }
        } catch (err) {
          console.log(`Error checking table ${tableName}:`, err)
        }
      }

      if (documentsData.length > 0) {
        // Process the documents to match expected structure
        const processedData = documentsData.map((item: DocumentData, index: number) => {
          const processedItem: DocumentDisplay = {
            id: item.id || (item.ID as string | undefined) || index.toString(),
            filename: item.filename || item.nombre_archivo || item.file_name || item.documento || 'Unknown Document',
            file_path: item.file_path || item.ruta_archivo || item.path || '',
            processing_status: (item.processing_status || item.estado || item.status || 'completed') as 'pending' | 'processing' | 'completed' | 'failed' | 'low_quality',
            ocr_confidence: item.ocr_confidence || item.confianza || item.confidence || undefined,
            extracted_text: item.extracted_text || item.texto_extraido || item.text || '',
            created_at: item.created_at || item.Created_At || new Date().toISOString(),
            processed_at: (item.processed_at || item.procesado_en || item.created_at || new Date().toISOString()) as string,
            document_date: item.document_date || item.fecha_documento || item.date || undefined,
            error_message: item.error_message || item.mensaje_error
          }
          return processedItem
        })
        setDocuments(processedData)
        console.log(`Processed ${processedData.length} documents from ${foundTable}`)
      } else {
        console.log('No documents found in any table')
        setDocuments([])
      }
    } catch (error) {
      console.error('Error:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low_quality':
        return <XCircle className="h-4 w-4 text-orange-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'low_quality':
        return 'bg-orange-100 text-orange-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          Documents
        </h1>
        <p className="mt-2 text-gray-600">
          View and manage processed documents and their OCR results
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search documents by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-blue-50 border border-blue-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="low_quality">Low Quality</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Documents ({filteredDocuments.length})
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredDocuments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    onClick={() => setSelectedDocument(document)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedDocument?.id === document.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <h3 className="font-medium text-gray-900 truncate">
                            {document.filename || 'Unnamed Document'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(document.processing_status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.processing_status)}`}>
                            {document.processing_status}
                          </span>
                        </div>
                        {document.ocr_confidence && (
                          <p className="text-sm text-gray-700">
                            Confidence: {Math.round(document.ocr_confidence * 100)}%
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          Doc: {document.document_date ? 
                            format(new Date(document.document_date), 'MMM dd, yyyy') : 
                            'Unknown'
                          } • Processed: {document.created_at ? 
                            format(new Date(document.created_at), 'MMM dd, yyyy') : 
                            'Unknown'
                          }
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-700">
                  {searchTerm || statusFilter !== 'all' ? 'No documents match your filters' : 'No documents found'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {selectedDocument ? (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Document Details</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    {selectedDocument.filename || 'Unnamed Document'}
                  </h3>
                  <p className="text-sm text-gray-700">
                    Document ID: {selectedDocument.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedDocument.processing_status)}
                    <div>
                      <p className="font-medium text-gray-700">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDocument.processing_status)}`}>
                        {selectedDocument.processing_status}
                      </span>
                    </div>
                  </div>

                  {selectedDocument.ocr_confidence && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-700">OCR Confidence</p>
                        <p className="text-gray-600">{Math.round(selectedDocument.ocr_confidence * 100)}%</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-700">Document Date</p>
                      <p className="text-gray-600">
                        {selectedDocument.document_date ? 
                          format(new Date(selectedDocument.document_date), 'MMM dd, yyyy') : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-700">Processed Date</p>
                      <p className="text-gray-600">
                        {selectedDocument.created_at ? 
                          format(new Date(selectedDocument.created_at), 'MMM dd, yyyy HH:mm:ss') : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedDocument.processing_status === 'failed' && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">Error Message</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1">
                          <p className="text-sm text-red-800 break-words">
                            {selectedDocument.error_message || 'No error message available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDocument.extracted_text && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Extracted Text</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedDocument.extracted_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a document to view details
              </h3>
              <p className="text-gray-700">
                Choose a document from the list to see processing information and extracted text
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}