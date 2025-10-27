import React, { useState } from "react";
import { Alert, View, Text, TouchableOpacity, TextInput } from "react-native";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useTheme } from "@/contexts/ThemeContext";

const redirectTo = `com.projectlift://google-auth`;

const createSessionFromUrl = async (url: string) => {
	const { params, errorCode } = QueryParams.getQueryParams(url);
	if (errorCode) throw new Error(errorCode);
	const { access_token, refresh_token } = params;
	if (!access_token) return;
	const { data, error } = await supabase.auth.setSession({
		access_token,
		refresh_token,
	});
	if (error) throw error;
	return data.session;
};

const performOAuth = async () => {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo,
			skipBrowserRedirect: true,
		},
	});
	if (error) throw error;

	const res = await WebBrowser.openAuthSessionAsync(
		data?.url ?? "",
		redirectTo
	);

	if (res.type === "success") {
		const { url } = res;
		await createSessionFromUrl(url);
	}
};

const sendMagicLink = async () => {
	const { error } = await supabase.auth.signInWithOtp({
		email: "example@email.com",
		options: {
			emailRedirectTo: redirectTo,
		},
	});
};

export default function Auth() {
	const { colors } = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// Handle linking into app from email app.
	const url = Linking.useURL();
	if (url) createSessionFromUrl(url);

	async function signInWithEmail() {
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) Alert.alert(error.message);
		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);
		const {
			data: { session },
			error,
		} = await supabase.auth.signUp({
			email: email,
			password: password,
		});

		if (error) Alert.alert(error.message);
		if (!session)
			Alert.alert("Please check your inbox for email verification!");
		setLoading(false);
	}

	return (
		<View>
			<View style={{ marginBottom: 16 }}>
				<Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
					Email
				</Text>
				<View 
					style={{
						backgroundColor: colors.background,
						borderWidth: 1,
						borderColor: colors.border,
						borderRadius: 12,
						paddingHorizontal: 14,
						paddingVertical: 12,
					}}
				>
					<TextInput
						onChangeText={(text) => setEmail(text)}
						value={email}
						placeholder="email@address.com"
						placeholderTextColor={colors.textMuted}
						autoCapitalize="none"
						keyboardType="email-address"
						style={{ fontSize: 16, color: colors.text }}
					/>
				</View>
			</View>

			<View style={{ marginBottom: 20 }}>
				<Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
					Password
				</Text>
				<View 
					style={{
						backgroundColor: colors.background,
						borderWidth: 1,
						borderColor: colors.border,
						borderRadius: 12,
						paddingHorizontal: 14,
						paddingVertical: 12,
					}}
				>
				<TextInput
					onChangeText={(text: string) => setPassword(text)}
					value={password}
					secureTextEntry={true}
					placeholder="Password"
					placeholderTextColor={colors.textMuted}
					autoCapitalize="none"
					style={{ fontSize: 16, color: colors.text }}
				/>
				</View>
			</View>

			<TouchableOpacity
				disabled={loading}
				onPress={() => signInWithEmail()}
				style={{
					backgroundColor: colors.primary,
					paddingVertical: 14,
					borderRadius: 12,
					marginBottom: 12,
					shadowColor: colors.primary,
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 6,
					elevation: 4,
					opacity: loading ? 0.6 : 1,
				}}
			>
				<Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
					Sign In
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				disabled={loading}
				onPress={() => signUpWithEmail()}
				style={{
					backgroundColor: colors.backgroundSecondary,
					paddingVertical: 14,
					borderRadius: 12,
					marginBottom: 24,
					borderWidth: 1,
					borderColor: colors.border,
					opacity: loading ? 0.6 : 1,
				}}
			>
				<Text style={{ color: colors.text, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
					Sign Up
				</Text>
			</TouchableOpacity>

			<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
				<View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
				<Text style={{ marginHorizontal: 16, color: colors.textMuted, fontSize: 14 }}>or</Text>
				<View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
			</View>

			<TouchableOpacity
				onPress={performOAuth}
				disabled={loading}
				style={{
					backgroundColor: colors.card,
					paddingVertical: 14,
					borderRadius: 12,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					borderWidth: 1,
					borderColor: colors.border,
					shadowColor: colors.cardShadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 2,
					opacity: loading ? 0.6 : 1,
				}}
			>
				<Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 10 }} />
				<Text style={{ fontWeight: '600', fontSize: 16, color: colors.text }}>
					{loading ? "Signing in..." : "Continue with Google"}
				</Text>
			</TouchableOpacity>
		</View>
	);
}
