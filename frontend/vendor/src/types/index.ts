export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  profilePicture?: string;
  storeName?: string;
  storeAddress?: string;
  description?: string;
  storeLocation?: Location;
  serviceRadius?: number;
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

export interface GeocodeResult {
  coordinates: [number, number];
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  name?: string;
  description?: string;
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
  isActive: boolean;
  location?: Location;
  deliveryRadius?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  orderItems: OrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  price: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 