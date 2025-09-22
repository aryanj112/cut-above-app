// Author: Hashem Alomar
// Date: 09/16/25
// Description: UI for Login Page
// TODOS:
// - Set up Supabase and initialize login
// - Route to main router once setup.

import React from 'react';
import Gradient from '@/assets/icons/Gradient';
import Logo from '@/assets/icons/Logo';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
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
      {/* Animated background gradient */}
      <Box className="absolute inset-0 opacity-5">
        <Box className="absolute top-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-red-400 to-blue-600 blur-3xl" />
        <Box className="absolute bottom-40 -right-20 h-[250px] w-[250px] rounded-full bg-gradient-to-br from-blue-500 to-red-400 blur-3xl" />
      </Box>
      
      <ScrollView
        style={{ height: '100%' }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Box className="flex-1 justify-center items-center px-6 py-safe">
          {/* Logo Section*/}
          <Box className="items-center mb-16">
            <Box 
              className={`h-[100px] w-[100px] mb-8 rounded-3xl p-4 ${
                isDark 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-white/80 border border-white/20 shadow-xl'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.1 : 0.1,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Logo /> {/* TODO: Change logo to one Reena has */}
            </Box>
            
            <Text className={`text-4xl font-black mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              One Cut Above
            </Text>
            <Text className={`text-lg font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            } text-center px-4`}>
              Premium barbershop experience awaits
            </Text>
          </Box>
          
          {/* Sign In Card */}
          <Box 
            className={`w-full max-w-sm rounded-3xl p-8 ${
              isDark 
                ? 'bg-gray-900/50 border border-gray-800/50' 
                : 'bg-white/90 border border-white/50'
            }`}
            style={{
              backdropFilter: 'blur(20px)',
              shadowColor: isDark ? '#000' : '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 30,
              elevation: 15,
          <Button
            size="md"
            className="bg-primary-500 px-6 py-2 rounded-full"
            onPress={() => {
              router.push('/tabs/home');
            }}
          >
            <Text className={`text-2xl font-bold mb-8 text-center ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Back
            </Text>

            {/* Google Sign In Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              className={`w-full rounded-2xl py-5 px-6 flex-row items-center justify-center mb-6 ${
                isDark 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-white border border-gray-200/50'
              }`}
              style={{
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.1 : 0.08,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Box className="w-6 h-6 mr-4">
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </Box>
              <Text className={`font-semibold text-base ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </Box>

          {/* Bottom spacing */}
          <Box className="h-8" />
        </Box>
      </ScrollView>
    </Box>
  );
}