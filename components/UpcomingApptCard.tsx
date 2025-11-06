// Author: Rachel Li
// Date: 09/21/25
// Description: UI for upcoming appointment card

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import CancelModal from '@/components/CancelModal';

type UpcomingApptCardProps = {
  id: string | number;
  date: string;           // ISO string
  barber: string;
  cut: string;
  onCancelled?: (id: string | number) => void;
};

export default function UpcomingApptCard({
  id,
  date,
  barber,
  cut,
  onCancelled,
}: UpcomingApptCardProps) {
  const [showModal, setShowModal] = useState(false);

  const formattedDate = new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card size="lg" className="m-3 w-[85%] flex flex-col">
      <Heading size="md" className="mb-1 text-center">
        Date: {formattedDate}
      </Heading>
      <Text size="md" className="text-center">Barber: {barber}</Text>
      <Text size="md" className="text-center">Cut: {cut}</Text>

      <Button className="m-2 py-2 px-4 bg-red-600" onPress={() => setShowModal(true)}>
        <ButtonText size="lg">Cancel</ButtonText>
      </Button>

      {showModal && (
        <CancelModal
          showModal={showModal}
          setShowModal={setShowModal}
          date={date}
          formattedDate={formattedDate}
          id={id}
          onCancelled={(deletedId) => onCancelled?.(deletedId)}
        />
      )}
    </Card>
  );
}