import React from 'react';

import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';

type UpcomingApptCardProps = {
  date: string;
  barber: string;
  cut: string;
}

export default function UpcomingApptCard({ date, barber, cut }: UpcomingApptCardProps) {
  return (
    <Card size="lg" className="m-3 w-[85%] flex flex-col">
      <Heading size="md" className="mb-1 text-center">
        Date: {date}
      </Heading>
      <Text size="md" className="text-center">Barber: {barber}</Text>
      <Text size="md" className="text-center">Cut: {cut}</Text>
      <Button className="m-2 py-2 px-4 w-2/4 self-center bg-red-600">
        <ButtonText size="lg">Cancel</ButtonText>
      </Button>
    </Card>
  );
}
