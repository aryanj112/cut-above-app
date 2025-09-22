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
    // TODO: get rid of mb here and add in the margin where the prop is being called (helps with future reuse and side effects)
    <View className="mb-[1rem]">
      <Card size="lg">
        <View className="flex flex-row justify-between items-center">
          <View>
            <Text className="text-[1.25rem] font-semibold">{name}</Text>
            <Text className="text-gray-500">{`${time} min - $${price}`}</Text>
          </View>

          <View className="flex flex-row items-center">
            {isDeal && (<Text className="text-green-600 font-bold ml-2">Deal</Text>)}
            <TouchableOpacity
              className="w-8 h-8 rounded-full border border-black flex justify-center items-center"
              onPress={onAdd}
            >
              <Text className="text-xl font-bold leading-[21px]">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );
}
