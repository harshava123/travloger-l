'use client'

import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from './layout/Layout'
import Routers from './routers/Routers'

const ClientApp: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routers />
          </Layout>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default ClientApp
