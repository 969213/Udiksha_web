import React, { useState, useEffect } from 'react';
import { User, Product, Order, TeamMember, QrConfig } from '../types';
import { 
  Shield, Users, Shirt, ShoppingBag, BarChart3, QrCode, Lock, 
  Trash2, Plus, Edit, Check, X, Phone, UserPlus, FileText, 
  RefreshCw, TrendingUp, Package, IndianRupee, AlertTriangle, Key
} from 'lucide-react';

interface AdminPanelProps {
  currentAdmin: User | null;
  onAdminLogin: (admin: User) => void;
  onAdminLogout: () => void;
}

export default function AdminPanel({ currentAdmin, onAdminLogin, onAdminLogout }: AdminPanelProps) {
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStep, setLoginStep] = useState<'email' | 'password'>('email');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active view
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'staff' | 'team' | 'qr' | 'settings'>('analytics');

  // Database states
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [qrConfig, setQrConfig] = useState<QrConfig>({ upiId: '', payeeName: '' });

  // Update triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Forms / Actions state
  const [newUpiId, setNewUpiId] = useState('');
  const [newPayeeName, setNewPayeeName] = useState('');
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);

  // Forms for adding products
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Sarees',
    image: '',
    sizes: 'Free Size',
    colors: 'Multi-Color',
    stockCount: '30'
  });
  const [productFormError, setProductFormError] = useState('');
  const [productFormSuccess, setProductFormSuccess] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Forms for adding staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    phoneOrEmail: '',
    age: '28',
    gender: 'Male',
    role: 'worker' as 'admin' | 'worker'
  });
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Forms for adding showcase team
  const [teamForm, setTeamForm] = useState({
    name: '',
    designation: '',
    photoUrl: '',
    contactNumber: ''
  });
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');

  // Forms for changing security settings
  const [secForm, setSecForm] = useState({
    newPassword: ''
  });
  const [secSuccess, setSecSuccess] = useState('');

  // Fetch admin databases
  useEffect(() => {
    if (!currentAdmin) return;

    const fetchData = async () => {
      try {
        const [anRes, ordRes, prodRes, staffRes, teamRes, qrRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/orders'),
          fetch('/api/products'),
          fetch('/api/admin/staff'),
          fetch('/api/admin/team'),
          fetch('/api/admin/qr')
        ]);

        if (anRes.ok) setAnalytics(await anRes.json());
        if (ordRes.ok) setOrders(await ordRes.ok ? await ordRes.json() : []);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (staffRes.ok) setStaff(await staffRes.json());
        if (teamRes.ok) setTeam(await teamRes.json());
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrConfig(qrData);
          setNewUpiId(qrData.upiId || '');
          setNewPayeeName(qrData.payeeName || '');
        }
      } catch (err) {
        console.error('Error loading administrative data:', err);
      }
    };

    fetchData();
  }, [currentAdmin, refreshTrigger]);

  // Authorization actions
  const triggerEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLoginError('Gmail identifier is required');
      return;
    }
    if (email.toLowerCase() !== 'mbhola099@gmail.com') {
      setLoginError('Authentication gate is pre-programmed strictly for mbhola099@gmail.com');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/admin/login-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setLoginStep('password');
      } else {
        setLoginError(data.error || 'Server error occurred');
      }
    } catch (err) {
      setLoginError('Connection failure.');
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyPasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLoginError('Verification passcode is required');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/admin/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onAdminLogin(data.user);
        setActiveTab('analytics');
      } else {
        setLoginError(data.error || 'Invalid passcode entered');
      }
    } catch (err) {
      setLoginError('Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Order actions
  const updateOrderStatus = async (orderId: string, statusType: 'paymentStatus' | 'orderStatus', value: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [statusType]: value })
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    setProductFormSuccess('');

    const formattedProduct = {
      title: productForm.title,
      description: productForm.description,
      price: Number(productForm.price),
      originalPrice: Number(productForm.originalPrice || Number(productForm.price) * 1.5),
      category: productForm.category,
      image: productForm.image,
      sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: productForm.colors.split(',').map(c => c.trim()).filter(Boolean),
      stockCount: Number(productForm.stockCount)
    };

    if (!formattedProduct.title || !formattedProduct.price) {
      setProductFormError('Title and Price are required fields');
      return;
    }

    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedProduct)
      });
      const data = await res.json();

      if (res.ok) {
        setProductFormSuccess(editingProductId ? 'Listing updated successfully!' : 'New style apparel added to database successfully!');
        setProductForm({
          title: '',
          description: '',
          price: '',
          originalPrice: '',
          category: 'Sarees',
          image: '',
          sizes: 'Free Size',
          colors: 'Multi-Color',
          stockCount: '30'
        });
        setEditingProductId(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        setProductFormError(data.error || 'Failed saving style');
      }
    } catch (err) {
      setProductFormError('Server communications error');
    }
  };

  const selectProductForEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      title: prod.title,
      description: prod.description,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice.toString(),
      category: prod.category,
      image: prod.image,
      sizes: prod.sizes.join(', '),
      colors: prod.colors.join(', '),
      stockCount: prod.stockCount.toString()
    });
    setProductFormError('');
    setProductFormSuccess('');
  };

  const deleteProduct = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this listing from the catalog?')) return;
    try {
      const res = await fetch(`/api/products/${prodId}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Staff actions
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    if (!staffForm.name || !staffForm.phoneOrEmail) {
      setStaffError('Name and Mobile/Email are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (res.ok) {
        setStaffSuccess(`Added ${staffForm.name} to directory layout successfully.`);
        setStaffForm({
          name: '',
          phoneOrEmail: '',
          age: '28',
          gender: 'Male',
          role: 'worker'
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        setStaffError(data.error || 'Server error.');
      }
    } catch (err) {
      setStaffError('Failed saving staff.');
    }
  };

  const removeStaff = async (phoneOrEmail: string) => {
    if (!confirm(`Are you sure you want to revoke permissions for ${phoneOrEmail}?`)) return;
    try {
      const res = await fetch(`/api/admin/staff/${phoneOrEmail}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Showcase actions
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');

    if (!teamForm.name || !teamForm.designation) {
      setTeamError('Name and Designation are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      });
      if (res.ok) {
        setTeamSuccess('Added team member to public display section.');
        setTeamForm({ name: '', designation: '', photoUrl: '', contactNumber: '' });
        setRefreshTrigger(prev => prev + 1);
      } else {
        setTeamError('Failed saving.');
      }
    } catch (err) {
      setTeamError('Error.');
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!confirm('Remove member from public team panel?')) return;
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update QR configuration
  const saveQrConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId: newUpiId, payeeName: newPayeeName })
      });
      if (res.ok) {
        setQrSaveSuccess(true);
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setQrSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change security password
  const saveSecSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecSuccess('');
    if (!secForm.newPassword) return;

    try {
      const res = await fetch('/api/auth/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: secForm.newPassword })
      });
      if (res.ok) {
        setSecSuccess('Master Super-Admin login passcode saved successfully!');
        setSecForm({ newPassword: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Guest view login render
  if (!currentAdmin) {
    return (
      <div id="admin_auth_wrapper" className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Verified Admin Area</h2>
          <p className="text-sm text-slate-500 mt-1">Authorized workers and owner only</p>
        </div>

        {loginError && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded text-sm mb-4">
            {loginError}
          </div>
        )}

        {loginStep === 'email' ? (
          <form onSubmit={triggerEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Super-Admin Email Address</label>
              <input
                type="email"
                placeholder="e.g. mbhola099@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2.5 focus:outline-none focus:border-amber-500 text-slate-800"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Entering the pre-programmed master email id <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-amber-600 font-bold">mbhola099@gmail.com</span> will automatically dispatch a secure password via the simulated server SMTP gateway.
              </p>
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2.5 rounded transition shadow-md disabled:bg-slate-400 cursor-pointer text-sm"
            >
              {loginLoading ? 'Accessing Gateway...' : 'Initialize Verification Key'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyPasscodeAuth} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-850">
              📬 A secure access passcode has been generated in the <span className="font-bold underline text-amber-950">Dev Gateway Logs</span> (bottom right of screen) dispatched directly for your account.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Enter Verification Passcode</label>
              <input
                type="text"
                placeholder="Enter passcode from Dev Logs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2.5 focus:outline-none focus:border-amber-500 tracking-widest text-center font-mono font-bold text-slate-900 bg-slate-50"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                Check bottom-right <span className="font-semibold text-slate-600">Dev Logs</span> drawer to extract this dynamic code.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLoginStep('email')}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded text-sm font-semibold transition"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={loginLoading}
                className="flex-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded transition shadow-md disabled:bg-amber-300 text-sm cursor-pointer"
              >
                {loginLoading ? 'Decrypting...' : 'Verify & Enter'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Dashboard render
  return (
    <div id="admin_dashboard" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg mb-12">
      {/* Top Banner admin info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 text-white px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg tracking-wider text-amber-400">उदीक्षा Garment Control Desk</h2>
            <p className="text-xs text-slate-400">
              Welcome, <span className="text-slate-100 font-medium">{currentAdmin.name}</span> ({currentAdmin.role})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            OWNER CONTACT: +91 95197 64098
          </span>
          <button
            onClick={onAdminLogout}
            id="btn_admin_logout"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded transition cursor-pointer"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1 flex overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
            activeTab === 'analytics' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Business Analytics
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
            activeTab === 'orders' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Orders Verification
          {orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod === 'UPI_QR').length > 0 && (
            <span className="bg-amber-500 text-slate-950 rounded-full text-[10px] px-1.5 py-0.5 font-bold">
              {orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod === 'UPI_QR').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
            activeTab === 'products' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shirt className="w-4 h-4" />
          Styles & Inventory CMS
        </button>
        {currentAdmin.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
                activeTab === 'staff' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Directory
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
                activeTab === 'team' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Showcase Team
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
                activeTab === 'qr' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Billing QR Settings
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 p-3 border-b-2 font-heading transition text-sm cursor-pointer ${
                activeTab === 'settings' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              Security Lock
            </button>
          </>
        )}
      </div>

      {/* Main tab scrollable wrapper */}
      <div className="p-6">
        
        {/* TAB 1: BUSINESS ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total Revenue</p>
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1 flex items-center">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                    {analytics.totalRevenue.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Procured Stock (Incoming)</p>
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">
                    {analytics.totalIncomingStock} <span className="text-xs text-slate-500 font-normal">units</span>
                  </h3>
                </div>
                <div className="bg-sky-100 text-sky-700 p-3 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Clothing Items Sold</p>
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">
                    {analytics.totalItemsSold} <span className="text-xs text-slate-500 font-normal">units</span>
                  </h3>
                </div>
                <div className="bg-amber-100 text-amber-700 p-3 rounded-lg">
                  <Shirt className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Pending QR Approvals</p>
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">
                    {analytics.pendingPaymentsCount} <span className="text-xs text-slate-500 font-normal">orders</span>
                  </h3>
                </div>
                <div className={`p-3 rounded-lg ${analytics.pendingPaymentsCount > 0 ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Structured running ledger table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-heading font-bold text-slate-800">Financial Ledger and Billing Feed</h4>
                <button 
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Buyer Name</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Sales Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                      <th className="px-4 py-3">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analytics.salesLedgerFeed.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">No business records logged in ledger file databases yet.</td>
                      </tr>
                    ) : (
                      analytics.salesLedgerFeed.map((entry: any) => (
                        <tr key={entry.orderId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{entry.orderId}</td>
                          <td className="px-4 py-3">{entry.buyerName}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs">{entry.itemCount} item(s)</td>
                          <td className="px-4 py-3 font-semibold">₹{entry.totalAmount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              entry.paymentStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              entry.paymentStatus === 'declined' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-850'
                            }`}>
                              {entry.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              entry.orderStatus === 'delivered' ? 'bg-sky-100 text-sky-800' :
                              entry.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              entry.orderStatus === 'cancelled' ? 'bg-slate-100 text-slate-800' :
                              'bg-amber-100 text-amber-850'
                            }`}>
                              {entry.orderStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER VERIFICATION DESK */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-slate-900">UPI Payment Approvals & Logistics Desk</h3>
              <p className="text-xs text-slate-500">Owners can effortlessly track custom dynamic QR bills</p>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 px-4 text-center text-slate-400 italic">
                  No orders have been submitted by customers yet.
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col md:flex-row gap-5 justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Order info header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-950 bg-slate-200 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentMethod === 'UPI_QR' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="border bg-white rounded-lg p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Products Purchased</p>
                        {order.items.map((itm, i) => (
                          <div key={i} className="text-sm border-b last:border-0 pb-1 last:pb-0 flex justify-between items-center text-slate-800">
                            <span>
                              {itm.productTitle}{' '}
                              <span className="text-xs text-slate-500 font-semibold">
                                ({itm.selectedSize ? `Size: ${itm.selectedSize}` : 'Free Size'}
                                {itm.selectedColor ? `, Color: ${itm.selectedColor}` : ''})
                              </span>
                            </span>
                            <span className="font-medium">
                              ₹{itm.price} x{itm.quantity}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 text-right font-bold text-sm text-slate-900 border-t mt-1">
                          Grand Total: ₹{order.totalAmount}
                        </div>
                      </div>

                      {/* Buyer Address info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-700 bg-slate-100 p-3 rounded">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Shipping Address</p>
                          <p className="font-medium text-slate-900 mt-0.5">{order.buyerName}</p>
                          <p className="mt-0.5 leading-relaxed">{order.buyerAddress}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Contact Customer</p>
                          <p className="font-medium text-slate-900 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {order.buyerPhone}
                          </p>
                          {order.buyerAge && (
                            <p className="mt-1 text-slate-500">
                              Age: <span className="text-slate-700">{order.buyerAge}</span> | Gender: <span className="text-slate-700">{order.buyerGender || 'N/A'}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls alignment */}
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5 flex flex-col justify-between items-end gap-4 min-w-[200px]">
                      <div className="w-full text-right space-y-1">
                        <p className="text-xs text-slate-500">Verification Ledger</p>
                        
                        {/* Transaction ID */}
                        {order.paymentMethod === 'UPI_QR' && (
                          <div className="bg-indigo-50/85 border border-indigo-150 p-2 rounded text-left mt-1">
                            <span className="text-[9px] text-indigo-800 uppercase block font-semibold">Provided Tx ID:</span>
                            <span className="font-mono text-xs text-indigo-950 font-bold select-all break-all block">{order.paymentTxId || 'None submitted'}</span>
                          </div>
                        )}
                      </div>

                      {/* Ledger Controls */}
                      <div className="w-full space-y-3">
                        {/* 1. Payment status lock */}
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Billing Approval</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateOrderStatus(order.id, 'paymentStatus', 'approved')}
                              className={`flex-1 flex justify-center items-center gap-1 text-xs py-1.5 rounded font-semibold border transition cursor-pointer ${
                                order.paymentStatus === 'approved' 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'bg-white text-slate-700 hover:bg-slate-150'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Appr
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'paymentStatus', 'declined')}
                              className={`flex-1 flex justify-center items-center gap-1 text-xs py-1.5 rounded font-semibold border transition cursor-pointer ${
                                order.paymentStatus === 'declined' 
                                  ? 'bg-rose-600 border-rose-600 text-white' 
                                  : 'bg-white text-slate-700 hover:bg-slate-150'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Rej
                            </button>
                          </div>
                        </div>

                        {/* 2. Order shipment settings */}
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Logistic Settings</p>
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order.id, 'orderStatus', e.target.value)}
                            className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:outline-none focus:border-amber-500"
                          >
                            <option value="pending">Pending Cargo Processing</option>
                            <option value="shipped">Shipped (Inventory Decremented)</option>
                            <option value="delivered">Delivered Successfully</option>
                            <option value="cancelled">Cancelled (Restore Stock)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STYLES & INVENTORY CMS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 border-b pb-2">
              {editingProductId ? '✏️ Edit Existing Apparel Listing' : '👕 Onboard New Style listing'}
            </h3>

            {productFormError && <div className="bg-rose-50 text-rose-700 p-3 rounded text-xs">{productFormError}</div>}
            {productFormSuccess && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-xs">{productFormSuccess}</div>}

            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. Traditional Bandhej Saree"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Apparel Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="Sarees">Sarees</option>
                  <option value="Kurtis & Ethnic">Kurtis & Ethnic Wear</option>
                  <option value="Men's Casuals">Men's Casuals</option>
                  <option value="Jeans & Trousers">Jeans & Trousers</option>
                  <option value="Suits & Sherwanis">Suits & Sherwanis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Procured Stock Count (Ledger Quantity)</label>
                <input
                  type="number"
                  value={productForm.stockCount}
                  onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })}
                  placeholder="30"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  placeholder="Exquisite fabrics style parameters, hand embroidery specifications, and weaving properties..."
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="1499"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Original Price (Strikeout ₹)</label>
                <input
                  type="number"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                  placeholder="2999"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Style Colors (Comma separated)</label>
                <input
                  type="text"
                  value={productForm.colors}
                  onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                  placeholder="Saffron, Crimson Blue, Silk Ivory"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Garment Image URL (High Definition)</label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="Paste Unsplash or royalty-free clothing image address"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Available Sizes (Comma separated)</label>
                <input
                  type="text"
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                  placeholder="M, L, XL, Free Size"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({
                        title: '',
                        description: '',
                        price: '',
                        originalPrice: '',
                        category: 'Sarees',
                        image: '',
                        sizes: 'Free Size',
                        colors: 'Multi-Color',
                        stockCount: '30'
                      });
                    }}
                    className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs px-4 py-2 rounded transition font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs px-6 py-2 rounded transition shadow"
                >
                  {editingProductId ? 'Update Listing' : 'Publish Style Listing'}
                </button>
              </div>
            </form>

            {/* List with admin actions */}
            <h4 className="font-heading font-bold text-slate-800 text-sm mt-6">Active Shop Catalog Items</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex gap-3 bg-white">
                  <img src={p.image} className="w-16 h-20 object-cover rounded border bg-slate-50" alt="" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-heading font-bold text-xs text-slate-900 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{p.category}</p>
                    <p className="text-sm font-semibold text-slate-900">₹{p.price}</p>
                    <p className="text-[10px] text-slate-500">
                      Procured: <span className={`font-mono font-bold ${p.stockCount <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>{p.stockCount} units</span>
                    </p>
                    
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => selectProductForEdit(p)}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 px-2 py-1 rounded transition font-semibold"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-[10px] text-rose-700 px-2 py-1 rounded transition font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAFF DIRECTORY */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-heading text-lg font-bold text-slate-900">Multi-Tiered Admin & Worker Directory</h3>
              <span className="text-xs text-slate-500 font-mono">ROLE PERMISSIONS ENGINE (SECURE)</span>
            </div>

            {staffError && <div className="bg-rose-50 text-rose-700 p-3 rounded text-xs">{staffError}</div>}
            {staffSuccess && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-xs">{staffSuccess}</div>}

            {/* Add Staff form */}
            <form onSubmit={handleStaffSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Singh"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number or Email</label>
                <input
                  type="text"
                  value={staffForm.phoneOrEmail}
                  onChange={(e) => setStaffForm({ ...staffForm, phoneOrEmail: e.target.value })}
                  placeholder="+91 99999 88888"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Permission Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'admin' | 'worker' })}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="worker">Worker (Logistics & Ledgers)</option>
                  <option value="admin">Administrator (Full permissions)</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-2.5 rounded transition cursor-pointer flex justify-center items-center gap-1.5 h-9"
              >
                <Plus className="w-3.5 h-3.5" /> Bind New Worker
              </button>
            </form>

            {/* Registered Directory Table */}
            <div className="border rounded-xl overflow-hidden bg-white mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Identity Contact</th>
                    <th className="px-4 py-3">Onboard Gender</th>
                    <th className="px-4 py-3">Role Authorization</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  {staff.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">{st.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{st.phoneOrEmail}</td>
                      <td className="px-4 py-3">{st.gender || 'Male'} (Age: {st.age || 28})</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {st.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {st.phoneOrEmail === 'mbhola099@gmail.com' ? (
                          <span className="text-[10px] text-slate-400 italic">Immortal Master Gate</span>
                        ) : (
                          <button
                            onClick={() => removeStaff(st.phoneOrEmail)}
                            className="text-rose-600 hover:text-rose-800 font-bold hover:underline transition"
                          >
                            Revoke Access
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SHOWCASE TEAM DISPLAY */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 border-b pb-2">Our Team Display Board Manager</h3>

            {teamError && <div className="bg-rose-50 text-rose-700 p-3 rounded text-xs">{teamError}</div>}
            {teamSuccess && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-xs">{teamSuccess}</div>}

            <form onSubmit={handleTeamSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Shivendra Mishra"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                <input
                  type="text"
                  value={teamForm.designation}
                  onChange={(e) => setTeamForm({ ...teamForm, designation: e.target.value })}
                  placeholder="Designer & Shop Owner"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  value={teamForm.photoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, photoUrl: e.target.value })}
                  placeholder="Paste portrait image URL"
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-2.5 rounded transition cursor-pointer tracking-wider"
              >
                Onboard to Header Catalog
              </button>
            </form>

            <h4 className="font-heading font-bold text-slate-800 text-sm mt-4">Current Team Showcase Profiles (Publicly visible)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {team.map((t) => (
                <div key={t.id} className="border border-slate-205 rounded-xl p-3 flex gap-4 bg-white items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={t.photoUrl} className="w-12 h-12 object-cover rounded-full border shadow-sm" alt="" />
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{t.designation}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTeamMember(t.id)}
                    className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: UPI QR BILLING CONFIGURATION */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 border-b pb-2">UPI Direct Checkout configuration</h3>
            
            <div className="bg-amber-50 text-amber-850 p-4 rounded-xl text-xs space-y-2 border border-amber-200">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                No Code modifications Required:
              </p>
              <p>
                Modify details below. The website automatically renders a fully functional, high-precision UPI QR Code generator dynamically during checkouts using these variables!
              </p>
            </div>

            {qrSaveSuccess && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-xs">Merchant UPI parameters updated in core database successfully!</div>}

            <form onSubmit={saveQrConfig} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Merchant UPI ID *</label>
                <input
                  type="text"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  placeholder="e.g. 9519764098@paytm"
                  className="w-full text-xs font-sans font-semibold border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payee Name (Branding name) *</label>
                <input
                  type="text"
                  value={newPayeeName}
                  onChange={(e) => setNewPayeeName(e.target.value)}
                  placeholder="e.g. ✨ उदीक्षा Garment Shop ✨"
                  className="w-full text-xs font-sans font-semibold border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                  required
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-205 flex items-center gap-4">
                {/* Dynamically simulated QR preview using UPI URL payload */}
                <div className="bg-white p-2 border rounded shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${newUpiId}&pn=${encodeURIComponent(newPayeeName)}&cu=INR`} 
                    className="w-16 h-16 object-contain" 
                    alt="Billing test" 
                  />
                </div>
                <div className="text-xs space-y-0.5 text-slate-600">
                  <p className="font-bold text-slate-900">Dynamic Bilateral QR Preview</p>
                  <p className="font-mono text-[10px]">pa: {newUpiId || 'None yet'}</p>
                  <p className="font-mono text-[10px]">pn: {newPayeeName || 'None yet'}</p>
                </div>
              </div>

              <button
                type="submit"
                className="bg-slate-950 hover:bg-slate-850 text-white font-semibold text-xs px-6 py-2.5 rounded transition shadow cursor-pointer"
              >
                Apply Merchant Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: ADMINISTRATIVE SECURITY PASSWORD */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 border-b pb-2">Security controls and administrative passwords</h3>

            {secSuccess && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-xs">{secSuccess}</div>}

            <form onSubmit={saveSecSettings} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modify administrative login password</label>
                <input
                  type="password"
                  placeholder="Enter new master passcode"
                  value={secForm.newPassword}
                  onChange={(e) => setSecForm({ newPassword: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                  required
                  minLength={4}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Changes apply immediately. The prebuilt passcode mbola099 master routing can be triggered via email, or direct setting authentication.
                </p>
              </div>

              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-6 py-2 rounded transition cursor-pointer"
              >
                Save administrative password
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
