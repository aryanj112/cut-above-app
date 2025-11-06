import { Text, Image, View, ScrollView } from "react-native";
import UpcomingApptCard from "@/components/UpcomingApptCard";
import { Button } from "@/components/ui/button";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import MessageButton from "@/components/MessageButton";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/OnboardingModal";
import { useFocusEffect } from "@react-navigation/native";

/** Booking row shape from Supabase */
type BookingRow = {
  id: string;
  booking_day: string;   // 'YYYY-MM-DD'
  booking_time: string;  // 'HH:MM:SS'
  booking_length: number | null;
};

export default function HomePage() {
  const params = useLocalSearchParams<{ new?: string }>();
  const localRouter = useRouter();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nextAppt, setNextAppt] = useState<BookingRow | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCancelled = (id: string | number) => {
    setUpcomingBookings(prev => prev.filter(b => b.id !== id));
    setNextAppt(prev => (prev && prev.id === id ? null : prev));
  };

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNextAppt(null);
        return;
      }

      const now = new Date();
      const today = now.toISOString().slice(0, 10);        // YYYY-MM-DD
      const currentTime = now.toTimeString().slice(0, 8);  // HH:MM:SS

      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_day, booking_time, booking_length")
        .eq("user_id", user.id)
        .gte("booking_day", today)
        .order("booking_day", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;

      const upcomingOnly = (data ?? []).filter(
        (b) =>
          b.booking_day > today ||
          (b.booking_day === today && b.booking_time >= currentTime)
      );

      setUpcomingBookings(upcomingOnly);

      let upcoming: BookingRow | null = null;
      if (upcomingOnly.length > 0) {
        upcoming = upcomingOnly[0];
      }
      setNextAppt(upcoming);
    } catch (e) {
      console.warn("Fetch upcoming error", e);
      setNextAppt(null);
    } finally {
      setLoading(false);
    }
  }, []);
    
  useEffect(() => {
    (async () => {
      if (params?.new === "1") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("onboarded")
            .eq("id", user.id)
            .single();

          if (!data?.onboarded) {
            setShowOnboarding(true);
          }
        }
        localRouter.replace("/tabs/home");
      }
    })();
  }, [params?.new]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  useFocusEffect(
    useCallback(() => {
      fetchUpcoming();
    }, [fetchUpcoming])
  );

  const nextDateISO =
    nextAppt ? new Date(`${nextAppt.booking_day}T${nextAppt.booking_time}`).toISOString() : null;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center">
        <Image
          className="w-[10rem] h-[10rem] mt-[2rem]"
          source={require("../../../assets/images/logo.png")}
        />

        <Text className="p-4 text-2xl font-bold">Upcoming Appointments</Text>

        {upcomingBookings.length > 0 ? (
          upcomingBookings.map((b) => {
            const iso = new Date(`${b.booking_day}T${b.booking_time}`).toISOString();
            return (
              <UpcomingApptCard
                key={b.id}
                id={b.id}
                date={iso}
                barber="TBD"
                cut="Selected services"
                onCancelled={handleCancelled}
              />
            );
          })
        ) : (
          <Text className="p-4 text-gray-500">
            {loading ? "Loading..." : "No upcoming appointments"}
          </Text>
        )}
      </View>

      <Button
        className="w-[10rem] h-[4rem] mt-12 mb-8"
        onPress={() => {
          router.push("/tabs/booking");
        }}
      >
        <Text className="text-white font-bold text-xl">Book Now</Text>
      </Button>

      <MessageButton />

      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </ScrollView>
  );
}