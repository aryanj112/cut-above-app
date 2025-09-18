import React from "react";
import { ScrollView, View, Text } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/ServiceCards";

export default function BookingPage() {
  const regularServices = services.services.filter((s) => !s.isDeal);
  const dealServices = services.services.filter((s) => s.isDeal);

  return (
    <ScrollView className="p-4">
      {/*Regular*/}
      <View className="mb-6">
        <Text className="text-xl font-bold mb-4">Bookings</Text>
        {regularServices.map((service) => (
          <ServiceCard
            key={service.id}
            name={service.name}
            price={service.price}
            time={service.timeMin}
            isDeal={service.isDeal}
          />
        ))}
      </View>

      {/*Deals*/}
      <View>
        <Text className="text-xl font-bold mb-4">Deals</Text>
        {dealServices.map((service) => (
          <ServiceCard
            key={service.id}
            name={service.name}
            price={service.price}
            time={service.timeMin}
            isDeal={service.isDeal}
          />
        ))}
      </View>
    </ScrollView>
  );
}
