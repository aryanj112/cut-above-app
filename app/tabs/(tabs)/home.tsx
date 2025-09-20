import { View, Text, Image } from "react-native";
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';

export default function HomePage() {
  return (
    <Center className="flex-1">
      <Image
        source={require('../../../assets/images/logo.png')}
        style={{ width: 200, height: 200, marginBottom: 20 }}
      />
      <Text className="p-4">Upcoming Appointments</Text>
      <UpcomingApptCard date="September 20, 2025 at 3:00 pm" barber="Vince" cut="Adult Hair Cut" />
    </Center>
  );
}
