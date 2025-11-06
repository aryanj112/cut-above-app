import React, { useState } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/booking/ServiceCards";
import { CartSummary } from "../../../components/booking/CartSummary";
import { BookingModal } from "../../../components/booking/BookingModal";
import { useCart } from "../../hooks/useCart";
import { Service } from "../../types";
import { BookingFormData, Appointment } from "../../types/Appointment";
import { supabase } from "@/lib/supabase";

export default function BookingPage() {
  const [isCartExpanded, setIsCartExpanded] = useState(true);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const cart = useCart();
  
  const regularServices: Service[] = services.services.filter((s) => !s.isDeal);
  const dealServices: Service[] = services.services.filter((s) => s.isDeal);

    

  const handleBookAppointment = () => {
    if (cart.cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add some services to your cart before booking.');
      return;
    }
    setIsBookingModalVisible(true);
  };

  const handleConfirmBooking = async (bookingData: BookingFormData) => {
    try {
      if (cart.cartItems.length === 0) {
        Alert.alert('Empty Cart', 'Please add some services to your cart before booking.');
        return;
      }
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      const booking_day = toPgDate(bookingData.date);
      const booking_time = toPgTime(bookingData.time);
      const booking_length = cart.getTotalTime(); // minutes

      if (!booking_day || !booking_time) {
        console.error("Bad date/time", { rawDate: bookingData.date, rawTime: bookingData.time, booking_day, booking_time });
        Alert.alert("Invalid date/time", "Please select a valid date and time.");
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        booking_day,
        booking_time,
        booking_length,
        created_at: new Date().toISOString(), // safe even if DB has default
      });

      if (error) {
        console.error("Supabase insert error:", error);
        Alert.alert("Booking failed", error.message ?? "Unknown error");
        return;
      }

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your appointment is scheduled for ${bookingData.date} at ${bookingData.time}.`,
        [{
          text: 'OK',
          onPress: () => {
            cart.clearCart();
            setIsBookingModalVisible(false);
          }
        }]
      );
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Booking failed", e?.message ?? "Unknown error");
    }
  };

  const toPgDate = (input: string) => {
    if (!input) return "";
    const s = String(input).trim();
    // Already ISO date?
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // US format MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [mmRaw, ddRaw, yyyy] = s.split("/");
      const mm = mmRaw.padStart(2, "0");
      const dd = ddRaw.padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback: try Date parsing
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };
  
  const toPgTime = (input: string) => {
    if (!input) return "";
    const s = String(input).trim();
    // If already 24h time (HH:MM or HH:MM:SS)
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s) && !/[AP]M$/i.test(s)) {
      const [hhRaw, mm, ssRaw] = s.split(":");
      const hh = String(Number(hhRaw)).padStart(2, "0");
      const ss = ssRaw ? String(Number(ssRaw)).padStart(2, "0") : "00";
      return `${hh}:${mm}:${ss}`;
    }
    // 12h time like "02:30 PM"
    const match = s.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (match) {
      let hour = Number(match[1]) % 12;
      const minute = Number(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM") hour += 12;
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      return `${hh}:${mm}:00`;
    }
    // Fallback: try Date parsing as time
    const d = new Date(`1970-01-01T${s}`);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    return "";
  };
  // --- end helpers ---

  const handleCloseModal = () => {
    setIsBookingModalVisible(false);
  };

  // Calculate bottom padding for ScrollView
  const cartHeight = isCartExpanded ? 300 : 60;
  const scrollViewBottomPadding = cart.cartItems.length > 0 
    ? cartHeight + 20
    : 20;

  return (
    <View className="flex-1">
      <ScrollView 
        className="p-[2rem]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: scrollViewBottomPadding 
        }}
      >
        {/* Regular Services */}
        <View className="mb-[1.5rem]">
          <Text className="mb-[1.5rem] text-[2rem] font-bold">
            Bookings
          </Text>
          {regularServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              quantity={cart.getItemQuantity(service.id)}
              onAdd={() => cart.addToCart(service)}
              onIncrease={() => cart.increaseQuantity(service.id)}
              onDecrease={() => cart.decreaseQuantity(service.id)}
            />
          ))}
        </View>

        {/* Deals */}
        <View>
          <Text className="mb-[1.5rem] text-[2rem] font-bold">
            Deals
          </Text>
          {dealServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              quantity={cart.getItemQuantity(service.id)}
              onAdd={() => cart.addToCart(service)}
              onIncrease={() => cart.increaseQuantity(service.id)}
              onDecrease={() => cart.decreaseQuantity(service.id)}
            />
          ))}
        </View>
      </ScrollView>

      <CartSummary
        cartItems={cart.cartItems}
        getTotalPrice={cart.getTotalPrice}
        getTotalTime={cart.getTotalTime}
        onBookAppointment={handleBookAppointment}
        onExpandedChange={setIsCartExpanded}
      />

      {/* Booking Modal */}
      <BookingModal
        isVisible={isBookingModalVisible}
        onClose={handleCloseModal}
        cartItems={cart.cartItems}
        totalPrice={cart.getTotalPrice()}
        totalTime={cart.getTotalTime()}
        onConfirmBooking={handleConfirmBooking}
      />
    </View>
  );
}