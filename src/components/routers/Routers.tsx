import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'
import Employeedashboard from '../pages/Employeedashboard'
import Leads from '../pages/crm/Leads'
import Bookings from '../pages/crm/Bookings'
import Payments from '../pages/crm/Payments'
import Reports from '../pages/crm/Reports'
import Itineraries from '../pages/cms/Itineraries'
import ItineraryBuilder from '../pages/cms/ItineraryBuilder'
import Blogs from '../pages/cms/Blogs'
import Suppliers from '../pages/cms/Suppliers'
import Destinations from '../pages/cms/Destinations'
import RoomTypes from '../pages/cms/RoomTypes'
import Activities from '../pages/cms/Activities'
import MealPlans from '../pages/cms/MealPlans'
import Hotels from '../pages/cms/Hotels'
import Transfers from '../pages/cms/Transfers'
import DayItinerary from '../pages/cms/DayItinerary'
import PackageTheme from '../pages/cms/PackageTheme'
import QueryStatus from '../pages/cms/QueryStatus'
import Settings from '../pages/Settings'
import WebsiteEdit from '../pages/cms/WebsiteEdit'
import Employees from '../pages/Employees'
import Queries from '../pages/Queries'
import QueryDetail from '../pages/QueryDetail'
import Login from '../../pages/Login'
import ProtectedRoute from '../auth/ProtectedRoute'

const Routers: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employee" element={
        <ProtectedRoute>
          <Employeedashboard />
        </ProtectedRoute>
      } />
      <Route path="/queries" element={
        <ProtectedRoute>
          <Queries />
        </ProtectedRoute>
      } />
      <Route path="/queries/:id" element={
        <ProtectedRoute>
          <QueryDetail />
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute>
          <Bookings />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/packages" element={
        <ProtectedRoute>
          <Itineraries />
        </ProtectedRoute>
      } />
      <Route path="/packages/:id" element={
        <ProtectedRoute>
          <ItineraryBuilder />
        </ProtectedRoute>
      } />
      <Route path="/blogs" element={
        <ProtectedRoute>
          <Blogs />
        </ProtectedRoute>
      } />
      <Route path="/website-edit" element={
        <ProtectedRoute>
          <WebsiteEdit />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/admin" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/suppliers" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Suppliers />
        </ProtectedRoute>
      } />
      <Route path="/settings/destinations" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Destinations />
        </ProtectedRoute>
      } />
      <Route path="/settings/room-types" element={
        <ProtectedRoute requiredRole="Super Admin">
          <RoomTypes />
        </ProtectedRoute>
      } />
      <Route path="/settings/activity" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Activities />
        </ProtectedRoute>
      } />
      <Route path="/settings/meal-plan" element={
        <ProtectedRoute requiredRole="Super Admin">
          <MealPlans />
        </ProtectedRoute>
      } />
      <Route path="/settings/hotels" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Hotels />
        </ProtectedRoute>
      } />
      <Route path="/settings/transfer" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Transfers />
        </ProtectedRoute>
      } />
      <Route path="/settings/day-itinerary" element={
        <ProtectedRoute requiredRole="Super Admin">
          <DayItinerary />
        </ProtectedRoute>
      } />
      <Route path="/settings/package-theme" element={
        <ProtectedRoute requiredRole="Super Admin">
          <PackageTheme />
        </ProtectedRoute>
      } />
      <Route path="/settings/query-status" element={
        <ProtectedRoute requiredRole="Super Admin">
          <QueryStatus />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default Routers
