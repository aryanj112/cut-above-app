import { Text, Image, ScrollView } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import MessageButton from "@/components/MessageButton";

export default function HomePage() {
  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: 'center',
        paddingVertical: 24,
        paddingBottom: 120, 
        rowGap: 16,        
      }}
    >
      <Image
        style={{ width: 320, height: 320 }}
        source={require('../../../assets/images/logo.png')}
      />
      <Text style={{ padding: 16 }}>Upcoming Appointments</Text>
      <UpcomingApptCard
        date="September 20, 2025 at 3:00 pm"
        barber="Vince"
        cut="Adult Hair Cut"
      />
      <Button
        className="w-[10rem] h-[4rem] mb-8"
        onPress={() => {
          router.push('/tabs/booking');
        }}
      >
        <Text className="text-white font-bold text-xl">Book Now</Text>
      </Button>
      <MessageButton />
    </ScrollView>
  );
}