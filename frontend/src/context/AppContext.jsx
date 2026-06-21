import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const AppContext = createContext();

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Sportsman Pro Match Football',
    category: 'Football',
    description: 'FIFA-quality match football with superior aerodynamics and textured grip. Designed for all weather conditions in Nairobi stadiums.',
    price: 3500,
    stockQuantity: 25,
    reorderThreshold: 5,
    brand: 'Sportsman',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle A - Row 1'
  },
  {
    id: 'prod-2',
    name: 'Nairobi Giants Official Jersey 2026',
    category: 'Jerseys',
    description: 'Breathable, sweat-wicking lightweight official team home jersey. Show your pride in Nairobi Giants style!',
    price: 2500,
    stockQuantity: 15,
    reorderThreshold: 5,
    brand: 'Sportsman',
    imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle A - Row 3'
  },
  {
    id: 'prod-3',
    name: 'Elite Grip Basketball (Size 7)',
    category: 'Basketball',
    description: 'Composite leather basketball optimized for both indoor wooden courts and outdoor neighborhood courts.',
    price: 4200,
    stockQuantity: 8,
    reorderThreshold: 3,
    brand: 'Spalding',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle B - Row 2'
  },
  {
    id: 'prod-4',
    name: 'Speedster Football Boots FG',
    category: 'Boots',
    description: 'Ultralight firm-ground cleats with stud configuration engineered for explosive speed and sudden pivots.',
    price: 6800,
    stockQuantity: 4,
    reorderThreshold: 5,
    brand: 'Sportsman',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle C - Row 4'
  },
  {
    id: 'prod-5',
    name: 'Professional Table Tennis Table',
    category: 'Table Tennis',
    description: 'Tournament-ready full-size table tennis table with premium 25mm blue playtop surface. Easily foldable.',
    price: 45000,
    stockQuantity: 2,
    reorderThreshold: 2,
    brand: 'Donic',
    imageUrl: 'https://images.unsplash.com/photo-1609710223199-14b36c6ca5d4?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Zone D - Shelf 1'
  },
  {
    id: 'prod-6',
    name: 'Carbon Ping Pong Racket',
    category: 'Table Tennis',
    description: 'High-speed defensive/offensive carbon-fiber ping pong racket with premium competition ITTF rubber.',
    price: 3800,
    stockQuantity: 12,
    reorderThreshold: 4,
    brand: 'Butterfly',
    imageUrl: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle B - Row 4'
  },
  {
    id: 'prod-7',
    name: '3-Star Table Tennis Balls (12-Pack)',
    category: 'Table Tennis',
    description: 'White seamless 40mm competition table tennis balls. Outstanding bounce, roundness and durability.',
    price: 1200,
    stockQuantity: 38,
    reorderThreshold: 10,
    brand: 'Donic',
    imageUrl: 'https://images.unsplash.com/photo-1620987278429-ca18c53d279d?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle B - Row 5'
  },
  {
    id: 'prod-8',
    name: 'Classic Basketball Hoop Net (Pair)',
    category: 'Basketball',
    description: 'Heavy duty, all-weather white nylon replacement basketball nets. Fits standard 12-loop basketball rims.',
    price: 950,
    stockQuantity: 5,
    reorderThreshold: 3,
    brand: 'Sportsman',
    imageUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=500&auto=format&fit=crop&q=60',
    warehouseLocation: 'Aisle B - Row 3'
  }
];

