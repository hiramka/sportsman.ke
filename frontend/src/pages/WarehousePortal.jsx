import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  Truck,
  MapPin,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function WarehousePortal() {
  const { products, orders, updateOrderStatus, addNotification } = useContext(AppContext);

  // Compute items falling below reorder threshold
  const reorderAlerts = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.reorderThreshold);
  }, [products]);

  // Compute orders pending warehouse processing
  // Statuses: 'Approved' -> 'Preparing' -> 'Ready for Shipping'
  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Approved' || o.status === 'Preparing');
  }, [orders]);

  return (
    <div className="flex-1 w-full bg-[#080B11] text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
        
        {/* Portal Header */}
        <div className="lg:col-span-3 pb-4 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white m-0 uppercase tracking-tight flex items-center gap-2">
              <Package className="text-purple-400 w-5.5 h-5.5 animate-pulse" /> Warehouse Fulfillment Station
            </h2>
            <p className="text-xs text-slate-400 m-0">Inventory depletion tracking, coordinate maps, and picking & packing orders</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              Station ID: NBO-WEST-1
            </span>
          </div>
        </div>

        {/* LEFT COLUMN: LOW STOCK ALERT / RESTOCK MANAGER */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0 flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500 w-4 h-4" /> Stock Alerts
              </h3>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                {reorderAlerts.length} Flagged
              </span>
            </div>

            {reorderAlerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                ✓ All inventory items exceed safety thresholds.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {reorderAlerts.map(p => (
                  <div key={p.id} className="bg-slate-950/65 border border-slate-900 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[150px]">
                        <h4 className="text-xs font-bold text-white truncate m-0">{p.name}</h4>
                        <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{p.id}</span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        p.stockQuantity === 0
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {p.stockQuantity === 0 ? 'DEPLETED' : `QTY: ${p.stockQuantity}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-900 text-slate-500">
                      <span>Threshold: {p.reorderThreshold}</span>
                      <span className="font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                        📍 {p.warehouseLocation || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ORDERS FULFILLMENT QUEUE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0 flex items-center gap-1.5">
                <ClipboardList className="text-purple-400 w-4 h-4" /> Pick & Pack Queue
              </h3>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingOrders.length} Pending
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
                <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-400 mb-0.5">Fulfillment queue is clear</h4>
                <p className="text-xs text-slate-500">Awaiting new checkout transactions from the Customer portal.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map(order => {
                  const isPreparing = order.status === 'Preparing';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-950/65 border border-slate-900 p-5 rounded-2xl space-y-4 relative overflow-hidden"
                    >
                      {/* Ribbon indicator */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isPreparing ? 'bg-purple-500' : 'bg-cyan-500'}`}></div>

                      {/* Header details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">PACKING REQUISITION</span>
                          <h4 className="text-sm font-black text-white m-0 mt-0.5">{order.id}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                            {order.subCounty}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded ${
                            isPreparing
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Item pick list with locations */}
                      <div className="bg-slate-900/60 rounded-xl p-4 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Pick Items Map</span>
                        {order.items.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center text-xs py-1">
                            <div>
                              <span className="text-slate-200 font-semibold">{item.product.name}</span>
                              <span className="text-slate-500 font-black ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-mono text-xs text-purple-400 bg-[#171120] border border-purple-500/20 px-2 py-0.5 rounded">
                              📍 {item.product.warehouseLocation || 'Aisle E - Row 2'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons to advance pipeline state */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                        <div className="text-left">
                          <span className="text-[9px] uppercase text-slate-500 block font-bold">Recipient</span>
                          <span className="text-xs font-bold text-slate-300">{order.customerName}</span>
                        </div>

                        {!isPreparing ? (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'Preparing');
                              addNotification('info', `Order ${order.id} moved to PICK & PACK stage.`);
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4 animate-spin" /> Start Picking
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'Ready for Shipping');
                              addNotification('success', `Order ${order.id} packaged & marked ready for shipping.`);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" /> Ready for Courier Dispatch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
