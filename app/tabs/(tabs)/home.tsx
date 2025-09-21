import { Text, Image } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Center } from '@/components/ui/center';

export default function HomePage() {
  return (
    <Center className="flex-1">
      <Image
        className="w-[20rem] h-[20rem]"
        source={require('../../../assets/images/logo.png')}
      />
      <Text className="p-4">Upcoming Appointments</Text>
      <UpcomingApptCard date="September 20, 2025 at 3:00 pm" barber="Vince" cut="Adult Hair Cut" />
    </Center>
  );
}
