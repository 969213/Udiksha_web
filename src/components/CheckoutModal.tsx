import React, { useState, useEffect } from 'react';
import { Product, User, OrderItem, QrConfig } from '../types';
import { X, Phone, Lock, UserCheck, AlertCircle, ShoppingCart, CreditCard, CheckCircle2, Copy } from 'lucide-react';

interface CheckoutModalProps {
  cart: { product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[];
  totalAmount: number;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ cart, totalAmount, currentUser, onLoginSuccess, onClose, onOrderSuccess }: CheckoutModalProps) {
  // Wizard steps: 'auth' | 'profile_setup' | 'shipping' | 'payment_upi' | 'payment_cod' | 'success'
  const [step, setStep] = useState<'auth' | 'profile_setup' | 'shipping' | 'success'>('auth');
  
  // Auth state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Temp user returned on first verification before profile completion
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  // Profile setup states
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('25');
  const [profileGender, setProfileGender] = useState('Male');

  // Shipping details state
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingName, setShippingName] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'COD'>('UPI_QR');
  const [paymentTxId, setPaymentTxId] = useState('');
  const [qrConfig, setQrConfig] = useState<QrConfig>({ upiId: '9519764098@paytm', payeeName: '✨ उदीक्षा Garment Shop ✨' });
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Sizing adjust selectors for each checkout item
  const [checkoutItems, setCheckoutItems] = useState<{
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }[]>([]);

  // Intialize items with selections
  useEffect(() => {
    const initialized = cart.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize || item.product.sizes[0] || 'Free Size',
      selectedColor: item.selectedColor || item.product.colors[0] || 'Multi-Color'
    }));
    setCheckoutItems(initialized);
    
    // Set default names from logged user if already logged
    if (currentUser) {
      setShippingName(currentUser.name);
      setShippingPhone(currentUser.phoneOrEmail);
      setStep('shipping');
    }
  }, [cart, currentUser]);

  // Load store UPI config
  useEffect(() => {
    fetch('/api/admin/qr')
      .then(res => res.json())
      .then(data => {
        if (data && data.upiId) {
          setQrConfig(data);
        }
      })
      .catch(console.error);
  }, []);

  // Phase 1: Authentication triggering OTP
  const triggerOtpSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setAuthError('Telephone contact number is required');
      return;
    }
    
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        setAuthError('Failed dispatching verification OTP string');
      }
    } catch (err) {
      setAuthError('Connection lost.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Phase 2: Verifying dynamic OTP string
  const verifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setAuthError('OTP digits are required');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: phone, otp })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.isNew) {
          // New buyer: proceed to onboarding setups post-login profile complete
          setTempUserId(data.user.id);
          setShippingPhone(phone);
          setStep('profile_setup');
        } else {
          // Existing buyer: load details
          onLoginSuccess(data.user);
          setShippingName(data.user.name);
          setShippingPhone(data.user.phoneOrEmail);
          setStep('shipping');
        }
      } else {
        setAuthError(data.error || 'Incorrect validation OTP string');
      }
    } catch (err) {
      setAuthError('Database verification error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Phase 3: Profile Setup Form submission
  const completeProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName) {
      setAuthError('Please fill your name in the block');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`/api/users/${tempUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          age: Number(profileAge),
          gender: profileGender
        })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user);
        setShippingName(data.user.name);
        setStep('shipping');
      } else {
        setAuthError(data.error || 'Failed saving onboarding setup card');
      }
    } catch (err) {
      setAuthError('Connection network loss');
    } finally {
      setAuthLoading(false);
    }
  };

  // Phase 4: Posting standard transaction Order to database
  const submitCheckoutOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress) {
      alert('Please fill your complete delivery address folder');
      return;
    }

    if (paymentMethod === 'UPI_QR' && !paymentTxId) {
      alert('Please verify transaction billing ID after scanning the UPI QR');
      return;
    }

    try {
      const buyerAge = currentUser ? currentUser.age : 25;
      const buyerGender = currentUser ? currentUser.gender : 'Male';
      const buyerId = currentUser ? currentUser.id : 'usr_guest';

      const payload = {
        buyerName: shippingName,
        buyerPhone: shippingPhone,
        buyerAddress: shippingAddress,
        buyerAge,
        buyerGender,
        buyerId,
        items: checkoutItems,
        totalAmount,
        paymentMethod,
        paymentTxId: paymentMethod === 'UPI_QR' ? paymentTxId : 'COD_VERIFIED'
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setPlacedOrderId(data.orderId);
        setStep('success');
        onOrderSuccess(data.orderId);
      } else {
        alert(data.error || 'Checkout process failure');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sizing changes helper
  const handleItemOptionChange = (idx: number, type: 'selectedSize' | 'selectedColor', val: string) => {
    const updated = [...checkoutItems];
    updated[idx][type] = val;
    setCheckoutItems(updated);
  };

  return (
    <div id="checkout_modal_container" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal element */}
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-850">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h3 className="font-heading font-semibold text-base tracking-wider">Garment Store Checkout Desk</h3>
          </div>
          <button
            onClick={onClose}
            id="btn_close_checkout"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: AUTHENTICATION FOR GUESTS */}
          {step === 'auth' && (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <h4 className="font-heading font-bold text-lg text-slate-900">Buyer Direct Authentication</h4>
                <p className="text-xs text-slate-500">Authentication is strictly triggered only on actual buy/place orders</p>
              </div>

              {authError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-2 text-xs rounded">
                  {authError}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={triggerOtpSend} className="space-y-4 max-w-sm mx-auto p-4 border rounded-xl bg-slate-50 border-slate-200">
                  <div className="flex justify-center text-orange-500 py-2">
                    <Phone className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Enter Buyer's Phone Number *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        pattern="\d{10}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="95197 64098"
                        className="w-full text-sm border border-slate-200 rounded pl-11 pr-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-semibold bg-white"
                        required
                        disabled={authLoading}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Sends a dynamic branding SMS with simulated validation OTP code instantly</p>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white text-xs font-bold py-2.5 rounded transition cursor-pointer disabled:bg-slate-400"
                  >
                    {authLoading ? 'Requesting Gateway...' : 'Initialize Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtpCode} className="space-y-4 max-w-sm mx-auto p-4 border rounded-xl bg-slate-50 border-slate-205">
                  <div className="flex justify-center text-orange-500 py-2">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div className="bg-orange-50 text-orange-850 border border-orange-200 rounded p-2.5 text-[11px] text-center">
                    💡 Real-time dynamic OTP has been logged into the <span className="font-bold underline">Dev Gateway Logs</span> (drawer at bottom-right corner of page screen).
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">Enter 6-Digit SMS OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter verification code"
                      className="w-full text-center tracking-widest text-sm font-mono font-bold border border-slate-200 rounded py-2.5 focus:outline-none focus:border-orange-500 bg-white"
                      required
                      disabled={authLoading}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 border text-slate-700 hover:bg-slate-100 text-xs py-2 rounded transition font-semibold"
                    >
                      Resend
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="flex-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-bold text-xs py-2 rounded transition shadow cursor-pointer disabled:bg-slate-300"
                    >
                      {authLoading ? 'Decrypting...' : 'Validate & Authenticate'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: FIRST TIME REGISTRATION SETUP WITH NAME, AGE, GENDER */}
          {step === 'profile_setup' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-heading font-bold text-lg text-slate-900">Setup Buyer Personal Card</h4>
                <p className="text-xs text-slate-500">First-time logins must register profile details dynamically</p>
              </div>

              {authError && (
                <div className="bg-rose-50 text-rose-700 p-2 text-xs rounded">{authError}</div>
              )}

              <form onSubmit={completeProfileSubmit} className="space-y-4 max-w-sm mx-auto p-5 border rounded-xl bg-slate-50">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Anand Mishra"
                    className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Age</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={profileAge}
                      onChange={(e) => setProfileAge(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Gender</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs py-3 rounded transition flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Save Profile & Continue
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: TRANSACTION DETAILS / UPI EXCHANGES */}
          {step === 'shipping' && (
            <form onSubmit={submitCheckoutOrder} className="space-y-5">
              
              {/* Product variants adjuster info */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configure Apparel Sizing & Colors</p>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-3 bg-slate-50">
                  {checkoutItems.map((item, idx) => {
                    const originalCartItem = cart[idx]?.product;
                    if (!originalCartItem) return null;
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2 last:border-0 last:pb-0 gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                          {item.productTitle}
                        </span>
                        
                        <div className="flex gap-2 text-[10px]">
                          {/* Sizing dropdown */}
                          <div className="flex items-center gap-1">
                            <span className="text-slate-405">Size:</span>
                            <select
                              value={item.selectedSize}
                              onChange={(e) => handleItemOptionChange(idx, 'selectedSize', e.target.value)}
                              className="border bg-white rounded p-1"
                            >
                              {originalCartItem.sizes.map((s, i) => (
                                <option key={i} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Color dropdown */}
                          <div className="flex items-center gap-1">
                            <span className="text-slate-405">Color:</span>
                            <select
                              value={item.selectedColor}
                              onChange={(e) => handleItemOptionChange(idx, 'selectedColor', e.target.value)}
                              className="border bg-white rounded p-1"
                            >
                              {originalCartItem.colors.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping information inputs */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shipping Destination Parameters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receiver's Name *</label>
                    <input
                      type="text"
                      value={shippingName}
                      onChange={(e) => setProfileName(e.target.value)} // Keep sync
                      className="w-full text-xs border border-slate-300 rounded p-2.5 bg-slate-100 font-semibold"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone Number *</label>
                    <input
                      type="tel"
                      value={shippingPhone}
                      className="w-full text-xs border border-slate-300 rounded p-2.5 bg-slate-100 font-semibold text-slate-500 font-mono"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Complete Home Delivery Address *</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2.5}
                    placeholder="Detailed House No., Ward, Landmark, Mohalla/Village, District, Pin Code, State"
                    className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Payment selector */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Checkout Payments</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI_QR')}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'UPI_QR' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold' 
                        : 'border-slate-205 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs">Dynamic UPI Scan QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'COD' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold' 
                        : 'border-slate-205 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-650" />
                    <span className="text-xs">Cash on Delivery</span>
                  </button>
                </div>

                {paymentMethod === 'UPI_QR' && (
                  <div className="border border-indigo-150 bg-indigo-50/20 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                    {/* Real QR display */}
                    <div className="bg-white p-3 border border-indigo-200 rounded-lg shadow-sm flex flex-col items-center shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${qrConfig.upiId}&pn=${encodeURIComponent(qrConfig.payeeName)}&am=${totalAmount}&tn=Order_Payment_Udikhsha&cu=INR`}
                        className="w-32 h-32 object-contain"
                        alt="Merchant Transaction QR Code"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">SCAN WITH PAYTM / PHONEPE / GPAY</span>
                    </div>

                    <div className="space-y-2 flex-1 text-xs">
                      <div>
                        <p className="font-heading font-extrabold text-indigo-900">Direct Merchant Billing QR</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                          Scan the dedicated UPI QR with any mobile scanner. The total checkout value of <span className="font-bold text-slate-900">₹{totalAmount}</span> will automatically bind to checkout parameters.
                        </p>
                      </div>

                      <div className="bg-white border rounded p-2 text-[10px]">
                        <span className="text-slate-400">Merchant UPI ID:</span>{' '}
                        <span className="font-mono font-bold text-slate-800">{qrConfig.upiId}</span>
                      </div>

                      {/* Code verification input */}
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-950 mb-0.5">Paste UPI Transaction Reference ID (UTR / Tx ID)*</label>
                        <input
                          type="text"
                          maxLength={32}
                          value={paymentTxId}
                          onChange={(e) => setPaymentTxId(e.target.value)}
                          placeholder="e.g. 308493029104"
                          className="w-full text-xs font-mono font-bold border border-slate-300 rounded p-2 bg-white text-indigo-950"
                          required={paymentMethod === 'UPI_QR'}
                        />
                        <span className="text-[9px] text-slate-400 italic block mt-0.5">Ensure precision: Admins manually verify transaction records against billing logs.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submitions */}
              <button
                type="submit"
                className={`w-full text-white font-bold py-3 rounded-xl transition shadow-lg text-sm cursor-pointer flex justify-center items-center gap-2 ${
                  paymentMethod === 'COD' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-90' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90'
                }`}
              >
                Place Final Order (Simulate WhatsApp Alert)
              </button>
            </form>
          )}

          {/* STEP 4: CHEERFUL TRANSACTION COMPLETION SCREEN */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-extrabold text-xl text-slate-900">✨ Order Submitted Successfully! ✨</h4>
                <p className="text-xs text-slate-500">Your checkout details have been written directly to persistent directories.</p>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-slate-500 font-bold">Transaction Reference ID:</span>
                  <span className="font-mono font-bold text-slate-900">{placedOrderId}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-slate-500">Shop Managing Owner:</span>
                  <span className="font-semibold">Shivendra Mishra (+91 95197 64098)</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-slate-500">Delivery Status:</span>
                  <span className="text-orange-600 font-bold font-mono">PENDING LOGISTIC APPROVAL</span>
                </div>
                <div className="bg-orange-50 text-orange-900 p-2.5 rounded border border-orange-200 mt-2 text-[11px] leading-relaxed">
                  📱 <span>An automated WhatsApp API webhook notification has been sent directly to the owner's number (<b>+91 95197 64098</b>). You can inspect the fully formed outgoing WhatsApp JSON payload inside our <b>Dev Gateway Logs</b> dashboard (bottom-right).</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition shrink-0"
              >
                Continue Browsing Fashion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
