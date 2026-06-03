export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  image: string;
  sizes: string[];
  colors: string[];
  stockCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  phoneOrEmail: string;
  name: string;
  age: number;
  gender: string;
  role: 'buyer' | 'admin' | 'worker';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerGender?: string;
  buyerAge?: number;
  buyerId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'UPI_QR' | 'COD';
  paymentTxId?: string;
  paymentStatus: 'pending' | 'approved' | 'declined';
  orderStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  photoUrl: string;
  contactNumber?: string;
}

export interface QrConfig {
  upiId: string;
  payeeName: string;
  qrImageUrl?: string;
}

export interface DevLog {
  id: string;
  timestamp: string;
  type: 'SMS_OTP' | 'EMAIL_PASSWORD' | 'WHATSAPP_ALERT';
  recipient: string;
  message: string;
  payload: Record<string, any>;
  status: 'sent' | 'failed';
}

export interface DBState {
  users: User[];
  products: Product[];
  orders: Order[];
  team: TeamMember[];
  qrConfig: QrConfig;
  devLogs: DevLog[];
  adminPasswordHash: string; // Storing password for the primary admin mbola099@gmail.com
}
