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

  const getCartItems = () => {
    // return a hashmap with serviceId as key and quantity as value
    const cartMap: { [key: string]: number } = {};
    cartItems.forEach(item => {
      cartMap[item.service.id] = item.quantity;
    });
    return cartMap;
  };

  const getCartServiceIds = (): string[] => {
    // return a set of serviceIds in the cart (composite IDs)
    return cartItems.map(item => item.service.id);
  };

  const getCartVariationIds = (): string[] => {
    // return a set of variation_ids in the cart (actual Square IDs)
    return cartItems.map(item => item.service.variation_id);
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
    getCartItems,
    getCartServiceIds,
    getCartVariationIds,
  };
}