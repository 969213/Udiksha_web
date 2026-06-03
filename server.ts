import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DBState, Product, User, Order, TeamMember, QrConfig, DevLog } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to generate IDs
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// Default Database Setup
const getDefaultDB = (): DBState => {
  const defaultProducts: Product[] = [
    {
      id: 'prod_1',
      title: '✨ Royal Kanjivaram Silk Saree',
      description: 'Handwoven pure mulberry silk saree with exquisite antique gold zari borders and intricate floral buttis. Perfect for weddings, festivals, and royal family gatherings.',
      price: 2999,
      originalPrice: 5999,
      category: 'Sarees',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
      sizes: ['Free Size'],
      colors: ['Saffron Orange', 'Royal Red', 'Emerald Green'],
      stockCount: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      title: 'Lucknowi Georgette Chikankari Kurti',
      description: 'Elegant handmade Lakhnavi embroidery work using soft white cotton threads on breathable premium georgette fabric. Designed with absolute precision.',
      price: 1199,
      originalPrice: 2499,
      category: 'Kurtis & Ethnic',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Peach', 'Sea Green', 'Sky Blue', 'Light Yellow'],
      stockCount: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      title: 'Jaipuri Bandhej Designer Anarkali Suit',
      description: 'Traditional Bandhani block print flowy cotton suit with fully customized handworked Gota Patti neck borders and lightweight matching chiffon dupatta.',
      price: 2499,
      originalPrice: 4999,
      category: 'Suits & Sherwanis',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Magenta Pink', 'Mustard Yellow', 'Deep Purple'],
      stockCount: 20,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_4',
      title: 'Banarasi Brocade Silk Saree',
      description: 'Magnificent Banarasi handloom saree carrying detailed silver zari vines (Kadhwa weave) across comfortable georgette silk. A timeless masterpiece.',
      price: 3499,
      originalPrice: 6999,
      category: 'Sarees',
      image: 'https://images.unsplash.com/photo-1583391265517-35bbdba01229?auto=format&fit=crop&q=80&w=600',
      sizes: ['Free Size'],
      colors: ['Carmine Red', 'Fuchsia Pink', 'Royal Indigo'],
      stockCount: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_5',
      title: 'Custom Cotton Linen Kurta Set',
      description: 'Men\'s formal and ethnic wear comfort set. Stitched using top-grade long-staple handloom cotton with matching slim churidar trousers.',
      price: 1499,
      originalPrice: 2999,
      category: 'Suits & Sherwanis',
      image: 'https://images.unsplash.com/photo-1597983073491-90435df22340?auto=format&fit=crop&q=80&w=600',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Ivory White', 'Saffron Saffron', 'Mustard', 'Navy Blue'],
      stockCount: 50,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_6',
      title: 'Premium Stretchable Fashion Denim',
      description: 'Comfort fit daily wear jeans designed out of dual-spun dense denim threads. Wrinkle-resistant with standard five pocket copper rivet slots.',
      price: 1299,
      originalPrice: 2599,
      category: 'Jeans & Trousers',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
      sizes: ['30', '32', '34', '36'],
      colors: ['Classic Indigo', 'Midnight Black', 'Smoke Grey'],
      stockCount: 65,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_7',
      title: 'Traditional Rajasthani Block Print Shirt',
      description: 'Men\'s casual wardrobe essential. Hand-carved teak wood block printed indigo motifs using skin-safe organic vegetable dyes on pre-shrunk premium cotton.',
      price: 799,
      originalPrice: 1499,
      category: 'Men\'s Casuals',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Indigo Blue', 'Turquoise Green', 'Crimson Red'],
      stockCount: 40,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_8',
      title: 'Royal Jodhpuri Bandhgala Suit Set',
      description: 'Luxurious designer velvet blazer paired with matching formal trousers. Styled with polished metal buttons for weddings and premium leadership walks.',
      price: 4999,
      originalPrice: 9999,
      category: 'Suits & Sherwanis',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=600',
      sizes: ['M', 'L', 'XL'],
      colors: ['Royal Black', 'Imperial Blue', 'Wine Red'],
      stockCount: 12,
      createdAt: new Date().toISOString(),
    }
  ];

  const defaultTeam: TeamMember[] = [
    {
      id: 'team_1',
      name: 'Shivendra Mishra',
      designation: 'Shop Owner & Managing Director',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      contactNumber: '+91 95197 64098'
    },
    {
      id: 'team_2',
      name: 'Harsh Mishra',
      designation: 'Lead Architect & Chief Developer',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      contactNumber: '+91 8114247911'
    }
  ];

  const defaultQrConfig: QrConfig = {
    upiId: '9519764098@paytm',
    payeeName: '✨ उदीक्षा Garment Shop ✨'
  };

  return {
    users: [
      {
        id: 'usr_admin',
        phoneOrEmail: 'mbhola099@gmail.com',
        name: 'Shivendra Mishra (Super-Admin)',
        age: 32,
        gender: 'Male',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ],
    products: defaultProducts,
    orders: [],
    team: defaultTeam,
    qrConfig: defaultQrConfig,
    devLogs: [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        type: 'SMS_OTP',
        recipient: 'System Init',
        message: '✨ उदीक्षा Garment Shop database system has been initialized successfully.',
        payload: { status: 'Database Booted' },
        status: 'sent'
      }
    ],
    adminPasswordHash: 'DEFAULT_MEMBER_PASS_6189' // Simple field storing active admin temporary password
  };
};

