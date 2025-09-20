import EditScreenInfo from '@/components/EditScreenInfo';
import UpcomingApptCard from '@/components/UpcomingApptCard';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Image } from 'react-native';

export default function Tab1() {
  return (
    <Center className="flex-1">
      <Image 
        source = {require('../../../assets/images/logo.png')}
        style={{width: 200, height: 200, marginBottom: 20}}
      />
      <Heading className="font-bold text-2xl">Expo - Tab 1</Heading>
      <Divider className="my-[30px] w-[80%]" />
      <Text className="p-4">Upcoming Appointments</Text>
      <UpcomingApptCard date="September 20, 2025 at 3:00 pm" barber="Vince" cut="Adult Hair Cut" />
      <Text className="p-4">HOME PAGE</Text>
      <EditScreenInfo path="app/(app)/(tabs)/tab1.tsx" />
    </Center>
  );
}
