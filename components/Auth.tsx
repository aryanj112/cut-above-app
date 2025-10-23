import React, { useState } from "react";
import { Alert, View } from "react-native";
import { supabase } from "../lib/supabase";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

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
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
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
		<View className="p-3">
			<View className="py-1 self-stretch mt-5">
				<Text className="mb-2 text-base font-semibold text-gray-700">
					Email
				</Text>
				<Input variant="outline" size="md">
					<InputField
						onChangeText={(text) => setEmail(text)}
						value={email}
						placeholder="email@address.com"
						autoCapitalize="none"
						keyboardType="email-address"
					/>
				</Input>
			</View>
			<View className="py-1 self-stretch">
				<Text className="mb-2 text-base font-semibold text-gray-700">
					Password
				</Text>
				<Input variant="outline" size="md">
					<InputField
						onChangeText={(text: string) => setPassword(text)}
						value={password}
						secureTextEntry={true}
						placeholder="Password"
						autoCapitalize="none"
					/>
				</Input>
			</View>
			<View className="py-1 self-stretch mt-5">
				<Button
					variant="solid"
					action="primary"
					size="md"
					isDisabled={loading}
					onPress={() => signInWithEmail()}
				>
					<ButtonText>Sign in</ButtonText>
				</Button>
			</View>
			<View className="py-1 self-stretch">
				<Button
					variant="outline"
					action="secondary"
					size="md"
					isDisabled={loading}
					onPress={() => signUpWithEmail()}
				>
					<ButtonText>Sign up</ButtonText>
				</Button>

				<TouchableOpacity
					onPress={performOAuth}
					disabled={loading}
					className={`mt-10 w-full rounded-2xl py-5 px-6 flex-row items-center justify-center mb-6 shadow-lg ${
						isDark
							? "bg-white/10 border border-white/20"
							: "bg-white border border-gray-200/50"
					} ${loading ? "opacity-50" : ""}`}
				>
					<Box className="w-6 h-6 mr-4">
						<Ionicons name="logo-google" size={20} color="#4285F4" />
					</Box>
					<Text
						className={`font-semibold text-base ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						{loading ? "Signing in..." : "Continue with Google"}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