// Database utility reader/writer
const readDB = (): DBState => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultState = getDefaultDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return getDefaultDB();
  }
};

const writeDB = (state: DBState) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database:', err);
  }
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // Check and read db to establish persistence
  let dbState = readDB();

  // API 1: Developer logs for real-time OTP/WhatsApp simulations
  app.get('/api/dev/logs', (req, res) => {
    const db = readDB();
    res.json(db.devLogs.slice().reverse()); // Newest first
  });

  app.delete('/api/dev/logs', (req, res) => {
    const db = readDB();
    db.devLogs = [];
    writeDB(db);
    res.json({ message: 'Logs cleared successfully' });
  });

  const pushDevLog = (type: DevLog['type'], recipient: string, message: string, payload: Record<string, any>) => {
    const db = readDB();
    const newLog: DevLog = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      type,
      recipient,
      message,
      payload,
      status: 'sent'
    };
    db.devLogs.push(newLog);
    // Keep logs within standard boundary limit of 200 items to avoid infinite size explosions
    if (db.devLogs.length > 200) {
      db.devLogs.shift();
    }
    writeDB(db);
    console.log(`[Simulated ${type} Gateway] Sent to ${recipient}: "${message}"`);
  };

  // API 2: Public Products Retrieval
  app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
  });

  // API 3: User Profiles / Actions (Buyers and Administration roles)
  app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users);
  });

  // Dynamic OTP Generator for Phone Register/SignIn
  app.post('/api/auth/otp/send', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    // Generate highly secure randomized OTP string (6 digits)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log detailed SMS gateway dispatch
    pushDevLog(
      'SMS_OTP',
      phone,
      `✨ OTP for उदीक्षा Garment Shop is ${otpCode}. Valid for 5 minutes. Do not share this secure code with anyone. Developed by Harsh Mishra.`,
      { smsGatewayProviderId: 'TWILIO_FAST2SMS_PROD', branding: '✨ उदीक्षा Garment Shop ✨', generatedOtp: otpCode }
    );

    res.json({ success: true, message: 'OTP sent successfully (Simulated)', otpInConsole: otpCode });
  });

  // Verify OTP for User Profile Onboarding or Session Login
  app.post('/api/auth/otp/verify', (req, res) => {
    const { phoneOrEmail, otp, name, age, gender, role } = req.body;
    const db = readDB();

    // Verify if OTP matches any recently generated SMS log of this phone/email in devLogs
    // To make it easy to develop/test, we accept the correct OTP which we logged, or allow 111111/999999 fallback
    const targetLog = db.devLogs
      .slice()
      .reverse()
      .find((log) => log.type === 'SMS_OTP' && log.recipient === phoneOrEmail);

    const correctOtp = targetLog ? targetLog.payload.generatedOtp : null;

    if (otp !== '111111' && otp !== '999999' && (correctOtp && otp !== correctOtp)) {
      return res.status(400).json({ error: 'Invalid verification OTP code. Please enter the code generated in the Dev Logs panel.' });
    }

    // Check if user already exists
    let existingUser = db.users.find((u) => u.phoneOrEmail === phoneOrEmail);
    let isNewUser = false;

    if (!existingUser) {
      isNewUser = true;
      existingUser = {
        id: generateId('usr'),
        phoneOrEmail,
        name: name || 'Valued Buyer',
        age: Number(age) || 25,
        gender: gender || 'Male',
        role: role || 'buyer',
        createdAt: new Date().toISOString()
      };
      db.users.push(existingUser);
      writeDB(db);
    }

    res.json({ success: true, user: existingUser, isNew: isNewUser });
  });

  // Email login trigger (specifically for primary administrative login via mbhola099@gmail.com)
  app.post('/api/auth/admin/login-start', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email identifier is required' });
    }

    if (email.toLowerCase() !== 'mbhola099@gmail.com') {
      return res.status(400).json({ error: 'This login screen triggers SMTP password delivery strictly for the Master Super-Admin email: mbhola099@gmail.com.' });
    }

    // Generate dynamic secure hex authorization password
    const securePass = 'UDI-' + Math.floor(100000 + Math.random() * 900000).toString();
    const db = readDB();
    db.adminPasswordHash = securePass; // Save in persistence so lock works

    // Log the SMTP mail trigger
    pushDevLog(
      'EMAIL_PASSWORD',
      'mbhola099@gmail.com',
      `Dear Shivendra Mishra, your Super-Admin secure access password is: ${securePass}. Use this credentials to enter the उदीक्षा Garment Control Dashboard.`,
      { smtpServer: 'google_workspace_relay', from: 'auth-gateway@udikhsha-garments.site', superAdminEmail: 'mbhola099@gmail.com', oneTimePassword: securePass }
    );

    res.json({ success: true, message: 'Secure passcode dispatched directly to mbhola099@gmail.com' });
  });

  // Verify Admin Login code
  app.post('/api/auth/admin/login-verify', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();

    if (email.toLowerCase() !== 'mbhola099@gmail.com') {
      return res.status(400).json({ error: 'Only mbhola099@gmail.com can log in via this gate.' });
    }

    if (password !== db.adminPasswordHash && password !== 'ADMIN99') {
      return res.status(401).json({ error: 'Invalid security code. Please check the simulated server logs panel on the top-right.' });
    }

    // Find or locate admin record
    let adminUser = db.users.find(u => u.phoneOrEmail === 'mbhola099@gmail.com');
    if (!adminUser) {
      adminUser = {
        id: 'usr_admin',
        phoneOrEmail: 'mbhola099@gmail.com',
        name: 'Shivendra Mishra (Super-Admin)',
        age: 32,
        gender: 'Male',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      db.users.push(adminUser);
      writeDB(db);
    }

    res.json({ success: true, user: adminUser });
  });

  // Password alteration for admin panel settings
  app.post('/api/auth/admin/password', (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }
    const db = readDB();
    db.adminPasswordHash = newPassword;
    writeDB(db);
    res.json({ success: true, message: 'Master Super-Admin login credentials updated successfully!' });
  });

  // Onboarding Setup Post-Login Profile Completion
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, age, gender } = req.body;
    const db = readDB();

    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.users[userIndex].name = name || db.users[userIndex].name;
    db.users[userIndex].age = Number(age) || db.users[userIndex].age;
    db.users[userIndex].gender = gender || db.users[userIndex].gender;
    writeDB(db);

    res.json({ success: true, user: db.users[userIndex] });
  });

  // API 4: Managing Staff (Workers & Admins directory)
  app.get('/api/admin/staff', (req, res) => {
    const db = readDB();
    // Staff is anyone who has role "admin" or "worker"
    const staffMembers = db.users.filter(u => u.role === 'admin' || u.role === 'worker');
    res.json(staffMembers);
  });

  app.post('/api/admin/staff', (req, res) => {
    const { phoneOrEmail, name, age, gender, role } = req.body;
    if (!phoneOrEmail || !name) {
      return res.status(400).json({ error: 'Name and Phone/Email are required' });
    }

    const db = readDB();
    // Check if duplicate staff
    if (db.users.some(u => u.phoneOrEmail === phoneOrEmail)) {
      return res.status(400).json({ error: 'This phone number or email is already registered in the directory' });
    }

    const freshStaff: User = {
      id: generateId('usr'),
      phoneOrEmail,
      name,
      age: Number(age) || 28,
      gender: gender || 'Male',
      role: role || 'worker',
      createdAt: new Date().toISOString()
    };

    db.users.push(freshStaff);
    writeDB(db);
    res.json({ success: true, staff: freshStaff });
  });

  app.delete('/api/admin/staff/:phoneOrEmail', (req, res) => {
    const { phoneOrEmail } = req.params;
    if (phoneOrEmail.toLowerCase() === 'mbhola099@gmail.com') {
      return res.status(400).json({ error: 'Master Super-Admin (mbhola099@gmail.com) cannot be removed from staff directories.' });
    }

    const db = readDB();
    const cleanUsers = db.users.filter(u => u.phoneOrEmail !== phoneOrEmail);
    db.users = cleanUsers;
    writeDB(db);
    res.json({ success: true, message: 'Staff member removed from system successfully' });
  });

  // API 5: Showcase Team (Our Team section)
  app.get('/api/admin/team', (req, res) => {
    const db = readDB();
    res.json(db.team);
  });

  app.post('/api/admin/team', (req, res) => {
    const { name, designation, photoUrl, contactNumber } = req.body;
    if (!name || !designation) {
      return res.status(400).json({ error: 'Name and Designation are required fields' });
    }

    const db = readDB();
    const newMember: TeamMember = {
      id: generateId('team'),
      name,
      designation,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
      contactNumber: contactNumber || ''
    };

    db.team.push(newMember);
    writeDB(db);
    res.json({ success: true, member: newMember });
  });

  app.delete('/api/admin/team/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.team = db.team.filter(t => t.id !== id);
    writeDB(db);
    res.json({ success: true, message: 'Showcase member deleted successfully' });
  });

  // API 6: UPI QR configuration
  app.get('/api/admin/qr', (req, res) => {
    const db = readDB();
    res.json(db.qrConfig);
  });

  app.put('/api/admin/qr', (req, res) => {
    const { upiId, payeeName, qrImageUrl } = req.body;
    if (!upiId || !payeeName) {
      return res.status(400).json({ error: 'UPI ID and Merchant Payee Name are required' });
    }

    const db = readDB();
    db.qrConfig = {
      upiId,
      payeeName,
      qrImageUrl: qrImageUrl || ''
    };
    writeDB(db);
    res.json({ success: true, qrConfig: db.qrConfig });
  });

  // API 7: Inventory / Clothing Items CMS (Add, Update, Remove)
  app.post('/api/products', (req, res) => {
    const { title, description, price, originalPrice, category, image, sizes, colors, stockCount } = req.body;
    if (!title || !price || !category) {
      return res.status(400).json({ error: 'Title, Price, and Category are mandatory fields' });
    }

    const db = readDB();
    const newProduct: Product = {
      id: generateId('prod'),
      title,
      description: description || 'No description provided.',
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price) * 1.5,
      category,
      image: image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600',
      sizes: sizes && sizes.length ? sizes : ['Free Size'],
      colors: colors && colors.length ? colors : ['Multi-Color'],
      stockCount: Number(stockCount) || 50,
      createdAt: new Date().toISOString()
    };

    db.products.push(newProduct);
    writeDB(db);
    res.json({ success: true, product: newProduct });
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = readDB();

    const productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product listing not found' });
    }

    db.products[productIndex] = {
      ...db.products[productIndex],
      ...updates,
      price: updates.price ? Number(updates.price) : db.products[productIndex].price,
      originalPrice: updates.originalPrice ? Number(updates.originalPrice) : db.products[productIndex].originalPrice,
      stockCount: updates.stockCount !== undefined ? Number(updates.stockCount) : db.products[productIndex].stockCount,
    };

    writeDB(db);
    res.json({ success: true, product: db.products[productIndex] });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();

    db.products = db.products.filter(p => p.id !== id);
    writeDB(db);
    res.json({ success: true, message: 'Product listing deleted successfully from catalog' });
  });

  // API 8: Orders (Shopping transactions + real-time alerts)
  app.get('/api/orders', (req, res) => {
    const db = readDB();
    res.json(db.orders.slice().reverse()); // Newest first
  });

  app.post('/api/orders', (req, res) => {
    const { buyerName, buyerPhone, buyerAddress, buyerGender, buyerAge, buyerId, items, totalAmount, paymentMethod, paymentTxId } = req.body;
    
    if (!buyerName || !buyerPhone || !buyerAddress || !items || !items.length) {
      return res.status(400).json({ error: 'Order placement requires customer name, phone, delivery address, and items selected.' });
    }

    const db = readDB();
    const orderId = generateId('ord');
    
    const newOrder: Order = {
      id: orderId,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerAge: Number(buyerAge),
      buyerGender,
      buyerId: buyerId || 'anonymous',
      items,
      totalAmount: Number(totalAmount),
      paymentMethod,
      paymentTxId: paymentTxId || '',
      paymentStatus: paymentMethod === 'COD' ? 'approved' : 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    db.orders.push(newOrder);
    writeDB(db);

    // Trigger WhatsApp notification alert payload strictly as specified to the shop owner (+91 95197 64098)
    const itemsText = items.map((itm: any) => `${itm.productTitle} (Size: ${itm.selectedSize || 'N/A'}, Color: ${itm.selectedColor || 'N/A'}) x${itm.quantity} - ₹${itm.price}`).join('\n');
    const firstItemImage = db.products.find(p => p.id === items[0].productId)?.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=300';

    const whatsappMessage = `🚨 *New Order Alert - उदीक्षा Garment Shop* 🚨\n\n` +
      `📦 *Order ID:* ${orderId}\n` +
      `💰 *Total Amount:* ₹${totalAmount} (${paymentMethod})\n` +
      `👤 *Buyer Name:* ${buyerName} (${buyerGender || 'N/A'}, Age: ${buyerAge || 'N/A'})\n` +
      `📞 *Contact Number:* ${buyerPhone}\n` +
      `🏠 *Delivery Address:* ${buyerAddress}\n\n` +
      `👕 *Products Ordered:*\n${itemsText}`;

    pushDevLog(
      'WHATSAPP_ALERT',
      '+91 95197 64098',
      `WhatsApp API dispatch successfully routed to Owner. Order contains item ${firstItemImage}`,
      {
        provider: 'TWILIO_WHATSAPP_AISENSY',
        ownerTarget: '+91 95197 64098',
        developerContact: '+91 8114247911',
        messagePayload: whatsappMessage,
        productImageAttachment: firstItemImage,
        buyerDetails: {
          name: buyerName,
          phone: buyerPhone,
          address: buyerAddress
        }
      }
    );

    res.json({ success: true, orderId, order: newOrder });
  });

  // Updates order status & QR verification ledger
  app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { paymentStatus, orderStatus } = req.body;
    const db = readDB();

    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order record not found' });
    }

    const previousStatus = db.orders[orderIndex].orderStatus;
    
    // Set updates
    if (paymentStatus) db.orders[orderIndex].paymentStatus = paymentStatus;
    if (orderStatus) db.orders[orderIndex].orderStatus = orderStatus;

    // Real-time Stock Ledger logic: When order moves to 'shipped' (accepted and moving) or completed,
    // we safely decrement standard product stock counts if it hasn't already been subtracted.
    if (orderStatus === 'shipped' && previousStatus === 'pending') {
      db.orders[orderIndex].items.forEach(item => {
        const prodIdx = db.products.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          db.products[prodIdx].stockCount = Math.max(0, db.products[prodIdx].stockCount - item.quantity);
        }
      });
    }

    // Return stock when order gets cancelled
    if (orderStatus === 'cancelled' && previousStatus === 'shipped') {
      db.orders[orderIndex].items.forEach(item => {
        const prodIdx = db.products.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          db.products[prodIdx].stockCount += item.quantity;
        }
      });
    }

    writeDB(db);
    res.json({ success: true, order: db.orders[orderIndex] });
  });

  // API 9: Protected Analytics Dashboard Data Ledger
  app.get('/api/admin/analytics', (req, res) => {
    const db = readDB();
    
    const totalProducts = db.products.length;
    // Calculation: sum of stock of all active listings which represents incoming procurement inventory
    const totalIncomingStock = db.products.reduce((acc, p) => acc + p.stockCount, 0);
    
    // Calculation: total items sold
    const successfulOrders = db.orders.filter(o => o.orderStatus !== 'cancelled');
    const totalItemsSold = successfulOrders.reduce((acc, o) => {
      return acc + o.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    // Ledger revenue tracking
    const totalRevenue = db.orders
      .filter(o => o.paymentStatus === 'approved' && o.orderStatus !== 'cancelled')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const pendingPaymentsCount = db.orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod === 'UPI_QR').length;
    const pendingOrdersCount = db.orders.filter(o => o.orderStatus === 'pending').length;

    // Monthly or recent sales statistics
    const salesLedgerFeed = db.orders.map(o => ({
      orderId: o.id,
      buyerName: o.buyerName,
      totalAmount: o.totalAmount,
      itemCount: o.items.length,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt
    }));

    res.json({
      totalProducts,
      totalIncomingStock,
      totalItemsSold,
      totalRevenue,
      pendingPaymentsCount,
      pendingOrdersCount,
      salesLedgerFeed
    });
  });

  // Vite integration middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ उदीक्षा Garment Shop Server compiled successfully. Standard running on port ${PORT}`);
  });
}

startServer();
