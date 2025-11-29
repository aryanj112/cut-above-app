// Component for rescheduling an existing appointment
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  currentDate: string;
  currentTime: string;
  serviceName: string;
  locationId: string;
  locationTimezone?: string;
  serviceVariationId: string;
  onRescheduleSuccess: () => void;
}

export default function RescheduleModal({
  visible,
  onClose,
  bookingId,
  currentDate,
  currentTime,
  serviceName,
  locationId,
  locationTimezone,
  serviceVariationId,
  onRescheduleSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<Date[] | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [currentStep, setCurrentStep] = useState<'date' | 'time'>('date');

  const handleDateSelect = async (day: any) => {
    const date = day.dateString;
    setSelectedDate(date);
    setIsLoadingSlots(true);
    setCurrentStep('time');

    try {
      const { data, error } = await supabase.functions.invoke('get-availability', {
        body: {
          date,
          location_id: locationId,
          service_variation_id: serviceVariationId,
          timezone: locationTimezone,
        },
      });

      if (error) {
        console.error('Error fetching time slots:', error);
        Alert.alert('Error', 'Could not load available times. Please try again.');
        setTimeSlots([]);
      } else if (!data || !data.availabilities) {
        console.warn('No availabilities returned');
        setTimeSlots([]);
      } else {
        const slots = data.availabilities.map((slot: any) => new Date(slot.start_at));
        setTimeSlots(slots);
      }
    } catch (err) {
      console.error('Error loading time slots:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleTimeSelect = (time: Date) => {
    const displayTime = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setSelectedTimeSlot(time);
    setSelectedTime(displayTime);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select both a date and time.');
      return;
    }

    setIsRescheduling(true);

    try {
      // Extract UTC time from the Date object
      const utcTime = selectedTimeSlot.toISOString().split('T')[1].split('.')[0];

      const { data, error } = await supabase.functions.invoke('update-booking', {
        body: {
          booking_id: bookingId,
          new_date: selectedDate,
          new_time: utcTime,
        },
      });

      if (error) {
        console.error('Error rescheduling booking:', error);
        Alert.alert(
          'Reschedule Failed',
          'An error occurred while rescheduling your appointment. Please try again.'
        );
      } else {
        console.log('Booking rescheduled successfully:', data);
        Alert.alert(
          'Appointment Rescheduled! 🎉',
          `Your appointment has been moved to ${formatDate(selectedDate)} at ${selectedTime}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onRescheduleSuccess();
                handleClose();
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTimeSlot(null);
    setTimeSlots(null);
    setCurrentStep('date');
    onClose();
  };

  const goBack = () => {
    if (currentStep === 'time') {
      setTimeSlots(null);
      setSelectedTime('');
      setSelectedTimeSlot(null);
      setCurrentStep('date');
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get today's date for minimum date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-2">
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={handleClose}
        />
        <View className="bg-white rounded-2xl w-full h-5/6 shadow-lg">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity
              onPress={currentStep === 'date' ? handleClose : goBack}
            >
              <Text className="text-lg font-semibold text-blue-600">
                {currentStep === 'date' ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold">Reschedule</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Progress Indicator */}
          <View className="flex-row justify-center items-center p-4 bg-gray-50">
            <View
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'date' ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              <Text className="text-white font-bold">1</Text>
            </View>
            <View
              className={`w-12 h-1 ${
                currentStep !== 'date' ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
            <View
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'time' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <Text
                className={`font-bold ${
                  currentStep !== 'date' ? 'text-white' : 'text-gray-600'
                }`}
              >
                2
              </Text>
            </View>
          </View>

          {/* Current Appointment Info */}
          <View className="mx-4 mt-2 mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Text className="text-xs text-gray-600 mb-1">Current Appointment</Text>
            <Text className="text-sm font-semibold text-gray-900">{serviceName}</Text>
            <Text className="text-xs text-gray-600 mt-1">
              {formatDate(currentDate)} at{' '}
              {new Date(`${currentDate}T${currentTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: locationTimezone || 'America/Los_Angeles',
              })}
            </Text>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Step 1: Date Selection */}
            {currentStep === 'date' && (
              <View>
                <Text className="text-2xl font-bold mb-4">Select New Date</Text>
                <View className="items-center">
                  <View className="w-full rounded-2xl overflow-hidden shadow-md">
                    <Calendar
                      onDayPress={handleDateSelect}
                      markedDates={{
                        [selectedDate]: {
                          selected: true,
                          selectedColor: '#3B82F6',
                        },
                      }}
                      minDate={today}
                      theme={{
                        calendarBackground: '#ffffff',
                        selectedDayBackgroundColor: '#3B82F6',
                        todayTextColor: '#3B82F6',
                        dayTextColor: '#000000',
                        monthTextColor: '#000000',
                        arrowColor: '#3B82F6',
                        textDayFontFamily: 'System',
                        textDayFontWeight: '600',
                        textMonthFontFamily: 'System',
                        textMonthFontWeight: '700',
                        textDayHeaderFontFamily: 'System',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Step 2: Time Selection - Loading */}
            {currentStep === 'time' && isLoadingSlots && (
              <View>
                <Text className="text-2xl font-bold mb-4">Loading Time Slots...</Text>
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              </View>
            )}

            {/* Step 2: Time Selection - No slots */}
            {currentStep === 'time' && !isLoadingSlots && timeSlots && timeSlots.length === 0 && (
              <View>
                <Text className="text-2xl font-bold mb-4">No Available Time Slots</Text>
                <Text className="text-gray-600">Please select a different date.</Text>
              </View>
            )}

            {/* Step 2: Time Selection - Available slots */}
            {currentStep === 'time' && !isLoadingSlots && timeSlots && timeSlots.length > 0 && (
              <View>
                <Text className="text-2xl font-bold mb-2">Select New Time</Text>
                <Text className="text-lg text-gray-600 mb-4">{formatDate(selectedDate)}</Text>

                <View className="flex-row flex-wrap gap-3">
                  {timeSlots.map((time) => {
                    const displayTime = time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <TouchableOpacity
                        key={time.toISOString()}
                        onPress={() => handleTimeSelect(time)}
                        className={`px-4 py-3 rounded-lg border-2 ${
                          selectedTime === displayTime
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            selectedTime === displayTime ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {displayTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Confirm Button */}
                {selectedTime && (
                  <TouchableOpacity
                    onPress={handleConfirmReschedule}
                    disabled={isRescheduling}
                    className={`mt-6 py-4 rounded-lg ${
                      isRescheduling ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                  >
                    {isRescheduling ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white font-bold ml-2">Rescheduling...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-center text-lg">
                        Confirm Reschedule
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
