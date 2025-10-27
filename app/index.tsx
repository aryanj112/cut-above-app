// Author: Hashem Alomar
// Date: 09/16/25
// Description: UI for Login Page
// TODOS:
// - Set up Supabase and initialize login
// - Route to main router once setup.
import "react-native-url-polyfill/auto";
import Auth from "@/components/Auth";
import { useRouter } from "expo-router";
import { View, Image, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
	const router = useRouter();
	const { session, loading } = useAuth();
	const { colors, colorMode, toggleColorMode } = useTheme();
	const insets = useSafeAreaInsets();

	// Redirect to home if user is already authenticated
	useEffect(() => {
		if (session && !loading) {
			router.replace("/tabs/home?new=1");
		}
	}, [session, loading, router]);

	// Show loading state while checking authentication
	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary }}>
					Loading...
				</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Theme Toggle Button */}
			<TouchableOpacity
				onPress={toggleColorMode}
				style={{
					position: 'absolute',
					top: insets.top + 16,
					right: 20,
					width: 44,
					height: 44,
					borderRadius: 22,
					backgroundColor: colors.backgroundSecondary,
					justifyContent: 'center',
					alignItems: 'center',
					zIndex: 10,
					borderWidth: 1,
					borderColor: colors.border,
					shadowColor: colors.cardShadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.2,
					shadowRadius: 4,
					elevation: 3,
				}}
			>
				<Ionicons 
					name={colorMode === 'dark' ? 'sunny' : 'moon'} 
					size={22} 
					color={colors.text} 
				/>
			</TouchableOpacity>

			<ScrollView 
				contentContainerStyle={{ 
					flexGrow: 1,
					justifyContent: 'center',
					paddingTop: Math.max(insets.top + 60, 80),
					paddingBottom: Math.max(insets.bottom + 20, 40),
					paddingHorizontal: 24,
				}}
				showsVerticalScrollIndicator={false}
			>
				{/* Logo Section */}
				<View style={{ alignItems: 'center', marginBottom: 48 }}>
					<View 
						style={{
							width: 140,
							height: 140,
							borderRadius: 70,
							backgroundColor: colors.primaryMuted,
							justifyContent: 'center',
							alignItems: 'center',
							marginBottom: 20,
							borderWidth: 3,
							borderColor: colors.primary,
							shadowColor: colors.primary,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.3,
							shadowRadius: 12,
							elevation: 8,
						}}
					>
						<Image
							style={{ width: 120, height: 120, borderRadius: 60 }}
							source={require("../assets/images/logo.png")}
						/>
					</View>

					<Text
						style={{
							fontSize: 32,
							fontWeight: '900',
							marginBottom: 8,
							color: colors.text,
							textAlign: 'center',
						}}
					>
						One Cut Above
					</Text>
					<Text
						style={{
							fontSize: 16,
							fontWeight: '500',
							color: colors.textSecondary,
							textAlign: 'center',
							paddingHorizontal: 16,
							marginBottom: 16,
						}}
					>
						Premium barbershop experience awaits
					</Text>

					{/* Feature Pills */}
					<View style={{ flexDirection: 'row', gap: 10 }}>
						<View 
							style={{ 
								backgroundColor: colors.secondaryMuted,
								paddingHorizontal: 12,
								paddingVertical: 6,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: colors.secondary,
							}}
						>
							<Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '600' }}>
								Fast Booking
							</Text>
						</View>
						<View 
							style={{ 
								backgroundColor: colors.primaryMuted,
								paddingHorizontal: 12,
								paddingVertical: 6,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: colors.primary,
							}}
						>
							<Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
								Top Barbers
							</Text>
						</View>
					</View>
				</View>

				{/* Auth Card */}
				<View
					style={{
						width: '100%',
						maxWidth: 400,
						borderRadius: 24,
						padding: 28,
						backgroundColor: colors.card,
						borderWidth: 1,
						borderColor: colors.border,
						shadowColor: colors.cardShadow,
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.15,
						shadowRadius: 16,
						elevation: 8,
						alignSelf: 'center',
					}}
				>
					<Text
						style={{
							fontSize: 22,
							fontWeight: '700',
							textAlign: 'center',
							marginBottom: 20,
							color: colors.text,
						}}
					>
						Welcome Back
					</Text>

					<Auth />
				</View>
			</ScrollView>
		</View>
	);
}
