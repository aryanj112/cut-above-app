import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Service } from "../../app/types";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

type ServiceCardProps = {
  service: Service;
  quantity?: number;
  onAdd?: () => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
};

export function ServiceCard({ service, quantity = 0, onAdd, onIncrease, onDecrease }: ServiceCardProps) {
  const { name, price, timeMin, isDeal } = service;
  const { colors } = useTheme();
  
  return (
    <View style={{ marginBottom: 12 }}>
      <View 
        style={{
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: isDeal ? colors.secondary : colors.border,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                {name}
              </Text>
              {isDeal && (
                <View 
                  style={{ 
                    backgroundColor: colors.secondaryMuted,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>
                    DEAL
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                {timeMin} min
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, marginHorizontal: 6 }}>•</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>
                ${price}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {quantity > 0 ? (
              // Show quantity controls when item is in cart
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.errorMuted,
                    borderWidth: 1.5,
                    borderColor: colors.error,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={onDecrease}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={colors.error} />
                </TouchableOpacity>
                
                <Text 
                  style={{ 
                    marginHorizontal: 12, 
                    fontSize: 17, 
                    fontWeight: '700', 
                    minWidth: 20, 
                    textAlign: 'center',
                    color: colors.text,
                  }}
                >
                  {quantity}
                </Text>
                
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.successMuted,
                    borderWidth: 1.5,
                    borderColor: colors.success,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={onIncrease}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.success} />
                </TouchableOpacity>
              </View>
            ) : (
              // Show add button when item is not in cart
              <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primaryMuted,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={onAdd}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
