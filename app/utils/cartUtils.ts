// utils/cartUtils.ts
import { CartItem, Service } from '../types';

export const cartUtils = {
  calculateTotalPrice: (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  },

  calculateTotalTime: (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.service.timeMin * item.quantity), 0);
  },

  findItemQuantity: (items: CartItem[], serviceId: string): number => {
    const item = items.find(item => item.service.id === serviceId);
    return item ? item.quantity : 0;
  },

  addServiceToCart: (items: CartItem[], service: Service): CartItem[] => {
    const existingItem = items.find(item => item.service.id === service.id);
    
    if (existingItem) {
      return items.map(item =>
        item.service.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      return [...items, { service, quantity: 1 }];
    }
  },

  updateItemQuantity: (items: CartItem[], serviceId: string, change: number): CartItem[] => {
    return items.reduce((acc, item) => {
      if (item.service.id === serviceId) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
          acc.push({ ...item, quantity: newQuantity });
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as CartItem[]);
  }
};