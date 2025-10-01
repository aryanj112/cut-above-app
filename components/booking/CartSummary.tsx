import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartItem } from "../../app/types";

type CartSummaryProps = {
  cartItems: CartItem[];
  getTotalPrice: () => number;
  getTotalTime: () => number;
  onBookAppointment?: () => void;
  onExpandedChange?: (isExpanded: boolean) => void;
};

export function CartSummary({ 
  cartItems, 
  getTotalPrice, 
  getTotalTime, 
  onBookAppointment, 
  onExpandedChange 
}: CartSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [animation] = useState(new Animated.Value(1));
  const insets = useSafeAreaInsets();
  
  // Calculate the height needed for the cart content
  const collapsedHeight = 60;
  const maxExpandedHeight = 300; // Maximum height when expanded
  
  const toggleCart = () => {
    const toValue = isExpanded ? 0 : 1;
    const newExpandedState = !isExpanded;
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(newExpandedState);
    onExpandedChange?.(newExpandedState);
  };

  const cartHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedHeight, maxExpandedHeight],
  });

  const contentOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const handleRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg'],
  });

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={{ 
        height: cartHeight,
        position: 'absolute',
        bottom: 0, // Attach directly to the bottom (tab bar level)
        left: 0,
        right: 0,
      }}
      className="bg-white border-t border-gray-200 shadow-lg"
    >
      {/* Toggle Handle */}
      <TouchableOpacity 
        className="flex-row justify-center items-center py-3 border-b border-gray-100"
        onPress={toggleCart}
      >
        <View className="flex-row items-center">
          <Text className="font-bold text-lg mr-2">
            Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}) • ${getTotalPrice()}
          </Text>
          <Animated.View style={{ transform: [{ rotate: handleRotation }] }}>
            <Text className="text-lg font-bold">⌄</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Cart Content - Scrollable */}
      <Animated.View 
        style={{ 
          opacity: contentOpacity,
          flex: 1,
        }}
        className="px-4 pb-4"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View className="mb-2">
            <Text className="text-base font-bold mb-1">Cart Details</Text>
            {cartItems.map((item) => (
              <View key={item.service.id} className="flex-row justify-between items-center mb-1">
                <Text className="flex-1 text-sm">{item.service.name}</Text>
                <Text className="text-sm font-medium mx-2">x{item.quantity}</Text>
                <Text className="text-sm font-bold">${item.service.price * item.quantity}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Footer section - always visible at bottom of expanded cart */}
        <View className="border-t border-gray-300 pt-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-bold">Total Time:</Text>
            <Text className="font-bold">{getTotalTime()} min</Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-lg">Total Price:</Text>
            <Text className="font-bold text-lg">${getTotalPrice()}</Text>
          </View>
          
          <TouchableOpacity 
            className="bg-blue-600 rounded-lg py-2 px-4"
            onPress={onBookAppointment}
          >
            <Text className="text-white text-center font-bold">Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}