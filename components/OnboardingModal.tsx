import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Modal,
	Alert,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { supabase } from "@/lib/supabase";

const toISODate = (d: Date) => {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

type Props = {
	visible: boolean;
	onClose: () => void;
};

export default function OnboardingModal({ visible, onClose }: Props) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [birthday, setBirthday] = useState("");
	const [saving, setSaving] = useState(false);
	const [showPicker, setShowPicker] = useState(false);

	const save = async () => {
		try {
			setSaving(true);
			const {
				data: { user },
				error: uerr,
			} = await supabase.auth.getUser();
			if (uerr || !user) {
				Alert.alert("Not signed in");
				return;
			}

			// create a customer id on square
			const { data, error } = await supabase.functions.invoke(
				"create-customer-id",
				{
					body: {
						phone: phone,
						name: name,
					},
				}
			);

			// upsert profiles
			const { error: perr } = await supabase.from("profiles").upsert(
				{
					id: user.id,
					display_name: name || null,
					phone: phone || null,
					birthday: birthday || null,
					onboarded: true,
					updated_at: new Date().toISOString(),
					square_id: data?.customer?.id || null,
				},
				{ onConflict: "id" }
			);
			if (perr) throw perr;

			// mirror display name into auth metadata (shows in Auth UI)
			if (name) {
				await supabase.auth.updateUser({ data: { full_name: name } });
			}

			onClose();
			Alert.alert("Welcome!", "Your profile is set.");
		} catch (e: any) {
			Alert.alert("Couldn’t save", e?.message ?? "Unknown error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/40 justify-center p-5">
				<View className="bg-white rounded-2xl p-5">
					<Text className="text-xl font-bold mb-3">
						Finish setting up your account
					</Text>

					<Text className="text-xs text-gray-500 mb-1">Full name</Text>
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="e.g., Vince Fillah"
						className="border border-gray-300 rounded-xl px-3.5 py-3 mb-3"
					/>

					<Text className="text-xs text-gray-500 mb-1">Phone number</Text>
					<TextInput
						value={phone}
						onChangeText={setPhone}
						keyboardType="phone-pad"
						placeholder="555-555-5555"
						className="border border-gray-300 rounded-xl px-3.5 py-3 mb-3"
					/>

					{/* <Text className="text-xs text-gray-500 mb-1">Birthday</Text>
					<TouchableOpacity
						onPress={() => setShowPicker(true)}
						className="border border-gray-300 rounded-xl px-3.5 py-3 mb-3"
					>
						<Text className="text-base">{birthday || "Select date"}</Text>
					</TouchableOpacity>

					<DateTimePickerModal
						isVisible={showPicker}
						mode="date"
						date={birthday ? new Date(birthday) : new Date(2005, 0, 1)}
						maximumDate={new Date()}
						onConfirm={(d) => {
							setBirthday(toISODate(d));
							setShowPicker(false);
						}}
						onCancel={() => setShowPicker(false)}
					/> */}

					<View className="flex-row justify-end gap-2 mt-2">
						{/* <TouchableOpacity
							onPress={onClose}
							className="bg-gray-200 px-4 py-2 rounded-xl"
						>
							<Text className="font-semibold">Skip</Text>
						</TouchableOpacity> */}
						<TouchableOpacity
							onPress={save}
							disabled={saving}
							className="bg-gray-900 px-4 py-2 rounded-xl"
						>
							<Text className="text-white font-semibold">
								{saving ? "Saving…" : "Save"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}
