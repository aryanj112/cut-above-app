import { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/booking/ServiceCards";
import { CartSummary } from "../../../components/booking/CartSummary";
import { BookingModal } from "../../../components/booking/BookingModal";
import { useCart } from "../../hooks/useCart";
import { Service } from "../../types";
import { BookingFormData, Appointment } from "../../types/Appointment";
import { supabase } from "../../../lib/supabase";

export default function BookingPage() {
	const [isCartExpanded, setIsCartExpanded] = useState(true);
	const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
	const regularServices: Service[] = services.services.filter((s) => !s.isDeal);
	const dealServices: Service[] = services.services.filter((s) => s.isDeal);
	const cart = useCart();

	// useEffect to call Supabase edge function
	useEffect(() => {
		const callEdgeFunction = async () => {
			const { data, error } = await supabase.functions.invoke(
				"get-services",
			);

			if (error) {
				console.error("Error calling edge function:", error);
			} else {
				console.log("Edge function response:", data);
			}
		};

		// Call the edge function when component mounts
		callEdgeFunction();
	}, []); // Empty dependency array means this runs once on mount

	const handleBookAppointment = () => {
		if (cart.cartItems.length === 0) {
			Alert.alert(
				"Empty Cart",
				"Please add some services to your cart before booking."
			);
			return;
		}
		setIsBookingModalVisible(true);
	};

	const handleConfirmBooking = (bookingData: BookingFormData) => {
		// Create the appointment object
		const appointment: Appointment = {
			id: `apt_${Date.now()}`, // Simple ID generation
			date: bookingData.date,
			time: bookingData.time,
			services: [...cart.cartItems],
			totalPrice: cart.getTotalPrice(),
			totalTime: cart.getTotalTime(),
			customerName: bookingData.customerName,
			customerPhone: bookingData.customerPhone,
			customerEmail: bookingData.customerEmail,
			status: "pending",
			notes: bookingData.notes,
			createdAt: new Date().toISOString(),
		};

		// Here you would typically save to your backend/database
		console.log("Booking confirmed:", appointment);

		// Show success message
		Alert.alert(
			"Booking Confirmed! 🎉",
			`Your appointment is scheduled for ${bookingData.date} at ${bookingData.time}. We'll send you a confirmation shortly.`,
			[
				{
					text: "OK",
					onPress: () => {
						cart.clearCart(); // Clear the cart after successful booking
						setIsBookingModalVisible(false);
					},
				},
			]
		);
	};

	const handleCloseModal = () => {
		setIsBookingModalVisible(false);
	};

	// Calculate bottom padding for ScrollView
	const cartHeight = isCartExpanded ? 300 : 60;
	const scrollViewBottomPadding =
		cart.cartItems.length > 0 ? cartHeight + 20 : 20;

	return (
		<View className="flex-1">
			<ScrollView
				className="p-[2rem]"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: scrollViewBottomPadding,
				}}
			>
				{/* Regular Services */}
				<View className="mb-[1.5rem]">
					<Text className="mb-[1.5rem] text-[2rem] font-bold">Bookings</Text>
					{regularServices.map((service) => (
						<ServiceCard
							key={service.id}
							service={service}
							quantity={cart.getItemQuantity(service.id)}
							onAdd={() => cart.addToCart(service)}
							onIncrease={() => cart.increaseQuantity(service.id)}
							onDecrease={() => cart.decreaseQuantity(service.id)}
						/>
					))}
				</View>

				{/* Deals */}
				<View>
					<Text className="mb-[1.5rem] text-[2rem] font-bold">Deals</Text>
					{dealServices.map((service) => (
						<ServiceCard
							key={service.id}
							service={service}
							quantity={cart.getItemQuantity(service.id)}
							onAdd={() => cart.addToCart(service)}
							onIncrease={() => cart.increaseQuantity(service.id)}
							onDecrease={() => cart.decreaseQuantity(service.id)}
						/>
					))}
				</View>
			</ScrollView>

			<CartSummary
				cartItems={cart.cartItems}
				getTotalPrice={cart.getTotalPrice}
				getTotalTime={cart.getTotalTime}
				onBookAppointment={handleBookAppointment}
				onExpandedChange={setIsCartExpanded}
			/>

			{/* Booking Modal */}
			<BookingModal
				isVisible={isBookingModalVisible}
				onClose={handleCloseModal}
				cartItems={cart.cartItems}
				totalPrice={cart.getTotalPrice()}
				totalTime={cart.getTotalTime()}
				onConfirmBooking={handleConfirmBooking}
			/>
		</View>
	);
}
