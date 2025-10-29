import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface Payment {
  id: number
  query_id: string
  trans_id: string
  type: string
  amount: number
  payment_date: string
  status: string
  convenience_fee: number
}

interface BillingProps {
  queryId: number
  queryData?: {
    name?: string
    email?: string
    phone?: string
    destination?: string
  }
}

const Billing: React.FC<BillingProps> = ({ queryId, queryData }) => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  
  // Summary calculations
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  const receivedAmount = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  const pendingAmount = totalAmount - receivedAmount
  const grossProfit = receivedAmount * 0.1 // 10% of received as example
  const supplierAmount = receivedAmount - grossProfit
  const supplierReceived = 0 // Placeholder
  const supplierPending = supplierAmount - supplierReceived

  useEffect(() => {
    fetchPayments()
  }, [queryId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/query-payments?queryId=${queryId}`)
      const data = await response.json()
      
      if (response.ok) {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return
    }

    try {
      const response = await fetch(`/api/query-payments?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPayments()
      } else {
        alert('Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Error deleting payment')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = String(parseInt(hours) % 12 || 12).padStart(2, '0')
    return `${day}/${month}/${year} - ${displayHours}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-7 gap-3">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{totalAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">TOTAL AMOUNT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{receivedAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">RECEIVED</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{pendingAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">PENDING</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-gray-900 text-center">₹{grossProfit.toFixed(0)}</div>
            <div className="text-xs text-gray-600 mt-1 text-center">GROSS PROFIT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER AMOUNT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierReceived.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER RECEIVED</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierPending.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER PENDING</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Payments ({payments.length})
            </h3>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Send Payment Plan To Mail
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trans. ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Convenience Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Receipt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="bg-green-50">
                      <td className="px-4 py-3 text-gray-900">{payment.id}</td>
                      <td className="px-4 py-3 text-gray-900">{payment.trans_id || 'TEST'}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-600 text-white">
                          {payment.type || 'UPI'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">₹{parseFloat(payment.amount.toString()).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-900">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${payment.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{payment.convenience_fee || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">-</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Not Scheduled Amount Row */}
                  {payments.length > 0 && (
                    <tr className="bg-white">
                      <td colSpan={8} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Not Scheduled Amount: ₹{pendingAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="px-3 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600">
                          Schedule Payment
                        </button>
                      </td>
                    </tr>
                  )}

                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                        No payments added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Invoice - {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="text-sm text-gray-600">GI/24-25/001</div>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              View Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Billing
