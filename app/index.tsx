// Author: Hashem Alomar
// Date: 09/16/25
// Description: UI for Login Page
// TODOS:
// - Set up Supabase and initialize login
// - Route to main router once setup.

import React from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Image, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleGoogleSignIn = () => {
    // Placeholder for Google sign-in logic
    console.log('Google sign-in pressed');
    // For now, navigate to placeholder route
    router.push('/');
  };

  return (
    <Box className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Box className="flex-1 justify-center items-center px-6 py-safe">
        <Box className="items-center mb-16">
          <Image className="w-40 h-40 mt-8" source={require('../assets/images/logo.png')} />

          <Text className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            One Cut Above
          </Text>
          <Text className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center px-4`}>
            Premium barbershop experience awaits
          </Text>
        </Box>

        <Box
          className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl ${
            isDark
              ? 'bg-gray-900/50 border border-gray-800/50'
              : 'bg-white/90 border border-white/50'
          }`}
        >
          <Text className={`text-2xl font-bold mb-8 text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome Back
          </Text>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            className={`w-full rounded-2xl py-5 px-6 flex-row items-center justify-center mb-6 shadow-lg ${
              isDark
                ? 'bg-white/10 border border-white/20'
                : 'bg-white border border-gray-200/50'
            }`}
          >
            <Box className="w-6 h-6 mr-4">
              <Ionicons name="logo-google" size={20} color="#4285F4" />
            </Box>
            <Text className={`font-semibold text-base ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Continue with Google
            </Text>
          </TouchableOpacity>
          
          <Button
            size="md"
            className="bg-primary-500 px-6 py-2 rounded-full"
            onPress={() => {
              router.push('/tabs/home');
            }}
          >
            <Text className="text-white font-bold">Go Home</Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}