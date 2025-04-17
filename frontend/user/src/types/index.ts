export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: Address;
  currentLocation?: Location;
  savedLocations?: SavedLocation[];
  profilePicture?: string;
  token?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Location {
  type?: string;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
}

export interface SavedLocation extends Location {
  _id?: string;
  name: string;
  type: 'home' | 'work' | 'other';
}

export interface Product {
  _id: string;
  name: string;
  images: string[];
  brand: string;
  vendor: string;
  category: string;
  description: string;
  rating: number;
  numReviews: number;
  price: number;
  countInStock: number;
  reviews?: Review[];
  location?: Location;
  deliveryRadius?: number;
}

export interface Vendor {
  _id: string;
  name: string;
  storeName: string;
  storeAddress: string;
  storeLocation?: Location;
  serviceRadius?: number;
  rating?: number;
  profilePicture?: string;
}

export interface Review {
  _id: string;
  user: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  shippingAddress: Address;
  deliveryLocation?: Location;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  distance?: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string;
  vendor: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
}

export interface GeocodeResult {
  coordinates: [number, number];
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  name?: string;
  description?: string;
} 