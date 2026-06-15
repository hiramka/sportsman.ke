import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Package,
  Truck,
  Activity,
  LogOut,
  ShoppingBag,
  Clock,
  Compass,
  ChevronDown,
  Lock,
  Layers,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const { cart, orders } = useContext(AppContext);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stats badge calculators
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const pendingPrepCount = orders.filter(o => o.status === 'Approved' || o.status === 'Preparing').length;
  const pendingDeliveryCount = orders.filter(o => o.status === 'Ready for Shipping' || o.status === 'Shipped').length;

  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Switcher configurations for admin debugging
  const devPortals = [
    { name: 'Storefront', path: '/', icon: Compass },
    { name: 'Admin Panel', path: '/admin', icon: Shield, badge: activeOrdersCount },
    { name: 'Warehouse', path: '/warehouse', icon: Package, badge: pendingPrepCount },
    { name: 'Delivery', path: '/delivery', icon: Truck, badge: pendingDeliveryCount }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <span className="text-xl font-bold text-white">🔥</span>
        </div>
        <div className="text-left">
          <h1 className="text-xl font-black tracking-tight text-white m-0 leading-none">
            Sportman<span className="text-orange-500">.ke</span>
          </h1>
          <p className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold m-0 flex items-center gap-1 mt-1">
            <Activity className="w-3 h-3 text-orange-500 animate-pulse" /> Corporate Logistics Node
          </p>
        </div>
      </Link>

      {/* Conditional Navigation Items Based on Logged-in User Role */}
      <nav className="flex items-center gap-2">
        {user && (
          <div className="flex items-center bg-slate-950/75 p-1 rounded-2xl border border-slate-800/50">
            {/* 1. CUSTOMER TABS */}
            {user.role === 'customer' && (
              <>
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/'
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Storefront</span>
                </Link>
                <Link
                  to="/tracker"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/tracker'
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Track Shipment</span>
                </Link>
                <Link
                  to="/receipts"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/receipts'
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Receipts</span>
                </Link>
              </>
            )}

            {/* 2. ADMIN TABS (Provides direct route switches styled like tabs) */}
            {user.role === 'admin' && (
              <>
                {devPortals.map((portal) => {
                  const Icon = portal.icon;
                  const isActive = currentPath === portal.path;
                  return (
                    <Link
                      key={portal.path}
                      to={portal.path}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{portal.name}</span>
                      {portal.badge > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-cyan-500 text-slate-950">
                          {portal.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}

            {/* 3. WAREHOUSE STAFF TABS */}
            {user.role === 'warehouse_staff' && (
              <>
                <Link
                  to="/warehouse"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/warehouse'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Warehouse Panel</span>
                </Link>
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Storefront <span className="text-[8px] text-[#6b7280]">(View-Only)</span></span>
                </Link>
              </>
            )}

            {/* 4. DELIVERY AGENT TABS */}
            {user.role === 'delivery_agent' && (
              <>
                <Link
                  to="/delivery"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentPath === '/delivery'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Delivery Logistics</span>
                </Link>
                <span className="text-[10px] text-emerald-400 font-bold px-3 py-2 flex items-center gap-1.5 border-l border-slate-800">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  {pendingDeliveryCount} Assigned Orders
                </span>
              </>
            )}
          </div>
        )}
      </nav>

      {/* User Actions & Dropdown */}
      <div className="flex items-center gap-4">
        {/* Shopping Cart Shortcut for Customer & Admin */}
        {user && (user.role === 'customer' || user.role === 'admin') && (
          <div className="text-[10px] text-slate-500 font-bold select-none flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-900">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
            <span>KES {cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()}</span>
          </div>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 uppercase font-black text-[10px]">
                {(user?.name || 'User').charAt(0)}
              </div>
              <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop closer */}
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-[#0D1321] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-40 animate-fade-in text-left">
                  <div className="p-4 border-b border-slate-900 bg-slate-950/40">
                    <span className="block text-xs font-black text-white truncate">{user?.name || 'User'}</span>
                    <span className="block text-[9px] font-mono text-slate-500 truncate mt-0.5">{user?.email || ''}</span>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      user.role === 'admin'
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : user.role === 'warehouse_staff'
                        ? 'bg-purple-500/10 text-purple-400'
                        : user.role === 'delivery_agent'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 hover:bg-slate-900/60 text-slate-400 hover:text-red-400 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-xs font-black transition-all duration-300 shadow-md cursor-pointer"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
