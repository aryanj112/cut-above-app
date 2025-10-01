// hooks/useCart.ts
import { useState } from 'react';
import { CartItem, Service } from '../types';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (service: Service) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.service.id === service.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { service, quantity: 1 }];
      }
    });
  };

  const increaseQuantity = (serviceId: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.service.id === serviceId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (serviceId: string) => {
    setCartItems(prevItems =>
      prevItems.reduce((acc, item) => {
        if (item.service.id === serviceId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[])
    );
  };

  const getItemQuantity = (serviceId: string): number => {
    const item = cartItems.find(item => item.service.id === serviceId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  };

  const getTotalTime = (): number => {
    return cartItems.reduce((total, item) => total + (item.service.timeMin * item.quantity), 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    getItemQuantity,
    getTotalPrice,
    getTotalTime,
    clearCart,
  };
}