import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Card } from "./ui/card";

type ServiceCardProps = {
  name: string;
  price: number;
  time: number;
  isDeal?: boolean;
  onAdd?: () => void;
};

export function ServiceCard({ name, price, time, isDeal, onAdd }: ServiceCardProps) {
  return (
    <Card
      size="md"
      className="mb-3"
    >
      <View className="flex flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold">{name}</Text>
          <Text className="text-gray-500">
            {time} min - ${price}
          </Text>
        </View>

        <View className = "flex flex-row items-center">
            {isDeal && (
                <Text className="text-green-600 font-bold ml-2">Deal</Text>
            )}
            <TouchableOpacity
                onPress = {onAdd}
                className="w-8 h-8 rounded-full border border-black flex items-center justify-center"
            >
                <Text className="text-xl font-bold">+</Text>
            </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}
