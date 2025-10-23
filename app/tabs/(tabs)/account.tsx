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
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode as decodeBase64 } from "base64-arraybuffer";
import MessageButton from "@/components/MessageButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

import { useFocusEffect } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";

type Info = {
  name: string;
  phone: string;
  email: string;
  birthday: string; // MM/DD/YYYY
};

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toUSDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}`;
};
const parseUSDate = (s: string) => {
  const [mm, dd, yyyy] = s.split("/").map((x) => parseInt(x, 10));
  if (!mm || !dd || !yyyy) return new Date();
  return new Date(yyyy, mm - 1, dd);
};
const usToISO = (s: string) => {
  const [mm, dd, yyyy] = s.split("/");
  if (!mm || !dd || !yyyy) return s;
  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
};
const isoToUS = (s: string) => {
  const [yyyy, mm, dd] = s.split("-");
  if (!yyyy || !mm || !dd) return s;
  return `${mm}/${dd}/${yyyy}`;
};

export default function AccountPage() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { session, loading, signOut } = useAuth();

  const [info, setInfo] = useState<Info>({
    name: "",
    phone: "",
    email: "",
    birthday: "",
  });
  const [draftInfo, setDraftInfo] = useState<Info>(info);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nameAck, setNameAck] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isAccountBdayPickerVisible, setAccountBdayPickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, birthday, profile_img")
        .eq("id", user.id)
        .single();

      const nameFromAuth =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        "";

      const next: Info = {
        name: data?.display_name ?? nameFromAuth ?? "",
        phone: data?.phone ?? "",
        email: user.email ?? "",
        birthday: data?.birthday ? isoToUS(String(data.birthday)) : "",
      };

      setInfo(next);
      setDraftInfo(next);
      if (data?.profile_img) {
        try {
          const { data: signed } = await supabase
            .storage
            .from("profile-images")
            .createSignedUrl(data.profile_img, 60 * 60); // 1 hour
          if (signed?.signedUrl) setPhotoUri(signed.signedUrl);
        } catch {}
      }
    })();
  }, [session?.user?.id]);

  const ensureMediaPermission = async (): Promise<boolean> => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return true;

    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (requested.granted) return true;

    if (!requested.canAskAgain) {
      Alert.alert(
        "Permission Needed",
        "We need access to your photo library to pick a profile image.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert("Permission Needed", "Please grant photo access to continue.");
    }
    return false;
  };

  const pickImage = async () => {
    try {
      if (!(await ensureMediaPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled) return;

      const localUri = result.assets[0].uri;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      // Read local file as base64 and then convert to ArrayBuffer and then upload 
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decodeBase64(base64);
      const filePath = `${user.id}.jpg`;

      const { error: uploadErr } = await supabase
        .storage
        .from("profile-images")
        .upload(filePath, arrayBuffer, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadErr) {
        console.warn("Upload failed:", uploadErr.message);
        Alert.alert("Upload failed", uploadErr.message);
        return;
      }
    
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ profile_img: filePath, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateErr) {
        console.warn("DB update failed:", updateErr.message);
        Alert.alert("Save failed", updateErr.message);
        return;
      }
   
      const { data: signed } = await supabase
        .storage
        .from("profile-images")
        .createSignedUrl(filePath, 60 * 60); 
      if (!signed?.signedUrl) {
        Alert.alert("Error", "Could not create a signed URL for the uploaded image.");
        return;
      }
      setPhotoUri(signed.signedUrl);
      Alert.alert("Profile photo updated");
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Error", e?.message ?? "Unknown error");
    }
  };


  useFocusEffect(React.useCallback(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("profile_img")
        .eq("id", user.id)
        .single();
      if (data?.profile_img) {
        const { data: signed } = await supabase
          .storage
          .from("profile-images")
          .createSignedUrl(data.profile_img, 60 * 60);
        if (signed?.signedUrl) setPhotoUri(signed.signedUrl);
      }
    })();
    return () => {};
  }, []));

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

  const isValidBirthday = (s: string) =>
    s === "" || /^\d{2}\/\d{2}\/\d{4}$/.test(s);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      if (!isValidBirthday(draftInfo.birthday)) {
        Alert.alert("Invalid birthday", "Use format MM/DD/YYYY (e.g., 06/25/2006).");
        return;
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: draftInfo.name || null,
          phone: draftInfo.phone || null,
          birthday: draftInfo.birthday ? usToISO(draftInfo.birthday) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profErr) throw profErr;
      if ((draftInfo.name || "") !== (user.user_metadata?.full_name || "")) {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: { full_name: draftInfo.name || null },
        });
        if (metaErr) {
          console.warn("Auth metadata update failed:", metaErr.message);
        }
      }

      // in case of email change
      if (draftInfo.email && draftInfo.email !== (user.email ?? "")) {
        const { error: emailErr } = await supabase.auth.updateUser({
          email: draftInfo.email,
        });
        if (emailErr) {
          Alert.alert("Email not updated", emailErr.message);
        } else {
          Alert.alert(
            "Check your inbox",
            "We sent a confirmation email to finish updating your address."
          );
        }
      }

      setInfo(draftInfo);
      setShowAccountInfo(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  // Handler for deleting account. NOT COMPLETE YET
  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }
      if (!nameAck || nameAck.trim() !== info.name.trim()) {
        Alert.alert("Confirmation required", "Please type your preferred name exactly to confirm.");
        return;
      }

      const { error: fnErr } = await supabase.functions.invoke("delete-user", {
        body: { userId: user.id },
      });
      if (fnErr) {
        Alert.alert(
          "Delete failed",
          "Server did not allow deletion. Make sure an Edge Function named 'delete-user' exists and is configured with the service role."
        );
        return;
      }

      await supabase.auth.signOut();
      setShowDeleteModal(false);
      Alert.alert("Account deleted", "Your account has been removed.");
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unknown error");
    } finally {
      setDeleting(false);
      setNameAck("");
    }
  };

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
            onPress={() => setShowDeleteModal(true)}
          />
          <ButtonBlock
            label="Sign Out"
            onPress={async () => {
              try {
                await signOut();
              } catch {
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
        <Pressable className="flex-1 bg-black/40" onPress={() => setModalTitle(null)}>
          <Pressable onPress={() => {}} className="m-auto w-11/12 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-2">{modalTitle}</Text>
            <Text className="text-base text-gray-700">This feature isn't ready yet.</Text>
            <TouchableOpacity
              onPress={() => setModalTitle(null)}
              className="self-end mt-4 bg-gray-900 px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-semibold">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Account info edit modal */}
      <Modal
        visible={showAccountInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountInfo(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowAccountInfo(false)}>
          <Pressable onPress={() => {}} className="m-auto w-11/12 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-2">Edit Account Information</Text>

            {/* Name */}
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Name</Text>
              <TextInput
                value={draftInfo.name}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, name: t }))}
                placeholder="Enter name"
                className="text-base"
                autoCapitalize="words"
              />
            </View>
            {/* Phone */}
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Phone Number</Text>
              <TextInput
                value={draftInfo.phone}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, phone: t }))}
                placeholder="Enter phone"
                keyboardType="phone-pad"
                className="text-base"
              />
            </View>
       
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Email</Text>
              <TextInput
                value={draftInfo.email}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, email: t }))}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="text-base"
              />
            </View>
     
            <TouchableOpacity
              onPress={() => setAccountBdayPickerVisible(true)}
              activeOpacity={0.85}
              className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3"
            >
              <Text className="text-[12px] text-gray-500 mb-1">Birthday</Text>
              <Text className="text-base">
                {draftInfo.birthday ? draftInfo.birthday : "Select date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isAccountBdayPickerVisible}
              mode="date"
              date={draftInfo.birthday ? parseUSDate(draftInfo.birthday) : new Date(2005, 0, 1)}
              maximumDate={new Date()}
              onConfirm={(d) => {
                setDraftInfo((p) => ({ ...p, birthday: toUSDate(d) }));
                setAccountBdayPickerVisible(false);
              }}
              onCancel={() => setAccountBdayPickerVisible(false)}
            />

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => setShowAccountInfo(false)}
                className="bg-gray-200 px-4 py-2 rounded-xl mr-2"
              >
                <Text className="text-gray-900 font-semibold">Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-gray-900 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  {saving ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

  
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowDeleteModal(false)}>
          <Pressable onPress={() => {}} className="m-auto w-11/12 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-2">Delete Account</Text>
            <Text className="text-base text-gray-700 mb-3">
              Are you sure you want to delete your account? This action cannot be undone. Please retype your preferred name below to confirm.
            </Text>
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Confirm Deletion</Text>
              <TextInput
                value={nameAck}
                onChangeText={setNameAck}
                placeholder="Type your preferred name"
                autoCapitalize="words"
                className="text-base"
              />
            </View>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="bg-gray-200 px-4 py-2 rounded-xl mr-2"
              >
                <Text className="text-gray-900 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-600 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  {deleting ? "Deleting…" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <MessageButton />
    </View>
  );
}