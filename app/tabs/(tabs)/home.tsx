import { Text, Image, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Button } from "@/components/ui/button";
import { router, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MessageButton from "@/components/MessageButton";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/OnboardingModal";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Service } from "@/app/types";

interface Booking {
  id: string;
  booking_day: string;
  booking_time: string;
  service_id: string;
  user_id: string;
  notes?: string;
  location_id: string;
}

export default function HomePage() {
  const params = useLocalSearchParams<{ new?: string }>();
  const localRouter = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colors, colorMode, toggleColorMode } = useTheme();

  // Fetch services for mapping service IDs to names
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-services");
      if (error) {
        console.error("Error fetching services:", error);
        return;
      }
      if (data?.services) {
        setServices(data.services);
      }
    } catch (err) {
      console.error("Error loading services:", err);
    }
  };

  // Fetch locations for timezone information
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-locations");
      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }
      if (data?.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  // Fetch upcoming bookings
  const fetchUpcomingBookings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get current date and time in ISO format
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toISOString().split('T')[1]; // HH:MM:SS.sssZ

      // Fetch bookings for this user that are in the future
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .or(`booking_day.gt.${currentDate},and(booking_day.eq.${currentDate},booking_time.gte.${currentTime})`)
        .order("booking_day", { ascending: true })
        .order("booking_time", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Error fetching bookings:", error);
      } else if (bookings && bookings.length > 0) {
        setUpcomingBooking(bookings[0]);
      } else {
        setUpcomingBooking(null);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchLocations();
  }, []);

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUpcomingBookings();
    }, [])
  );

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
        // Clean the URL so the modal doesn't re-open on back nav
        localRouter.replace("/tabs/home");
      }
    })();
  }, [params?.new]);

  // Get service name from service_id
  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.variation_id === serviceId);
    return service?.name || "Haircut Service";
  };

  // Get location timezone from location_id
  const getLocationTimezone = (locationId: string): string | undefined => {
    const location = locations.find(l => l.id === locationId);
    return location?.timezone;
  };

  // Handle successful cancellation or reschedule
  const handleCancelSuccess = () => {
    fetchUpcomingBookings(); // Refresh the bookings list
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Theme Toggle */}
      <View 
        style={{ 
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
            Home
          </Text>
          <TouchableOpacity
            onPress={toggleColorMode}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.backgroundSecondary,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons 
              name={colorMode === 'dark' ? 'sunny' : 'moon'} 
              size={22} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Logo Section */}
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: colors.primaryMuted,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: colors.primary,
            }}
          >
            <Image
              style={{ width: 120, height: 120, borderRadius: 60 }}
              source={require('../../../assets/images/logo.png')}
            />
          </View>
        </View>

        {/* Upcoming Appointments Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text 
            style={{ 
              fontSize: 22, 
              fontWeight: '700', 
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Upcoming Appointments
          </Text>
          
          {isLoading ? (
            <View 
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textMuted, marginTop: 12 }}>
                Loading appointments...
              </Text>
            </View>
          ) : upcomingBooking ? (
            <UpcomingApptCard
              bookingId={upcomingBooking.id}
              date={`${upcomingBooking.booking_day}T${upcomingBooking.booking_time}`}
              barber="Vince"
              cut={getServiceName(upcomingBooking.service_id)}
              locationId={upcomingBooking.location_id}
              locationTimezone={getLocationTimezone(upcomingBooking.location_id)}
              serviceVariationId={upcomingBooking.service_id}
              onCancelSuccess={handleCancelSuccess}
            />
          ) : (
            <View 
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 30,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text 
                style={{ 
                  color: colors.text, 
                  fontSize: 16, 
                  fontWeight: '600',
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                No Upcoming Appointments
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
                Book an appointment to see it here
              </Text>
            </View>
          )}
        </View>

        {/* CTA Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
          <TouchableOpacity
            onPress={() => router.push('/tabs/booking')}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
              Book Appointment Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <MessageButton />

      {/* Onboarding modal appears only right after sign-up when new=1 */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </View>
  );
}