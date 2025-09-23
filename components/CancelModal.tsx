// Author: Rachel Li
// Date: 09/21/25
// Description: UI for cancel popup/modal
// TODOS:
// - Possibly change wording and layout so more user-friendly

import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
} from '@/components/ui/checkbox';
import { CheckIcon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon, CloseIcon } from '@/components/ui/icon';
import { View } from 'react-native';
import { useState } from 'react'

type ModalProps = {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  date: string;  
  formattedDate: string;
};

export default function CancelModal({ showModal, setShowModal, date, formattedDate }: ModalProps) {
  const [agreed, setAgreed] = useState(false);

  // Calculate time remaining before appointment and 
  // categorize user into the three cancel groups (no charge, 50% charge, full charge)
  function getCancelGroup(appointmentDate: string): string {
    const now = new Date();
    const appt = new Date(appointmentDate);
    const diffMs = appt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 24) return "No Charge (>= 24 hours)";
    if (diffHours < 24 && diffHours > 0) return "50% Charge (< 24 hours)";
    return "100% Charge (Missed Appointment)";
  }

  return (
    <>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">Cancel Appointment</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text className="mb-4">Are you sure you want to cancel your appointment on {formattedDate}?</Text>

            <Text className="font-bold">Cancellation Policy:</Text>
            <View className="ml-2 space-y-2 mb-4">
              <Text>{'\u2022'} No charge if you cancel at least 24 hours before your appointment.</Text>
              <Text>{'\u2022'} 50% of the haircut fee if you cancel within 24 hours of your appointment.</Text>
              <Text>{'\u2022'} Full haircut fee charged if you miss your appointment.</Text>
            </View>

            <Text className="mt-2 font-semibold">
              You fall into: {getCancelGroup(date)}
            </Text>

            {/* Checkbox for agreement */}
            <Checkbox
              value="agree"
              isChecked={agreed}
              onChange={(checked) => setAgreed(checked)}
              size="md"
            >
              <CheckboxIndicator>
                {agreed && (
                  <CheckboxIcon as={CheckIcon} />
                )}
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
                setShowModal(false);
              }}
            >
              <ButtonText>Nevermind</ButtonText>
            </Button>
            
            {/* Button to cancel */}
            <Button
              onPress={() => setShowModal(false)}
              isDisabled={!agreed} // disable button if user did not agree to terms yet
              className={`${agreed ? "bg-red-600" : "bg-gray-400"} px-4 py-2 rounded`}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}