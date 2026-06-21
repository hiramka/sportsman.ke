import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Mail, MessageSquare, AlertTriangle, CheckCircle2, Info, BellRing } from 'lucide-react';

export default function NotificationsCenter() {
  const { notifications } = useContext(AppContext);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        return (
          <div
            key={n.id}
            className="pointer-events-auto w-full animate-slide-up rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden"
          >
            {/* SMS Notification Theme */}
            {n.type === 'sms' && (
              <div className="bg-[#1C202F] text-[#F3F4F6] border border-[#2F3446] p-4 font-sans rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between pb-2 border-b border-[#2F3446]/50 mb-2">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF]">SMS MESSAGE</span>
                  </div>
                  <span className="text-[9px] text-[#6B7280] font-medium">Just now</span>
                </div>
                <div className="text-xs text-[#E5E7EB] leading-relaxed">
                  <span className="font-bold text-green-400 mr-1.5">SPORTSMAN.KE:</span>
                  {n.message}
                </div>
              </div>
            )}

            {/* Email Notification Theme */}
            {n.type === 'email' && (
              <div className="bg-[#0A1021] text-[#E2E8F0] border border-cyan-500/25 p-4 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8]">EMAIL SYSTEM</span>
                  </div>
                  <span className="text-[9px] text-cyan-500/60 font-medium">Outbox</span>
                </div>
                <div className="text-xs text-[#E2E8F0] leading-relaxed font-light">
                  <div className="font-bold text-cyan-400 mb-0.5">Subject: Sportsman.ke Order Updates</div>
                  <p className="text-[11px] text-slate-300 mt-1">{n.message}</p>
                </div>
              </div>
            )}

            {/* Success Standard Notification Theme */}
            {n.type === 'success' && (
              <div className="bg-[#0A1A12] text-emerald-100 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-[0_15px_30px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 m-0">Success Action</h4>
                  <p className="text-xs text-emerald-200/80 m-0 mt-0.5">{n.message}</p>
                </div>
              </div>
            )}

            {/* Warning Theme */}
            {n.type === 'warning' && (
              <div className="bg-[#1E110A] text-amber-100 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-[0_15px_30px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 m-0">Alert</h4>
                  <p className="text-xs text-amber-200/80 m-0 mt-0.5">{n.message}</p>
                </div>
              </div>
            )}

            {/* Default Info Theme */}
            {n.type === 'info' && (
              <div className="bg-[#0F172A]/90 text-slate-100 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-md shadow-lg shadow-black/50">
                <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 m-0">Notification</h4>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">{n.message}</p>
                </div>
              </div>
            )}

            {/* Error Theme */}
            {n.type === 'error' && (
              <div className="bg-[#1A0A0A] text-rose-100 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-[0_15px_30px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300 m-0">Error Encountered</h4>
                  <p className="text-xs text-rose-200/80 m-0 mt-0.5">{n.message}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
