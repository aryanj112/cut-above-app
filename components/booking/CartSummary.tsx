import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartItem } from "../../app/types";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

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
  const { colors } = useTheme();
  
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
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Toggle Handle */}
      <TouchableOpacity 
        style={{ 
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.primaryMuted,
        }}
        onPress={toggleCart}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cart" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontWeight: '700', fontSize: 17, marginRight: 8, color: colors.text }}>
            Cart ({cartItems.length})
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.primary }}>
            ${getTotalPrice()}
          </Text>
          <Animated.View style={{ transform: [{ rotate: handleRotation }], marginLeft: 8 }}>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Cart Content - Scrollable */}
      <Animated.View 
        style={{ 
          opacity: contentOpacity,
          flex: 1,
        }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
        >
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.text }}>
              Cart Details
            </Text>
            {cartItems.map((item, index) => (
              <View 
                key={item.service.id} 
                style={{ 
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < cartItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{item.service.name}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', marginHorizontal: 8, color: colors.textSecondary }}>
                  ×{item.quantity}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>
                  ${item.service.price * item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Footer section - always visible at bottom of expanded cart */}
        <View 
          style={{ 
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: 16,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={{ fontWeight: '600', marginLeft: 4, color: colors.text }}>Total Time:</Text>
            </View>
            <Text style={{ fontWeight: '700', color: colors.text }}>{getTotalTime()} min</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, color: colors.text }}>Total Price:</Text>
            <Text style={{ fontWeight: '700', fontSize: 20, color: colors.primary }}>${getTotalPrice()}</Text>
          </View>
          
          <TouchableOpacity 
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={onBookAppointment}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
              Book Appointment
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}