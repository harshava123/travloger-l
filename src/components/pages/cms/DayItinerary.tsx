import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DayItinerary {
  id: number
  title: string
  detail: string
  status: string
  created_by: string
  date: string
}

const DayItinerary: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingDayItinerary, setEditingDayItinerary] = useState<DayItinerary | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    detail: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchDayItineraries()
  }, [])

  const fetchDayItineraries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/day-itineraries')
      const data = await response.json()
      
      if (response.ok) {
        setDayItineraries(data.dayItineraries || [])
      } else {
        console.error('Failed to fetch day itineraries:', data.error)
      }
    } catch (error) {
      console.error('Error fetching day itineraries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDayItinerary = async () => {
    if (!formData.title.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const method = editingDayItinerary ? 'PUT' : 'POST'
      const body = editingDayItinerary 
        ? { id: editingDayItinerary.id, ...formData }
        : formData

      const response = await fetch('/api/day-itineraries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDayItineraries()
        setShowAddForm(false)
        setFormData({ title: '', detail: '', status: 'Active' })
        setEditingDayItinerary(null)
        alert(data.message || 'Day itinerary saved successfully')
      } else {
        alert(data.error || 'Failed to save day itinerary')
      }
    } catch (error) {
      console.error('Error saving day itinerary:', error)
      alert('Error saving day itinerary')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDayItinerary = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/day-itineraries?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDayItineraries()
        alert(data.message || 'Day itinerary deleted successfully')
      } else {
        alert(data.error || 'Failed to delete day itinerary')
      }
    } catch (error) {
      console.error('Error deleting day itinerary:', error)
      alert('Error deleting day itinerary')
    }
  }

  const handleEditClick = (dayItinerary: DayItinerary) => {
    setEditingDayItinerary(dayItinerary)
    setFormData({
      title: dayItinerary.title,
      detail: dayItinerary.detail,
      status: dayItinerary.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingDayItinerary(null)
    setFormData({ title: '', detail: '', status: 'Active' })
  }

  const filteredDayItineraries = dayItineraries.filter(di =>
    di.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading day itineraries...</p>
        </div>
      </div>
    )
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
              <h1 className="text-lg font-bold text-gray-900">Day Itinerary</h1>
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
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Day Itinerary
            </Button>
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
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDayItineraries.map((dayItinerary) => (
                    <tr key={dayItinerary.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <FolderOpen className="h-5 w-5 text-orange-500" />
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {dayItinerary.title}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">{dayItinerary.detail || '-'}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {dayItinerary.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{dayItinerary.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {dayItinerary.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(dayItinerary)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteDayItinerary(dayItinerary.id, dayItinerary.title)}
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

        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredDayItineraries.length}
        </div>
      </div>

      {/* Add Day Itinerary Form Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingDayItinerary ? 'Edit Day Itinerary' : 'Add Day Itinerary'}
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

              <div className="flex-1 p-6 overflow-y-auto">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter day itinerary title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detail
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      placeholder="Enter detail"
                      value={formData.detail}
                      onChange={(e) => setFormData({...formData, detail: e.target.value})}
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
                    onClick={handleSaveDayItinerary}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingDayItinerary ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DayItinerary