const DEFAULT_COUPONS = [
  { id: 'c-1', code: 'SPORT50', discountPercentage: 50, description: '50% off flash sale' },
  { id: 'c-2', code: 'KIPCHOGE', discountPercentage: 20, description: '20% off marathon special' },
  { id: 'c-3', code: 'NAIROBI10', discountPercentage: 10, description: '10% off local delivery' }
];

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState('customer');

  useEffect(() => {
    if (user) {
      setRole(user.role);
    } else {
      setRole('customer');
    }
  }, [user]);

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('sm_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('sm_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [coupons, setCoupons] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch authorization headers for gated endpoints
  const getAuthHeaders = (targetRole = null) => {
    const activeRole = targetRole || role;
    const token = sessionStorage.getItem(`sm_token_${activeRole}`);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // 1. Fetch products from NestJS server with fallback
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch (err) {
      console.warn('Backend server down. Falling back to Sandbox memory catalog.', err);
      setProducts(DEFAULT_PRODUCTS);
    }
  };

  // 2. Fetch coupons from NestJS server with fallback
  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE}/coupons`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        setCoupons(DEFAULT_COUPONS);
      }
    } catch (err) {
      console.warn('Backend server down. Falling back to Sandbox memory coupons.', err);
      setCoupons(DEFAULT_COUPONS);
    }
  };

  // 3. Fetch/Sync orders from NestJS server
  const fetchOrders = async (targetRole = null) => {
    const activeRole = targetRole || role;
    if (activeRole === 'customer') {
      try {
        const headers = getAuthHeaders(activeRole);
        const res = await fetch(`${API_BASE}/orders/my-orders`, { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const parsedOrders = data.map(o => ({
            ...o,
            timeline: JSON.parse(o.timelineJson || '[]'),
            items: o.items.map(item => ({
              product: item.product,
              quantity: item.quantity
            }))
          }));
          setOrders(parsedOrders);
          localStorage.setItem('sm_orders', JSON.stringify(parsedOrders));
          return;
        }
      } catch (err) {
        console.warn('Backend order sync failed, using local storage fallback.', err);
      }

      // Sync customer's local orders from database
      const savedOrders = localStorage.getItem('sm_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        await syncCustomerOrders(parsed);
      }
      return;
    }

    // For staff, load all database orders
    try {
      const headers = getAuthHeaders(activeRole);
      const res = await fetch(`${API_BASE}/orders`, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const parsedOrders = data.map(o => ({
          ...o,
          timeline: JSON.parse(o.timelineJson || '[]'),
          items: o.items.map(item => ({
            product: item.product,
            quantity: item.quantity
          }))
        }));
        setOrders(parsedOrders);
      }
    } catch (err) {
      console.error('Failed to load database orders for role:', activeRole, err);
    }
  };

  // Sync customer local orders from backend records
  const syncCustomerOrders = async (localOrders) => {
    if (!localOrders || localOrders.length === 0) return;
    try {
      const synced = await Promise.all(
        localOrders.map(async (order) => {
          try {
            const res = await fetch(`${API_BASE}/orders/${order.id}?email=${encodeURIComponent(order.email)}`, { credentials: 'include' });
            if (res.ok) {
              const o = await res.json();
              return {
                ...o,
                timeline: JSON.parse(o.timelineJson || '[]'),
                items: o.items.map(item => ({
                  product: item.product,
                  quantity: item.quantity
                }))
              };
            }
          } catch (e) {
            console.warn('Failed to sync order:', order.id, e);
          }
          return order;
        })
      );
      setOrders(synced);
      localStorage.setItem('sm_orders', JSON.stringify(synced));
    } catch (err) {
      console.warn('Could not sync customer tracking orders with backend.', err);
    }
  };

  // Run on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProducts();
      await fetchCoupons();
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sm_role', role);
    // Fetch orders if role changes to display the correct data in staff dashboards!
    fetchOrders(role);
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem('sm_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sm_orders', JSON.stringify(orders));
  }, [orders]);

  // Helper function to add alert notifications
  const addNotification = (type, message) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newNotif = { id, type, message, timestamp: new Date(), read: false };
    setNotifications(prev => [newNotif, ...prev]);

    // Automatically remove toast notifications after 5.5 seconds to prevent screen clutter
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };

  // Switch Portal View
  const changeRole = (newRole) => {
    setRole(newRole);
    addNotification('info', `Switched viewing perspective to ${newRole.toUpperCase()} Portal`);
  };

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
    addNotification('success', `Added "${product.name}" to cart`);
  };

  // Update item quantity in cart
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    const item = cart.find(i => i.product.id === productId);
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    if (item) {
      addNotification('info', `Removed "${item.product.name}" from cart`);
    }
  };

  // Clear shopping cart
  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  // Apply Coupon code
  const applyCoupon = (code) => {
    const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (found) {
      setActiveCoupon(found);
      addNotification('success', `Coupon "${found.code}" applied: ${found.discountPercentage}% discount!`);
      return { success: true, discount: found.discountPercentage };
    } else {
      addNotification('error', `Invalid or expired coupon code: "${code}"`);
      return { success: false };
    }
  };

  // Place a new Order
  const createOrder = async (customerInfo, paymentMethod) => {
    try {
      const body = {
        userId: user ? user.id : null,
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        subCounty: customerInfo.subCounty,
        paymentMethod,
        cart,
        couponCode: activeCoupon ? activeCoupon.code : null
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Checkout failed.');
      }

      const rawOrder = await res.json();
      const parsedOrder = {
        ...rawOrder,
        timeline: JSON.parse(rawOrder.timelineJson || '[]'),
        items: rawOrder.items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      };

      // Apply locally
      setOrders(prev => [parsedOrder, ...prev]);
      clearCart();

      // Trigger instant Email and SMS simulator notifications
      addNotification('email', `Order confirmation sent to ${customerInfo.email}. Ref: ${parsedOrder.id}`);
      addNotification('sms', `Sportsman: Order ${parsedOrder.id} received. total: KES ${parsedOrder.totalAmount.toLocaleString()}. Thank you!`);

      // Refetch catalog to sync locks & stock counts
      await fetchProducts();

      return parsedOrder;
    } catch (err) {
      addNotification('error', err.message || 'Checkout failed: Stock insufficiency or database lock timeout.');
      return null;
    }
  };

  // Complete Payment (mostly for M-Pesa simulator) via the public pay endpoint
  const payOrder = async (orderId, mpesaRef) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpesaReference: mpesaRef }),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Payment status capture failed.');
      }

      const updated = await res.json();
      const parsed = {
        ...updated,
        timeline: JSON.parse(updated.timelineJson || '[]'),
        items: updated.items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      };

      setOrders(prev =>
        prev.map(order => (order.id === orderId ? parsed : order))
      );

      addNotification('sms', `M-Pesa ID ${mpesaRef} confirmed. KES ${parsed.totalAmount.toLocaleString()} paid to SPORTSMAN.KE.`);
      addNotification('success', `Payment verified successfully! Receipt Code: ${mpesaRef}`);
    } catch (err) {
      addNotification('error', err.message || 'M-Pesa payment sync failed.');
    }
  };

  // Trigger Lipa Na M-Pesa STK Push API
  const triggerMpesaPush = async (orderId, phone) => {
    try {
      const res = await fetch(`${API_BASE}/mpesa/stkpush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to trigger M-Pesa prompt.');
      }

      const data = await res.json();
      if (data.success) {
        addNotification('info', data.message);
        return data;
      } else {
        throw new Error(data.message || 'M-Pesa payment prompt rejected.');
      }
    } catch (err) {
      addNotification('error', err.message || 'Could not initiate STK Push.');
      return null;
    }
  };

  // Update order status across warehouse/delivery pipelines with gated controls
  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus, extraData }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update order status.');
      }

      const updated = await res.json();
      const parsed = {
        ...updated,
        timeline: JSON.parse(updated.timelineJson || '[]'),
        items: updated.items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      };

      setOrders(prev =>
        prev.map(order => (order.id === orderId ? parsed : order))
      );

      // Trigger standard alerts
      if (newStatus === 'Shipped') {
        addNotification('sms', `Sportsman: Order ${parsed.id} shipped via ${parsed.courierName}. Track with ${parsed.trackingNumber}`);
      } else if (newStatus === 'Delivered') {
        addNotification('sms', `Sportsman: Order ${parsed.id} has been delivered successfully. Rate our service!`);
      } else if (newStatus === 'Cancelled') {
        addNotification('email', `Cancellation notice for order ${parsed.id} sent to ${parsed.email}`);
        // Refresh catalogue stock levels
        await fetchProducts();
      }

      return parsed;
    } catch (err) {
      addNotification('error', err.message || 'Workflow update rejected.');
    }
  };

  // User CRUD (Admin gated)
  const fetchUsers = async () => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/auth/users`, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const addUser = async (userData) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add user.');
      }

      await fetchUsers();
      addNotification('success', `User "${userData.name}" added successfully.`);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user.');
      }

      await fetchUsers();
      addNotification('info', `User updated successfully.`);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user.');
      }

      await fetchUsers();
      addNotification('warning', `User deleted.`);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
      return { success: false, error: err.message };
    }
  };

  // Product CRUD (Admin gated)
  const addProduct = async (newProd) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newProd),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Product creation failed.');
      }

      await fetchProducts();
      addNotification('success', `Product "${newProd.name}" added to inventory`);
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
    }
  };

  const updateProduct = async (updatedProd) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/products/${updatedProd.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedProd),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Product modification failed.');
      }

      await fetchProducts();
      addNotification('info', `Product "${updatedProd.name}" updated successfully`);
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Product removal failed.');
      }

      await fetchProducts();
      addNotification('warning', `Product removed from catalogue`);
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
    }
  };

  // Coupon CRUD (Admin gated)
  const addCoupon = async (newCoupon) => {
    try {
      const headers = getAuthHeaders('admin');
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCoupon),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Campaign coupon launch failed.');
      }

      await fetchCoupons();
      addNotification('success', `Campaign coupon "${newCoupon.code.toUpperCase()}" launched!`);
    } catch (err) {
      addNotification('error', err.message || 'Gated Action Denied.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        API_BASE,
        role,
        changeRole,
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
        updateOrderStatus,
        coupons,
        addCoupon,
        activeCoupon,
        applyCoupon,
        notifications,
        addNotification,
        addProduct,
        updateProduct,
        deleteProduct,
        users,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
