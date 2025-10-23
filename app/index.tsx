// Author: Hashem Alomar
// Date: 09/16/25
// Description: UI for Login Page
// TODOS:
// - Set up Supabase and initialize login
// - Route to main router once setup.
import "react-native-url-polyfill/auto";
import Auth from "@/components/Auth";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { Image, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Home() {
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const { session, loading } = useAuth();

	// Redirect to home if user is already authenticated
	useEffect(() => {
		if (session && !loading) {
			router.push("/tabs/home");
		}
	}, [session, loading, router]);

	// Show loading state while checking authentication
	if (loading) {
		return (
			<Box
				className={`flex-1 ${
					isDark ? "bg-gray-950" : "bg-gray-50"
				} justify-center items-center`}
			>
				<Text className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
					Loading...
				</Text>
			</Box>
		);
	}

	return (
		<Box className={`flex-1 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
			<Box className="flex-1 justify-center items-center px-6 py-safe">
				<Box className="items-center mb-16">
					<Image
						className="w-40 h-40 mt-8"
						source={require("../assets/images/logo.png")}
					/>

					<Text
						className={`text-4xl font-black mb-3 ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						One Cut Above
					</Text>
					<Text
						className={`text-lg font-medium ${
							isDark ? "text-gray-400" : "text-gray-600"
						} text-center px-4`}
					>
						Premium barbershop experience awaits
					</Text>
				</Box>

				<Box
					className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl ${
						isDark
							? "bg-gray-900/50 border border-gray-800/50"
							: "bg-white/90 border border-white/50"
					}`}
				>
					<Text
						className={`text-2xl font-bold text-center ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						Welcome
					</Text>

					<Auth />
				</Box>
			</Box>
		</Box>
	);
}
