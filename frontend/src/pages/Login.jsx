import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Key, Activity, ArrowRight, Info, User, Phone } from 'lucide-react';

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signup(name.trim(), email.trim(), phone.trim(), password);
        setSuccessMessage(result.message || 'Registration successful. Please verify your email before signing in.');
        setIsSignUp(false);
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
      } else {
        const user = await login(email.trim(), password);
        // Redirect based on role
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
      }
    } catch (err) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 min-h-screen bg-[#080B11] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-2xl">🔥</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase m-0 leading-none">
            Sportsman<span className="text-orange-500">.ke</span>
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold m-0 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Corporate Secure Gateway
          </p>
        </div>

        {/* Login/Signup Box */}
        <div className="bg-[#0D1321]/60 border border-slate-800/80 p-8 rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-lg font-black text-white uppercase tracking-tight m-0">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-3 py-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@sportsman.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-slate-700 tracking-widest font-bold"
                />
              </div>
            </div>

            {error && (
              <p className="text-[10px] font-bold text-red-500 m-0 animate-pulse">
                ⚠️ {error}
              </p>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-400 text-[10.5px] font-bold leading-normal">
                ✓ {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Unlock Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle button */}
          <div className="text-center pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-400 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
