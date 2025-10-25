import React, { useEffect, useState } from 'react'
import ViewQuotationModal from '../ui/ViewQuotationModal'

// Proposals page that fetches itineraries from database like ItineraryBuilder/Itineraries
// Expects a leadId prop to filter proposals

const Proposals = ({ leadId }) => {
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState([])
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(null) // Track which proposal is being confirmed
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchProposals = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch itineraries from the same API as Itineraries.tsx
        const res = await fetch('/api/itineraries', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        
        if (res.ok && Array.isArray(data.itineraries)) {
          console.log('Fetched itineraries for proposals:', data.itineraries)
          // Transform itineraries to proposal format with price calculation
          const transformedProposals = await Promise.all(data.itineraries.map(async (itinerary) => {
            console.log('🔄 Processing itinerary:', itinerary.id)
            console.log('🖼️ Cover photo exists:', !!itinerary.cover_photo)
            console.log('🖼️ Cover photo length:', itinerary.cover_photo?.length)
            console.log('🖼️ Cover photo preview:', itinerary.cover_photo?.substring(0, 50) + '...')
            console.log('🖼️ Cover photo starts with data:', itinerary.cover_photo?.startsWith('data:'))
            
            const imageUrl = itinerary.cover_photo ? 
              (itinerary.cover_photo.startsWith('data:') ? itinerary.cover_photo : `data:image/jpeg;base64,${itinerary.cover_photo}`) : 
              'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
            
            console.log('🖼️ Final image URL:', imageUrl.substring(0, 50) + '...')
            
            // Calculate total price from events
            const totalPrice = await calculateTotalPrice(itinerary.id)
            console.log('💰 Calculated total price for itinerary', itinerary.id, ':', totalPrice)
            
            return {
            id: itinerary.id,
            title: itinerary.name || 'Untitled Itinerary',
            locations: itinerary.destinations || 'Not specified',
            pax: `${itinerary.adults || 0} Adult(s) - ${itinerary.children || 0} Child(s)`,
            from: itinerary.start_date ? new Date(itinerary.start_date).toLocaleDateString('en-GB') : 'Not specified',
            to: itinerary.end_date ? new Date(itinerary.end_date).toLocaleDateString('en-GB') : 'Not specified',
            createdBy: 'Travloger.in',
            createdOn: itinerary.created_at ? new Date(itinerary.created_at).toLocaleDateString('en-GB') : 'Not specified',
            optionLabel: 'Option 1',
            price: totalPrice,
            status: itinerary.status || 'pending',
            image: imageUrl,
            marketplace_shared: itinerary.marketplace_shared || false
            }
          }))
          
          if (mounted) setProposals(transformedProposals)
        } else {
          if (mounted) {
            setError(data.error || 'Failed to load proposals')
            setProposals(getDemoProposals())
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Network error loading proposals')
          setProposals(getDemoProposals())
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProposals()
    return () => { mounted = false }
  }, [leadId])

  // Function to calculate total price from all events (same as Itineraries.tsx)
  const calculateTotalPrice = async (itineraryId) => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/events`)
      if (!response.ok) return 0
      
      const data = await response.json()
      const events = data.events || []
      
      let total = 0
      events.forEach((event) => {
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

  // Handle proposal confirmation
  const handleConfirmProposal = async (proposalId) => {
    try {
      setConfirming(proposalId)
      console.log('🔄 Confirming proposal:', proposalId)
      
      // Update the proposal status in the database
      const response = await fetch(`/api/itineraries/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        }),
      })

      if (response.ok) {
        // Update local state
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { ...p, status: 'confirmed' }
            : p
        ))
        console.log('✅ Proposal confirmed successfully:', proposalId)
        
        // Show success message
        alert(`Proposal ${proposalId} has been confirmed!`)
      } else {
        console.error('❌ Failed to confirm proposal:', response.status)
        alert('Failed to confirm proposal. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error confirming proposal:', error)
      alert('Error confirming proposal. Please try again.')
    } finally {
      setConfirming(null)
    }
  }

  // Handle view quotation button click
  const handleViewQuotation = (itineraryId) => {
    setSelectedItineraryId(itineraryId)
    setShowQuotationModal(true)
  }

  const getDemoProposals = () => {
    return [
      {
        id: 100097,
        title: '3 DAYS KERALA BLISS',
        locations: 'Kerala, Cochin, Munnar',
        pax: '2 Adult(s) - 0 Child(s)',
        from: '16 Feb 2025',
        to: '18 Feb 2025',
        createdBy: 'Travloger.in',
        createdOn: '13/10/2025',
        optionLabel: 'Option 1',
        price: 17010,
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop'
      },
      {
        id: 100096,
        title: '3 DAYS KERALA BLISS',
        locations: 'Kerala, Cochin, Munnar',
        pax: '2 Adult(s) - 0 Child(s)',
        from: '11 Nov 2025',
        to: '14 Nov 2025',
        createdBy: 'Travloger.in',
        createdOn: '10/10/2025',
        optionLabel: 'Option 1',
        price: 22260,
        status: 'confirmed',
        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
      }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
      </div>
    )
  }

  if (error) {
    console.warn('Proposals error:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Proposals</h2>
          {error && (
            <p className="text-sm text-red-600 mt-1">Using demo data due to: {error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
            <span className="mr-2">＋</span>
            Create itinerary
          </button>
          <button className="inline-flex items-center px-4 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800">
            <span className="mr-2">⬇</span>
            Insert itinerary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposals.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="relative h-44 w-full overflow-hidden">
              <img 
                src={p.image} 
                alt={p.title} 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  console.log('❌ Image failed to load for itinerary:', p.id)
                  console.log('❌ Image URL:', p.image)
                  console.log('❌ Image URL length:', p.image?.length)
                  console.log('❌ Image URL starts with data:', p.image?.startsWith('data:'))
                  e.target.src = 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully for itinerary:', p.id)
                  console.log('✅ Image URL:', p.image)
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{p.locations}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">ID</div>
                  <div className="font-medium">{p.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Pax</div>
                  <div className="font-medium">{p.pax}</div>
                </div>
                <div>
                  <div className="text-gray-500">From</div>
                  <div className="font-medium">{p.from}</div>
                </div>
                <div>
                  <div className="text-gray-500">To</div>
                  <div className="font-medium">{p.to}</div>
                </div>
                <div>
                  <div className="text-gray-500">By</div>
                  <div className="font-medium">{p.createdBy}</div>
                </div>
                <div>
                  <div className="text-gray-500">Created</div>
                  <div className="font-medium">{p.createdOn}</div>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">
                    {p.optionLabel}: ₹{Number(p.price || 0).toLocaleString('en-IN')}
                  </div>
                  {p.status === 'confirmed' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-emerald-500 text-white">✔ Confirmed</span>
                  ) : (
                    <button 
                      onClick={() => handleConfirmProposal(p.id)}
                      disabled={confirming === p.id}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirming === p.id ? 'Confirming...' : 'Make Confirm'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <button 
                  onClick={() => handleViewQuotation(p.id)}
                  className="w-full inline-flex items-center justify-center h-10 px-4 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800"
                >
                  View Quotation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Quotation Modal */}
      <ViewQuotationModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        itineraryId={selectedItineraryId}
        queryId={leadId}
      />
    </div>
  )
}

export default Proposals


