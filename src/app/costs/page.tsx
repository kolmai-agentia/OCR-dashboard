'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DocumentData } from '@/types/database'
import { DollarSign, TrendingUp, Calendar, Target, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'

interface ApiUsage {
  id: string
  api_name: 'gemini' | 'serpapi' | 'firecrawl' | 'openai'
  usage_type: string
  cost: number
  usage_count: number
  created_at: string
}

export default function CostsPage() {
  const [apiUsages, setApiUsages] = useState<ApiUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [documentsProcessed, setDocumentsProcessed] = useState(0)
  const [documentsData, setDocumentsData] = useState<DocumentData[]>([])

  const fetchApiUsages = useCallback(async () => {
    try {
      const days = parseInt(selectedPeriod)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get documents from cmr_documents table
      const { data: documentsData, error: docsError } = await supabase
        .from('cmr_documents')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('Error fetching documents for cost analysis:', docsError)
        setApiUsages([])
        return
      }

      if (!documentsData || documentsData.length === 0) {
        console.log('No documents found for cost analysis')
        setApiUsages([])
        return
      }

      // Convert documents to API usage format
      const processedData: ApiUsage[] = []
      
      documentsData.forEach((doc: DocumentData) => {
        // Extract cost and usage information from document fields
        const geminiCost = parseFloat(String(doc.cost_gemini || doc.gemini_cost || doc.ocr_cost || doc.costo_gemini || 0))
        const openaiCost = parseFloat(String(doc.cost_openai || 0))
        const openaiUsage = parseFloat(String(doc.unitary_usage_openai || 0))
        const serpApiUsage = parseFloat(String(doc.unitary_usage_serpapi || 0))
        const firecrawlUsage = parseFloat(String(doc.unitary_usage_firecrawl || 0))

        // Gemini OCR - 1 usage per document
        if (geminiCost > 0 || doc.id) {  // Always count if document exists
          processedData.push({
            id: `${doc.id}-gemini`,
            api_name: 'gemini',
            usage_type: 'ocr_processing',
            cost: geminiCost,
            usage_count: 1,  // Always 1 per document
            created_at: doc.created_at || new Date().toISOString()
          })
        }

        // OpenAI - with cost and usage
        if (openaiCost > 0 || openaiUsage > 0) {
          processedData.push({
            id: `${doc.id}-openai`,
            api_name: 'openai',
            usage_type: 'ai_processing',
            cost: openaiCost,
            usage_count: openaiUsage || (openaiCost > 0 ? 1 : 0),  // Default to 1 if cost exists but no usage count
            created_at: doc.created_at || new Date().toISOString()
          })
        }

        // SerpAPI - usage only (no cost)
        if (serpApiUsage > 0) {
          processedData.push({
            id: `${doc.id}-serpapi`,
            api_name: 'serpapi',
            usage_type: 'company_search',
            cost: 0,
            usage_count: serpApiUsage,
            created_at: doc.created_at || new Date().toISOString()
          })
        }


        // Firecrawl - usage only (no cost)
        if (firecrawlUsage > 0) {
          processedData.push({
            id: `${doc.id}-firecrawl`,
            api_name: 'firecrawl',
            usage_type: 'web_scraping',
            cost: 0,
            usage_count: firecrawlUsage,
            created_at: doc.created_at || new Date().toISOString()
          })
        }
      })

      setApiUsages(processedData)
      setDocumentsProcessed(documentsData.length)
      setDocumentsData(documentsData)
      console.log(`Processed ${processedData.length} API usage records from ${documentsData.length} documents`)
      console.log('Cost breakdown:', processedData)
      
    } catch (error) {
      console.error('Error fetching cost data from documents:', error)
      setApiUsages([])
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchApiUsages()
  }, [fetchApiUsages])

  const totalCost = apiUsages.reduce((sum, usage) => sum + usage.cost, 0)
  const totalRequests = apiUsages.reduce((sum, usage) => sum + usage.usage_count, 0)

  const costByApi = apiUsages.reduce((acc, usage) => {
    acc[usage.api_name] = (acc[usage.api_name] || 0) + usage.cost
    return acc
  }, {} as Record<string, number>)

  const requestsByApi = apiUsages.reduce((acc, usage) => {
    acc[usage.api_name] = (acc[usage.api_name] || 0) + usage.usage_count
    return acc
  }, {} as Record<string, number>)

  const dailyCosts = apiUsages.reduce((acc, usage) => {
    const date = format(new Date(usage.created_at), 'MMM dd')
    acc[date] = (acc[date] || 0) + usage.cost
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyCosts).map(([date, cost]) => ({
    date,
    cost: Number(cost.toFixed(2))
  })).reverse()

  // Show API usage counts in pie chart
  const pieData = Object.entries(requestsByApi)
    .filter(([, count]) => count > 0)
    .map(([api, count]) => ({
      name: api === 'gemini' ? 'Gemini OCR' : 
            api === 'openai' ? 'OpenAI' :
            api === 'serpapi' ? 'SerpAPI' : 
 
            api === 'firecrawl' ? 'Firecrawl' : api,
      value: count,
      color: api === 'gemini' ? '#3B82F6' : 
             api === 'openai' ? '#F59E0B' :
             api === 'serpapi' ? '#10B981' : 
 
             api === 'firecrawl' ? '#8B5CF6' : '#6B7280'
    }))

  const apiStats = [
    {
      name: 'Gemini OCR',
      cost: costByApi.gemini || 0,
      requests: requestsByApi.gemini || 0,
      avgCost: requestsByApi.gemini ? (costByApi.gemini || 0) / requestsByApi.gemini : 0,
      color: 'bg-blue-500',
      description: 'Document OCR processing',
      showCost: true
    },
    {
      name: 'OpenAI',
      cost: costByApi.openai || 0,
      requests: requestsByApi.openai || 0,
      avgCost: requestsByApi.openai ? (costByApi.openai || 0) / requestsByApi.openai : 0,
      color: 'bg-amber-500',
      description: 'AI text processing',
      showCost: true
    },
    {
      name: 'SerpAPI',
      cost: 0,
      requests: requestsByApi.serpapi || 0,
      avgCost: 0,
      color: 'bg-green-500',
      description: 'Company search & verification',
      showCost: false
    },
    {
      name: 'Firecrawl',
      cost: 0,
      requests: requestsByApi.firecrawl || 0,
      avgCost: 0,
      color: 'bg-purple-500',
      description: 'Web scraping & data extraction',
      showCost: false
    }
  ].filter(api => api.showCost ? (api.cost > 0 || api.requests > 0) : api.requests > 0) // Only show APIs with actual usage

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
          <DollarSign className="h-8 w-8" />
          Cost Tracking
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor API usage costs from document processing workflow
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">${totalCost.toFixed(2)}</h3>
              <p className="text-sm text-gray-700">Total API Cost</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-indigo-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{documentsProcessed}</h3>
              <p className="text-sm text-gray-700">Documents Processed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{totalRequests}</h3>
              <p className="text-sm text-gray-700">Total API Usage</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                ${documentsProcessed ? (totalCost / documentsProcessed).toFixed(2) : '0.00'}
              </h3>
              <p className="text-sm text-gray-700">Cost/Document</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-yellow-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                ${(totalCost / parseInt(selectedPeriod)).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-700">Daily Average</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daily Cost Trend</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">API Usage Distribution</h2>
          </div>
          <div className="p-6">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} uses`, 'Usage']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-700">No usage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">API Usage Breakdown</h2>
        </div>
        <div className="p-6">
          <div className={`grid grid-cols-1 ${apiStats.length === 3 ? 'md:grid-cols-3' : apiStats.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'} gap-6`}>
            {apiStats.map((api) => (
              <div key={api.name} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${api.color}`}></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{api.name}</h3>
                    <p className="text-xs text-gray-700">{api.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {api.showCost ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Total Cost</span>
                        <span className="font-medium text-gray-900">${api.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Documents</span>
                        <span className="font-medium text-gray-900">{api.requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Avg Cost/Doc</span>
                        <span className="font-medium text-gray-900">${api.avgCost.toFixed(4)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Total Usage</span>
                        <span className="font-medium text-gray-900">{api.requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Status</span>
                        <span className="font-medium text-gray-900">Tracked</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Cost Per Document (Successful)</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Gemini OCR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    OpenAI Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    OpenAI Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    SerpAPI Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Firecrawl Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    API Logs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(new Set(apiUsages.map(usage => usage.id.split('-')[0])))
                  .filter(docIdPrefix => {
                    const doc = documentsData.find(d => d.id.startsWith(docIdPrefix))
                    return doc?.status === 'completed'
                  })
                  .map(docIdPrefix => {
                  // Find the full document ID that starts with this prefix
                  const fullDocId = documentsData.find(doc => doc.id.startsWith(docIdPrefix))?.id
                  const docId = fullDocId || docIdPrefix
                  const docUsages = apiUsages.filter(usage => usage.id.startsWith(docIdPrefix))
                  const geminiCost = docUsages.find(u => u.api_name === 'gemini')?.cost || 0
                  const openaiCost = docUsages.find(u => u.api_name === 'openai')?.cost || 0
                  const openaiUsage = docUsages.find(u => u.api_name === 'openai')?.usage_count || 0
                  const serpApiUsage = docUsages.find(u => u.api_name === 'serpapi')?.usage_count || 0
                  const firecrawlUsage = docUsages.find(u => u.api_name === 'firecrawl')?.usage_count || 0
                  const docDate = docUsages[0]?.created_at
                  
                  // Find the actual document data
                  const actualDoc = documentsData.find(doc => doc.id === docId)
                  
                  
                  const documentName = actualDoc ? 
                    (actualDoc.filename || actualDoc.nombre_archivo || actualDoc.file_name || actualDoc.documento || 'Unknown Document') :
                    'Unknown Document'
                  
                  // Format API logs for display
                  const getApiLogsDisplay = () => {
                    if (!actualDoc?.api_details) return '-'
                    
                    const details = actualDoc.api_details as string | Record<string, unknown>
                    
                    // Handle string values
                    if (typeof details === 'string') {
                      // Color code based on content
                      const isSuccess = details.toLowerCase().includes('success')
                      const isError = details.toLowerCase().includes('error') || details.toLowerCase().includes('fail')
                      
                      return (
                        <span className={`text-xs ${isSuccess ? 'text-green-600' : isError ? 'text-red-600' : 'text-gray-700'}`}>
                          {details}
                        </span>
                      )
                    }
                    
                    // Handle objects
                    if (typeof details === 'object' && Object.keys(details).length > 0) {
                      // Try to extract meaningful information
                      const firstKey = Object.keys(details)[0]
                      const firstValue = details[firstKey]
                      
                      if (typeof firstValue === 'string' && firstValue.length < 30) {
                        return (
                          <span className="text-xs text-gray-700">
                            {firstValue}
                          </span>
                        )
                      }
                      
                      // For complex objects, show a summary
                      return (
                        <span className="text-xs text-gray-600" title={JSON.stringify(details, null, 2)}>
                          {Object.keys(details).length} entries
                        </span>
                      )
                    }
                    
                    return '-'
                  }
                  
                  return (
                    <tr key={docIdPrefix} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{documentName}</div>
                        <div className="text-xs text-gray-700">{docId.substring(0, 12)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {docDate ? format(new Date(docDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${geminiCost.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${openaiCost.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {openaiUsage || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {serpApiUsage || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {firecrawlUsage || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getApiLogsDisplay()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {apiUsages.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-700">No cost data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}