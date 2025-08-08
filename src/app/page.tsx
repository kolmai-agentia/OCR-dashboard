'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, FileText, DollarSign, Activity, AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface TableInfo {
  table_name: string
  table_type: string
}

export default function Dashboard() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latestApiError, setLatestApiError] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Get actual counts from your database
        console.log('Fetching data from database...')
        
        const { data: companiesData, error: companiesError, count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact' })

        console.log('Companies query result:', { data: companiesData, error: companiesError, count: companiesCount })

        const tablesInfo = []

        if (!companiesError && companiesCount !== null) {
          tablesInfo.push({ 
            table_name: `companies (${companiesCount} records)`, 
            table_type: 'TABLE' 
          })
        } else if (companiesError) {
          console.error('Companies error:', companiesError)
          tablesInfo.push({ 
            table_name: `companies (error: ${companiesError.message})`, 
            table_type: 'ERROR' 
          })
        }

        // Check other common tables your n8n workflow might use  
        const otherTables = ['cmr_documents', 'document_companies', 'documents', 'files', 'cmr', 'api_usage']
        for (const tableName of otherTables) {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })
            
            console.log(`Checking table ${tableName}:`, { count, error })
            
            if (error) {
              console.error(`Error accessing ${tableName}:`, error)
              if (tableName === 'cmr_documents') {
                tablesInfo.push({ 
                  table_name: `${tableName} (access denied: ${error.message})`, 
                  table_type: 'ERROR' 
                })
              }
            } else if (count !== null && count > 0) {
              tablesInfo.push({ 
                table_name: `${tableName} (${count} records)`, 
                table_type: 'TABLE' 
              })
            } else if (count === 0 && tableName === 'cmr_documents') {
              tablesInfo.push({ 
                table_name: `${tableName} (0 records - exists but empty)`, 
                table_type: 'EMPTY' 
              })
            }
          } catch (err) {
            console.error(`Exception accessing ${tableName}:`, err)
            if (tableName === 'cmr_documents') {
              tablesInfo.push({ 
                table_name: `${tableName} (exception: ${String(err)})`, 
                table_type: 'ERROR' 
              })
            }
          }
        }

        if (tablesInfo.length === 0) {
          tablesInfo.push(
            { table_name: 'No accessible data found', table_type: 'INFO' },
            { table_name: 'Check RLS policies in Supabase', table_type: 'HELP' }
          )
        }

        setTables(tablesInfo)
        
        // Check for latest document with API errors
        try {
          const { data: latestDoc, error: docError } = await supabase
            .from('cmr_documents')
            .select('id, filename, api_details, processing_date')
            .not('api_details', 'is', null)
            .neq('api_details', '{}')
            .order('processing_date', { ascending: false })
            .limit(1)
            .single()
            
          if (!docError && latestDoc && latestDoc.api_details && Object.keys(latestDoc.api_details).length > 0) {
            setLatestApiError(latestDoc)
          }
        } catch (err) {
          console.log('No API errors found in recent documents')
        }
      } catch (err) {
        console.error('Data fetch failed:', err)
        setError(`Unable to fetch data: ${String(err)}`)
        setTables([
          { table_name: 'Connection failed', table_type: 'ERROR' },
          { table_name: 'Check database permissions', table_type: 'HELP' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = [
    { name: 'Database Connection', value: error ? 'Failed' : 'Connected', icon: Building2, color: error ? 'bg-red-500' : 'bg-green-500' },
    { name: 'Available Tables', value: tables.length.toString(), icon: FileText, color: 'bg-blue-500' },
    { name: 'Diagnostic Tool', value: 'Available', icon: DollarSign, color: 'bg-yellow-500' },
    { name: 'Status', value: loading ? 'Loading...' : 'Ready', icon: Activity, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">OCR Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your OCR system performance and manage company data
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Database Connection Issue</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                <Link href="/diagnostic" className="underline">Run diagnostic tool</Link> to troubleshoot.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {latestApiError && (
        <Link href="/costs" className="block mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-yellow-800 font-medium">API Error Detected</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Document: {latestApiError.filename || 'Unknown'}
                  </p>
                  <p className="text-yellow-600 text-xs mt-1">
                    Click to view error details in Cost Tracking
                  </p>
                </div>
              </div>
              <div className="text-yellow-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-700">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Database Status</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-700">Connecting to database...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Connection failed</p>
                <p className="text-sm text-gray-700 mb-4">Unable to connect to the database</p>
                <Link 
                  href="/diagnostic" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Run Diagnostic
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-green-600 font-medium mb-4">✓ Database connection successful</p>
                {tables.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Available Tables ({tables.length}):</h3>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {tables.map((table) => (
                        <div key={table.table_name} className="bg-gray-50 rounded px-3 py-2">
                          <span className="font-mono text-sm text-gray-900">{table.table_name}</span>
                          <span className="text-xs text-gray-700 ml-2">({table.table_type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-700 mb-4">No tables found in the public schema.</p>
                    <Link 
                      href="/diagnostic" 
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Full Diagnostic
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link 
                href="/general" 
                className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
              >
                <div className="font-medium text-blue-900">General Overview</div>
                <div className="text-sm text-blue-600">View documents with company relationships</div>
              </Link>
              
              <Link 
                href="/costs" 
                className="block w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
              >
                <div className="font-medium text-orange-900">Cost Tracking</div>
                <div className="text-sm text-orange-600">Monitor API usage and expenses</div>
              </Link>

              {tables.some(t => t.table_name.includes('companies') || t.table_name.includes('company')) && (
                <Link 
                  href="/companies" 
                  className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200"
                >
                  <div className="font-medium text-green-900">Companies</div>
                  <div className="text-sm text-green-600">View and filter company data</div>
                </Link>
              )}

              {tables.some(t => t.table_name.includes('document') || t.table_name.includes('file')) && (
                <Link 
                  href="/documents" 
                  className="block w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                >
                  <div className="font-medium text-purple-900">Documents</div>
                  <div className="text-sm text-purple-600">View document processing status</div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
