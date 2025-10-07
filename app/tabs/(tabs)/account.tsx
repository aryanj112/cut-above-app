import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Image,
	TextInput,
	Modal,
	Pressable,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import MessageButton from "@/components/MessageButton";
import { useAuth } from "@/contexts/AuthContext";
import { Button, ButtonText } from "@/components/ui/button";

type Info = {
	name: string;
	phone: string;
	email: string;
	birthday: string;
};
export default function AccountPage() {
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const { session, loading, signOut } = useAuth();
	const [info, setInfo] = useState<Info>({
		name: session?.user?.user_metadata?.name || "",
		phone: session?.user?.user_metadata?.phone || "",
		email: session?.user?.email || "",
		birthday: session?.user?.user_metadata?.birthday || "",
	});
	const [draftInfo, setDraftInfo] = useState<Info>(info);
	const [modalTitle, setModalTitle] = useState<string | null>(null);
	const [showAccountInfo, setShowAccountInfo] = useState(false);

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Needed", "We need access to your photo library");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.9,
		});
		if (!result.canceled) setPhotoUri(result.assets[0].uri);
	};
	const ButtonBlock = ({
		label,
		onPress,
	}: {
		label: string;
		onPress: () => void;
	}) => (
		<TouchableOpacity
			onPress={onPress}
			className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
		>
			<Text className="text-white text-base font-semibold">{label}</Text>
		</TouchableOpacity>
	);
	return (
		<View className="flex-1">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ paddingBottom: 140 }}
					className="px-5 pt-5"
				>
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-2xl font-bold">
							Welcome {info.name || "Guest"}
						</Text>
						<TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
							{photoUri ? (
								<Image
									source={{ uri: photoUri }}
									className="w-16 h-16 rounded-full border border-gray-200"
									resizeMode="cover"
								/>
							) : (
								<View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center border border-gray-200">
									<Text className="text-xl text-gray-500">👤</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
					<ButtonBlock
						label="Account Info"
						onPress={() => {
							setDraftInfo(info);
							setShowAccountInfo(true);
						}}
					/>
					<ButtonBlock
						label="Past Bookings"
						onPress={() => setModalTitle("Past Bookings")}
					/>
					<ButtonBlock
						label="Notifications"
						onPress={() => setModalTitle("Notifications")}
					/>
					<ButtonBlock
						label="Terms and Conditions"
						onPress={() => setModalTitle("Terms and Conditions")}
					/>
					<ButtonBlock
						label="Delete Account"
						onPress={() => setModalTitle("Delete Account")}
					/>
					<ButtonBlock
						label="Sign Out"
						onPress={async () => {
							try {
								await signOut();
							} catch (error) {
								Alert.alert("Error", "Failed to sign out. Please try again.");
							}
						}}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
			<Modal
				visible={modalTitle !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setModalTitle(null)}
			>
				<Pressable
					className="flex-1 bg-black/40"
					onPress={() => setModalTitle(null)}
				>
					<Pressable
						onPress={() => {}}
						className="m-auto w-11/12 bg-white rounded-2xl p-5"
					>
						<Text className="text-lg font-bold mb-2">{modalTitle}</Text>
						<Text className="text-base text-gray-700">
							This feature isn't ready yet.
						</Text>
						<TouchableOpacity
							onPress={() => setModalTitle(null)}
							className="self-end mt-4 bg-gray-900 px-4 py-2 rounded-xl"
						>
							<Text className="text-white font-semibold">Close</Text>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
			<Modal
				visible={showAccountInfo}
				transparent
				animationType="fade"
				onRequestClose={() => setShowAccountInfo(false)}
			>
				<Pressable
					className="flex-1 bg-black/40"
					onPress={() => setShowAccountInfo(false)}
				>
					<Pressable
						onPress={() => {}}
						className="m-auto w-11/12 bg-white rounded-2xl p-5"
					>
						<Text className="text-lg font-bold mb-2">
							Edit Account Information
						</Text>
						{(
							[
								["Name", "name"],
								["Phone Number", "phone"],
								["Email", "email"],
								["Birthday", "birthday"],
							] as const
						).map(([label, key]) => (
							<View
								key={key}
								className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3"
							>
								<Text className="text-[12px] text-gray-500 mb-1">{label}</Text>
								<TextInput
									value={draftInfo[key]}
									onChangeText={(t) =>
										setDraftInfo((p) => ({ ...p, [key]: t }))
									}
									placeholder={`Enter ${label.toLowerCase()}`}
									className="text-base"
									keyboardType={
										key === "phone"
											? "phone-pad"
											: key === "email"
											? "email-address"
											: "default"
									}
									autoCapitalize={key === "email" ? "none" : "words"}
								/>
							</View>
						))}
						<View className="flex-row justify-end mt-4">
							<TouchableOpacity
								onPress={() => setShowAccountInfo(false)}
								className="bg-gray-200 px-4 py-2 rounded-xl mr-2"
							>
								<Text className="text-gray-900 font-semibold">Close</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									setInfo(draftInfo);
									setShowAccountInfo(false);
								}}
								className="bg-gray-900 px-4 py-2 rounded-xl"
							>
								<Text className="text-white font-semibold">Save</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
			<MessageButton />
		</View>
	);
}
