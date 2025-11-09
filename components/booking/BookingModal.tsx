import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	Alert,
	TextInput,
	Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Card } from "@/components/ui/card";
import { CartItem } from "../../app/types/CartItem";
import { BookingFormData } from "../../app/types/Appointment";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

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
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [customerNotes, setCustomerNotes] = useState("");
	const [currentStep, setCurrentStep] = useState<"date" | "time" | "details">(
		"date"
	);
	const [timeSlots, setTimeSlots] = useState<Date[] | null>(null);

	const resetForm = () => {
		setSelectedDate("");
		setSelectedTime("");
		setCurrentStep("date");
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleDateSelect = (day: any) => {
		setSelectedDate(day.dateString);
		setCurrentStep("time");
		handleRetrieveTimeSlots(day.dateString);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
		setCurrentStep("details");
	};

	const handleConfirmBooking = async () => {
		// fetch customer details from supabase auth user metadata
		const user = await supabase.auth.getUser();
		const customerName = user.data.user?.user_metadata.full_name || "";
		const customerPhone = user.data.user?.user_metadata.phone || "";
		const customerEmail = user.data.user?.email || "";
		const notes = "";

		const bookingData: BookingFormData = {
			date: selectedDate,
			time: selectedTime?.replace(/\s*[AP]M/i, "") || "",
			customerName,
			customerPhone,
			customerEmail,
			notes,
		};

		onConfirmBooking(bookingData);
		handleClose();
	};

	const goBack = () => {
		if (currentStep === "time") {
			setTimeSlots(null);
			setCurrentStep("date");
		} else if (currentStep === "details") {
			setCurrentStep("time");
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const handleRetrieveTimeSlots = async (date: string) => {
		// fetch time slots from supabase edge function get-availabilities
		const { data, error } = await supabase.functions.invoke(
			"get-availability",
			{
				body: { date },
			}
		);

		if (error) {
			console.error("Error fetching time slots:", error);
			return;
		}

		let slots = data.availabilities.map((slot: any) => {
			return new Date(slot.start_at);
		});

		setTimeSlots(slots);
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
						<TouchableOpacity
							onPress={currentStep === "date" ? handleClose : goBack}
						>
							<Text className="text-lg font-semibold text-blue-600">
								{currentStep === "date" ? "Cancel" : "Back"}
							</Text>
						</TouchableOpacity>
						<Text className="text-lg font-bold">Book Appointment</Text>
						<View style={{ width: 60 }} />
					</View>

					{/* Progress Indicator */}
					<View className="flex-row justify-center items-center p-4 bg-gray-50">
						<View
							className={`w-8 h-8 rounded-full flex items-center justify-center ${
								currentStep === "date" ? "bg-blue-600" : "bg-green-600"
							}`}
						>
							<Text className="text-white font-bold">1</Text>
						</View>
						<View
							className={`w-12 h-1 ${
								currentStep !== "date" ? "bg-green-600" : "bg-gray-300"
							}`}
						/>
						<View
							className={`w-8 h-8 rounded-full flex items-center justify-center ${
								currentStep === "time"
									? "bg-blue-600"
									: currentStep === "details"
									? "bg-green-600"
									: "bg-gray-300"
							}`}
						>
							<Text
								className={`font-bold ${
									currentStep !== "date" ? "text-white" : "text-gray-600"
								}`}
							>
								2
							</Text>
						</View>
						<View
							className={`w-12 h-1 ${
								currentStep === "details" ? "bg-green-600" : "bg-gray-300"
							}`}
						/>
						<View
							className={`w-8 h-8 rounded-full flex items-center justify-center ${
								currentStep === "details" ? "bg-blue-600" : "bg-gray-300"
							}`}
						>
							<Text
								className={`font-bold ${
									currentStep === "details" ? "text-white" : "text-gray-600"
								}`}
							>
								3
							</Text>
						</View>
					</View>

					<ScrollView className="flex-1 p-4">
						{/* Step 1: Date Selection */}
						{currentStep === "date" && (
							<View>
								<Text className="text-2xl font-bold mb-4">Select a Date</Text>
								<View className="items-center">
									<View className="w-full rounded-2xl overflow-hidden shadow-md">
										<Calendar
											onDayPress={handleDateSelect}
											markedDates={{
												[selectedDate]: {
													selected: true,
													selectedColor: "#3B82F6",
												},
											}}
											minDate={new Date().toISOString().split("T")[0]}
											theme={{
												calendarBackground: "#ffffff",
												selectedDayBackgroundColor: "#3B82F6",
												todayTextColor: "#3B82F6",
												dayTextColor: "#000000",
												monthTextColor: "#000000",
												arrowColor: "#3B82F6",
												textDayFontFamily: "System",
												textDayFontWeight: "600",
												textMonthFontFamily: "System",
												textMonthFontWeight: "700",
												textDayHeaderFontFamily: "System",
												textDayHeaderFontWeight: "600",
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
						{currentStep === "time" && timeSlots === null && (
							<View>
								<Text className="text-2xl font-bold mb-4">
									Loading Time Slots...
								</Text>
							</View>
						)}
						{currentStep === "time" && timeSlots && timeSlots.length === 0 && (
							<View>
								<Text className="text-2xl font-bold mb-4">
									No Available Time Slots
								</Text>
								<Text className="text-gray-600">
									Please select a different date.
								</Text>
							</View>
						)}
						{currentStep === "time" && timeSlots && timeSlots.length > 0 && (
							<View>
								<Text className="text-2xl font-bold mb-2">Select a Time</Text>
								<Text className="text-lg text-gray-600 mb-4">
									{formatDate(selectedDate)}
								</Text>

								<View className="flex-row flex-wrap gap-3">
									{timeSlots.map((time) => (
										<TouchableOpacity
											key={time.toLocaleTimeString()}
											onPress={() =>
												handleTimeSelect(time.toLocaleTimeString())
											}
											className={`px-4 py-3 rounded-lg border-2 ${
												selectedTime === time.toLocaleTimeString()
													? "bg-blue-600 border-blue-600"
													: "bg-white border-gray-300"
											}`}
										>
											<Text
												className={`font-semibold ${
													selectedTime === time.toLocaleTimeString()
														? "text-white"
														: "text-gray-800"
												}`}
											>
												{time.toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						)}

						{/* Step 3: Customer Details */}
						{currentStep === "details" && (
							<View className="px-4">
								<Text className="text-2xl font-bold mb-4">Your Details</Text>

								{/* Booking Summary */}
								<Card className="mb-6 p-0">
									<Text className="text-lg font-bold mb-2">
										Booking Summary
									</Text>
									<Text className="text-gray-600 mb-1">
										📅 {formatDate(selectedDate)} at {selectedTime}
									</Text>
									<Text className="text-gray-600 mb-3">
										⏱️ Total time: {totalTime} minutes
									</Text>

									<View className="border-t border-gray-200 pt-3">
										{cartItems.map((item) => (
											<View
												key={item.service.id}
												className="flex-row justify-between mb-1"
											>
												<Text className="flex-1">
													{item.service.name} x{item.quantity}
												</Text>
												<Text className="font-semibold">
													${item.service.price * item.quantity}
												</Text>
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

								{/* Additional Notes Input */}
								<Text className="text-lg font-bold mb-2">Additional Notes</Text>
								<TextInput
									className="border border-gray-300 rounded-lg p-3 mb-6 h-24 text-gray-800"
									placeholder="Any special requests or information..."
									multiline
									numberOfLines={4}
									onChangeText={(text) => {
										setCustomerNotes(text);
									}}
								/>
							</View>
						)}
					</ScrollView>

					{/* Footer Button */}
					{currentStep === "details" && (
						<View className="p-4 border-t border-gray-200">
							<TouchableOpacity
								onPress={handleConfirmBooking}
								className="bg-blue-600 rounded-lg py-4"
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
