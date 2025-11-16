import {
  View,
  Text,
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
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

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
  const { colors, colorMode, toggleColorMode } = useTheme();

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
    danger = false,
  }: {
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: danger ? colors.errorMuted : colors.card,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: danger ? colors.error : colors.border,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ 
        color: danger ? colors.error : colors.text, 
        fontSize: 16, 
        fontWeight: '600' 
      }}>
        {label}
      </Text>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Theme Toggle */}
      <View 
        style={{ 
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
            Account
          </Text>
          <TouchableOpacity
            onPress={toggleColorMode}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.backgroundSecondary,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons 
              name={colorMode === 'dark' ? 'sunny' : 'moon'} 
              size={22} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          contentContainerStyle={{ paddingBottom: 140 }}
          style={{ paddingHorizontal: 20, paddingTop: 20 }}
        >
          {/* Profile Card */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: 40,
                      borderWidth: 3,
                      borderColor: colors.primary,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: 40, 
                      backgroundColor: colors.primaryMuted,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 3,
                      borderColor: colors.primary,
                    }}
                  >
                    <Ionicons name="person" size={40} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
                  {info.name || "Guest"}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {info.email || "No email"}
                </Text>
                <TouchableOpacity 
                  onPress={pickImage}
                  style={{ 
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="camera" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 4, fontWeight: '600' }}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
            danger
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
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalTitle !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTitle(null)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => setModalTitle(null)}>
          <Pressable 
            onPress={() => {}} 
            style={{ 
              margin: 'auto',
              width: '85%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
              {modalTitle}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>
              This feature isn't ready yet.
            </Text>
            <TouchableOpacity
              onPress={() => setModalTitle(null)}
              style={{
                alignSelf: 'flex-end',
                marginTop: 16,
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>Close</Text>
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
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => setShowAccountInfo(false)}>
          <Pressable 
            onPress={() => {}} 
            style={{ 
              margin: 'auto',
              width: '90%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>
              Edit Account Information
            </Text>

            {/* Name */}
            <View style={{ 
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Name</Text>
              <TextInput
                value={draftInfo.name}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, name: t }))}
                placeholder="Enter name"
                placeholderTextColor={colors.textMuted}
                style={{ fontSize: 16, color: colors.text }}
                autoCapitalize="words"
              />
            </View>
            {/* Phone */}
            <View style={{ 
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                value={draftInfo.phone}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, phone: t }))}
                placeholder="Enter phone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={{ fontSize: 16, color: colors.text }}
              />
            </View>
       
            <View style={{ 
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Email</Text>
              <TextInput
                value={draftInfo.email}
                onChangeText={(t) => setDraftInfo((p) => ({ ...p, email: t }))}
                placeholder="Enter email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ fontSize: 16, color: colors.text }}
              />
            </View>
     
            <TouchableOpacity
              onPress={() => setAccountBdayPickerVisible(true)}
              activeOpacity={0.85}
              style={{ 
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Birthday</Text>
              <Text style={{ fontSize: 16, color: colors.text }}>
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

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowAccountInfo(false)}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>
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
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => setShowDeleteModal(false)}>
          <Pressable 
            onPress={() => {}} 
            style={{ 
              margin: 'auto',
              width: '85%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: colors.error }}>
              Delete Account
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 12 }}>
              Are you sure you want to delete your account? This action cannot be undone. Please retype your preferred name below to confirm.
            </Text>
            <View style={{ 
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Confirm Deletion</Text>
              <TextInput
                value={nameAck}
                onChangeText={setNameAck}
                placeholder="Type your preferred name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                style={{ fontSize: 16, color: colors.text }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={{
                  backgroundColor: colors.error,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>
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