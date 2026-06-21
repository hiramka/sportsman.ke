import React, { useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  MapPin,
  Phone,
  User,
  Mail,
  Map,
  X,
  Check,
  Smartphone,
  Loader,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  FileText,
  Printer
} from 'lucide-react';

const NAIROBI_SUB_COUNTIES = [
  'Westlands',
  'Kilimani / Lavington',
  'Karen / Langata',
  'CBD / Nairobi Central',
  'Embakasi / Eastlands',
  'Kasarani / Roysambu',
  'Gigiri / Runda'
];

export default function CustomerPortal() {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    orders,
    fetchOrders,
    createOrder,
    payOrder,
    triggerMpesaPush,
    activeCoupon,
    applyCoupon,
    API_BASE
  } = useContext(AppContext);
  const { user: currentUser } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [priceRange, setPriceRange] = useState(50000);
  const [sortBy, setSortBy] = useState('featured');

  // Interactive panels
  const location = useLocation();
  const navigate = useNavigate();
  const showActiveTab = location.pathname === '/tracker' ? 'tracker' : location.pathname === '/receipts' ? 'receipts' : 'shop';
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  // Coupon state
  const [couponCodeText, setCouponCodeText] = useState('');
  const [couponFeedback, setCouponFeedback] = useState({ success: null, message: '' });

  // Checkout Form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    subCounty: NAIROBI_SUB_COUNTIES[0]
  });
  const [paymentMethod, setPaymentMethod] = useState('WhatsApp');

  // M-Pesa STK Push Simulator State
  const [showMpesaSimulator, setShowMpesaSimulator] = useState(false);
  const [mpesaSimState, setMpesaSimState] = useState('push-send'); // 'push-send' | 'pin-entry' | 'processing' | 'success'
  const [mpesaPin, setMpesaPin] = useState('');
  const [simulatedOrder, setSimulatedOrder] = useState(null);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  // Modals for Terms, Privacy and Support
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Support ticket form state
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    category: 'M-Pesa Payment Issue',
    details: ''
  });

  // Support submit
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    const ticketId = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
    addNotification('success', `Support ticket #${ticketId} submitted! Our Nairobi team will review it.`);
    setSupportForm({
      name: '',
      email: '',
      phone: '',
      orderId: '',
      category: 'M-Pesa Payment Issue',
      details: ''
    });
    setIsSupportOpen(false);
  };

  // Receipt printing
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
              Queries? Email: Sportsman.ke001@gmail.com | Phone: +254 759 238018<br>
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

  // Compute Categories and Brands from products
  const categories = useMemo(() => {
    return ['All', ...new Set(products.map(p => p.category))];
  }, [products]);

  const brands = useMemo(() => {
    return ['All', ...new Set(products.map(p => p.brand))];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
        const matchesPrice = p.price <= priceRange;
        return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'stock') return b.stockQuantity - a.stockQuantity;
        return 0; // Default featured order
      });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange, sortBy]);

  // Filtered Receipts for the Receipts Tab
  const filteredReceipts = useMemo(() => {
    return orders.filter(order => {
      const query = receiptSearch.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(query);
      const matchesProduct = order.items.some(item =>
        item.product.name.toLowerCase().includes(query) ||
        item.product.brand.toLowerCase().includes(query)
      );
      const matchesMethod = order.paymentMethod && order.paymentMethod.toLowerCase().includes(query);
      const matchesStatus = order.status && order.status.toLowerCase().includes(query);
      return matchesId || matchesProduct || matchesMethod || matchesStatus;
    });
  }, [orders, receiptSearch]);

  // Cart helper calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (!activeCoupon) return 0;
    return Math.round(cartSubtotal * (activeCoupon.discountPercentage / 100));
  }, [cartSubtotal, activeCoupon]);

  const cartTotal = cartSubtotal - cartDiscount;

  // Handle Coupon Submit
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCodeText) return;
    const res = applyCoupon(couponCodeText);
    if (res.success) {
      setCouponFeedback({ success: true, message: `Coupon applied successfully!` });
    } else {
      setCouponFeedback({ success: false, message: 'Invalid coupon code.' });
    }
  };

  // Handle Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill out all billing & delivery details.');
      return;
    }

    if (paymentMethod === 'M-Pesa') {
      alert('M-Pesa payments are currently under development. Please use WhatsApp checkout.');
      return;
    }

    const order = await createOrder(customerInfo, paymentMethod);
    if (!order) return; // Cart stock error

    setIsCheckoutOpen(false);

    if (paymentMethod === 'WhatsApp') {
      // Clear cart locally
      clearCart();

      // Build structured text for WhatsApp ordering
      let message = `New Order Request\n\n`;
      message += `Customer:\n`;
      message += `Name: ${customerInfo.name}\n`;
      message += `Email: ${customerInfo.email}\n`;
      message += `Phone: ${customerInfo.phone}\n\n`;
      
      message += `Products:\n`;
      order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.product.name} - Qty: ${item.quantity} - KES ${item.product.price.toLocaleString()}\n`;
      });
      message += `\nTotal:\n`;
      message += `KES ${order.totalAmount.toLocaleString()}\n\n`;
      message += `Please process this order.`;

      // Redirect to Admin WhatsApp line
      const whatsappNumber = '254759238018';
      const url = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      // Go to shipment/order tracker page
      setActiveTrackingOrder(order.id);
      navigate('/tracker');
    } else {
      // Standard Card / Bank transfer payments instantly paid
      setActiveTrackingOrder(order.id);
      navigate('/tracker');
    }
  };

  // Submit M-Pesa Pin Simulator
  const handleMpesaPinSubmit = (e) => {
    e.preventDefault();
    if (mpesaPin.length < 4) return;

    setMpesaSimState('processing');

    // Simulate Network delay and complete mock payment
    setTimeout(async () => {
      const generatedRef = 'MPESA' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await payOrder(simulatedOrder.id, generatedRef);
      setMpesaSimState('success');
    }, 2500);
  };

  // Redirect to Tracking Page from Mpesa Simulator
  const handleViewTracking = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
    setShowMpesaSimulator(false);
    setActiveTrackingOrder(simulatedOrder.id);
    navigate('/tracker');
  };

  // Recommendation Generator (Related products)
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
      .slice(0, 3);
  }, [selectedProduct, products]);

  return (
    <div className="flex-1 w-full bg-[#080B11] text-slate-100 flex flex-col">
      {/* Store Navigation Bar */}
      <div className="bg-[#0D1321]/60 border-b border-slate-900 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-bold pb-1 cursor-pointer transition-all duration-200 ${showActiveTab === 'shop'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Storefront
          </button>
          <button
            onClick={() => {
              navigate('/tracker');
              if (orders.length > 0 && !activeTrackingOrder) {
                setActiveTrackingOrder(orders[0].id);
              }
            }}
            className={`text-sm font-bold pb-1 cursor-pointer transition-all duration-200 ${showActiveTab === 'tracker'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Track Shipment {orders.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-orange-500 text-white font-extrabold">{orders.length}</span>}
          </button>
          <button
            onClick={() => navigate('/receipts')}
            className={`text-sm font-bold pb-1 cursor-pointer transition-all duration-200 ${showActiveTab === 'receipts'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            My Receipts
          </button>
        </div>

        {/* Float Cart Icon */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-orange-500/15 transition-all duration-300 transform active:scale-95 cursor-pointer"
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-slate-950 text-orange-500 border border-orange-500/30 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-pulse">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {showActiveTab === 'shop' ? (
        <>
          {/* Hero Promo Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#090D1A] to-[#080B11] border-b border-slate-900 py-12 md:py-16 px-4 md:px-8">
            {/* Background elements */}
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold mb-4 animate-pulse-slow">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Promo Code: SPORT50 for 50% OFF!</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 uppercase leading-none">
                  Unleash Your <br />
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent glow-orange">
                    Inner Athlete
                  </span>
                </h1>
                <p className="text-sm md:text-lg text-slate-400 mb-6 max-w-lg font-light leading-relaxed">
                  Discover Nairobi’s premium marketplace for top-tier sport jerseys, professional football boots, table tennis tables, and customized gear. Delivered in 2 hours flat.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <a
                    href="#catalog"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3.5 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all duration-300 hover:translate-x-1 cursor-pointer"
                  >
                    <span>Shop Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-300 font-semibold">100% Genuine M-Pesa Verified</span>
                  </div>
                </div>
              </div>

              {/* Visual Mock Banner Side Card */}
              <div className="flex-1 w-full max-w-sm md:max-w-none flex justify-center">
                <div className="w-full max-w-[340px] p-6 rounded-3xl glass-panel relative shadow-glow-orange border-slate-800/60 overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    HOT SALE
                  </div>
                  <div className="h-44 rounded-2xl bg-slate-950 overflow-hidden relative mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60"
                      className="w-full h-full object-cover object-center transform hover:scale-110 transition-transform duration-500"
                      alt="Hot Boot"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-orange-500 uppercase tracking-widest font-extrabold">BOOTS</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] text-cyan-400 uppercase font-black">Best Seller</span>
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-1 leading-tight">Speedster Football Boots FG</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-black text-white">KES 6,800</span>
                    <span className="text-xs text-slate-500 line-through">KES 8,500</span>
                  </div>
                  <button
                    onClick={() => {
                      const boot = products.find(p => p.id === 'prod-4');
                      if (boot) addToCart(boot, 1);
                    }}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-orange-500 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-black transition-all duration-300 cursor-pointer"
                  >
                    Quick Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Product Category & Catalog Controls */}
          <section id="catalog" className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white m-0 uppercase tracking-tight flex items-center gap-2">
                  <ShoppingBag className="text-orange-500 w-5 h-5" /> Sportman Catalog
                </h2>
                <p className="text-xs text-slate-400 m-0">Showing {filteredProducts.length} high-performance sports items in Nairobi</p>
              </div>

              {/* Filters toggle bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search product, brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs w-48 focus:w-60 transition-all duration-300 text-white"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-slate-300 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="featured" className="bg-slate-900">Featured</option>
                    <option value="price-low" className="bg-slate-900">Price: Low to High</option>
                    <option value="price-high" className="bg-slate-900">Price: High to Low</option>
                    <option value="stock" className="bg-slate-900">Stock Availability</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sidebar + Product Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filter Sidebar - Modern */}
              <div className="lg:col-span-1 space-y-6">
                {/* Category List */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">Category</h3>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${selectedCategory === cat
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                          }`}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands Selector */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">Brand</h3>
                  <div className="space-y-1">
                    {brands.map(b => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(b)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${selectedBrand === b
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                          }`}
                      >
                        <span>{b}</span>
                        {selectedBrand === b && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter Slider */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Max Price</h3>
                    <span className="text-xs font-bold text-orange-500">KES {priceRange.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>KES 500</span>
                    <span>KES 50,000</span>
                  </div>
                </div>
              </div>

              {/* Product Card Grid */}
              <div className="lg:col-span-3">
                {filteredProducts.length === 0 ? (
                  <div className="bg-slate-900/20 border border-slate-800/40 border-dashed rounded-3xl p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-300 mb-1">No products match your criteria</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Try resetting filters, searching for alternate brands, or adjusting price sliders.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All');
                        setSelectedBrand('All');
                        setPriceRange(50000);
                      }}
                      className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl hover:border-orange-500 text-white cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredProducts.map(p => {
                      const isLowStock = p.stockQuantity <= p.reorderThreshold && p.stockQuantity > 0;
                      const isOutOfStock = p.stockQuantity === 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="bg-[#0D1321]/45 border border-slate-800/70 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 flex flex-col group cursor-pointer"
                        >
                          {/* Image Container */}
                          <div className="h-44 bg-slate-950 relative overflow-hidden">
                            <img
                              src={p.imageUrl}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                              alt={p.name}
                              loading="lazy"
                            />
                            {/* Stock level badge overlay */}
                            {isOutOfStock ? (
                              <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                                SOLD OUT
                              </div>
                            ) : isLowStock ? (
                              <div className="absolute top-2 left-2 bg-amber-500/95 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider animate-pulse">
                                LOW STOCK ({p.stockQuantity})
                              </div>
                            ) : (
                              <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                                IN STOCK
                              </div>
                            )}

                            {/* Category Badge overlay */}
                            <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md text-[9px] text-slate-300 font-bold px-2.5 py-1 rounded-md border border-slate-800">
                              {p.category}
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">
                                {p.brand}
                              </span>
                              <h3 className="text-sm font-extrabold text-white group-hover:text-orange-500 transition-colors duration-200 line-clamp-1 mb-1.5">
                                {p.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                                {p.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 mt-auto">
                              <span className="text-sm font-black text-white">KES {p.price.toLocaleString()}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfStock) addToCart(p, 1);
                                }}
                                disabled={isOutOfStock}
                                className={`p-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${isOutOfStock
                                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                                  }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      ) : showActiveTab === 'tracker' ? (
        /* Order Tracker View */
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-10 flex-1 w-full animate-fade-in">
          <h2 className="text-xl md:text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-orange-500 w-5.5 h-5.5" /> Shipment & Order Tracker
          </h2>

          {orders.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-800/40 border-dashed rounded-3xl p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300 mb-1">No orders found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">You have not placed any orders yet in this active session. Go checkout some premium gear!</p>
              <button
                onClick={() => navigate('/')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer"
              >
                Go Shop Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order selector list */}
              <div className="md:col-span-1 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Order History</h3>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {orders.map(order => {
                    const isSelected = activeTrackingOrder === order.id;
                    const dateStr = new Date(order.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });

                    let statusColor = 'bg-slate-800 text-slate-300';
                    if (order.status === 'Paid') statusColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                    if (order.status === 'Delivered') statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    if (order.status === 'Cancelled') statusColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                    if (order.status === 'Ready for Shipping' || order.status === 'Shipped') statusColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

                    return (
                      <div
                        key={order.id}
                        onClick={() => setActiveTrackingOrder(order.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-slate-900 border-orange-500 shadow-md shadow-orange-500/5'
                            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-white">{order.id}</span>
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs font-bold text-slate-200">KES {order.totalAmount.toLocaleString()}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Tracking detail display */}
              <div className="md:col-span-2">
                {(() => {
                  const selectedOrder = orders.find(o => o.id === activeTrackingOrder);
                  if (!selectedOrder) return (
                    <div className="bg-slate-900/20 border border-slate-800/40 border-dashed rounded-3xl p-12 text-center h-full flex flex-col justify-center items-center">
                      <Clock className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500">Select an order on the left to track its real-time shipping logs.</p>
                    </div>
                  );

                  // Setup timeline checkpoints
                  // Statuses: 'Pending Payment', 'Paid', 'Preparing', 'Ready for Shipping', 'Shipped', 'Delivered', 'Cancelled'
                  const isCancelled = selectedOrder.status === 'Cancelled';
                  const states = ['Ordered', 'Paid', 'Prepared', 'Shipped', 'Delivered'];

                  // Map order statuses to active indices
                  const getStepIndex = (status) => {
                    if (status === 'Pending Payment') return 0;
                    if (status === 'Paid' || status === 'Preparing') return 1;
                    if (status === 'Ready for Shipping') return 2;
                    if (status === 'Shipped') return 3;
                    if (status === 'Delivered') return 4;
                    return -1;
                  };

                  const activeStep = getStepIndex(selectedOrder.status);

                  return (
                    <div className="bg-[#0D1321]/45 border border-slate-800 p-6 rounded-2xl text-left space-y-6 animate-fade-in">
                      {/* Tracking Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-900 gap-3">
                        <div>
                          <h4 className="text-sm text-slate-400 font-bold m-0 flex items-center gap-1.5">
                            Order ID: <span className="text-white font-black">{selectedOrder.id}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1">Placed: {new Date(selectedOrder.date).toLocaleString('en-KE')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedOrder.status === 'Pending Payment' && (
                            <button
                              onClick={() => {
                                setSimulatedOrder(selectedOrder);
                                setMpesaPin('');
                                setMpesaSimState('push-send');
                                setShowMpesaSimulator(true);
                                setTimeout(() => {
                                  setMpesaSimState('pin-entry');
                                }, 1500);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-green-500/10"
                            >
                              Pay Now via M-Pesa
                            </button>
                          )}
                          {selectedOrder.status !== 'Pending Payment' && selectedOrder.status !== 'Cancelled' && currentUser?.role === 'admin' && (
                            <button
                              onClick={() => printReceipt(selectedOrder)}
                              className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs px-3.5 py-1.5 border border-slate-800 hover:border-orange-500 rounded-xl transition-all duration-200 cursor-pointer shadow-md flex items-center gap-1"
                            >
                              🖨️ Print Receipt
                            </button>
                          )}
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                            Method: {selectedOrder.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Steps Visualization */}
                      {!isCancelled ? (
                        <div className="py-2">
                          <div className="flex justify-between items-center relative mb-8">
                            {/* Horizontal Line background */}
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 pointer-events-none z-0"></div>
                            {/* Horizontal Line Progress */}
                            <div
                              className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-orange-500 to-cyan-400 pointer-events-none z-0 transition-all duration-500"
                              style={{ width: `${(Math.max(0, activeStep) / 4) * 92}%` }}
                            ></div>

                            {states.map((stepName, idx) => {
                              const isCompleted = activeStep >= idx;
                              const isCurrent = activeStep === idx;

                              return (
                                <div key={stepName} className="flex flex-col items-center z-10 relative">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${isCompleted
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                                        : isCurrent
                                          ? 'bg-slate-950 border-orange-500 text-orange-500 animate-pulse'
                                          : 'bg-slate-950 border-slate-800 text-slate-500'
                                      }`}
                                  >
                                    {isCompleted && idx < activeStep ? (
                                      <Check className="w-4.5 h-4.5" />
                                    ) : (
                                      <span>{idx + 1}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] mt-2 font-black tracking-tight ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                                    {stepName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                          <p className="text-xs font-bold text-red-400 m-0">This order has been cancelled and refunded.</p>
                        </div>
                      )}

                      {/* Courier Transit Info */}
                      {selectedOrder.trackingNumber && (
                        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Courier Assigned</span>
                            <span className="text-xs text-white font-extrabold flex items-center gap-1.5 mt-0.5">
                              {selectedOrder.courierName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Tracking Number</span>
                            <span className="text-xs font-mono text-cyan-400 font-extrabold block mt-0.5">
                              {selectedOrder.trackingNumber}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Order Timeline Logs */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Tracking Status History</h4>
                        <div className="space-y-3.5 border-l-2 border-slate-900 ml-2 pl-4 py-1.5">
                          {selectedOrder.timeline.map((log, idx) => (
                            <div key={idx} className="relative">
                              {/* Circle Bullet indicator */}
                              <div className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-glow-orange"></div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-200">{log.status}</span>
                                <span className="text-[9px] text-slate-500">{new Date(log.date).toLocaleTimeString('en-KE')}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{log.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Signature Check displays */}
                      {selectedOrder.signature && (
                        <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Delivery Validation</span>
                            <span className="text-xs text-emerald-400 font-bold mt-0.5">✓ Verified delivered & signed</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">CUSTOMER SIGNATURE</span>
                            <div className="text-xs italic font-serif text-slate-400 tracking-wider font-extrabold mt-1">
                              "{selectedOrder.signature}"
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Purchased products list summary */}
                      <div className="border-t border-slate-900 pt-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 m-0">Order Summary</h4>
                        <div className="space-y-2">
                          {selectedOrder.items.map(item => (
                            <div key={item.product.id} className="flex justify-between text-xs py-1">
                              <span className="text-slate-300">
                                {item.product.name} <span className="text-slate-500 font-bold">x{item.quantity}</span>
                              </span>
                              <span className="font-bold text-slate-200">KES {(item.product.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-2 border-t border-slate-900 font-black">
                            <span className="text-slate-400">Total Charged</span>
                            <span className="text-orange-500">KES {selectedOrder.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Receipts Dashboard View */
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-10 flex-1 w-full animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white m-0 uppercase tracking-tight flex items-center gap-2">
                <FileText className="text-orange-500 w-5.5 h-5.5 animate-pulse" /> My Official Receipts
              </h2>
              <p className="text-xs text-slate-400 m-0 mt-1">Download and print official invoices for gear purchased at Sportman.ke</p>
            </div>
            
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order ID, item, or status..."
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs w-48 focus:w-60 transition-all duration-300 text-white"
              />
              {receiptSearch && (
                <button onClick={() => setReceiptSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="bg-[#0D1321]/45 border border-slate-800/80 border-dashed rounded-3xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300 mb-1">No receipts found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                {receiptSearch ? "Try checking for spelling errors or searching by a different term." : "You haven't purchased any products yet."}
              </p>
              {!receiptSearch && (
                <button
                  onClick={() => navigate('/')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer animate-pulse"
                >
                  Go Shop Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReceipts.map(order => {
                const dateStr = new Date(order.date).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                let statusColor = 'bg-slate-800 text-slate-300';
                if (order.status === 'Paid') statusColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                if (order.status === 'Delivered') statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                if (order.status === 'Cancelled') statusColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                if (order.status === 'Ready for Shipping' || order.status === 'Shipped') statusColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

                return (
                  <div key={order.id} className="bg-[#0D1321]/45 border border-slate-800/80 rounded-2xl p-6 text-left space-y-4 shadow-xl hover:border-slate-700 transition-all duration-300">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-900 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{order.id}</span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Order Date: {dateStr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status !== 'Pending Payment' && order.status !== 'Cancelled' ? (
                          currentUser?.role === 'admin' ? (
                            <button
                              onClick={() => printReceipt(order)}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-orange-500/10 flex items-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                              Receipt Viewable On-Screen
                            </span>
                          )
                        ) : order.status === 'Pending Payment' ? (
                          <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl">
                            Unpaid - Pending Payment
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-xl">
                            Order Cancelled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400 py-1">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Deliver To</span>
                        <span className="text-white font-extrabold block mt-0.5">{order.customerName}</span>
                        <span className="block mt-0.5">{order.phone}</span>
                        <span className="block font-semibold">{order.subCounty}, Nairobi</span>
                        <span className="block italic text-[11px] mt-0.5">{order.deliveryAddress}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Payment Details</span>
                        <span className="text-white font-extrabold block mt-0.5">Method: {order.paymentMethod}</span>
                        {order.mpesaReference && (
                          <span className="font-mono text-cyan-400 font-bold block mt-0.5">M-Pesa Ref: {order.mpesaReference}</span>
                        )}
                        <span className="block mt-1">
                          Subtotal: <span className="text-slate-200 font-semibold">KES {order.subtotal.toLocaleString()}</span>
                        </span>
                        {order.discountAmount > 0 && (
                          <span className="block text-emerald-400">
                            Discount ({order.couponApplied}): - KES {order.discountAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items Purchased List */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold">
                            <th className="pb-2 font-bold">Item Description</th>
                            <th className="pb-2 text-center font-bold">Qty</th>
                            <th className="pb-2 text-right font-bold">Unit Price</th>
                            <th className="pb-2 text-right font-bold">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {order.items.map(item => (
                            <tr key={item.product.id} className="text-slate-300">
                              <td className="py-2.5">
                                <span className="font-bold text-slate-200">{item.product.name}</span>
                                <span className="text-[10px] text-slate-500 block">Brand: {item.product.brand}</span>
                              </td>
                              <td className="py-2.5 text-center font-semibold">{item.quantity}</td>
                              <td className="py-2.5 text-right font-semibold">KES {item.product.price.toLocaleString()}</td>
                              <td className="py-2.5 text-right font-bold text-white">KES {(item.product.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="font-black text-white">
                            <td colSpan="2" className="pt-3"></td>
                            <td className="pt-3 text-right text-slate-400">Grand Total:</td>
                            <td className="pt-3 text-right text-orange-500 text-sm">KES {order.totalAmount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Delivery signature validation inside receipt */}
                    {order.signature && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold block">Courier Handover Verification</span>
                          <span className="text-emerald-400 font-bold">✓ Successfully delivered and signed by customer</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">SIGNATURE LOG</span>
                          <span className="text-slate-300 italic font-serif font-black">"{order.signature}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#05070B] border-t border-slate-900/80 py-8 px-4 md:px-8 text-center text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-orange-500 font-bold text-sm">🔥 Sportman.ke</span>
            <span className="text-slate-700">|</span>
            <span>Nairobi’s #1 Sports Hub</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-slate-300 cursor-pointer font-bold bg-transparent border-none">Terms of Service</button>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-300 cursor-pointer font-bold bg-transparent border-none">Privacy Policy</button>
            <button onClick={() => setIsSupportOpen(true)} className="hover:text-slate-300 cursor-pointer font-bold bg-transparent border-none">Customer Support</button>
          </div>
          <div>
            <span>&copy; {new Date().getFullYear()} Sportman.ke. All Rights Reserved.</span>
          </div>
        </div>
      </footer>

      {/* --- DRAWERS / MODALS OVERLAYS --- */}

      {/* PRODUCT DETAILS DIALOG */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-slate-950/70 border border-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-full bg-slate-950 relative">
                <img
                  src={selectedProduct.imageUrl}
                  className="w-full h-full object-cover object-center"
                  alt={selectedProduct.name}
                />
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] text-orange-500 uppercase tracking-widest font-black block mb-1">
                    {selectedProduct.brand}
                  </span>
                  <h2 className="text-xl font-black text-white mb-2 leading-tight">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl font-black text-white">KES {selectedProduct.price.toLocaleString()}</span>
                    <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      {selectedProduct.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light mb-4">
                    {selectedProduct.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-900 pt-3">
                    <div className="flex justify-between">
                      <span>Warehouse Location:</span>
                      <span className="text-white font-mono">{selectedProduct.warehouseLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock Inventory Level:</span>
                      <span className={`font-bold ${selectedProduct.stockQuantity === 0 ? 'text-red-500' : 'text-slate-200'}`}>
                        {selectedProduct.stockQuantity > 0 ? `${selectedProduct.stockQuantity} items available` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedProduct.stockQuantity > 0) {
                      addToCart(selectedProduct, 1);
                      setSelectedProduct(null);
                    }
                  }}
                  disabled={selectedProduct.stockQuantity === 0}
                  className={`w-full py-3.5 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${selectedProduct.stockQuantity === 0
                      ? 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/15'
                    }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{selectedProduct.stockQuantity > 0 ? 'Add to Shopping Cart' : 'Currently Out of Stock'}</span>
                </button>
              </div>
            </div>

            {/* Related recommendations section */}
            {relatedProducts.length > 0 && (
              <div className="bg-[#090D18] p-6 border-t border-slate-850">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5 text-left">Product Recommendations</h3>
                <div className="grid grid-cols-3 gap-4">
                  {relatedProducts.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedProduct(rel)}
                      className="bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden hover:border-orange-500/30 p-2 text-left cursor-pointer transition-all duration-200"
                    >
                      <div className="h-20 bg-slate-950 rounded-lg overflow-hidden mb-1.5">
                        <img src={rel.imageUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                      <h4 className="text-[10px] font-bold text-white truncate m-0">{rel.name}</h4>
                      <span className="text-[10px] text-orange-500 font-extrabold mt-0.5 block">KES {rel.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#0D1321] border-l border-slate-850 h-full shadow-2xl flex flex-col justify-between animate-slide-up">
            {/* Cart Header */}
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-orange-500 w-5 h-5 animate-pulse" />
                <h3 className="text-base font-black text-white uppercase tracking-tight m-0">Your Shopping Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Your cart is currently empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-white hover:border-orange-500 cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 bg-slate-900/40 border border-slate-850/80 p-4 rounded-xl">
                    <div className="w-16 h-16 bg-slate-950 rounded-lg overflow-hidden shrink-0">
                      <img src={item.product.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1 m-0">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-500 uppercase font-bold mt-0.5 block">{item.product.brand}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Qty selectors */}
                        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-850 scale-90">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:text-orange-500 text-slate-400 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-2.5">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:text-orange-500 text-slate-400 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-white">KES {(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors p-1 self-start cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-900 bg-slate-950/40 space-y-4 text-left">
                {/* Coupon Application Panel */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponCodeText}
                      onChange={(e) => setCouponCodeText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-3 py-2 text-xs uppercase text-white placeholder-slate-600 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-900 border border-slate-800 hover:border-orange-500 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                {couponFeedback.message && (
                  <p className={`text-[10px] font-bold m-0 ${couponFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {couponFeedback.message}
                  </p>
                )}

                {/* Subtotals & total calculations */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-200">KES {cartSubtotal.toLocaleString()}</span>
                  </div>
                  {activeCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Coupon ({activeCoupon.code}):</span>
                      <span>- KES {cartDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-white font-black pt-2 border-t border-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-orange-500">KES {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs md:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all duration-300 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT SYSTEM DRAWER */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 text-left">
              <h3 className="text-base md:text-lg font-black text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                <MapPin className="text-orange-500 w-5 h-5" /> Delivery & Checkout Info
              </h3>
              <p className="text-[11px] text-slate-400 mb-6">Enter details below to dispatch your sports order via Nairobi Courier network.</p>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* Full name input */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Customer Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kipchoge Keino"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="kipi@runner.com"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">M-Pesa Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0712345678"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Nairobi Subcounty Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Nairobi Sub-County</label>
                  <div className="relative">
                    <Map className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={customerInfo.subCounty}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, subCounty: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      {NAIROBI_SUB_COUNTIES.map(sc => (
                        <option key={sc} value={sc} className="bg-slate-900">{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Shipping address details */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Delivery Physical Address</label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Apt/Suite, Street, Building Name..."
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  ></textarea>
                </div>

                {/* Payment Option Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'WhatsApp', label: 'WhatsApp Checkout', icon: '💬 ' },
                      { id: 'M-Pesa', label: 'M-Pesa Pay', icon: '📲 ' }
                    ].map(method => (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`py-2.5 rounded-xl text-[10px] font-black tracking-tight border transition-all cursor-pointer ${paymentMethod === method.id
                            ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        {method.icon}
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'M-Pesa' ? (
                  <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-3.5 text-center animate-fade-in">
                    {/* Modern construction / building loading animation */}
                    <div className="flex items-center justify-center space-x-2.5 py-1">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">📲 M-Pesa Under Construction</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        M-Pesa payments are currently under development. Please use WhatsApp checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Submit button for WhatsApp Checkout */
                  <div className="pt-4 border-t border-slate-900 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Payable Total</span>
                      <span className="text-sm font-black text-orange-500">KES {cartTotal.toLocaleString()}</span>
                    </div>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white font-extrabold text-xs md:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all duration-300 transform active:scale-95 cursor-pointer"
                    >
                      <span>Checkout via WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REAL M-PESA CHECKOUT DIALOG */}
      {showMpesaSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-[#0D1321] border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden font-sans text-center space-y-6 animate-fade-in">
            {/* Header / Brand */}
            <div className="flex items-center justify-center gap-2 pb-4 border-b border-slate-900">
              <span className="text-xl font-black text-white tracking-tight">SPORTMAN<span className="text-orange-500">.KE</span></span>
              <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 font-extrabold uppercase px-2 py-0.5 rounded-md">M-Pesa Live</span>
            </div>

            {/* Content States */}
            {mpesaSimState === 'push-send' && (
              <div className="space-y-4 py-4 animate-fade-in text-center">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto text-orange-500 shadow-glow-orange animate-pulse">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Sending M-Pesa Prompt</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  We are triggering a Safaricom M-Pesa STK Push prompt to your registered number <span className="text-orange-500 font-bold">{simulatedOrder?.phone}</span>...
                </p>
                <div className="flex justify-center pt-2">
                  <Loader className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              </div>
            )}

            {mpesaSimState === 'pin-entry' && (
              <div className="space-y-4 py-4 animate-fade-in text-center">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto text-green-500 shadow-glow-cyan animate-bounce-slow">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Authorizing Payment</h3>

                <div className="bg-[#131A2A] border border-slate-800 p-4 rounded-xl text-left text-xs space-y-3">
                  <p className="text-slate-300 m-0">
                    1. A prompt has been sent to your phone for <span className="font-extrabold text-white">KES {simulatedOrder?.totalAmount.toLocaleString()}</span>.
                  </p>
                  <p className="text-slate-300 m-0">
                    2. Please unlock your phone and **enter your 4-digit M-Pesa PIN** to authorize the charge.
                  </p>
                  <p className="text-slate-300 m-0">
                    3. Do not close this screen. Our system is polling the ledger to automatically verify your payment...
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Loader className="w-4 h-4 text-green-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">Waiting for PIN entry and receipt validation...</span>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMpesaSimulator(false);
                      if (pollIntervalId) {
                        clearInterval(pollIntervalId);
                        setPollIntervalId(null);
                      }
                    }}
                    className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setMpesaSimState('processing')}
                    className="flex-1 py-3 bg-green-600/10 border border-green-600/20 hover:bg-green-600 hover:text-white text-green-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Simulate Manual PIN
                  </button>
                </div>
              </div>
            )}

            {mpesaSimState === 'processing' && (
              <form onSubmit={handleMpesaPinSubmit} className="space-y-4 py-4 animate-fade-in text-left">
                <h3 className="text-base font-black text-white uppercase text-center mb-2">Sandbox Manual Pin Entry</h3>
                <div className="bg-[#131A2A] border border-slate-800 p-5 rounded-xl space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Enter 4-Digit M-Pesa PIN</label>
                    <input
                      type="password"
                      maxLength="4"
                      pattern="\d{4}"
                      required
                      autoFocus
                      placeholder="••••"
                      value={mpesaPin}
                      onChange={(e) => setMpesaPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0D1321] border border-slate-800 rounded-xl py-3 text-center text-xl font-black tracking-[0.6em] text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMpesaSimState('pin-entry')}
                      className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={mpesaPin.length < 4}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mpesaPin.length < 4
                          ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                        }`}
                    >
                      Verify PIN
                    </button>
                  </div>
                </div>
              </form>
            )}

            {mpesaSimState === 'success' && (
              <div className="space-y-4 py-2 animate-fade-in text-center">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-glow-cyan animate-pulse">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Payment Confirmed</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your M-Pesa transaction has been verified successfully. Your order is now paid!
                </p>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2 text-left text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">M-Pesa Receipt:</span>
                    <span className="text-white font-extrabold">{simulatedOrder?.mpesaReference || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="text-white font-extrabold">{simulatedOrder?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Charged:</span>
                    <span className="text-green-400 font-extrabold">KES {simulatedOrder?.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleViewTracking}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-500/20 cursor-pointer animate-pulse-slow"
                >
                  Track Handover & Shipment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TERMS OF SERVICE MODAL --- */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-2xl bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-900 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-white uppercase tracking-tight m-0">Terms of Service</h3>
              <button
                onClick={() => setIsTermsOpen(false)}
                className="bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-light">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Last Updated: May 31, 2026</p>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">1. Overview & Agreement</h4>
                <p>Welcome to Sportman.ke. These Terms of Service ("Terms") govern your access to and use of our sports gear platform, operating within Nairobi County, Kenya. By purchasing our products, accessing our storefront, or triggering payment mechanisms, you fully consent to be bound by these legal terms.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">2. Payments & M-Pesa Transactions</h4>
                <p>All digital transactions executed on Sportman.ke are verified in partnership with Safaricom M-Pesa. By submitting an STK Push trigger, you authorize us to prompt your registered mobile number for a secure 4-digit PIN. In compliance with the Kenya Central Bank electronic transfer directives, we enforce a strict transaction limit in accordance with standard M-Pesa transaction limits. Any unauthorized or spoofed transactions will be blacklisted and logged with security regulators.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">3. Nairobi Courier & Boda-Boda Logistics</h4>
                <p>Delivery of products is handled strictly within Nairobi County sub-counties (Westlands, Kilimani, Karen, Langata, Embakasi, Roysambu, CBD). We leverage external courier networks ("BodaBoda Express") to offer rapid 2-hour dispatch. You are required to provide precise suite/apartment directions. Ownership and risk of damage transfer to you upon electronic handover sign-off (either custom text signature or drawn OTP checks).</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">4. Return, Refund & Stock Restoration Policies</h4>
                <p>In accordance with the Kenya Consumer Protection Act, we provide a 7-day return policy for unused, unopened sports equipment. If an order is cancelled by the Admin or Customer before delivery dispatcher handover, the transaction will be refunded to your source M-Pesa number within 24 hours, and inventory stock coordinates will automatically be restored to central warehouse levels.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">5. Governing Law</h4>
                <p>These terms and all commercial actions on this platform are governed strictly by the laws of the Republic of Kenya. Any claims, disagreements, or contract breaches will be filed within tribunals located in Nairobi, Kenya.</p>
              </section>
            </div>

            <div className="p-4 border-t border-slate-900 flex justify-end shrink-0 bg-slate-950/40">
              <button
                onClick={() => setIsTermsOpen(false)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                I Agree & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRIVACY POLICY MODAL --- */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-2xl bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-900 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-white uppercase tracking-tight m-0">Privacy & Data Policy</h3>
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-light">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Compliance: Kenya Data Protection Act 2019</p>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">1. Information We Collect</h4>
                <p>To deliver high-performance athletic gear to your doorstep, we collect personal information during checkout: Customer Name, Email, Safaricom Mobile Phone Number, physical street address, and Nairobi Sub-County. We do NOT store your M-Pesa PIN numbers; PIN entries are processed inside Safaricom’s isolated SIM Toolkit network interface.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">2. Use of Personal Data</h4>
                <p>We process your data solely to execute your purchase contracts: generating order invoice logs, dispatching tracking coordinates to Boda-Boda logistics teams, sending Twilio SMS delivery confirmations, and validating transactions against the M-Pesa Daraja payment ledger.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">3. Encryption & Data Safety</h4>
                <p>Your details are safely encrypted and stored in secure cloud containers. We strictly restrict customer ledger access to authorized corporate admins and warehouse coordinators. We enforce PCI compliance considerations and never lease or sell your telephone or address registries to third-party marketing companies.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white uppercase">4. Data Subject Rights</h4>
                <p>Under the Kenya Data Protection Act, you maintain full rights to request access, correction, or permanent erasure of your order details from our system archives. You can initiate this request at any time by contacting our Nairobi support team at Sportsman.ke001@gmail.com.</p>
              </section>
            </div>

            <div className="p-4 border-t border-slate-900 flex justify-end shrink-0 bg-slate-950/40">
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOMER SUPPORT MODAL PORTAL --- */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md bg-[#0D1321] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsSupportOpen(false)}
              className="absolute top-4 right-4 bg-slate-950/70 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8">
              <h3 className="text-base md:text-lg font-black text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                💬 Sportman Help & Support
              </h3>
              <p className="text-[10px] text-slate-400 mb-5">Encountered an issue with payments or shipping? Submit a support ticket to our Nairobi center.</p>

              <div className="flex gap-3 mb-5">
                <a
                  href="https://wa.me/254759238018"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-green-600/10 text-center decoration-none no-underline"
                >
                  <span>💬 WhatsApp Chat</span>
                </a>
                <a
                  href="tel:+254759238018"
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center decoration-none no-underline"
                >
                  <span>📞 Call Support</span>
                </a>
              </div>

              <div className="relative flex py-1 items-center mb-3">
                <div className="flex-grow border-t border-slate-800/60"></div>
                <span className="flex-shrink mx-3 text-[8px] text-slate-500 font-bold uppercase tracking-wider">Or Submit A Ticket</span>
                <div className="flex-grow border-t border-slate-800/60"></div>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={supportForm.name}
                      onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="07xx xxx xxx"
                      value={supportForm.phone}
                      onChange={(e) => setSupportForm({ ...supportForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={supportForm.email}
                      onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Order Ref ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SM-12345"
                      value={supportForm.orderId}
                      onChange={(e) => setSupportForm({ ...supportForm, orderId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Issue Category</label>
                  <select
                    value={supportForm.category}
                    onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="M-Pesa Payment Issue" className="bg-slate-900">M-Pesa Payment/STK Issue</option>
                    <option value="Delayed Boda-Boda Delivery" className="bg-slate-900">Delayed Boda-Boda Courier</option>
                    <option value="Wrong Shoe Size / Exchange" className="bg-slate-900">Gear Exchange / Sizing</option>
                    <option value="Product Defect / Return" className="bg-slate-900">Product Defects / Returns</option>
                    <option value="Other" className="bg-slate-900">Other Support Issue</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Detailed Explanation</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide details about your query..."
                    value={supportForm.details}
                    onChange={(e) => setSupportForm({ ...supportForm, details: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2 text-xs text-white"
                  ></textarea>
                </div>

                <div className="pt-3 border-t border-slate-900 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSupportOpen(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP CHAT WIDGET */}
      <a
        href="https://wa.me/254759238018"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-full shadow-2xl shadow-green-600/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group decoration-none no-underline"
        title="Chat with us on WhatsApp"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.988 3.3 1.489 5.353 1.49 5.433-.003 9.85-4.425 9.853-9.863.002-2.634-1.02-5.11-2.884-6.974C17.062 1.94 14.59 1.92 12.003 1.92c-5.44 0-9.858 4.417-9.86 9.858-.001 2.078.547 3.795 1.587 5.49L2.732 21.2l3.915-1.046z" />
        </svg>
        <span className="text-xs font-black uppercase tracking-wider text-white">
          WhatsApp Support
        </span>
      </a>
    </div>
  );
}
