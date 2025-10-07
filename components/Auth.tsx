import React, { useState } from "react";
import { Alert, View } from "react-native";
import { supabase } from "../lib/supabase";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { MailIcon, LockIcon } from "@/components/ui/icon";

export default function Auth() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

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
		<View className="mt-10 p-3">
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
			</View>
		</View>
	);
}
