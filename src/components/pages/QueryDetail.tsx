import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  MessageCircle, 
  Mail, 
  CheckSquare, 
  Edit, 
  Plus,
  FileText,
  File,
  CreditCard,
  FileCheck,
  Calendar,
  MapPin,
  User,
  Phone,
  AtSign,
  ArrowLeft,
  Clock,
  Tag,
  Building2,
  Star,
  AlertCircle,
  Shield,
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react'

interface QueryDetail {
  id: number
  name: string
  email: string
  phone: string
  destination: string
  from_date: string
  to_date: string
  travel_month: string
  lead_source: string
  services: string
  pax: {
    adults: number
    children: number
    infants: number
  }
  assigned_to: string
  status: string
  created_at: string
  last_updated: string
  notes: string
}

const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [query, setQuery] = useState<QueryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [packageSuggestions, setPackageSuggestions] = useState<any[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const maxRetries = 3

  // Fetch query data from database
  useEffect(() => {
    const fetchQuery = async () => {
      try {
        setLoading(true)
        
        if (!id) {
          console.error('No query ID provided')
          setLoading(false)
          return
        }

        console.log(`Fetching query data for ID: ${id} (attempt ${retryCount + 1})`)

        const response = await fetch(`/api/leads/${id}`)
        console.log('API Response status:', response.status)
        
        if (!response.ok) {
          console.error('API response not ok:', response.status, response.statusText)
          throw new Error(`API request failed with status ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API Response data:', data)
        
        if (data.lead) {
          const lead = data.lead
          console.log('Raw lead data:', lead)
          
          const queryData: QueryDetail = {
            id: parseInt(id),
            name: lead.name || 'Unknown',
            email: lead.email || 'No email',
            phone: lead.phone || 'No phone',
            destination: lead.destination || 'Not specified',
            from_date: lead.travel_dates ? 
              (lead.travel_dates.includes(' to ') ? 
                lead.travel_dates.split(' to ')[0] : 
                lead.travel_dates) : 
              'Not specified',
            to_date: lead.travel_dates && lead.travel_dates.includes(' to ') ? 
              lead.travel_dates.split(' to ')[1] : 
              'Not specified',
            travel_month: lead.travel_dates ? 
              (() => {
                try {
                  const dateStr = lead.travel_dates.includes(' to ') ? 
                    lead.travel_dates.split(' to ')[0] : 
                    lead.travel_dates
                  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long' })
                } catch {
                  return 'Not specified'
                }
              })() : 
              'Not specified',
            lead_source: lead.source || 'Not specified',
            services: lead.custom_notes || 'Full package',
            pax: {
              adults: parseInt(lead.number_of_travelers) || 2,
              children: 0,
              infants: 0
            },
            assigned_to: lead.assigned_employee_name || 'Unassigned',
            status: lead.status || 'New',
            created_at: lead.created_at ? 
              new Date(lead.created_at).toLocaleDateString('en-GB') : 
              'Not specified',
            last_updated: lead.created_at ? 
              new Date(lead.created_at).toLocaleDateString('en-GB') + ' - ' + 
              new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
              'Not specified',
            notes: lead.custom_notes || 'No Notes'
          }
          
          console.log('Transformed query data:', queryData)
          setQuery(queryData)
          setRetryCount(0)
        } else {
          console.error('No lead data in response:', data)
          throw new Error('No lead data found in API response')
        }
      } catch (error) {
        console.error('Failed to fetch query:', error)
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 2000)
          return
        }
        
        const fallbackQuery: QueryDetail = {
          id: parseInt(id || '0'),
          name: 'Error loading data',
          email: 'Error loading data',
          phone: 'Error loading data',
          destination: 'Error loading data',
          from_date: 'Error loading data',
          to_date: 'Error loading data',
          travel_month: 'Error loading data',
          lead_source: 'Error loading data',
          services: 'Error loading data',
          pax: { adults: 0, children: 0, infants: 0 },
          assigned_to: 'Error loading data',
          status: 'New',
          created_at: 'Error loading data',
          last_updated: 'Error loading data',
          notes: `Error loading query data: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
        setQuery(fallbackQuery)
      } finally {
        setLoading(false)
      }
    }

    fetchQuery()
  }, [id, retryCount])

  // Function to calculate total price from all events (same as Itineraries.tsx)
  const calculateTotalPrice = async (itineraryId: number): Promise<number> => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/events`)
      if (!response.ok) return 0
      
      const data = await response.json()
      const events = data.events || []
      
      let total = 0
      events.forEach((event: any) => {
        const eventData = event.event_data
        if (eventData && eventData.price) {
          // Parse price as number
          const price = typeof eventData.price === 'string' 
            ? parseFloat(eventData.price) 
            : eventData.price
          if (!isNaN(price)) {
            total += price
          }
        }
      })
      
      return total
    } catch (error) {
      console.error('Error calculating total price:', error)
      return 0
    }
  }

  // Fetch package suggestions from database
  const fetchPackageSuggestions = async () => {
    try {
      setSuggestionsLoading(true)
      console.log('🔄 Fetching package suggestions...')
      
      // Fetch itineraries that match the query destination
      const response = await fetch('/api/itineraries', { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok && Array.isArray(data.itineraries)) {
        console.log('🔍 Total itineraries fetched:', data.itineraries.length)
        console.log('🎯 Query destination:', query?.destination)
        console.log('📋 All itineraries:', data.itineraries.map((i: any) => ({ id: i.id, name: i.name, destinations: i.destinations })))
        
        // Filter itineraries that match the query destination
        const filteredItineraries = data.itineraries.filter((itinerary: any) => {
          if (!query?.destination) {
            console.log('⚠️ No query destination, showing all')
            return true
          }
          const matches = itinerary.destinations?.toLowerCase().includes(query.destination.toLowerCase())
          console.log(`🔍 Checking "${itinerary.destinations}" against "${query.destination}": ${matches}`)
          return matches
        }).slice(0, 5) // Limit to 5 suggestions

        // Calculate prices for all filtered itineraries
        const suggestionsWithPrices = await Promise.all(
          filteredItineraries.map(async (itinerary: any) => {
            const totalPrice = await calculateTotalPrice(itinerary.id)
            console.log(`💰 Calculated price for itinerary ${itinerary.id}: ${totalPrice}`)
            
            return {
              id: itinerary.id,
              title: itinerary.name || 'Untitled Package',
              destinations: itinerary.destinations || 'Not specified',
              price: totalPrice,
              cover_photo: itinerary.cover_photo,
              created_at: itinerary.created_at,
              created_by: 'Travloger.in'
            }
          })
        )
        
        console.log('✅ Loaded package suggestions:', suggestionsWithPrices.length)
        console.log('📦 Suggestions with prices:', suggestionsWithPrices)
        
        // If no matching suggestions found, show all itineraries (for debugging)
        if (suggestionsWithPrices.length === 0 && data.itineraries.length > 0) {
          console.log('⚠️ No matching suggestions, showing all itineraries for debugging')
          const allSuggestions = await Promise.all(
            data.itineraries.slice(0, 5).map(async (itinerary: any) => {
              const totalPrice = await calculateTotalPrice(itinerary.id)
              return {
                id: itinerary.id,
                title: itinerary.name || 'Untitled Package',
                destinations: itinerary.destinations || 'Not specified',
                price: totalPrice,
                cover_photo: itinerary.cover_photo,
                created_at: itinerary.created_at,
                created_by: 'Travloger.in'
              }
            })
          )
          setPackageSuggestions(allSuggestions)
        } else {
          setPackageSuggestions(suggestionsWithPrices)
        }
      } else {
        console.error('❌ Failed to fetch package suggestions:', data.error)
        setPackageSuggestions([])
      }
    } catch (error) {
      console.error('❌ Error fetching package suggestions:', error)
      setPackageSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  // Fetch package suggestions when query data is loaded
  useEffect(() => {
    if (query) {
      fetchPackageSuggestions()
    }
  }, [query])

  const [activeView, setActiveView] = useState<'details' | 'proposals'>('details')

  const handleBackToQueries = () => {
    navigate('/queries')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading query details...</p>
        </div>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Query Not Found</h3>
            <p className="text-muted-foreground">The query you're looking for doesn't exist or has been removed.</p>
          </div>
          <Button onClick={handleBackToQueries}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queries
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Query Management</h2>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          
          <nav className="space-y-1">
            <div 
              className={`flex items-center gap-3 px-3 py-2 ${activeView === 'details' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'} rounded-md cursor-pointer transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => setActiveView('details')}
            >
              <FileText className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Query Details</span>}
            </div>
            
            <div
              className={`flex items-center gap-3 px-3 py-2 ${activeView === 'proposals' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'} rounded-md cursor-pointer transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => setActiveView('proposals')}
            >
              <File className="w-4 h-4" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm">Proposals</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </div>
            
            <div className={`flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <CreditCard className="w-4 h-4" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm">Billing</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </div>
            
            <div className={`flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <FileCheck className="w-4 h-4" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm">Guest Documents</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleBackToQueries} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queries
            </Button>
            
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Whatsapp
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Task
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {activeView === 'proposals' ? (
            // Proposals view
            <div>
              {/* Lazy import guard: only require when needed */}
              {(() => {
                const Proposals = require('./Proposals.jsx').default
                return <Proposals leadId={query.id} />
              })()}
            </div>
          ) : (
            <>
          {/* Query Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Query #{query.id}</CardTitle>
                  <p className="text-muted-foreground mt-1">Lead Management Dashboard</p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  Created: {query.created_at}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <AtSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Query Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Query Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Destination</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.destination}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">From Date</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.from_date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">To Date</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.to_date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Lead Source</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.lead_source}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Services</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.services}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Assign To</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{query.assigned_to}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-md">
                <p className="text-muted-foreground">
                  {query.notes || 'No notes available for this query.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Package Suggestion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Kerala Package Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading package suggestions...</p>
                </div>
              ) : packageSuggestions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-700">Title</th>
                        <th className="px-4 py-2 font-medium text-gray-700">Price</th>
                        <th className="px-4 py-2 font-medium text-gray-700">Created</th>
                        <th className="px-4 py-2 font-medium text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {packageSuggestions.map((suggestion) => (
                        <tr key={suggestion.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={suggestion.cover_photo ? 
                                  (suggestion.cover_photo.startsWith('data:') ? 
                                    suggestion.cover_photo : 
                                    `data:image/jpeg;base64,${suggestion.cover_photo}`) : 
                                  'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=100&auto=format&fit=crop'
                                } 
                                alt={suggestion.title} 
                                className="w-12 h-12 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=100&auto=format&fit=crop'
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{suggestion.title}</div>
                                <div className="text-xs text-gray-500">ID: {suggestion.id} - {suggestion.destinations}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-green-600">₹{Number(suggestion.price || 0).toLocaleString('en-IN')}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{suggestion.created_by}</div>
                            <div className="text-xs text-gray-500">
                              {suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString('en-GB') : 'Not specified'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              onClick={() => {
                                console.log('🎯 Selected package:', suggestion.id)
                                alert(`Package "${suggestion.title}" selected!`)
                              }}
                            >
                              + Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Package Suggestions</h3>
                  <p className="text-muted-foreground text-sm">
                    No matching packages found for this destination.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default QueryDetail