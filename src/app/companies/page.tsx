'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Search, Eye, Mail, Phone, Globe, FileText } from 'lucide-react'
import type { CompanyData } from '@/types/database'

interface CompanyDisplay {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  tax_id?: string
  created_at: string
  role?: string
  [key: string]: unknown
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<CompanyDisplay | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      // Try to fetch all data without assuming column names
      const { data, error } = await supabase
        .from('companies')
        .select('*')

      if (error) {
        console.error('Error fetching companies:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setCompanies([])
      } else {
        console.log('Companies data fetched successfully:', data)
        // Convert any data structure to our expected format
        const processedData = (data || []).map((item: CompanyData, index: number) => {
          const processedItem: CompanyDisplay = {
            id: item.id || (item.ID as string | undefined) || index.toString(),
            name: item.empresa || item.name || item.Name || item.company_name || item.nombre || 'Unknown Company',
            address: item.direccion || item.address || item.Address || '',
            city: item.ciudad || item.city || item.City || '',
            country: item.pais || item.country || item.Country || '',
            phone: item.telefono || item.phone || item.Phone || '',
            email: item.correo || item.email || item.Email || '',
            website: item.web || item.website || item.Website || '',
            tax_id: item.tax_id || item.taxId || item.tax_number || item.nif || item.cif || item.vat_number || item.fiscal_id || '',
            role: (item.role as string) || '',
            created_at: item.created_at || item.Created_At || new Date().toISOString()
          }
          // Add additional properties from original item
          Object.keys(item).forEach(key => {
            if (!(key in processedItem)) {
              (processedItem as Record<string, unknown>)[key] = item[key]
            }
          })
          return processedItem
        })
        setCompanies(processedData)
      }
    } catch (error) {
      console.error('Error:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.country?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || company.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Companies
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage company information extracted from documents
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search companies by name, city, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-blue-50 border border-blue-300 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="expedidor">Expedidor</option>
            <option value="destinatario">Destinatario</option>
            <option value="transportista">Transportista</option>
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        <div className="bg-white rounded-lg shadow flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-medium text-gray-900">
              Companies ({filteredCompanies.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredCompanies.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCompany?.id === company.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{company.name || 'Unnamed Company'}</h3>
                        {company.city && (
                          <p className="text-sm text-gray-700 mt-1">
                            {company.city}{company.country && `, ${company.country}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          ID: {company.id}
                        </p>
                        {/* Show all available fields */}
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.keys(company).filter(key => !['id', 'name', 'city', 'country'].includes(key)).slice(0, 3).map(key => (
                            <span key={key} className="mr-2">
                              {key}: {String(company[key]).substring(0, 20)}...
                            </span>
                          ))}
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-700">
                  {searchTerm ? 'No companies match your search' : 'No companies found'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow flex flex-col min-h-0">
          {selectedCompany ? (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-medium text-gray-900">Company Details</h2>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedCompany.name || 'Unnamed Company'}
                  </h3>
                  <p className="text-sm text-gray-700">
                    Company ID: {selectedCompany.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {selectedCompany.role && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Role</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedCompany.role === 'expedidor' ? 'bg-blue-100 text-blue-800' :
                          selectedCompany.role === 'destinatario' ? 'bg-green-100 text-green-800' :
                          selectedCompany.role === 'transportista' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedCompany.role}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedCompany.address && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Address</p>
                        <p className="text-gray-600">{selectedCompany.address}</p>
                      </div>
                    </div>
                  )}

                  {selectedCompany.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Phone</p>
                        <p className="text-gray-600">{selectedCompany.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedCompany.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Email</p>
                        <p className="text-gray-600">{selectedCompany.email}</p>
                      </div>
                    </div>
                  )}

                  {selectedCompany.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Website</p>
                        <a
                          href={selectedCompany.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedCompany.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedCompany.tax_id && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Tax ID</p>
                        <p className="text-gray-600 font-mono">{selectedCompany.tax_id}</p>
                      </div>
                    </div>
                  )}

                  {selectedCompany.role === 'transportista' && (selectedCompany['vehiculo'] || selectedCompany['tipo_camion']) ? (
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Vehicle Information</p>
                        {selectedCompany['vehiculo'] ? (
                          <p className="text-gray-600">Vehicle: {selectedCompany['vehiculo'] as string}</p>
                        ) : null}
                        {selectedCompany['tipo_camion'] ? (
                          <p className="text-gray-600">Truck Type: {selectedCompany['tipo_camion'] as string}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-4">
                    Company ID: {selectedCompany.id}
                  </p>
                  
                  {/* Show all raw data */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">All Available Data:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedCompany, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a company to view details
                </h3>
                <p className="text-gray-700">
                  Choose a company from the list to see detailed information
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}