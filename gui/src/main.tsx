import React from 'react'
import ReactDOM from 'react-dom/client'
import MainLayout from './components/layouts/MainLayout'
import Dashboard from './components/Dashboard/Dashboard'
import './index.css' // Ensure Tailwind CSS is imported

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainLayout>
      <Dashboard />
    </MainLayout>
  </React.StrictMode>,
)