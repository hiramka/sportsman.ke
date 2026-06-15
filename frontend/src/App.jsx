import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationsCenter from './components/NotificationsCenter';
import CustomerPortal from './pages/CustomerPortal';
import AdminPortal from './pages/AdminPortal';
import WarehousePortal from './pages/WarehousePortal';
import DeliveryPortal from './pages/DeliveryPortal';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';

function AppContent() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080B11]">
      {/* Redesigned Nav Header with Profile avatar */}
      <Navbar />
      
      {/* Routing content */}
      <main className="flex-1 flex flex-col w-full">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />

          {/* Customer Portal (Storefront) */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'warehouse_staff', 'delivery_agent']}>
              <CustomerPortal />
            </ProtectedRoute>
          } />
          
          {/* Customer Shipment Tracker */}
          <Route path="/tracker" element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <CustomerPortal />
            </ProtectedRoute>
          } />

          {/* Customer Receipts Panel */}
          <Route path="/receipts" element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <CustomerPortal />
            </ProtectedRoute>
          } />

          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPortal />
            </ProtectedRoute>
          } />

          {/* Warehouse Panel */}
          <Route path="/warehouse" element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse_staff']}>
              <WarehousePortal />
            </ProtectedRoute>
          } />

          {/* Delivery Logistics */}
          <Route path="/delivery" element={
            <ProtectedRoute allowedRoles={['admin', 'delivery_agent']}>
              <DeliveryPortal />
            </ProtectedRoute>
          } />

          {/* Redirect unregistered URLs to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Live Alerts Node */}
      <NotificationsCenter />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
