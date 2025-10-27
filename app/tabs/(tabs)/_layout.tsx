import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Image, Platform } from "react-native";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBarIcon(props: {
	name: React.ComponentProps<typeof FontAwesome>["name"];
	color: string;
}) {
	return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	
	return (
		<ProtectedRoute>
			<Tabs
				screenOptions={{
					// Disable the static render of the header on web
					// to prevent a hydration error in React Navigation v6.
					headerShown: false,
					tabBarActiveTintColor: colors.tabIconSelected,
					tabBarInactiveTintColor: colors.tabIconDefault,
					tabBarStyle: {
						backgroundColor: colors.tabBackground,
						borderTopColor: colors.border,
						borderTopWidth: 1,
						elevation: 0,
						shadowOpacity: 0,
						height: 60 + insets.bottom,
						paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
						paddingTop: 8,
					},
					tabBarLabelStyle: {
						fontSize: 12,
						fontWeight: '600',
						marginBottom: 4,
					},
				}}
			>
				<Tabs.Screen
					name="home"
					options={{
						title: "Home",
						tabBarIcon: ({ color, size }) => (
							<Image
								source={require("../../../assets/images/home-icon.png")}
								style={{ width: size, height: size, tintColor: color }}
								resizeMode="contain"
							/>
						),
					}}
				/>

				<Tabs.Screen
					name="booking"
					options={{
						title: "Booking",
						tabBarIcon: ({ color, size }) => (
							<Image
								source={require("../../../assets/images/booking-icon.png")}
								style={{ width: size, height: size, tintColor: color }}
								resizeMode="contain"
							/>
						),
					}}
				/>

				<Tabs.Screen
					name="account"
					options={{
						title: "Account",
						tabBarIcon: ({ color, size }) => (
							<Image
								source={require("../../../assets/images/account-icon.png")}
								style={{ width: size, height: size, tintColor: color }}
								resizeMode="contain"
							/>
						),
					}}
				/>
				{/* <Tabs.Screen
					name="book"
					options={{
						title: "Book",
						tabBarIcon: ({ color, size }) => (
							<Image
								source={require("../../../assets/images/account-icon.png")}
								style={{ width: size, height: size, tintColor: color }}
								resizeMode="contain"
							/>
						),
					}}
				/> */}
			</Tabs>
		</ProtectedRoute>
	);
}
