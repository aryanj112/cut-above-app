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
    <View style={{ marginBottom: 12 }}>
      <Card size="md">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{name}</Text>
            <Text style={{ color: "#6B7280" }}>{`${time} min - $${price}`}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isDeal && (
              <Text style={{ color: "#16A34A", fontWeight: "bold", marginLeft: 8 }}>Deal</Text>
            )}
            <TouchableOpacity
              onPress={onAdd}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "black",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", lineHeight: 21 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );
}
