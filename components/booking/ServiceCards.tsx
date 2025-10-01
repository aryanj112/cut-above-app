import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Card } from "../ui/card";
import { Service } from "../../app/types";

type ServiceCardProps = {
  service: Service;
  quantity?: number;
  onAdd?: () => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
};

export function ServiceCard({ service, quantity = 0, onAdd, onIncrease, onDecrease }: ServiceCardProps) {
  const { name, price, timeMin, isDeal } = service;
  
  return (
    // TODO: get rid of mb here and add in the margin where the prop is being called (helps with future reuse and side effects)
    <View className="mb-[1rem]">
      <Card size="lg">
        <View className="flex flex-row justify-between items-center">
          <View>
            <Text className="text-[1.25rem] font-semibold">{name}</Text>
            <Text className="text-gray-500">{`${timeMin} min - $${price}`}</Text>
          </View>

          <View className="flex flex-row items-center">
            {isDeal && (<Text className="text-green-600 font-bold ml-2">Deal</Text>)}
            
            {quantity > 0 ? (
              // Show quantity controls when item is in cart
              <View className="flex flex-row items-center ml-2">
                <TouchableOpacity
                  className="w-8 h-8 rounded-full border border-red-500 flex justify-center items-center"
                  onPress={onDecrease}
                >
                  <Text className="text-lg font-bold text-red-500 text-center leading-[16px]">-</Text>
                </TouchableOpacity>
                
                <Text className="mx-3 text-lg font-bold min-w-[20px] text-center">{quantity}</Text>
                
                <TouchableOpacity
                  className="w-8 h-8 rounded-full border border-green-500 flex justify-center items-center"
                  onPress={onIncrease}
                >
                  <Text className="text-lg font-bold text-green-500 text-center leading-[16px]">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Show add button when item is not in cart
              <TouchableOpacity
                className="w-8 h-8 rounded-full border border-black flex justify-center items-center ml-2"
                onPress={onAdd}
              >
                <Text className="text-xl font-bold text-center leading-[18.5px]">+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}
