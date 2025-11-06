import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Card } from '@/components/ui/card';
import { CartItem } from '../../app/types/CartItem';
import { BookingFormData } from '../../app/types/Appointment';

const { width } = Dimensions.get('window');

interface BookingModalProps {
  isVisible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalPrice: number;
  totalTime: number;
  onConfirmBooking: (bookingData: BookingFormData) => void;
}

export function BookingModal({
  isVisible,
  onClose,
  cartItems,
  totalPrice,
  totalTime,
  onConfirmBooking,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'details'>('date');

  const timeSlots = [
    {
      section: "Morning",
      times: ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"]
    },
    {
      section: "Afternoon", 
      times: ["12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"]
    },
    {
      section: "Evening",
      times: ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"]
    }
  ];

  // --- Helpers: timezone-safe local date handling ---

  // Build "YYYY-MM-DD" from a Date *in local time* (avoids UTC shift)
  function toLocalYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Parse "YYYY-MM-DD" into a local Date (no timezone shift)
  function parseLocalISODate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 0, 0, 0, 0); // local midnight
  }

  // Format header like "Monday, October 28, 2025" without UTC skew
  function formatDateLocal(dateString: string) {
    const d = parseLocalISODate(dateString);
    if (!d) return "";
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Parse "h:mm AM/PM" into 24h {h, m}
  function parse12h(timeLabel: string): { h: number; m: number } | null {
    const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!match) return null;
    let h = Number(match[1]) % 12;
    const m = Number(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM") h += 12;
    return { h, m };
  }

  // Is a given slot earlier than "now" when the selected day is today?
  function isPastTimeToday(dateStr: string, timeLabel: string): boolean {
    const sel = parseLocalISODate(dateStr);
    if (!sel) return false;
    const now = new Date();
    // If the selected date is not today (local), do not disable.
    if (sel.toDateString() !== now.toDateString()) return false;

    const hm = parse12h(timeLabel);
    if (!hm) return false;
    const slot = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), hm.h, hm.m, 0, 0);
    return slot.getTime() <= now.getTime();
  }

  // Today (local) in YYYY-MM-DD for Calendar.minDate (avoid UTC off-by-one)
  const todayLocalStr = useMemo(() => toLocalYYYYMMDD(new Date()), []);

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setCurrentStep('date');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateSelect = (day: any) => {
    // day.dateString is "YYYY-MM-DD". Keep it as-is (string), and always format using local-safe helpers.
    setSelectedDate(day.dateString);
    setSelectedTime('');
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    // guard: do nothing if this time is disabled
    if (selectedDate && isPastTimeToday(selectedDate, time)) return;
    setSelectedTime(time);
    setCurrentStep('details');
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !customerName || !customerPhone) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const bookingData: BookingFormData = {
      date: selectedDate,
      time: selectedTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    };

    onConfirmBooking(bookingData);
    handleClose();
  };

  const goBack = () => {
    if (currentStep === 'time') {
      setCurrentStep('date');
    } else if (currentStep === 'details') {
      setCurrentStep('time');
    }
  };

  return (
    <Modal
      visible={isVisible}
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
            <TouchableOpacity onPress={currentStep === 'date' ? handleClose : goBack}>
              <Text className="text-lg font-semibold text-blue-600">
                {currentStep === 'date' ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold">Book Appointment</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Progress Indicator */}
          <View className="flex-row justify-center items-center p-4 bg-gray-50">
            <View className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'date' ? 'bg-blue-600' : 'bg-green-600'}`}>
              <Text className="text-white font-bold">1</Text>
            </View>
            <View className={`w-12 h-1 ${currentStep !== 'date' ? 'bg-green-600' : 'bg-gray-300'}`} />
            <View className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'time' ? 'bg-blue-600' : currentStep === 'details' ? 'bg-green-600' : 'bg-gray-300'}`}>
              <Text className={`font-bold ${currentStep !== 'date' ? 'text-white' : 'text-gray-600'}`}>2</Text>
            </View>
            <View className={`w-12 h-1 ${currentStep === 'details' ? 'bg-green-600' : 'bg-gray-300'}`} />
            <View className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'details' ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <Text className={`font-bold ${currentStep === 'details' ? 'text-white' : 'text-gray-600'}`}>3</Text>
            </View>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Step 1: Date Selection */}
            {currentStep === 'date' && (
              <View>
                <Text className="text-2xl font-bold mb-4">Select a Date</Text>
                <View className="items-center">
                  <View className="w-full rounded-2xl overflow-hidden shadow-md">
                    <Calendar
                      onDayPress={handleDateSelect}
                      markedDates={{
                        [selectedDate]: { 
                          selected: true, 
                          selectedColor: '#3B82F6' 
                        }
                      }}
                      // Use local "today" string — prevents off-by-one minDate bug.
                      minDate={todayLocalStr}
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

            {/* Step 2: Time Selection */}
            {currentStep === 'time' && (
              <View>
                <Text className="text-2xl font-bold mb-2">Select a Time</Text>
                <Text className="text-lg text-gray-600 mb-4">
                  {formatDateLocal(selectedDate)}
                </Text>
                
                {timeSlots.map(({ section, times }) => (
                  <View key={section} className="mb-6">
                    <Text className="text-xl font-bold mb-3">{section}</Text>
                    <View className="flex-row flex-wrap gap-3">
                      {times.map((time) => {
                        const disabled = selectedDate ? isPastTimeToday(selectedDate, time) : false;
                        const selected = selectedTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            onPress={() => handleTimeSelect(time)}
                            disabled={disabled}
                            className={`px-4 py-3 rounded-lg border-2 ${
                              selected
                                ? 'bg-blue-600 border-blue-600'
                                : disabled
                                  ? 'bg-gray-100 border-gray-200'
                                  : 'bg-white border-gray-300'
                            } ${disabled ? 'opacity-50' : ''}`}
                          >
                            <Text
                              className={`font-semibold ${
                                selected ? 'text-white' : disabled ? 'text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Step 3: Customer Details */}
            {currentStep === 'details' && (
              <View>
                <Text className="text-2xl font-bold mb-4">Your Details</Text>
                
                {/* Booking Summary */}
                <Card className="mb-6 p-4">
                  <Text className="text-lg font-bold mb-2">Booking Summary</Text>
                  <Text className="text-gray-600 mb-1">
                    📅 {formatDateLocal(selectedDate)} at {selectedTime}
                  </Text>
                  <Text className="text-gray-600 mb-3">
                    ⏱️ Total time: {totalTime} minutes
                  </Text>
                  
                  <View className="border-t border-gray-200 pt-3">
                    {cartItems.map((item) => (
                      <View key={item.service.id} className="flex-row justify-between mb-1">
                        <Text className="flex-1">{item.service.name} x{item.quantity}</Text>
                        <Text className="font-semibold">${item.service.price * item.quantity}</Text>
                      </View>
                    ))}
                    <View className="border-t border-gray-200 pt-2 mt-2">
                      <View className="flex-row justify-between">
                        <Text className="text-lg font-bold">Total:</Text>
                        <Text className="text-lg font-bold">${totalPrice}</Text>
                      </View>
                    </View>
                  </View>
                </Card>

                {/* Customer Form */}
                <View className="space-y-4">
                  <View>
                    <Text className="text-base font-semibold mb-2">Name *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      placeholder="Enter your full name"
                      value={customerName}
                      onChangeText={setCustomerName}
                    />
                  </View>

                  <View>
                    <Text className="text-base font-semibold mb-2">Phone *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      placeholder="(555) 123-4567"
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View>
                    <Text className="text-base font-semibold mb-2">Email</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      placeholder="your.email@example.com"
                      value={customerEmail}
                      onChangeText={setCustomerEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text className="text-base font-semibold mb-2">Notes (Optional)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      placeholder="Any special requests or notes..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Button */}
          {currentStep === 'details' && (
            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={handleConfirmBooking}
                className="bg-blue-600 rounded-lg py-4"
                disabled={!customerName || !customerPhone}
              >
                <Text className="text-white text-lg font-bold text-center">
                  Confirm Booking - ${totalPrice}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}