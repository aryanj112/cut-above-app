import { Text, Image, View, TouchableOpacity } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Button } from "@/components/ui/button";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import MessageButton from "@/components/MessageButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/OnboardingModal";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function HomePage() {
  const params = useLocalSearchParams<{ new?: string }>();
  const localRouter = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { colors, colorMode, toggleColorMode } = useTheme();

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
          <UpcomingApptCard
            date="2025-09-23T21:30:00.000Z"
            barber="Vince"
            cut="Adult Hair Cut"
          />
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