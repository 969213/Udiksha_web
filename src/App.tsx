import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Shield, Shirt, Users, Search, 
  MapPin, Phone, Github, Star, Sparkles, Filter, 
  ShoppingBag as CartIcon, Trash2, ArrowRight, Menu, X, 
  RefreshCw, Check, AlertCircle, Heart, HeartOff
} from 'lucide-react';
import { Product, User, TeamMember } from './types';
import AdminPanel from './components/AdminPanel';
import CheckoutModal from './components/CheckoutModal';
import DevLogsPanel from './components/DevLogsPanel';

export default function App() {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and view states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  
  // Floating Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Authentication states
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation panel controllers
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminViewOpen, setAdminViewOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  // Trigger state refreshes
  const [refreshState, setRefreshState] = useState(0);

  // Slide Promo Banners
  const banners = [
    {
      title: "👑 Royal Wedding Looms 👑",
      subtitle: "Exquisite hand-woven Saffron & Gold Silk Sarees",
      desc: "Pre-crafted wedding collection styled uniquely by master owner Shivendra Mishra",
      discount: "Flat 50% Off",
      theme: "from-orange-500 via-pink-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200"
    },
    {
      title: "🌸 Pure Lucknowi Chikankari Wear 🌸",
      subtitle: "Premium Handcrafted Floral Embroidery Georgett Wear",
      desc: "Traditional designs offering absolute comfort, lightness, and class",
      discount: "Special Festive Launch",
      theme: "from-pink-600 via-purple-600 to-orange-500",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1200"
    },
    {
      title: "✨ Elite Jodhpuri Velvet Blazers ✨",
      subtitle: "Add royal essence to premium celebrations",
      desc: "Velvet suits paired gracefully with dual-weave matching trousers",
      discount: "Heritage Weavers Selection",
      theme: "from-orange-600 via-red-500 to-pink-500",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200"
    }
  ];

  // Rotate ads every 8 seconds automatically
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(slideInterval);
  }, []);

  // Fetch shop records
  useEffect(() => {
    const loadShopData = async () => {
      try {
        setLoading(true);
        const [pRes, tRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/admin/team')
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (tRes.ok) setTeam(await tRes.json());
      } catch (err) {
        console.error('Error fetching shop resources:', err);
      } finally {
        setLoading(false);
      }
    };
    loadShopData();
  }, [refreshState, adminViewOpen]);

  // Load liked items from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('udikhsha_likes');
    if (cached) {
      try { setLikes(JSON.parse(cached)); } catch (e) {}
    }
    // Load logged in buyer details from localStorage if existed
    const cachedBuyer = localStorage.getItem('udikhsha_buyer');
    if (cachedBuyer) {
      try { setCurrentUser(JSON.parse(cachedBuyer)); } catch (e) {}
    }
    // Load logged in admin credentials
    const cachedAdmin = localStorage.getItem('udikhsha_admin');
    if (cachedAdmin) {
      try { setCurrentAdmin(JSON.parse(cachedAdmin)); } catch (e) {}
    }
  }, []);

  // Liked items coordinator
  const toggleLike = (id: string) => {
    const updated = { ...likes, [id]: !likes[id] };
    setLikes(updated);
    localStorage.setItem('udikhsha_likes', JSON.stringify(updated));
  };

  // Cart operations
  const addToCart = (product: Product, size?: string, color?: string) => {
    const itemSize = size || product.sizes[0] || 'Free Size';
    const itemColor = color || product.colors[0] || 'Multi-Color';
    
    setCart(prev => {
      // Locate if same apparel id with matching size/color already inside shopping bag
      const existsIdx = prev.findIndex(item => 
        item.product.id === product.id && 
        item.selectedSize === itemSize && 
        item.selectedColor === itemColor
      );

      if (existsIdx !== -1) {
        const copy = [...prev];
        copy[existsIdx].quantity += 1;
        return copy;
      } else {
        return [...prev, { product, quantity: 1, selectedSize: itemSize, selectedColor: itemColor }];
      }
    });

    // Provide visual response
    setCartOpen(true);
  };

  const updateCartQuantity = (idx: number, delta: number) => {
    setCart(prev => {
      const copy = [...prev];
      copy[idx].quantity += delta;
      if (copy[idx].quantity <= 0) {
        copy.splice(idx, 1);
      }
      return copy;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  // Auth coordinators
  const handleBuyerLogin = (buyerUser: User) => {
    setCurrentUser(buyerUser);
    localStorage.setItem('udikhsha_buyer', JSON.stringify(buyerUser));
  };

  const handleAdminLoginSuccess = (adminUser: User) => {
    setCurrentAdmin(adminUser);
    localStorage.setItem('udikhsha_admin', JSON.stringify(adminUser));
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('udikhsha_admin');
    setAdminViewOpen(false);
  };

  const handleBuyerLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('udikhsha_buyer');
  };

  const handleCheckoutTrigger = () => {
    if (cart.length === 0) {
      alert('Your shopping bag is completely empty!');
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleDirectBuyTrigger = (product: Product) => {
    // Empty standard cart temporarily to direct checkout single item
    setCart([{ product, quantity: 1, selectedSize: product.sizes[0], selectedColor: product.colors[0] }]);
    setCheckoutOpen(true);
  };

  // Calculations
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalAmount = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Category tags
  const categoriesList = ['All', 'Sarees', 'Kurtis & Ethnic', 'Suits & Sherwanis', 'Men\'s Casuals', 'Jeans & Trousers'];

  // Search filter matching
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="website_app_root" className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* 1. BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Saffron Styled Brand Logo font-display (Cinzel Series) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setAdminViewOpen(false); }}
              id="header_branding_trigger"
              className="flex flex-col items-start cursor-pointer group text-left"
            >
              <h1 className="font-serif font-black text-xl sm:text-2xl md:text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 select-none">
                ✨ उदीक्षा Garment Shop ✨
              </h1>
              <span className="text-[10px] font-heading font-bold tracking-[0.2em] text-slate-400 group-hover:text-orange-600 transition uppercase">
                Premium Traditional Wear Emporium
              </span>
            </button>
          </div>

          {/* Search bar helper (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md bg-slate-100 hover:bg-slate-200/50 border border-slate-200 py-2 px-4 rounded-full transition duration-300">
            <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search for ethnic wear, sarees, kurtas, silk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-705 bg-transparent border-none focus:outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-900 p-0.5 font-bold">X</button>
            )}
          </div>

          {/* Actions panel */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* View Admin Panel Portal toggle */}
            <button
              onClick={() => setAdminViewOpen(!adminViewOpen)}
              id="btn_admin_portal"
              title="Admin Dashboard Portal"
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer border ${
                adminViewOpen 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-none shadow-md shadow-orange-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ADMIN DESK</span>
            </button>

            {/* Shopping cart trigger */}
            {!adminViewOpen && (
              <button
                onClick={() => setCartOpen(true)}
                id="btn_shopping_bag_trigger"
                className="relative bg-orange-500 hover:bg-orange-650 text-white rounded-full p-2.5 shadow-lg shadow-orange-200 transition cursor-pointer flex items-center justify-center border border-orange-400"
              >
                <CartIcon className="w-4.5 h-4.5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-pink-500 text-white rounded-full font-bold text-[9px] h-4.5 w-4.5 flex items-center justify-center border-2 border-white animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile query triggers */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-lg">
            {/* Search */}
            <div className="flex items-center bg-slate-100 border py-1.5 px-3 rounded-lg text-slate-800">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search premium apparel styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none"
              />
            </div>

            {/* Buyer session card */}
            {currentUser ? (
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between items-center text-xs text-slate-700">
                <span>👤 <b>{currentUser.name}</b> ({currentUser.gender})</span>
                <button onClick={handleBuyerLogout} className="text-rose-600 font-bold hover:underline">Log out</button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic text-center">
                Guest Mode: Free Browsing (Login triggered strictly during checkout)
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. DYNAMIC WORKSPACE BODY CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW TYPE A: SUPER-ADMIN PORTAL INTERFACE */}
        {adminViewOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel 
              currentAdmin={currentAdmin}
              onAdminLogin={handleAdminLoginSuccess}
              onAdminLogout={handleAdminLogout}
            />
          </motion.div>
        ) : (
          
          /* VIEW TYPE B: E-COMMERCE CONSUMER RETAIL DESIGN */
          <div className="space-y-8">
            
            {/* 2.1 AMAZON/FLIPKART HIGHLIGHT DISCOVERY PROMO BANNER */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[21/9] sm:aspect-[24/8] min-h-[160px] flex items-center bg-slate-900 border border-slate-850">
              {/* Slides background transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeBanner}
                  initial={{ opacity: 0.1 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0.1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-cover bg-center select-none cursor-default"
                  style={{ backgroundImage: `url(${banners[activeBanner].image})` }}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Theme gradient mask */}
              <div className={`absolute inset-0 bg-gradient-to-r ${banners[activeBanner].theme} mix-blend-multiply opacity-85`} />

              {/* Actual banner typography text content */}
              <div className="relative z-10 px-6 sm:px-12 py-5 text-white max-w-lg space-y-2 sm:space-y-4">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm inline-block">
                  {banners[activeBanner].discount}
                </span>
                
                <h2 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-white">
                  {banners[activeBanner].title}
                </h2>
                
                <h3 className="font-sans font-medium text-xs sm:text-lg text-orange-200">
                  {banners[activeBanner].subtitle}
                </h3>
                
                <p className="hidden md:block text-xs text-slate-200 leading-relaxed max-w-sm">
                  {banners[activeBanner].desc}
                </p>

                {/* Micro slider indicator pills */}
                <div className="flex gap-1.5 pt-1 select-none">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full cursor-pointer transition-all duration-300 ${
                        activeBanner === i ? 'bg-orange-400 w-4 sm:w-6' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 2.2 SYSTEM GENERAL CATEGORIES & SEARCH CONTROLLER */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3 border-slate-205">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">
                    Trending Now <span className="text-pink-500">🔥</span>
                  </h4>
                </div>
                {currentUser && (
                  <span className="text-xs text-orange-600 font-bold bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
                    Welcome back, <b className="text-slate-800">{currentUser.name}</b>
                  </span>
                )}
              </div>

              {/* Interactive Category tags rail list with Vibrant Palette */}
              <div className="flex overflow-x-auto whitespace-nowrap gap-2.5 pb-1 scrollbar-none select-none">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-none shadow-md shadow-orange-100'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2.3 GARMENT CATALOG CARDS GRID LAYOUT */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-xs font-mono">Catalog databases loading, please wait...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-6 text-slate-400 italic">
                No matching clothes found. Try expanding search or category settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((p) => {
                  const liked = likes[p.id] || false;
                  const originalPercent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

                  return (
                    <div 
                      key={p.id} 
                      className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Image container banner */}
                      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                        <img 
                          src={p.image} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none" 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Discount bubble tag */}
                        {originalPercent > 0 && (
                          <span className="absolute top-3 left-3 bg-pink-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded shadow-sm">
                            SAVE {originalPercent}%
                          </span>
                        )}

                        {/* Fast interact Like heart */}
                        <button
                          onClick={() => toggleLike(p.id)}
                          className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-full text-rose-500 transition shadow cursor-pointer shadow-black/10"
                        >
                          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                        </button>

                        {/* Stock alerts marker */}
                        {p.stockCount <= 5 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-550/95 text-white text-[9px] font-bold py-1.5 px-3 text-center tracking-wider font-mono">
                            🚨 HURRY, ONLY {p.stockCount} LEFT!
                          </div>
                        )}
                      </div>

                      {/* Info catalog */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">{p.category}</p>
                          <h5 className="font-bold text-slate-800 line-clamp-1 text-sm sm:text-base group-hover:text-orange-600 transition" title={p.title}>
                            {p.title}
                          </h5>
                          <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-snug">
                            {p.description}
                          </p>
                        </div>

                        {/* Sizing tags shown */}
                        <div className="flex gap-1 overflow-x-auto whitespace-nowrap pb-1">
                          {p.sizes.map((s, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Billing and action triggers */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-lg font-black text-orange-600">₹{p.price}</span>
                            {p.originalPrice > p.price && (
                              <span className="text-xs text-slate-400 line-through ml-1.5">₹{p.originalPrice}</span>
                            )}
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => addToCart(p)}
                              className="border border-slate-205 text-slate-705 hover:bg-orange-50 hover:text-orange-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Add Bags
                            </button>
                            <button
                              onClick={() => handleDirectBuyTrigger(p)}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-md shadow-orange-100 cursor-pointer"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* 2.4 "OUR TEAM" HERITAGE PROFILES GALLERIES */}
            {team.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="text-center space-y-1.5 max-w-md mx-auto">
                  <span className="text-[10px] text-pink-600 font-extrabold uppercase tracking-[0.2em] block">Heritage Designers</span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-slate-800">Meet Our Team & Designers</h3>
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
                  {team.map((member) => (
                    <div key={member.id} className="flex flex-col items-center text-center p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 transition-colors hover:bg-orange-50/10">
                      <img 
                        src={member.photoUrl} 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-orange-500 shadow-md shadow-orange-100"
                        alt={member.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <h4 className="font-heading font-bold text-slate-800 text-sm">{member.name}</h4>
                        <p className="text-xs text-orange-600 font-semibold">{member.designation}</p>
                        {member.contactNumber && (
                          <p className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                            <Phone className="w-3 h-3 text-slate-300" />
                            {member.contactNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2.5 STORE INFO CARD BANNER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800">
              <div className="space-y-3.5">
                <h4 className="font-display font-extrabold text-xl tracking-wider text-amber-400">✨ उदीक्षा Garment Emporium ✨</h4>
                <p className="text-slate-350 text-xs leading-relaxed">
                  Established with absolute elite focus on preserving standard Indian loom designs. We craft fine wedding sarees, Lucknawi Chikankari kurtis, block print shirts, festive sherwanis, and modern denim fittings. Discover premium fabrics curated with absolute customer hospitality.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-505" /> Hardoi Road, Gosainganj, Lucknow, UP, India</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-505" /> Customer queries: +91 95197 64098</p>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center p-6 border border-dashed border-slate-800 rounded-xl text-center space-y-2.5">
                <Sparkles className="w-8 h-8 text-amber-500 animate-spin-slow" />
                <h5 className="font-heading font-extrabold text-sm text-slate-100">Dynamic Bilateral UPI QR Terminal Enabled</h5>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Select "Buy Now" on any style apparel listing to test our dynamic real-time checkout routing system! SMS verification notifications are generated instantaneously.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 3. VERIFIED DEVELOPER CREDITS FOOTER SECTION */}
      <footer className="bg-slate-905 bg-slate-900 text-white border-t border-slate-800 py-6 mt-12 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
        <div className="flex items-center gap-4 text-[11px] font-medium text-center sm:text-left">
          <span className="opacity-60 text-slate-400">Shop Owner:</span>
          <span className="font-bold text-orange-400 select-all">Shivendra Mishra (+91 95197 64098)</span>
        </div>
        <div className="text-sm italic font-serif flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
          <span className="text-slate-300">Developed by</span>
          <span className="text-pink-400 font-bold not-italic">👑 Harsh Mishra 👑</span>
          <span className="text-[10px] opacity-50 font-mono ml-0 sm:ml-2">Contact: +91 81142 47911 (harsh@mishra.site)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 cursor-pointer" title="UPI Payment Enabled">
            <span className="text-[10px] uppercase font-black text-orange-400">UPI</span>
          </div>
          <a
            href="https://wa.me/919519764098"
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition"
          >
            WhatsApp Help
          </a>
        </div>
      </footer>

      {/* 4. ANIMATED CLIENT SLIDE-OUT CART PANEL */}
      <AnimatePresence>
        {cartOpen && (
          <div id="shopping_bag_backdrop" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
            {/* Click backdrop to discard */}
            <div className="absolute inset-0" onClick={() => setCartOpen(false)} />
            
            {/* Actual panel container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              id="shopping_bag_sheet"
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <CartIcon className="w-4.5 h-4.5 text-amber-500" />
                    <span className="font-heading font-extrabold text-sm tracking-wider uppercase">Your Shopping Bags</span>
                  </div>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-350 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Items feed list */}
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 italic space-y-2">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                      <p className="text-xs">Your shopping bag is currently empty.</p>
                      <button 
                        onClick={() => setCartOpen(false)}
                        className="text-xs bg-slate-100 px-3 py-1.5 border hover:bg-slate-200 text-slate-700 font-semibold rounded-full mt-2"
                      >
                        Explore Sarees & Garments
                      </button>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex gap-3 border-b pb-3 last:border-b-0 last:pb-0 items-center justify-between">
                        <img src={item.product.image} className="w-12 h-16 object-cover rounded border" alt="" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-heading font-bold text-xs text-slate-900 truncate">{item.product.title}</p>
                          <p className="text-[10px] text-slate-400">{item.product.category}</p>
                          <p className="text-xs text-slate-900 font-bold">₹{item.product.price}</p>
                        </div>

                        {/* quantity and actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQuantity(idx, -1)}
                            className="bg-slate-105 hover:bg-slate-200 p-1 rounded font-bold text-slate-700 text-xs h-6 w-6 flex items-center justify-center border"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold text-slate-800 min-w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(idx, 1)}
                            className="bg-slate-105 hover:bg-slate-200 p-1 rounded font-bold text-slate-700 text-xs h-6 w-6 flex items-center justify-center border"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Running total and checkout catalyst */}
              {cart.length > 0 && (
                <div className="bg-slate-50 border-t p-4 space-y-3 shadow-inner">
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>Grand Total:</span>
                    <span className="text-lg">₹{cartTotalAmount}</span>
                  </div>
                  <button
                    onClick={handleCheckoutTrigger}
                    id="btn_checkout_catalyst"
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-rose-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shrink-0 cursor-pointer text-center tracking-wider flex justify-center items-center gap-2"
                  >
                    Proceed to checkout <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CHECKOUT DIALOG MODAL LAYOUT */}
      {checkoutOpen && (
        <CheckoutModal 
          cart={cart}
          totalAmount={cartTotalAmount}
          currentUser={currentUser}
          onLoginSuccess={handleBuyerLogin}
          onClose={() => setCheckoutOpen(false)}
          onOrderSuccess={(orderId) => {
            // Success Callback: flush main shopping bag
            setCart([]);
            setRefreshState(prev => prev + 1);
          }}
        />
      )}

      {/* 6. SYSTEM LIVE LOGS CONSOLE (DEV PREVIEW TOOL AT CORNER IN SINGLE-VIEW ENVIRONMENT) */}
      <DevLogsPanel />

    </div>
  );
}
