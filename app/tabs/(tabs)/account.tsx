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
import { router, useFocusEffect } from "expo-router";
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
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

const isoToUS = (s: string) => {
  const [yyyy, mm, dd] = s.split("-");
  if (!yyyy || !mm || !dd) return s;
  return `${mm}/${dd}/${yyyy}`;
};

export default function AccountPage() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { session, signOut } = useAuth();

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
  const [isAccountBdayPickerVisible, setAccountBdayPickerVisible] =
    useState(false);

  const [pastBookings, setPastBookings] = useState<any[] | null>(null);
  const [loadingPast, setLoadingPast] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        .update({
          profile_img: filePath,
          updated_at: new Date().toISOString(),
        })
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
        Alert.alert(
          "Error",
          "Could not create a signed URL for the uploaded image."
        );
        return;
      }
      setPhotoUri(signed.signedUrl);
      Alert.alert("Profile photo updated");
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Error", e?.message ?? "Unknown error");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
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
    }, [])
  );

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
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
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
        .upsert(
          {
            id: user.id,
            display_name: draftInfo.name || null,
            phone: draftInfo.phone || null,
            birthday: draftInfo.birthday ? usToISO(draftInfo.birthday) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

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

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }
      if (!nameAck || nameAck.trim() !== info.name.trim()) {
        Alert.alert(
          "Confirmation required",
          "Please type your preferred name exactly to confirm."
        );
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

  const computeEndMs = (row: any) => {
    // Treat booking_day + booking_time as **local time**
    const [Y, M, D] = String(row.booking_day).split("-").map(Number);
    const [h, m, s] = String(row.booking_time).split(":").map(Number);
    const startLocal = new Date(Y, M - 1, D, h || 0, m || 0, s || 0);
    return startLocal.getTime() + Number(row.booking_length || 0) * 60_000;
  };

  const computeStartMs = (row: any) => {
    const [Y, M, D] = String(row.booking_day).split("-").map(Number);
    const [h, m, s] = String(row.booking_time).split(":").map(Number);
    return new Date(Y, M - 1, D, h || 0, m || 0, s || 0).getTime();
  };

  const openPastBookings = async () => {
    setModalTitle("Past Bookings");
    try {
      setLoadingPast(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookings")
        .select("id, created_at, booking_day, booking_time, booking_length")
        .eq("user_id", user.id)
        .order("booking_day", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;

      const nowMs = Date.now();
      const past = (data ?? []).filter((b) => computeStartMs(b) <= nowMs);
      setPastBookings(past);
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Failed to load past bookings.");
    } finally {
      setLoadingPast(false);
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

          <TouchableOpacity
            onPress={() => {
              setDraftInfo(info);
              setShowAccountInfo(true);
            }}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">
              Account Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openPastBookings}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">
              Past Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalTitle("Notifications")}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">
              Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalTitle("Terms and Conditions")}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">
              Terms and Conditions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">
              Delete Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                await signOut();
              } catch {
                Alert.alert("Error", "Failed to sign out. Please try again.");
              }
            }}
            className="bg-gray-900 rounded-xl px-5 py-4 mb-3 active:opacity-90"
          >
            <Text className="text-white text-base font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* General modal with dynamic content by modalTitle */}
      <Modal
        visible={modalTitle !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTitle(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          {/* Backdrop that doesn't wrap content (prevents swallowing child scroll) */}
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setModalTitle(null)}
          />

          {/* Modal sheet */}
          <View className="w-11/12 max-h-[85%] bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <View className="px-5 pt-5 pb-2 border-b border-gray-200">
              <Text className="text-lg font-bold">
                {modalTitle}
              </Text>
            </View>

            {/* Body */}
            {modalTitle === "Past Bookings" ? (
              <View className="px-5 py-4">
                {loadingPast ? (
                  <Text className="text-base text-gray-700">Loading…</Text>
                ) : pastBookings?.length ? (
                  <ScrollView
                    style={{ maxHeight: 380 }}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {pastBookings.map((b) => {
                      const [Y, M, D] = String(b.booking_day).split("-").map(Number);
                      const [h, m, s] = String(b.booking_time).split(":").map(Number);
                      const startLocal = new Date(
                        Y,
                        M - 1,
                        D,
                        h || 0,
                        m || 0,
                        s || 0
                      ).toLocaleString();
                      return (
                        <View
                          key={b.id}
                          className="mb-3 p-3 rounded-xl border border-gray-200"
                        >
                          <Text className="font-semibold mb-1">{startLocal}</Text>
                          <Text className="text-sm text-gray-600">
                            Duration: {b.booking_length} min
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Ends: {new Date(computeEndMs(b)).toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text className="text-base text-gray-700">No past bookings yet.</Text>
                )}
              </View>
            ) : modalTitle === "Terms and Conditions" ? (
              // ✅ Scrollable TOS
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
              >
                <Text className="text-base text-gray-700 mb-2">
                  <Text className="font-semibold">Last updated: 10/28/2025</Text> 
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">1) Overview</Text>
                <Text className="text-base text-gray-700 mb-2">
                  This app provides an easy-to-use scheduling service for people of all ages (“Service”).
                  By booking or using the app, you agree to these Terms & Conditions.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">2) Accounts & Access</Text>
                <Text className="text-base text-gray-700 mb-2">
                  You are responsible for the accuracy of information you provide when booking (name, phone, email).
                  The app is designed to be simple and accessible; if you need assistance, contact us via the phone number shown in the app.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">3) Pricing & Fees</Text>
                <Text className="text-base text-gray-700 mb-2">
                  Service prices are generally fixed and shown before you confirm a booking. A{" "}
                  <Text className="font-semibold">booking fee (currently $2.75 per appointment)</Text> may apply
                  and will be displayed at checkout. Payment processing fees may apply and are included or shown
                  at checkout before you pay. OCA intends to reduce third-party fees by operating its own
                  scheduling and payment app; posted fees reflect this goal and may change with notice in the app.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">4) Payments, Holds, and Authorization</Text>
                <Text className="text-base text-gray-700 mb-2">
                  We accept credit/debit card payments in the app; OCA’s goal is that 80% of payments occur in-app.
                  At the time of booking, the app may place a temporary hold (pre-authorization) on your payment
                  method to secure your spot and/or any applicable no-show/cancellation fees. Final charges are
                  captured after your appointment completes or upon a no-show/late cancellation under Section 6.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">5) After-Hours Pricing</Text>
                <Text className="text-base text-gray-700 mb-2">
                  Appointments scheduled outside regular business hours may carry an after-hours premium shown at
                  checkout prior to confirmation.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">6) Cancellations, Late Changes & No-Shows</Text>
                <Text className="text-base text-gray-700 mb-2">
                  You can cancel or reschedule in the app where available. Cancellation/late-change and no-show
                  fees (if any) are shown before you confirm. If you do not arrive for your appointment or cancel
                  too late (as indicated in the app), we may charge the no-show/late-cancel fee using your stored
                  payment method or the active authorization.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">7) Alerts, Notifications & Last-Minute Availability</Text>
                <Text className="text-base text-gray-700 mb-2">
                  You can opt in to notifications for reminders, last-minute openings, “fully booked” alerts, or
                  “limited availability” alerts. You can toggle these in app at any time. Message and data rates
                  may apply. If enabled, the system may auto-notify you when slots open close to the appointment time.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">8) Senior Guidance</Text>
                <Text className="text-base text-gray-700 mb-2">
                  For seniors, the app provides clear guidance on times that may be more convenient cost-wise
                  (e.g., avoiding after-hours premiums). This is informational and does not change posted prices.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">9) Messaging & Support</Text>
                <Text className="text-base text-gray-700 mb-2">
                  For faster support, messages may be routed directly to the business owner’s phone (SMS/calls)
                  instead of an in-app inbox. By contacting us or opting into text updates, you consent to receiving
                  SMS/calls related to your appointment(s). Message and data rates may apply. You can opt out at any
                  time per instructions in the message.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">10) Fair Use & Availability</Text>
                <Text className="text-base text-gray-700 mb-2">
                  Bookings are subject to availability. We may limit, suspend, or refuse bookings to maintain fair
                  access or for misuse, fraud prevention, or operational reasons.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">11) Refunds & Disputes</Text>
                <Text className="text-base text-gray-700 mb-2">
                  Refund eligibility (including booking fee and processing fee components) is shown in the app
                  at checkout and/or your receipt. If you believe a charge is incorrect, contact us first; we’ll
                  review promptly.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">12) Data & Privacy</Text>
                <Text className="text-base text-gray-700 mb-2">
                  We collect only what’s needed to schedule and complete your appointment (e.g., name, contact info,
                  payment tokens). Payment data is handled by a PCI-compliant processor; we do not store full card
                  numbers. See the in-app Privacy Policy for details on data, retention, and your choices.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">13) Accessibility</Text>
                <Text className="text-base text-gray-700 mb-2">
                  We aim for an experience usable by people of all ages and abilities. If you need accommodation,
                  please contact us and we’ll help schedule or provide alternatives.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">14) Changes to Terms</Text>
                <Text className="text-base text-gray-700 mb-2">
                  We may update these Terms. Updates take effect when posted in the app. If changes are material,
                  we will highlight them in-app.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">15) Liability</Text>
                <Text className="text-base text-gray-700 mb-2">
                  To the extent permitted by law, OCA and its affiliates are not liable for indirect, incidental,
                  or consequential damages arising from your use of the Service. Nothing here excludes liability
                  where not allowed by law.
                </Text>

                <Text className="text-lg font-semibold mt-3 mb-1">16) Governing Law</Text>
                <Text className="text-base text-gray-700 mb-4">
                  These Terms are governed by the laws of the state where OCA primarily operates, without regard
                  to conflict-of-law provisions.
                </Text>

                <Text className="text-xs text-gray-500">
                  This text is informational and not legal advice. Consider legal review for your jurisdiction and
                  policies (e.g., specific cancellation windows/fees).
                </Text>
              </ScrollView>
            ) : (
              <View className="px-5 py-4">
                <Text className="text-base text-gray-700">
                  This feature isn't ready yet.
                </Text>
              </View>
            )}

            {/* Footer */}
            <View className="px-5 pb-5 pt-3 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setModalTitle(null)}
                className="self-end bg-gray-900 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account info edit modal */}
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
          <Pressable onPress={() => {}} className="m-auto w-11/12 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-2">Edit Account Information</Text>

            {/* Name */}
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Name</Text>
              <TextInput
                value={draftInfo.name}
                onChangeText={(t) =>
                  setDraftInfo((p) => ({ ...p, name: t }))
                }
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
                onChangeText={(t) =>
                  setDraftInfo((p) => ({ ...p, phone: t }))
                }
                placeholder="Enter phone"
                keyboardType="phone-pad"
                className="text-base"
              />
            </View>

            {/* Email */}
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">Email</Text>
              <TextInput
                value={draftInfo.email}
                onChangeText={(t) =>
                  setDraftInfo((p) => ({ ...p, email: t }))
                }
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="text-base"
              />
            </View>

            {/* Birthday */}
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
              date={
                draftInfo.birthday
                  ? parseUSDate(draftInfo.birthday)
                  : new Date(2005, 0, 1)
              }
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

      {/* Delete account modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable onPress={() => {}} className="m-auto w-11/12 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-2">Delete Account</Text>
            <Text className="text-base text-gray-700 mb-3">
              Are you sure you want to delete your account? This action cannot be
              undone. Please retype your preferred name below to confirm.
            </Text>
            <View className="bg-white border border-gray-300 rounded-xl px-3.5 py-3 mb-3">
              <Text className="text-[12px] text-gray-500 mb-1">
                Confirm Deletion
              </Text>
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