import React from "react";
import { ScrollView, View, Text } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/ServiceCards";

export default function BookingPage() {
  const regularServices = services.services.filter((s) => !s.isDeal);
  const dealServices = services.services.filter((s) => s.isDeal);

  return (
    <ScrollView style={{ padding: 16 }}>
      {/*Regular*/}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
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
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
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
