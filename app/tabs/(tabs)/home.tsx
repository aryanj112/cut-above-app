import { Text, Image, View } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import MessageButton from "@/components/MessageButton";

export default function HomePage() {
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
    </View>
  );
}