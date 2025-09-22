import React from "react";
import { ScrollView, View, Text } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/ServiceCards";

export default function BookingPage() {
  const regularServices = services.services.filter((s) => !s.isDeal);
  const dealServices = services.services.filter((s) => s.isDeal);

  return (
    <ScrollView className="p-[2rem]">
      {/*Regular*/}
      <View className="mb-[1.5rem]">
        <Text className="mb-[1.5rem] text-[2rem] font-bold">
          Bookings
        </Text>
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
        <Text className="mb-[1.5rem] text-[2rem] font-bold">
          Deals
        </Text>
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
