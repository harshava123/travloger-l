import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QueryStatus {
  id: number
  name: string
  color: string
  take_note: boolean
  lock_status: boolean
  dashboard: boolean
  status: string
  created_by: string
  date: string
}

const QueryStatus: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [queryStatuses, setQueryStatuses] = useState<QueryStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStatus, setEditingStatus] = useState<QueryStatus | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    takeNote: false,
    lockStatus: false,
    dashboard: false,
    status: 'Active'
  })

  useEffect(() => {
    fetchQueryStatuses()
  }, [])

  const fetchQueryStatuses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/query-statuses')
      const data = await response.json()
      
      if (response.ok) {
        setQueryStatuses(data.queryStatuses || [])
      } else {
        console.error('Failed to fetch query statuses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching query statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStatus = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a status name')
      return
    }

    try {
      setSaving(true)
      const method = editingStatus ? 'PUT' : 'POST'
      const body = editingStatus 
        ? { id: editingStatus.id, ...formData }
        : formData

      const response = await fetch('/api/query-statuses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchQueryStatuses()
        setShowAddForm(false)
        setFormData({ name: '', color: '#3B82F6', takeNote: false, lockStatus: false, dashboard: false, status: 'Active' })
        setEditingStatus(null)
        alert(data.message || 'Query status saved successfully')
      } else {
        alert(data.error || 'Failed to save query status')
      }
    } catch (error) {
      console.error('Error saving query status:', error)
      alert('Error saving query status')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStatus = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/query-statuses?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchQueryStatuses()
        alert(data.message || 'Query status deleted successfully')
      } else {
        alert(data.error || 'Failed to delete query status')
      }
    } catch (error) {
      console.error('Error deleting query status:', error)
      alert('Error deleting query status')
    }
  }

  const handleEditClick = (queryStatus: QueryStatus) => {
    setEditingStatus(queryStatus)
    setFormData({
      name: queryStatus.name,
      color: queryStatus.color,
      takeNote: queryStatus.take_note,
      lockStatus: queryStatus.lock_status,
      dashboard: queryStatus.dashboard,
      status: queryStatus.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingStatus(null)
    setFormData({ name: '', color: '#3B82F6', takeNote: false, lockStatus: false, dashboard: false, status: 'Active' })
  }

  const filteredStatuses = queryStatuses.filter(qs =>
    qs.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading query statuses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-lg font-bold text-gray-900">Query Status</h1>
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
              Add Status
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Take Note</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lock Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dashboard</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatuses.map((queryStatus, index) => (
                    <tr key={queryStatus.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: queryStatus.color }}
                        />
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {queryStatus.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.take_note ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.lock_status ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.dashboard ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {queryStatus.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditClick(queryStatus)}
                            className="hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStatus(queryStatus.id, queryStatus.name)}
                            className="hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredStatuses.length}
        </div>
      </div>

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
                  {editingStatus ? 'Edit Query Status' : 'Add Query Status'}
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
                      Status Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter status name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <Input 
                      type="color" 
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.takeNote}
                        onChange={(e) => setFormData({...formData, takeNote: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Take Note</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.lockStatus}
                        onChange={(e) => setFormData({...formData, lockStatus: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Lock Status</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.dashboard}
                        onChange={(e) => setFormData({...formData, dashboard: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Show on Dashboard</span>
                    </label>
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
                    onClick={handleSaveStatus}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingStatus ? 'Update' : 'Save')}
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

export default QueryStatus