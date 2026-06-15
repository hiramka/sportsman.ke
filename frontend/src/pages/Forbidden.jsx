import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user) {
      navigate('/');
      return;
    }
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'warehouse_staff':
        navigate('/warehouse');
        break;
      case 'delivery_agent':
        navigate('/delivery');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#080B11] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0D1321]/60 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">403 Forbidden</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access Denied. You do not have the required permissions to view this secure directory.
          </p>
        </div>

        <button
          onClick={handleGoHome}
          className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-orange-500 text-slate-300 hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Authorized Directory</span>
        </button>
      </div>
    </div>
  );
}
