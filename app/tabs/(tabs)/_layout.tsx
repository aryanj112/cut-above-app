import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Image } from "react-native";
import ProtectedRoute from "@/components/ProtectedRoute";

function TabBarIcon(props: {
	name: React.ComponentProps<typeof FontAwesome>["name"];
	color: string;
}) {
	return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
	return (
		<ProtectedRoute>
			<Tabs
				screenOptions={{
					// Disable the static render of the header on web
					// to prevent a hydration error in React Navigation v6.
					headerShown: useClientOnlyValue(false, true),
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
