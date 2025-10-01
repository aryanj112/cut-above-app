import { CartItem } from './CartItem';

export interface Appointment {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time string (e.g., "2:30 PM")
  services: CartItem[];
  totalPrice: number;
  totalTime: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface BookingFormData {
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
}
