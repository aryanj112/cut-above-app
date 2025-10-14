import { Text, Image, View } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Button } from "@/components/ui/button";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import MessageButton from "@/components/MessageButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/OnboardingModal";

export default function HomePage() {
  const params = useLocalSearchParams<{ new?: string }>();
  const localRouter = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    <View className="flex-1 justify-between items-center">
      <View className="items-center">
        <Image
          className="w-[10rem] h-[10rem] mt-[2rem]"
          source={require('../../../assets/images/logo.png')}
        />
        <Text className="p-4">Upcoming Appointments</Text>
        <UpcomingApptCard
          date="2025-09-23T21:30:00.000Z"
          barber="Vince"
          cut="Adult Hair Cut"
        />
      </View>
      <Button
        className="w-[10rem] h-[4rem] mb-8"
        onPress={() => {
          router.push('/tabs/booking');
        }}
      >
        <Text className="text-white font-bold text-xl">Book Now</Text>
      </Button>
      <MessageButton />

      {/* Onboarding modal appears only right after sign-up when new=1 */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </View>
  );
}