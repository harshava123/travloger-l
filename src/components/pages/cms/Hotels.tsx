import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Download, Upload, FileDown, Star, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchApi, handleApiError } from '../../../lib/api'
import Image from 'next/image'
import ErrorBoundary from '../../ErrorBoundary'

interface Hotel {
  id: string
  name: string
  category: number
  destination: string
  price: number
  address: string
  phone: string
  email: string
  icon_url: string
  status: string
  created_by: string
  date: string
}

interface HotelRate {
  id: number
  hotel_id: string
  from_date: string
  to_date: string
  from_date_formatted: string
  to_date_formatted: string
  room_type: string
  meal_plan: string
  single: number
  double: number
  triple: number
  quad: number
  cwb: number
  cnb: number
}

const Hotels: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    category: 3,
    price: 0,
    address: '',
    phone: '',
    email: '',
    iconUrl: '',
    status: 'Active'
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  
  const [destinations, setDestinations] = useState<string[]>([])
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

  // Rate management states
  const [showRateDialog, setShowRateDialog] = useState(false)
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null)
  const [rates, setRates] = useState<HotelRate[]>([])
  const [roomTypes, setRoomTypes] = useState<{id: number, name: string}[]>([])
  const [mealPlans, setMealPlans] = useState<string[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)
  const [rateMenuOpen, setRateMenuOpen] = useState<number | null>(null)

  const [rateForm, setRateForm] = useState({
    fromDate: '',
    toDate: '',
    roomType: '',
    mealPlan: 'APAI',
    single: '',
    double: '',
    triple: '',
    quad: '',
    cwb: '',
    cnb: ''
  })
  const [editingRate, setEditingRate] = useState<HotelRate | null>(null)

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsDataURL(file)
    })
  }

  useEffect(() => {
    fetchHotels()
    fetchDestinations()
  }, [])

  const fetchDestinations = async () => {
    try {
      const data = await fetchApi('/api/destinations');
      setDestinations(data.destinations?.map((d: any) => d.name) || []);
    } catch (error) {
      console.error('Error fetching destinations:', handleApiError(error));
    }
  }

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/hotels');
      setHotels(data.hotels || []);
    } catch (error) {
      console.error('Error fetching hotels:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  }

  const handleSaveHotel = async () => {
    if (!formData.name.trim() || !formData.destination.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Photo is required for new hotels, optional for updates
    if (!selectedFile && !editingHotel) {
      alert('Please select a hotel photo');
      return;
    }

    try {
      setSaving(true);
      const method = editingHotel ? 'PUT' : 'POST';
      
      let body = editingHotel 
        ? { id: editingHotel.id, ...formData }
        : formData;
      
      // Convert selected file to base64 if provided
      if (selectedFile) {
        try {
          const base64String = await convertFileToBase64(selectedFile);
          body.iconUrl = base64String;
          console.log('✅ File converted to base64:', selectedFile.name);
        } catch (error) {
          console.error('❌ Error converting file to base64:', error);
          alert('Error processing the image file. Please try again.');
          return;
        }
      }

      const data = await fetchApi('/api/hotels', {
        method,
        body: JSON.stringify(body)
      });

      await fetchHotels(); // Refresh the list
      setShowAddForm(false);
      setFormData({ name: '', destination: '', category: 3, price: 0, address: '', phone: '', email: '', iconUrl: '', status: 'Active' });
      setEditingHotel(null);
      setSelectedFile(null);
      setFileName('');
      alert(data.message || 'Hotel saved successfully');
    } catch (error) {
      console.error('Error saving hotel:', handleApiError(error));
      alert(handleApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteHotel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const data = await fetchApi(`/api/hotels?id=${id}`, {
        method: 'DELETE'
      });

      await fetchHotels(); // Refresh the list
      alert(data.message || 'Hotel deleted successfully');
    } catch (error) {
      console.error('Error deleting hotel:', handleApiError(error));
      alert(handleApiError(error));
    }
  }

  const handleEditClick = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      destination: hotel.destination,
      category: hotel.category,
      price: hotel.price,
      address: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      iconUrl: hotel.icon_url || '',
      status: hotel.status
    })
    setDestinationInput(hotel.destination || '')
    setSelectedFile(null)
    setFileName('')
    setShowAddForm(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG, GIF, etc.)')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingHotel(null)
    setFormData({ name: '', destination: '', category: 3, price: 0, address: '', phone: '', email: '', iconUrl: '', status: 'Active' })
    setDestinationInput('')
    setShowDestinationSuggestions(false)
    setSelectedFile(null)
    setFileName('')
  }

  // Rate management functions
  const fetchRoomTypes = async () => {
    try {
      const data = await fetchApi('/api/room-types');
      setRoomTypes(data.roomTypes || []);
    } catch (error) {
      console.error('Error fetching room types:', handleApiError(error));
    }
  }

  const fetchMealPlans = async () => {
    try {
      const data = await fetchApi('/api/meal-plans');
      const uniqueMealPlans = [...new Set((data.mealPlans || []).map((mp: any) => mp.meal_type))] as string[];
      setMealPlans(uniqueMealPlans);
    } catch (error) {
      console.error('Error fetching meal plans:', handleApiError(error));
    }
  }

  const openRateDialog = async (hotel: Hotel) => {
    try {
      setCurrentHotel(hotel);
      setShowRateDialog(true);
      setRateError(null);
      await Promise.all([
        fetchRoomTypes(),
        fetchMealPlans(),
        fetchRates(hotel.id)
      ]);
    } catch (error) {
      setRateError(handleApiError(error));
    }
  }

  const fetchRates = async (hotelId: string) => {
    try {
      setLoadingRates(true);
      console.log('🔄 Fetching rates for hotel:', hotelId);
      const data = await fetchApi(`/api/hotel-rates?hotelId=${hotelId}`);
      console.log('✅ Rates fetched successfully:', data.rates);
      setRates(data.rates || []);
      console.log('✅ Rates state updated with', data.rates?.length || 0, 'rates');
    } catch (error) {
      console.error('❌ Error fetching rates:', handleApiError(error));
    } finally {
      setLoadingRates(false);
    }
  }

  const handleAddRate = async () => {
    if (!currentHotel || !rateForm.fromDate || !rateForm.toDate || !rateForm.roomType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const body = {
        hotelId: currentHotel.id,
        fromDate: rateForm.fromDate,
        toDate: rateForm.toDate,
        roomType: rateForm.roomType,
        mealPlan: rateForm.mealPlan,
        single: parseFloat(rateForm.single) || 0,
        double: parseFloat(rateForm.double) || 0,
        triple: parseFloat(rateForm.triple) || 0,
        quad: parseFloat(rateForm.quad) || 0,
        cwb: parseFloat(rateForm.cwb) || 0,
        cnb: parseFloat(rateForm.cnb) || 0
      };

      console.log('💾 Saving rate with data:', body);

      const method = editingRate ? 'PUT' : 'POST';
      const url = '/api/hotel-rates';

      const data = await fetchApi(url, {
        method,
        body: JSON.stringify(editingRate ? { id: editingRate.id, ...body } : body)
      });

      console.log('✅ Rate saved successfully! Refreshing rates list...');
      if (currentHotel) {
        await fetchRates(currentHotel.id);
      }
      setRateForm({
        fromDate: '',
        toDate: '',
        roomType: '',
        mealPlan: 'APAI',
        single: '',
        double: '',
        triple: '',
        quad: '',
        cwb: '',
        cnb: ''
      });
      setEditingRate(null);
      console.log('✅ Form cleared, rates should now be visible in table');
    } catch (error) {
      console.error('❌ Error saving rate:', handleApiError(error));
      alert(handleApiError(error));
    }
  }

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      await fetchApi(`/api/hotel-rates?id=${id}`, {
        method: 'DELETE'
      });

      if (currentHotel) {
        await fetchRates(currentHotel.id);
      }
      // Rate deleted successfully - table will auto-update
    } catch (error) {
      console.error('Error deleting rate:', handleApiError(error));
      alert(handleApiError(error));
    }
  }

  const handleEditRate = (rate: HotelRate) => {
    setEditingRate(rate)
    setRateForm({
      fromDate: rate.from_date,
      toDate: rate.to_date,
      roomType: rate.room_type,
      mealPlan: rate.meal_plan,
      single: rate.single.toString(),
      double: rate.double.toString(),
      triple: rate.triple.toString(),
      quad: rate.quad.toString(),
      cwb: rate.cwb.toString(),
      cnb: rate.cnb.toString()
    })
    setRateMenuOpen(null)
  }

  const handleCloseRateDialog = () => {
    setShowRateDialog(false);
    setCurrentHotel(null);
    setRates([]);
    setEditingRate(null);
    setRateError(null);
    setRateForm({
      fromDate: '',
      toDate: '',
      roomType: '',
      mealPlan: 'APAI',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: ''
    });
  }

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading hotels...</p>
        </div>
      </div>
    )
  }

  const renderStars = (category: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < category ? 'text-orange-500 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings/admin')}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="text-xs">Back to Admin Settings</span>
              </button>
              <h1 className="text-lg font-bold text-gray-900">Hotel</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-40 h-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Download className="w-3 h-3 mr-1" />
                Download Format
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Upload className="w-3 h-3 mr-1" />
                Import File
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <FileDown className="w-3 h-3 mr-1" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Hotel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">🏨</span>
                          </div>
                          <button 
                            onClick={() => openRateDialog(hotel)}
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate text-left"
                          >
                            {hotel.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          {renderStars(hotel.category)}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {hotel.destination}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <button className="text-blue-600 hover:text-blue-800 underline">
                          ₹{hotel.price}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {hotel.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{hotel.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {hotel.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(hotel)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Total Records */}
        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredHotels.length}
        </div>
      </div>

      {/* Add Hotel Form Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          
          {/* Sliding Panel */}
          <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingHotel ? 'Edit Hotel' : 'Add Hotel'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 p-6 overflow-y-auto">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel name
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter hotel name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-3.5"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: parseInt(e.target.value)})}
                      >
                        <option value="">Select</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Star</option>
                        <option value="3">3 Star</option>
                        <option value="4">4 Star</option>
                        <option value="5">5 Star</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Type to search destinations..."
                        value={destinationInput}
                        onChange={(e) => {
                          setDestinationInput(e.target.value)
                          setShowDestinationSuggestions(true)
                        }}
                        onFocus={() => setShowDestinationSuggestions(true)}
                        className="border-l-2 border-red-500"
                      />
                      
                      {showDestinationSuggestions && destinationInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {destinations
                            .filter(d => d.toLowerCase().includes(destinationInput.toLowerCase()))
                            .map((destination, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                                onClick={() => {
                                  setFormData({...formData, destination: destination})
                                  setDestinationInput(destination)
                                  setShowDestinationSuggestions(false)
                                }}
                              >
                                {destination}
                              </button>
                            ))}
                          {destinations.filter(d => d.toLowerCase().includes(destinationInput.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">No destinations found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <Input 
                      type="number" 
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter hotel address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Photo {!editingHotel && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="photo"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="photo"
                        className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 text-sm"
                      >
                        Choose File
                      </label>
                      <span className="text-sm text-gray-500">
                        {fileName || (editingHotel ? 'No new file selected' : 'No file chosen')}
                      </span>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-green-600">
                          ✓ File selected: {fileName}
                        </div>
                        <div className="w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                          <Image 
                            src={URL.createObjectURL(selectedFile)} 
                            alt="Preview" 
                            className="object-cover"
                            fill
                            sizes="80px"
                            priority
                          />
                        </div>
                      </div>
                    )}
                    {editingHotel && !selectedFile && (
                      <div className="mt-2 text-xs text-blue-600">
                        ℹ Current photo will be kept if no new file is selected
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input 
                      type="email" 
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input 
                      type="tel" 
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseForm}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveHotel}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingHotel ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Management Dialog */}
      {showRateDialog && currentHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow-xl w-[1200px] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Update Price</h2>
              <button
                onClick={handleCloseRateDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {/* Hotel Name */}
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-900">{currentHotel.name}</p>
              </div>

              {/* Rate Form */}
              <div className="mb-6">
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">From Date</label>
                    <Input
                      type="date"
                      value={rateForm.fromDate}
                      onChange={(e) => setRateForm({...rateForm, fromDate: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <Input
                      type="date"
                      value={rateForm.toDate}
                      onChange={(e) => setRateForm({...rateForm, toDate: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Room Type</label>
                    <select
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm"
                      value={rateForm.roomType}
                      onChange={(e) => setRateForm({...rateForm, roomType: e.target.value})}
                    >
                      <option value="">Select</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.name}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Meal Plan</label>
                    <select
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm"
                      value={rateForm.mealPlan}
                      onChange={(e) => setRateForm({...rateForm, mealPlan: e.target.value})}
                    >
                      {mealPlans.map((mp, idx) => (
                        <option key={idx} value={mp}>{mp}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Single</label>
                    <Input
                      type="number"
                      value={rateForm.single}
                      onChange={(e) => setRateForm({...rateForm, single: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Double</label>
                    <Input
                      type="number"
                      value={rateForm.double}
                      onChange={(e) => setRateForm({...rateForm, double: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className=" lasang block text-xs text-gray-600 mb-1">Triple</label>
                    <Input
                      type="number"
                      value={rateForm.triple}
                      onChange={(e) => setRateForm({...rateForm, triple: e.target.value})}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Quad</label>
                    <Input
                      type="number"
                      value={rateForm.quad}
                      onChange={(e) => setRateForm({...rateForm, quad: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">CWB</label>
                    <Input
                      type="number"
                      value={rateForm.cwb}
                      onChange={(e) => setRateForm({...rateForm, cwb: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">CNB</label>
                    <Input
                      type="number"
                      value={rateForm.cnb}
                      onChange={(e) => setRateForm({...rateForm, cnb: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-9 flex items-end">
                    <Button
                      onClick={handleAddRate}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Rate List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Rate List</h3>
                {rateError ? (
                  <div className="text-center py-4">
                    <div className="text-red-600 text-sm">{rateError}</div>
                    <button
                      onClick={() => {
                        setRateError(null);
                        if (currentHotel) {
                          fetchRates(currentHotel.id);
                        }
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : loadingRates ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">From</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">To</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Room Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Meal Plan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Single</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Double</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Triple</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Quad</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CWB</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CNB</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => { console.log('🎨 Rendering rates table with', rates.length, 'rates:', rates); return null; })()}
                        {rates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.from_date_formatted}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.to_date_formatted}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.room_type}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.meal_plan}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.single || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.double || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.triple || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.quad || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.cwb || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.cnb || '-'}</td>
                            <td className="px-3 py-2 relative">
                              <button
                                onClick={() => setRateMenuOpen(rateMenuOpen === rate.id ? null : rate.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {rateMenuOpen === rate.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <button
                                    onClick={() => handleEditRate(rate)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRate(rate.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {rates.length === 0 && (
                          <tr>
                            <td colSpan={11} className="px-3 py-4 text-center text-sm text-gray-500">
                              No rates added yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          </ErrorBoundary>
        </div>
      )}
    </div>
  )
}

export default Hotels

