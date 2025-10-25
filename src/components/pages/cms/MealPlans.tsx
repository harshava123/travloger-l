import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MealPlan {
  id: number
  name: string
  destination: string
  meal_type: string
  price: number
  status: string
  created_by: string
  date: string
}

const MealPlans: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    mealType: 'BB',
    price: 0,
    status: 'Active'
  })
  
  const [destinations, setDestinations] = useState<string[]>([])
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

  useEffect(() => {
    fetchMealPlans()
    fetchDestinations()
  }, [])

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations')
      const data = await response.json()
      
      if (response.ok) {
        setDestinations(data.destinations?.map((d: any) => d.name) || [])
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    }
  }

  const fetchMealPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meal-plans')
      const data = await response.json()
      
      if (response.ok) {
        setMealPlans(data.mealPlans || [])
      } else {
        console.error('Failed to fetch meal plans:', data.error)
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMealPlan = async () => {
    if (!formData.name.trim() || !formData.destination.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const method = editingMealPlan ? 'PUT' : 'POST'
      const body = editingMealPlan 
        ? { id: editingMealPlan.id, ...formData }
        : formData

      const response = await fetch('/api/meal-plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMealPlans()
        setShowAddForm(false)
        setFormData({ name: '', destination: '', mealType: 'BB', price: 0, status: 'Active' })
        setEditingMealPlan(null)
        alert(data.message || 'Meal plan saved successfully')
      } else {
        alert(data.error || 'Failed to save meal plan')
      }
    } catch (error) {
      console.error('Error saving meal plan:', error)
      alert('Error saving meal plan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMealPlan = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/meal-plans?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMealPlans()
        alert(data.message || 'Meal plan deleted successfully')
      } else {
        alert(data.error || 'Failed to delete meal plan')
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error)
      alert('Error deleting meal plan')
    }
  }

  const handleEditClick = (mealPlan: MealPlan) => {
    setEditingMealPlan(mealPlan)
    setFormData({
      name: mealPlan.name,
      destination: mealPlan.destination,
      mealType: mealPlan.meal_type,
      price: mealPlan.price,
      status: mealPlan.status
    })
    setDestinationInput(mealPlan.destination || '')
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingMealPlan(null)
    setFormData({ name: '', destination: '', mealType: 'BB', price: 0, status: 'Active' })
    setDestinationInput('')
    setShowDestinationSuggestions(false)
  }

  const filteredMealPlans = mealPlans.filter(mealPlan =>
    mealPlan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mealPlan.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meal plans...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Meal Plan</h1>
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
              Add Meal Plan
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMealPlans.map((mealPlan) => (
                    <tr key={mealPlan.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {mealPlan.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {mealPlan.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {mealPlan.created_by ? (
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">T</span>
                            </div>
                            <span className="text-xs truncate">{mealPlan.created_by}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {mealPlan.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(mealPlan)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteMealPlan(mealPlan.id, mealPlan.name)}
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
          Total Records: {filteredMealPlans.length}
        </div>
      </div>

      {/* Add Meal Plan Form Panel */}
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
                  {editingMealPlan ? 'Edit Meal Plan' : 'Add Meal Plan'}
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
                      Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter meal plan name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
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
                      Meal Type
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.mealType}
                      onChange={(e) => setFormData({...formData, mealType: e.target.value})}
                    >
                      <option value="BB">BB (Bed & Breakfast)</option>
                      <option value="HB">HB (Half Board)</option>
                      <option value="FB">FB (Full Board)</option>
                      <option value="AI">AI (All Inclusive)</option>
                      <option value="CP">CP (Continental Plan)</option>
                      <option value="MAP">MAP (Modified American Plan)</option>
                      <option value="EP">EP (European Plan)</option>
                    </select>
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
                    onClick={handleSaveMealPlan}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingMealPlan ? 'Update' : 'Save')}
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

export default MealPlans
