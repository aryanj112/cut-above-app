// Author: Rachel Li
// Date: 09/21/25
// Description: UI for upcoming appointment card

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CancelModal from '@/components/CancelModal';
import RescheduleModal from '@/components/RescheduleModal';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type UpcomingApptCardProps = {
  date: string;
  barber: string;
  cut: string;
  bookingId?: string;
  locationId?: string;
  locationTimezone?: string;
  serviceVariationId?: string;
  onCancelSuccess?: () => void;
}

export default function UpcomingApptCard({ 
  date, 
  barber, 
  cut, 
  bookingId, 
  locationId,
  locationTimezone,
  serviceVariationId,
  onCancelSuccess 
}: UpcomingApptCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const { colors } = useTheme();

  // Format into a date like "September 21, 2025 at 3:30 PM"
  const formattedDate = new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Extract booking_day and booking_time from the ISO date string
  const dateObj = new Date(date);
  const bookingDay = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  const bookingTime = dateObj.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS

  return (
    <View 
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 12,
      }}
    >
      {/* Header with Icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View 
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primaryMuted,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="calendar" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>
            Next Appointment
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
            Barber:
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 6 }}>
            {barber}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cut-outline" size={18} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
            Service:
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 6 }}>
            {cut}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.secondaryMuted,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.secondary,
          }}
          onPress={() => setShowRescheduleModal(true)}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.secondary, textAlign: 'center', fontWeight: '600', fontSize: 14 }}>
            Reschedule
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.errorMuted,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.error,
          }}
          onPress={() => setShowCancelModal(true)}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.error, textAlign: 'center', fontWeight: '600', fontSize: 14 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal 
          showModal={showCancelModal} 
          setShowModal={setShowCancelModal} 
          date={date} 
          formattedDate={formattedDate}
          bookingId={bookingId}
          onCancelSuccess={onCancelSuccess}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && bookingId && locationId && serviceVariationId && (
        <RescheduleModal
          visible={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          bookingId={bookingId}
          currentDate={bookingDay}
          currentTime={bookingTime}
          serviceName={cut}
          locationId={locationId}
          locationTimezone={locationTimezone}
          serviceVariationId={serviceVariationId}
          onRescheduleSuccess={() => {
            setShowRescheduleModal(false);
            if (onCancelSuccess) {
              onCancelSuccess(); // Reuse this callback to refresh the appointments
            }
          }}
        />
      )}
    </View>
  );
}
