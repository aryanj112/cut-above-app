import React from 'react';
import Gradient from '@/assets/icons/Gradient';
import Logo from '@/assets/icons/Logo';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';


export default function Home() {
  const router = useRouter();
  return (
    <Box className="flex-1 bg-background-300 h-[100vh]">

      <Box className="absolute h-[500px] w-[500px] lg:w-[700px] lg:h-[700px]">
        <Gradient />
      </Box>
      {/* <ScrollView
        style={{ height: '100%' }}
        contentContainerStyle={{ flexGrow: 1 }}
      > */}
      <Box className="flex flex-1 items-center mx-5 lg:my-24 lg:mx-32 py-safe">
        <Box className="gap-10 base:flex-col sm:flex-row justify-between sm:w-[80%] md:flex-1">
          <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column md:flex-row md:self-start">
            <Text className="text-white font-medium">
              Get started by editing
            </Text>
            <Text className="text-white font-medium ml-2">./app/index.tsx HEY THIS IS ARYAN THIS IS OUR LOGIN PAGE</Text>
          </Box>
          <Button
            size="md"
            className="bg-primary-500 px-6 py-2 rounded-full"
            onPress={() => {
              router.push('/tabs/home');
            }}
          >
            <ButtonText>Explore Tab Navigation</ButtonText>
          </Button>

        </Box>
        <Box className="flex-1 justify-center items-center h-[20px] w-[300px] lg:h-[160px] lg:w-[400px]">
          <Logo />
        </Box>
      </Box>
      {/* </ScrollView> */}
    </Box>
  );
}
