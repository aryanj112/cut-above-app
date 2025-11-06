// Author: Rachel Li
// Date: 09/21/25
// Description: UI for cancel popup/modal
// Enhanced: fully functional with onConfirm deletion and parent update

import React, { useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { View, Alert } from "react-native";
import { supabase } from "@/lib/supabase";

type ModalProps = {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  date: string;              // ISO string
  formattedDate: string;     // e.g., "September 23, 2025 at 5:30 PM"
  id?: string | number;      // Booking ID
  onCancelled?: (id: string | number) => void;
};

export default function CancelModal({
  showModal,
  setShowModal,
  date,
  formattedDate,
  id,
  onCancelled,
}: ModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculate remaining hours and categorize the charge bracket
  function getCancelGroup(appointmentDate: string): string {
    const now = new Date();
    const appt = new Date(appointmentDate);
    const diffMs = appt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 24) return "No Charge (≥ 24 hours)";
    if (diffHours > 0) return "50% Charge (< 24 hours)";
    return "100% Charge (Missed Appointment)";
  }

  const handleConfirmCancel = async () => {
    if (!id) {
      Alert.alert("Error", "Missing booking ID.");
      return;
    }
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;

      onCancelled?.(id);
      setShowModal(false);
    } catch (e: any) {
      Alert.alert("Cancellation failed", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        if (!submitting) setShowModal(false);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Cancel Appointment</Heading>
          <ModalCloseButton disabled={submitting}>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <Text className="mb-4">
            Are you sure you want to cancel your appointment on {formattedDate}?
          </Text>

          <Text className="font-bold mb-2">Cancellation Policy:</Text>
          <View className="ml-2 space-y-2 mb-4">
            <Text>{'\u2022'} No charge if you cancel at least 24 hours before your appointment.</Text>
            <Text>{'\u2022'} 50% of the haircut fee if you cancel within 24 hours of your appointment.</Text>
            <Text>{'\u2022'} Full haircut fee charged if you miss your appointment.</Text>
          </View>

          <Text className="mt-2 font-semibold">
            You fall into: {getCancelGroup(date)}
          </Text>

          {/* Agreement checkbox */}
          <Checkbox
            value="agree"
            isChecked={agreed}
            onChange={(checked) => setAgreed(checked)}
            size="md"
            className="mt-4"
          >
            <CheckboxIndicator>
              {agreed && <CheckboxIcon as={CheckIcon} />}
            </CheckboxIndicator>
            <CheckboxLabel className="ml-2">
              I agree to the cancellation terms and conditions.
            </CheckboxLabel>
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-2"
            onPress={() => {
              if (!submitting) setShowModal(false);
            }}
            isDisabled={submitting}
          >
            <ButtonText>Nevermind</ButtonText>
          </Button>

          <Button
            onPress={handleConfirmCancel}
            isDisabled={!agreed || submitting}
            className={`${agreed && !submitting ? "bg-red-600" : "bg-gray-400"} px-4 py-2 rounded`}
          >
            <ButtonText>{submitting ? "Cancelling…" : "Confirm Cancel"}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}