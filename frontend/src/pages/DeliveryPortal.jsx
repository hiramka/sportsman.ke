import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Truck,
  MapPin,
  Phone,
  User,
  CheckCircle,
  X,
  FileSignature,
  Smartphone,
  Navigation,
  Check
} from 'lucide-react';

export default function DeliveryPortal() {
  const { orders, updateOrderStatus, addNotification } = useContext(AppContext);

  // Active delivery jobs
  // Statuses: 'Ready for Shipping' -> 'Shipped' -> 'Delivered'
  const activeJobs = useMemo(() => {
    return orders.filter(o => o.status === 'Ready for Shipping' || o.status === 'Shipped');
  }, [orders]);

  // Signature validation states
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  const [courierNameInput, setCourierNameInput] = useState('BodaBoda Express Nairobi');
  const [dispatchOrder, setDispatchOrder] = useState(null);

  // Handle Dispatch Shipment
  const handleDispatch = (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;

    updateOrderStatus(dispatchOrder.id, 'Shipped', {
      courier: courierNameInput
    });
    addNotification('info', `Order ${dispatchOrder.id} dispatched via ${courierNameInput}.`);
    setDispatchOrder(null);
  };

  // Handle Confirm Signature Handover
  const handleSignatureSubmit = (e) => {
    e.preventDefault();
    if (!signatureText) {
      alert('Please have the customer sign by typing their name.');
      return;
    }

    updateOrderStatus(selectedDelivery.id, 'Delivered', {
      signature: signatureText.trim()
    });
    addNotification('success', `Shipment ${selectedDelivery.id} delivered! Handover signature captured.`);
    setSelectedDelivery(null);
    setSignatureText('');
  };

  return (
    <div className="flex-1 w-full bg-[#080B11] text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in text-left">
        
        {/* Portal Header */}
        <div className="pb-4 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white m-0 uppercase tracking-tight flex items-center gap-2">
              <Truck className="text-emerald-400 w-5.5 h-5.5 animate-pulse" /> Dispatch & Delivery Logistics
            </h2>
            <p className="text-xs text-slate-400 m-0">Nairobi dispatch route logs, delivery handovers, and electronic client signature capture</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Logistics Agent: Active
            </span>
          </div>
        </div>

        {/* Deliveries list container */}
        <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Logistics Assigned Route Map</h3>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
              {activeJobs.length} Active Assignments
            </span>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
              <Truck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-400 mb-0.5">No active logistics dispatches</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Orders must be packed & marked "Ready for Shipping" in the Warehouse portal before they appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeJobs.map(job => {
                const isShipped = job.status === 'Shipped';

                return (
                  <div
                    key={job.id}
                    className="bg-slate-950/65 border border-slate-900 p-5 rounded-2xl space-y-4 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${isShipped ? 'bg-emerald-550' : 'bg-purple-550'}`}></div>

                    <div>
                      {/* Job Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-900/60 pb-3 mb-3">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">DISPATCH JOB</span>
                          <h4 className="text-sm font-black text-white m-0 mt-0.5">{job.id}</h4>
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full ${
                          isShipped
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Recipient Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-200">
                          <User className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="font-extrabold">{job.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="font-mono">{job.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-300">{job.subCounty}</span>
                            <p className="text-[11px] leading-relaxed mt-0.5">{job.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Item quantities overview */}
                      <div className="bg-slate-900/60 rounded-xl p-3.5 mt-4 space-y-1.5">
                        <span className="text-[9px] font-black uppercase text-slate-500 block">Package Details</span>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {job.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}
                        </div>
                      </div>

                      {job.trackingNumber && (
                        <div className="mt-3 text-[10px] text-slate-500 font-bold flex items-center justify-between">
                          <span>Courier: {job.courierName}</span>
                          <span className="font-mono text-cyan-400">Tracking: {job.trackingNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Job CTA button */}
                    <div className="pt-4 border-t border-slate-900 flex justify-end">
                      {!isShipped ? (
                        <button
                          onClick={() => {
                            setDispatchOrder(job);
                            setCourierNameInput('BodaBoda Express Nairobi');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Dispatch Shipment</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDelivery(job);
                            setSignatureText('');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          <FileSignature className="w-4 h-4" />
                          <span>Complete & Handover</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- DISPATCH TRANSIT SETUP DIALOG --- */}
        {dispatchOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              <button
                onClick={() => setDispatchOrder(null)}
                className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8 text-left">
                <h3 className="text-base font-black text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                  🚚 Courier Dispatch Job
                </h3>
                <p className="text-[10px] text-slate-400 mb-6">Assign a boda-boda courier to deliver package to {dispatchOrder.customerName}.</p>

                <form onSubmit={handleDispatch} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Courier Carrier Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BodaBoda Express, DHL Kenya"
                      value={courierNameInput}
                      onChange={(e) => setCourierNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDispatchOrder(null)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl cursor-pointer"
                    >
                      Confirm Dispatch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- CUSTOMER HANDOVER / SIGNATURE CAPTURE DIALOG --- */}
        {selectedDelivery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-[300px] h-[550px] bg-[#0E1015] border-8 border-slate-800 rounded-[40px] phone-shadow relative overflow-hidden flex flex-col justify-between font-sans">
              
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 w-32 h-6 rounded-b-2xl z-20 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>

              {/* Status bar */}
              <div className="pt-6 px-5 flex items-center justify-between text-[9px] text-slate-500 font-bold z-10 shrink-0 select-none">
                <span>Courier App</span>
                <span>LTE 🔋</span>
              </div>

              {/* Content */}
              <div className="flex-1 px-5 flex flex-col justify-center text-center">
                <form onSubmit={handleSignatureSubmit} className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 shadow-glow-cyan">
                    <FileSignature className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Client Handover</h4>
                  
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1 text-left text-[9px] text-slate-400 font-mono leading-normal">
                    <div>
                      <span>Customer:</span>
                      <p className="text-white font-extrabold m-0 leading-tight">{selectedDelivery.customerName}</p>
                    </div>
                    <div className="pt-1">
                      <span>Address:</span>
                      <p className="text-white m-0 leading-tight truncate">{selectedDelivery.deliveryAddress}</p>
                    </div>
                    <div className="pt-1">
                      <span>Amount Collected:</span>
                      <p className="text-emerald-400 font-black m-0 leading-tight">KES {selectedDelivery.totalAmount.toLocaleString()} ({selectedDelivery.paymentMethod})</p>
                    </div>
                  </div>

                  <div className="bg-[#1C2130] border border-[#2F3446] rounded-xl p-3 text-left space-y-2">
                    <label className="text-[8px] font-black uppercase text-[#9CA3AF] block">CUSTOMER ELECTRONIC SIGNATURE</label>
                    <input
                      type="text"
                      required
                      placeholder="Type Client Full Name to Sign"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      className="w-full bg-[#0E1015] border border-[#2F3446] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-700 italic font-serif"
                    />
                    <p className="text-[7px] text-[#6B7280] leading-none m-0 font-medium">By signing, the recipient confirms receipt of genuine goods.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDelivery(null)}
                      className="flex-1 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={!signatureText}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black text-center cursor-pointer ${
                        !signatureText
                          ? 'bg-slate-950 text-slate-650 border border-slate-900 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      Complete Job
                    </button>
                  </div>
                </form>
              </div>

              {/* Home bar */}
              <div className="pb-3 flex justify-center shrink-0">
                <div className="w-28 h-1 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
