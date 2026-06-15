import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  DollarSign,
  Package,
  Activity,
  CheckCircle2,
  PlusCircle,
  Users
} from 'lucide-react';

export default function AdminPortal() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    coupons,
    addCoupon,
    API_BASE,
    users,
    addUser,
    updateUser,
    deleteUser
  } = useContext(AppContext);

  const { user: currentUser } = useAuth();

  // Search & view filters
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'orders' | 'coupons' | 'users'
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Form states - User Add/Edit
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });

  // Form states - Product Add/Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Football',
    description: '',
    price: '',
    stockQuantity: '',
    reorderThreshold: '3',
    brand: '',
    imageUrl: '',
    warehouseLocation: ''
  });

  // Image Uploading States & Handler
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      setUploadError('Only PNG files are allowed!');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = sessionStorage.getItem('sm_token_admin');

      const response = await fetch(`${API_BASE}/products/upload-image`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Image upload failed.');
      }

      const data = await response.json();
      const host = API_BASE.replace('/api', '');
      const fullUrl = `${host}${data.imageUrl}`;

      setProductForm(prev => ({ ...prev, imageUrl: fullUrl }));
    } catch (err) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Form states - Coupon Creator
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountPercentage: '',
    description: ''
  });

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.status !== 'Pending Payment' && o.status !== 'Cancelled');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= p.reorderThreshold).length;

    return {
      sales: totalSales,
      ordersCount: orders.length,
      lowStock: lowStockCount,
      activePromos: coupons.length
    };
  }, [orders, products, coupons]);

  // Calculate Category Shares for progress analytics
  const categoryShares = useMemo(() => {
    const paidOrders = orders.filter(o => o.status !== 'Pending Payment' && o.status !== 'Cancelled');
    const categoryTotals = {};
    let totalQty = 0;

    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.product.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
        totalQty += item.quantity;
      });
    });

    const defaults = {
      'Football': 40,
      'Jerseys': 30,
      'Basketball': 15,
      'Boots': 10,
      'Table Tennis': 5
    };

    const colors = {
      'Football': 'bg-cyan-500',
      'Jerseys': 'bg-orange-500',
      'Basketball': 'bg-purple-500',
      'Boots': 'bg-emerald-500',
      'Table Tennis': 'bg-amber-500'
    };

    if (totalQty === 0) {
      return Object.entries(defaults).map(([name, pct]) => ({
        name,
        value: pct,
        color: colors[name] || 'bg-slate-500'
      }));
    }

    return Object.entries(categoryTotals).map(([name, qty]) => ({
      name,
      value: Math.round((qty / totalQty) * 100),
      color: colors[name] || 'bg-slate-500'
    }));
  }, [orders]);

  // Calculate Sales Trend coordinates
  const salesTrend = useMemo(() => {
    const trend = [];
    const paidOrders = orders.filter(o => o.status !== 'Pending Payment' && o.status !== 'Cancelled');
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
      
      const keyDate = d.toISOString().split('T')[0];
      const salesForDay = paidOrders
        .filter(o => o.date.startsWith(keyDate))
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      trend.push({ date: dateStr, amount: salesForDay });
    }
    
    const hasSales = trend.some(t => t.amount > 0);
    if (!hasSales) {
      const mockAmounts = [12000, 18500, 14000, 29000, 22000, 35000, 45000];
      return trend.map((t, idx) => ({ ...t, amount: mockAmounts[idx] }));
    }
    
    return trend;
  }, [orders]);

  // Product Catalog filter
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Order Logs filter
  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone.includes(orderSearch)
    );
  }, [orders, orderSearch]);

  // User filter
  const filteredUsers = useMemo(() => {
    return (users || []).filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  // Handle Product Form Submit
  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stockQuantity || !productForm.brand) {
      alert('Please fill in required fields.');
      return;
    }

    const defaultImg = productForm.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60';
    const submission = { ...productForm, imageUrl: defaultImg };

    if (editingProduct) {
      updateProduct({ ...submission, id: editingProduct.id });
    } else {
      addProduct(submission);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Football',
      description: '',
      price: '',
      stockQuantity: '',
      reorderThreshold: '3',
      brand: '',
      imageUrl: '',
      warehouseLocation: ''
    });
  };

  // Trigger Edit Mode
  const startEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      price: prod.price.toString(),
      stockQuantity: prod.stockQuantity.toString(),
      reorderThreshold: prod.reorderThreshold.toString(),
      brand: prod.brand,
      imageUrl: prod.imageUrl,
      warehouseLocation: prod.warehouseLocation
    });
    setIsProductModalOpen(true);
  };

  // Launch Coupon Form Submit
  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountPercentage) {
      alert('Please provide coupon code and discount percentage.');
      return;
    }

    addCoupon(couponForm);
    setCouponForm({ code: '', discountPercentage: '', description: '' });
  };

  // Handle User Form Submit
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.phone || (!editingUser && !userForm.password)) {
      alert('Please fill in required fields.');
      return;
    }

    let result;
    if (editingUser) {
      const submission = { ...userForm };
      if (!submission.password || submission.password.trim() === '') {
        delete submission.password;
      }
      result = await updateUser(editingUser.id, submission);
    } else {
      result = await addUser(userForm);
    }

    if (result && result.success) {
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer'
      });
    }
  };

  const startEditUser = (usr) => {
    setEditingUser(usr);
    setUserForm({
      name: usr.name,
      email: usr.email,
      phone: usr.phone,
      password: '',
      role: usr.role
    });
    setIsUserModalOpen(true);
  };

  const printReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${order.id} - Sportman.ke</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc; }
            .receipt-box { max-w: 600px; margin: auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            .header { text-align: center; border-bottom: 2px solid #FF5A1F; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 26px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.5px; }
            .title span { color: #FF5A1F; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 5px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; color: #334155; }
            .details strong { color: #0f172a; }
            .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; color: #475569; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            th { border-bottom: 2px solid #e2e8f0; text-align: left; padding: 10px 0; color: #475569; font-weight: 700; }
            td { border-bottom: 1px solid #f1f5f9; padding: 12px 0; color: #334155; }
            .total-row td { border-bottom: none; padding-top: 8px; }
            .grand-total { font-weight: 800; font-size: 18px; color: #FF5A1F; border-top: 2px solid #FF5A1F; padding-top: 12px !important; }
            .signature-block { margin-top: 25px; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 12px; width: fit-content; background: #f8fafc; }
            .signature-label { font-size: 9px; color: #64748b; font-weight: 800; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
            .signature-text { font-size: 16px; font-style: italic; font-family: serif; font-weight: 800; margin-top: 5px; display: block; color: #0f172a; }
            .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            @media print {
              body { background: white; padding: 0; }
              .receipt-box { box-shadow: none; border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="title">SPORTMAN<span>.KE</span></div>
              <div class="subtitle">Nairobi Premium Sports Hub</div>
            </div>
            
            <div class="details">
              <div>
                <strong>SHIPPED TO:</strong><br>
                ${order.customerName}<br>
                ${order.phone}<br>
                ${order.subCounty}, Nairobi<br>
                ${order.deliveryAddress}
              </div>
              <div style="text-align: right;">
                <strong>ORDER REFERENCE:</strong> ${order.id}<br>
                <strong>DATE:</strong> ${new Date(order.date).toLocaleDateString('en-KE')}<br>
                <strong>PAYMENT:</strong> ${order.paymentMethod} ${order.mpesaReference ? `(${order.mpesaReference})` : ''}<br>
                <strong>STATUS:</strong> ${order.status}
              </div>
            </div>
            
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td><strong>${item.product.name}</strong><br><span style="font-size: 11px; color: #64748b;">Brand: ${item.product.brand}</span></td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">KES ${item.product.price.toLocaleString()}</td>
                    <td style="text-align: right;">KES ${(item.product.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
                
                <tr class="total-row">
                  <td colspan="2"></td>
                  <td style="text-align: right; color: #64748b;">Subtotal:</td>
                  <td style="text-align: right; font-weight: 600;">KES ${order.subtotal.toLocaleString()}</td>
                </tr>
                
                ${order.discountAmount > 0 ? `
                  <tr class="total-row" style="color: #10b981;">
                    <td colspan="2"></td>
                    <td style="text-align: right;">Discount (${order.couponApplied}):</td>
                    <td style="text-align: right; font-weight: 600;">- KES ${order.discountAmount.toLocaleString()}</td>
                  </tr>
                ` : ''}
                
                <tr class="total-row grand-total">
                  <td colspan="2"></td>
                  <td style="text-align: right;">Grand Total:</td>
                  <td style="text-align: right;">KES ${order.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            ${order.signature ? `
              <div class="signature-block">
                <span class="signature-label">Customer Handover Verification</span>
                <span class="signature-text">"${order.signature}"</span>
                <span style="font-size: 9px; color: #10b981; font-weight: bold; display: block; margin-top: 4px;">✓ Verified Signed & Delivered</span>
              </div>
            ` : ''}
            
            <div class="footer">
              Thank you for shopping with Sportman.ke!<br>
              Queries? Email: Sportsman.ke001@gmail.com | Phone: +254 712 345678<br>
              <em>Genuine Gear. Rapid Nairobi Delivery.</em>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  return (
    <div className="flex-1 w-full bg-[#080B11] text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in text-left">
        
        {/* Admin Header with sub-tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-900 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white m-0 uppercase tracking-tight flex items-center gap-2">
              <Activity className="text-cyan-400 w-5.5 h-5.5 animate-pulse" /> Corporate Admin Control Panel
            </h2>
            <p className="text-xs text-slate-400 m-0">Consolidated analytics, product catalog modifications, and live order tracking</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', name: 'Dashboard Stats' },
              { id: 'products', name: 'Product Inventory' },
              { id: 'orders', name: 'Order Processing' },
              { id: 'coupons', name: 'Coupon Campaigns' },
              { id: 'users', name: 'User Management' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0D1321]/45 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3 text-cyan-400">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Total Sales</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white">KES {metrics.sales.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Excludes cancelled & unpaid orders</p>
              </div>

              <div className="bg-[#0D1321]/45 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3 text-orange-500">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Orders Placed</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white">{metrics.ordersCount} orders</h3>
                <p className="text-[10px] text-slate-500 mt-1">All live checkout transactions</p>
              </div>

              <div className="bg-[#0D1321]/45 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Low Stock Alerts</span>
                </div>
                <h3 className={`text-xl md:text-2xl font-black ${metrics.lowStock > 0 ? 'text-amber-500' : 'text-white'}`}>
                  {metrics.lowStock} items
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Below critical threshold</p>
              </div>

              <div className="bg-[#0D1321]/45 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3 text-purple-400">
                  <Tag className="w-5 h-5" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Campaign Coupons</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white">{metrics.activePromos} active</h3>
                <p className="text-[10px] text-slate-500 mt-1">Available discount codes</p>
              </div>
            </div>

            {/* CORPORATE ANALYTICS CHARTS PANEL */}
            {(() => {
              const maxSalesAmount = Math.max(...salesTrend.map(t => t.amount), 5000);
              const chartPoints = salesTrend.map((t, idx) => {
                const x = 35 + idx * 65;
                const y = 120 - (t.amount / maxSalesAmount) * 80;
                return { x, y };
              });

              const linePathD = chartPoints.length > 0
                ? `M ${chartPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
                : '';
              const fillPathD = chartPoints.length > 0
                ? `${linePathD} L ${chartPoints[chartPoints.length - 1].x},130 L ${chartPoints[0].x},130 Z`
                : '';

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sales Revenue Trend Chart */}
                  <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3.5">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Corporate Sales Revenue Growth</h3>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">Real-time daily transaction summaries in Nairobi</p>
                      </div>
                      <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg animate-pulse">
                        Live Updates
                      </span>
                    </div>

                    {/* SVG glowing spline area chart */}
                    <div className="relative pt-2">
                      <svg className="w-full h-44 overflow-visible" viewBox="0 0 460 150">
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>

                        {/* Chart Grid Lines */}
                        <line x1="30" y1="40" x2="440" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                        <line x1="30" y1="85" x2="440" y2="85" stroke="#1e293b" strokeDasharray="3 3" />
                        <line x1="30" y1="130" x2="440" y2="130" stroke="#334155" />

                        {/* Left Y-Axis Labels */}
                        <text x="5" y="44" fill="#64748b" className="text-[8px] font-mono font-bold">KES {(maxSalesAmount * 0.8).toLocaleString()}</text>
                        <text x="5" y="89" fill="#64748b" className="text-[8px] font-mono font-bold">KES {(maxSalesAmount * 0.4).toLocaleString()}</text>
                        <text x="5" y="134" fill="#64748b" className="text-[8px] font-mono font-bold">KES 0</text>

                        {/* Area fill */}
                        {fillPathD && <path d={fillPathD} fill="url(#salesGrad)" />}

                        {/* Glowing stroke path */}
                        {linePathD && (
                          <path
                            d={linePathD}
                            stroke="#06b6d4"
                            strokeWidth="3"
                            fill="none"
                            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                          />
                        )}

                        {/* Interactive nodes */}
                        {chartPoints.map((p, idx) => (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="4"
                              fill="#080B11"
                              stroke="#06b6d4"
                              strokeWidth="2.5"
                            />
                            <text
                              x={p.x}
                              y={p.y - 10}
                              fill="#ffffff"
                              className="text-[8px] font-mono font-black text-center"
                              textAnchor="middle"
                            >
                              {salesTrend[idx].amount > 0 ? `KES ${(salesTrend[idx].amount / 1000).toFixed(1)}k` : ''}
                            </text>
                          </g>
                        ))}

                        {/* X-Axis Labels */}
                        {salesTrend.map((t, idx) => (
                          <text
                            key={idx}
                            x={35 + idx * 65}
                            y="146"
                            fill="#64748b"
                            className="text-[8px] font-bold text-center"
                            textAnchor="middle"
                          >
                            {t.date}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Category Shares Distribution Panel */}
                  <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="border-b border-slate-900 pb-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Category Shares</h3>
                      <p className="text-[10px] text-slate-500 m-0 mt-0.5">Popular sales distribution by category</p>
                    </div>

                    <div className="space-y-3.5 my-auto">
                      {categoryShares.map(share => (
                        <div key={share.name} className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-slate-300 font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${share.color}`}></span>
                              {share.name}
                            </span>
                            <span className="font-mono text-white">{share.value}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${share.color}`}
                              style={{ width: `${share.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Recent Order Activity</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No order transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="bg-slate-950/65 border border-slate-900 p-4 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{o.id}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{o.customerName}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{o.items.length} items • {o.subCounty}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-white">KES {o.totalAmount.toLocaleString()}</span>
                          <span className="block text-[8px] uppercase tracking-widest text-cyan-400 font-bold mt-1">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Administrative Tasks</h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        category: 'Football',
                        description: '',
                        price: '',
                        stockQuantity: '',
                        reorderThreshold: '3',
                        brand: '',
                        imageUrl: '',
                        warehouseLocation: ''
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Sports Product</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    Manage Orders Queue
                  </button>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    Manage Promo Campaigns
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    Manage Users & Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs w-full text-white"
                />
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Product Table */}
            <div className="bg-[#0D1321]/45 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 font-extrabold select-none">
                      <th className="p-4">Item Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Brand</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4">Aisle Location</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {filteredProducts.map(p => {
                      const isLowStock = p.stockQuantity <= p.reorderThreshold;
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-3">
                            <img src={p.imageUrl} className="w-10 h-10 object-cover rounded-lg shrink-0" alt="" />
                            <div className="truncate max-w-[200px]">
                              <span className="block font-black text-slate-100">{p.name}</span>
                              <span className="block text-[9px] font-mono text-slate-500 mt-0.5">{p.id}</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-300">{p.category}</td>
                          <td className="p-4 text-slate-400 font-medium">{p.brand}</td>
                          <td className="p-4 text-right font-black text-white">KES {p.price.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.stockQuantity === 0
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : isLowStock
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}>
                              {p.stockQuantity}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{p.warehouseLocation || 'N/A'}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 hover:text-cyan-400 transition-colors text-slate-400 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove "${p.name}" from catalogue?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 hover:text-red-500 transition-colors text-slate-400 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER LIST & STATUS MODIFICATION */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="max-w-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, phone, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs w-full text-white"
                />
              </div>
            </div>

            {/* Orders Listing */}
            <div className="bg-[#0D1321]/45 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 font-extrabold select-none">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Workflow Status</th>
                      <th className="p-4">Action Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {filteredOrders.map(o => {
                      let statusBadge = 'bg-slate-800 text-slate-300';
                      if (o.status === 'Paid') statusBadge = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                      if (o.status === 'Delivered') statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      if (o.status === 'Cancelled') statusBadge = 'bg-red-500/10 text-red-400 border border-red-500/20';
                      if (o.status === 'Ready for Shipping' || o.status === 'Shipped') statusBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

                      return (
                        <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 font-black text-white">{o.id}</td>
                          <td className="p-4">
                            <span className="block font-bold text-slate-200">{o.customerName}</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">{o.phone} • {o.subCounty}</span>
                          </td>
                          <td className="p-4 font-black text-white">KES {o.totalAmount.toLocaleString()}</td>
                          <td className="p-4 font-semibold text-slate-300">
                            {o.paymentMethod}
                            {o.mpesaReference && (
                              <span className="block text-[9px] font-mono text-cyan-400 mt-0.5">{o.mpesaReference}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBadge}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                              {/* Workflow status advance shortcuts */}
                              {o.status === 'Pending Payment' && (
                                <button
                                  onClick={() => updateOrderStatus(o.id, 'Paid', {})}
                                  className="px-2 py-1 bg-slate-900 border border-slate-850 hover:border-cyan-500 text-cyan-400 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                                >
                                  Force Paid
                                </button>
                              )}
                              
                              {o.status === 'Paid' && (
                                <button
                                  onClick={() => updateOrderStatus(o.id, 'Approved', {})}
                                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-extrabold transition-all cursor-pointer shadow-md shadow-cyan-500/10"
                                >
                                  ✓ Approve & Release
                                </button>
                              )}
                              
                              {/* Standard Order Cancellation with inventory stock restoration! */}
                              {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Cancellation & Refund Reason:', 'Customer Request');
                                    if (reason !== null) {
                                      updateOrderStatus(o.id, 'Cancelled', { reason });
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-650 hover:bg-red-700 text-white border border-transparent rounded text-[10px] font-extrabold transition-all cursor-pointer"
                                >
                                  Refund / Cancel
                                </button>
                              )}

                              {o.status !== 'Pending Payment' && o.status !== 'Cancelled' && (
                                <button
                                  onClick={() => printReceipt(o)}
                                  className="px-2 py-1 bg-slate-900 border border-slate-850 hover:border-orange-500 text-orange-400 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                                >
                                  🖨️ Print Receipt
                                </button>
                              )}
                              
                              {o.status === 'Cancelled' && (
                                <span className="text-[10px] text-red-500 font-bold">Stock Restored</span>
                              )}
                              {o.status === 'Delivered' && (
                                <span className="text-[10px] text-emerald-400 font-bold">Complete & Signed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COUPON CAMPAIGNS MANAGER */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            {/* Coupon Builder form */}
            <div className="md:col-span-1 bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Launch Campaign Coupon</h3>
              <form onSubmit={handleCouponSubmit} className="space-y-3 text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPORT20"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="e.g. 20"
                    value={couponForm.discountPercentage}
                    onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Campaign Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 20% off all tennis balls"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Create & Launch Coupon
                </button>
              </form>
            </div>

            {/* Coupons Table List */}
            <div className="md:col-span-2 bg-[#0D1321]/45 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Active System Coupons</h3>
              <div className="space-y-2">
                {coupons.map(c => (
                  <div key={c.id} className="bg-slate-950/65 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase">
                        {c.code}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">{c.description || 'Global store coupon discount'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-white">{c.discountPercentage}% OFF</span>
                      <span className="block text-[8px] text-emerald-400 font-bold uppercase mt-1">✓ Active Campaign</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs w-full text-white"
                />
              </div>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    role: 'customer'
                  });
                  setIsUserModalOpen(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add User / Staff
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-[#0D1321]/45 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 font-extrabold select-none">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Role Badge</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {(filteredUsers || []).map(usr => {
                      let roleBadge = 'bg-slate-800 text-slate-300';
                      if (usr.role === 'admin') roleBadge = 'bg-red-500/10 text-red-400 border border-red-500/20';
                      if (usr.role === 'warehouse_staff') roleBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                      if (usr.role === 'delivery_agent') roleBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                      if (usr.role === 'customer') roleBadge = 'bg-green-500/10 text-green-400 border border-green-500/20';

                      const isSelf = currentUser && currentUser.id === usr.id;

                      return (
                        <tr key={usr.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span>{usr.name}</span>
                              {isSelf && (
                                <span className="bg-cyan-500/20 text-cyan-300 text-[8px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 font-mono">{usr.email}</td>
                          <td className="p-4 text-slate-400">{usr.phone}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${roleBadge}`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditUser(usr)}
                                className="p-1.5 hover:text-cyan-400 transition-colors text-slate-400 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isSelf) {
                                    alert('Security Lock: You cannot delete your own admin account.');
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to delete user "${usr.name}"? This action is permanent.`)) {
                                    deleteUser(usr.id);
                                  }
                                }}
                                disabled={isSelf}
                                className={`p-1.5 transition-colors cursor-pointer ${
                                  isSelf ? 'opacity-25 cursor-not-allowed text-slate-600' : 'hover:text-red-500 text-slate-400'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PRODUCT EDIT MODAL DRAWER --- */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-100">
            <div className="w-full max-w-md bg-[#0D1321] border border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative">
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8 text-left">
                <h3 className="text-base md:text-lg font-black text-white mb-2 uppercase tracking-tight">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                </h3>
                <p className="text-[10px] text-slate-400 mb-6">Modify details to synch real-time warehouse inventory records.</p>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  {/* Name and Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pro Racket"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sportman"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {['Football', 'Basketball', 'Jerseys', 'Boots', 'Table Tennis'].map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price, Stock and Reorder limits */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Price (KES) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Price"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Stock Level *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Stock"
                        value={productForm.stockQuantity}
                        onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Reorder Level</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Reorder"
                        value={productForm.reorderThreshold}
                        onChange={(e) => setProductForm({ ...productForm, reorderThreshold: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Image URL and Warehouse Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Warehouse Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Aisle B - Row 4"
                        value={productForm.warehouseLocation}
                        onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Product Image (PNG Upload)</label>
                      <div className="space-y-2">
                        {/* File Selector Label */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/png"
                            id="product-image-file"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="product-image-file"
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:text-white cursor-pointer font-bold transition-all text-center select-none"
                          >
                            {uploading ? 'Uploading image...' : 'Select PNG Image File'}
                          </label>
                        </div>

                        {uploadError && (
                          <p className="text-[9px] font-bold text-red-500 m-0">⚠️ {uploadError}</p>
                        )}

                        {/* Text input fallback */}
                        <div>
                          <span className="text-[8px] text-slate-500 block mb-1">OR Enter Image URL directly:</span>
                          <input
                            type="text"
                            placeholder="e.g. https://..."
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-[10px] text-white"
                          />
                        </div>

                        {/* Image Preview */}
                        {productForm.imageUrl && (
                          <div className="mt-2 p-1 border border-slate-850 rounded-xl bg-slate-950/80 flex items-center gap-3">
                            <img
                              src={productForm.imageUrl}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                              alt="Upload Preview"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="truncate text-[9px]">
                              <span className="block text-slate-400 font-bold">Image Preview</span>
                              <span className="block text-slate-600 truncate max-w-[200px] font-mono">{productForm.imageUrl}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Image quick presets */}
                      <div className="mt-2.5 flex items-center gap-1">
                        <span className="text-[8px] text-slate-400 font-bold">Presets:</span>
                        {[
                          { name: '⚽ Ball', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60' },
                          { name: '🏀 Hoop', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60' },
                          { name: '👕 Shirt', url: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=60' },
                          { name: '👟 Boot', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60' },
                          { name: '🏓 Paddle', url: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=500&auto=format&fit=crop&q=60' }
                        ].map(preset => (
                          <button
                            type="button"
                            key={preset.name}
                            onClick={() => setProductForm({ ...productForm, imageUrl: preset.url })}
                            className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-cyan-500 rounded text-[8px] text-slate-300 cursor-pointer transition-all"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Item Description</label>
                    <textarea
                      rows="2"
                      placeholder="Write core catalog features here..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                    ></textarea>
                  </div>

                  {/* Form Submission CTAs */}
                  <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductModalOpen(false);
                        setEditingProduct(null);
                      }}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/10 cursor-pointer"
                    >
                      {editingProduct ? 'Save Product' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- USER EDIT/ADD MODAL DRAWER --- */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-100">
            <div className="w-full max-w-md bg-[#0D1321] border border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative">
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8 text-left">
                <h3 className="text-base md:text-lg font-black text-white mb-2 uppercase tracking-tight">
                  {editingUser ? 'Edit User Details' : 'Add New User / Staff'}
                </h3>
                <p className="text-[10px] text-slate-400 mb-6">Onboard corporate roles or promote users with secure authorization.</p>

                <form onSubmit={handleUserSubmit} className="space-y-4">
                  {/* Name and Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Role *</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {['customer', 'admin', 'warehouse_staff', 'delivery_agent'].map(r => (
                          <option key={r} value={r} className="bg-slate-900">{r.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@sportman.ke"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0712345678"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                      Password {editingUser ? '(leave blank to keep current)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      placeholder={editingUser ? '••••••••' : 'Enter login password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Form Submission CTAs */}
                  <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserModalOpen(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/10 cursor-pointer"
                    >
                      {editingUser ? 'Save Changes' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
