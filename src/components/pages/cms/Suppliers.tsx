import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Supplier {
  id: number
  city: string
  company_name: string
  title: string
  first_name: string
  last_name: string
  email: string
  mobile_country_code: string
  mobile_number: string
  address: string
  created_by: string
  date: string
}

const Suppliers: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [formData, setFormData] = useState({
    city: '',
    companyName: '',
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    mobileCountryCode: '+91',
    mobileNumber: '',
    address: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      
      if (response.ok) {
        setSuppliers(data.suppliers || [])
      } else {
        console.error('Failed to fetch suppliers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    if (!formData.companyName || !formData.firstName || !formData.lastName || !formData.email || !formData.mobileNumber) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const method = editingSupplier ? 'PUT' : 'POST'
      const body = editingSupplier 
        ? { id: editingSupplier.id, ...formData }
        : formData

      const response = await fetch('/api/suppliers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchSuppliers() // Refresh the list
        setShowAddForm(false)
        setFormData({
          city: '',
          companyName: '',
          title: '',
          firstName: '',
          lastName: '',
          email: '',
          mobileCountryCode: '+91',
          mobileNumber: '',
          address: ''
        })
        setEditingSupplier(null)
        alert(data.message || 'Supplier saved successfully')
      } else {
        alert(data.error || 'Failed to save supplier')
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Error saving supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSupplier = async (id: number, companyName: string) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchSuppliers() // Refresh the list
        alert(data.message || 'Supplier deleted successfully')
      } else {
        alert(data.error || 'Failed to delete supplier')
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Error deleting supplier')
    }
  }

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      city: supplier.city || '',
      companyName: supplier.company_name || '',
      title: supplier.title || '',
      firstName: supplier.first_name || '',
      lastName: supplier.last_name || '',
      email: supplier.email || '',
      mobileCountryCode: supplier.mobile_country_code || '+91',
      mobileNumber: supplier.mobile_number || '',
      address: supplier.address || ''
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingSupplier(null)
    setFormData({
      city: '',
      companyName: '',
      title: '',
      firstName: '',
      lastName: '',
      email: '',
      mobileCountryCode: '+91',
      mobileNumber: '',
      address: ''
    })
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${supplier.first_name} ${supplier.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading suppliers...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Suppliers</h1>
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
              Add Supplier
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
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">
                        {supplier.company_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">
                        {supplier.title} {supplier.first_name} {supplier.last_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">
                        {supplier.email}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {supplier.mobile_country_code} {supplier.mobile_number}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">
                        {supplier.city}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{supplier.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {supplier.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(supplier)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteSupplier(supplier.id, supplier.company_name)}
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
          Total Records: {filteredSuppliers.length}
        </div>
      </div>

      {/* Add Supplier Form Panel */}
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
                  {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
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
                      City (type slowly)
                    </label>
                    <Input 
                      type="text" 
                      className="border-l-2 border-red-500"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <Input 
                      type="text" 
                      className="border-l-2 border-red-500"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title/Salutation
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input 
                      type="text" 
                      className="border-l-2 border-red-500"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input 
                      type="text" 
                      className="border-l-2 border-red-500"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input 
                      type="email" 
                      className="border-l-2 border-red-500"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                     <div className="flex gap-2">
                       <Input 
                         type="text" 
                         value={formData.mobileCountryCode}
                         className="w-auto px-1 text-center bg-gray-50"
                         onChange={(e) => setFormData({...formData, mobileCountryCode: e.target.value})}
                       />
                       <Input 
                         type="tel" 
                         className="border-l-2 border-red-500 w-16"
                         placeholder="Enter mobile number"
                         value={formData.mobileNumber}
                         onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                       />
                     </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
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
                    onClick={handleSaveSupplier}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingSupplier ? 'Update' : 'Save')}
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

export default Suppliers
