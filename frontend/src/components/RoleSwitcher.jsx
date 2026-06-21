import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Shield, Package, Truck, Activity, Lock, X, LogOut, Key } from 'lucide-react';

export default function RoleSwitcher() {
  const { role, changeRole, orders, addNotification, API_BASE } = useContext(AppContext);

  // Gated Auth States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Track session authenticated roles in state (and sync to SessionStorage for active reloading)
  const [authenticatedRoles, setAuthenticatedRoles] = useState(() => {
    const saved = sessionStorage.getItem('sm_authenticated_roles');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem('sm_authenticated_roles', JSON.stringify(authenticatedRoles));
  }, [authenticatedRoles]);

  // Count active stats for role badges
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const pendingPrepCount = orders.filter(o => o.status === 'Approved' || o.status === 'Preparing').length;
  const pendingDeliveryCount = orders.filter(o => o.status === 'Ready for Shipping' || o.status === 'Shipped').length;

  const roles = [
    {
      id: 'customer',
      name: 'Customer',
      icon: User,
      color: 'hover:text-orange-500 active:bg-orange-500/10',
      activeClass: 'bg-orange-500/10 text-orange-500 border border-orange-500/30 font-semibold shadow-[0_0_15px_rgba(255,90,31,0.15)]',
      badge: null
    },
    {
      id: 'admin',
      name: 'Admin Panel',
      icon: Shield,
      color: 'hover:text-cyan-400 active:bg-cyan-500/10',
      activeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-cyan-500 text-[#080B11]'
    },
    {
      id: 'warehouse',
      name: 'Warehouse',
      icon: Package,
      color: 'hover:text-purple-400 active:bg-purple-500/10',
      activeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      badge: pendingPrepCount > 0 ? pendingPrepCount : null,
      badgeColor: 'bg-purple-500 text-white'
    },
    {
      id: 'delivery',
      name: 'Delivery Logistics',
      icon: Truck,
      color: 'hover:text-emerald-400 active:bg-emerald-500/10',
      activeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.15)]',
      badge: pendingDeliveryCount > 0 ? pendingDeliveryCount : null,
      badgeColor: 'bg-emerald-500 text-[#080B11]'
    }
  ];

  // Handle switching trigger
  const handleSwitchRoleClick = (targetRoleId) => {
    if (targetRoleId === 'customer') {
      changeRole('customer');
      return;
    }

    // Check if role is already authenticated in this session
    if (authenticatedRoles.includes(targetRoleId)) {
      changeRole(targetRoleId);
    } else {
      // Prompt Credentials Gateway
      setPendingRole(roles.find(r => r.id === targetRoleId));
      setPasswordInput('');
      setLoginError('');
      setIsLoginOpen(true);
    }
  };

  // Submit password gate to secure API
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const email = `${pendingRole.id}@sportsman.ke`;
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Access Denied: Invalid Security Pin code.');
      }
      
      const data = await response.json(); // { token, user: { id, name, email, phone, role } }
      
      // Save secure JWT token to sessionStorage
      sessionStorage.setItem(`sm_token_${pendingRole.id}`, data.token);
      
      setAuthenticatedRoles(prev => [...prev, pendingRole.id]);
      setIsLoginOpen(false);
      changeRole(pendingRole.id);
      addNotification('success', `Internal Portal authentication successful: ${pendingRole.name}`);
    } catch (err) {
      setLoginError(err.message || 'Access Denied: Invalid Security Pin code.');
      addNotification('error', `Security Breach Alert: Failed login attempt for ${pendingRole.name}`);
    }
  };

  // Handle manual logout
  const handleStaffLogout = () => {
    sessionStorage.removeItem(`sm_token_${role}`);
    setAuthenticatedRoles(prev => prev.filter(r => r !== role));
    changeRole('customer');
    addNotification('info', 'Logged out of corporate internal staff portal.');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-xl font-bold text-white">🔥</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white m-0 flex items-center gap-1.5 leading-none">
              Sportsman<span className="text-orange-500">.ke</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold m-0 flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3 text-orange-500 animate-pulse" /> Corporate Logistics Node
            </p>
          </div>
        </div>

        {/* Role Segmented Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap md:flex-nowrap items-center bg-slate-950/75 p-1 rounded-2xl border border-slate-800/50">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              const isLocked = r.id !== 'customer' && !authenticatedRoles.includes(r.id);

              return (
                <button
                  key={r.id}
                  onClick={() => handleSwitchRoleClick(r.id)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm transition-all duration-300 cursor-pointer ${
                    isActive ? r.activeClass : `text-slate-400 ${r.color}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{r.name}</span>
                  {isLocked && <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
                  {r.badge !== null && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black min-w-5 h-5 flex items-center justify-center ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout button for authenticated staff */}
          {role !== 'customer' && (
            <button
              onClick={handleStaffLogout}
              className="p-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-black"
              title="Logout from Staff Portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout Portal</span>
            </button>
          )}
        </div>
      </header>

      {/* --- SECURE GATEWAY AUTH DIALOG --- */}
      {isLoginOpen && pendingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 text-left">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              
              <h3 className="text-base md:text-lg font-black text-white m-0 uppercase tracking-tight">
                Secure Access Gateway
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 mb-6">
                Restricted portal for authorized <span className="text-cyan-400 font-bold">{pendingRole.name}</span> personnel only.
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Staff Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={`${pendingRole.id}@sportsman.ke`}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Enter Security PIN Code</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-700 tracking-widest font-bold"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-[10px] font-bold text-red-500 m-0 animate-pulse">
                    ⚠️ {loginError}
                  </p>
                )}

                {/* Prefilled Helper Credentials for Sandbox Testing */}
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl space-y-1.5">
                  <span className="text-[8px] font-black uppercase text-[#6B7280] block tracking-wider flex items-center gap-1">
                    🔓 SANDBOX STAFF KEYCARD (TESTING PIN)
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Please use PIN: <span className="text-cyan-400 font-bold font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded ml-1">{pendingRole.id}123</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Unlock Portal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
