import { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert, TouchableOpacity } from "react-native";
import services from "../../../data/services.json";
import { ServiceCard } from "../../../components/booking/ServiceCards";
import { CartSummary } from "../../../components/booking/CartSummary";
import { BookingModal } from "../../../components/booking/BookingModal";
import { useCart } from "../../hooks/useCart";
import { Service } from "../../types";
import { BookingFormData, Appointment } from "../../types/Appointment";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function BookingPage() {
	const [isCartExpanded, setIsCartExpanded] = useState(true);
	const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
	const [regularServices, setRegularServices] = useState<Service[]>([]);
	const dealServices: Service[] = services.services.filter((s) => s.isDeal);
	const cart = useCart();
	const { colors, colorMode, toggleColorMode } = useTheme();

	// useEffect to call Supabase edge function
	useEffect(() => {
		const callEdgeFunction = async () => {
			const { data, error } = await supabase.functions.invoke("get-services");

			if (error) {
				console.error("Error calling edge function:", error);
			} else {
				// console.log("Edge function response:", data);

				// Map Square API service data to your Service type
				const mappedServices: Service[] =
					data.objects
						?.map((squareItem: any) => {
							const itemData = squareItem.item_data;
							return {
								id: squareItem.id,
								name: itemData?.name || "Unknown Service",
								price: itemData?.variations?.[0]?.item_variation_data
									?.price_money?.amount
									? itemData.variations[0].item_variation_data.price_money
											.amount / 100
									: 0, // Convert cents to dollars
								timeMin: itemData?.service_duration
									? Math.round(itemData.service_duration / 60)
									: 15, // Convert seconds to minutes
								isDeal: itemData?.is_deal || false, // Check if it's marked as a deal
							};
						})
						.filter((service: Service) => service.name !== "Unknown Service") ||
					[];

				// console.log("Mapped services:", mappedServices);
				setRegularServices(mappedServices);
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
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Header with Theme Toggle */}
			<View 
				style={{ 
					paddingTop: 60,
					paddingHorizontal: 20,
					paddingBottom: 20,
					backgroundColor: colors.background,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				}}
			>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
					<Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
						Book Services
					</Text>
					<TouchableOpacity
						onPress={toggleColorMode}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							backgroundColor: colors.backgroundSecondary,
							justifyContent: 'center',
							alignItems: 'center',
							borderWidth: 1,
							borderColor: colors.border,
						}}
					>
						<Ionicons 
							name={colorMode === 'dark' ? 'sunny' : 'moon'} 
							size={22} 
							color={colors.text} 
						/>
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView
				style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: scrollViewBottomPadding,
				}}
			>
				{/* Regular Services */}
				<View style={{ marginBottom: 24 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
						<View 
							style={{ 
								width: 4, 
								height: 28, 
								backgroundColor: colors.primary, 
								marginRight: 12,
								borderRadius: 2,
							}} 
						/>
						<Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
							Services
						</Text>
					</View>
					{regularServices?.map((service) => (
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
				{dealServices.length > 0 && (
					<View style={{ marginBottom: 24 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
							<View 
								style={{ 
									width: 4, 
									height: 28, 
									backgroundColor: colors.secondary, 
									marginRight: 12,
									borderRadius: 2,
								}} 
							/>
							<Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
								Special Deals
							</Text>
							<View 
								style={{ 
									backgroundColor: colors.secondaryMuted,
									paddingHorizontal: 8,
									paddingVertical: 4,
									borderRadius: 8,
									marginLeft: 12,
								}}
							>
								<Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '600' }}>
									💰 Save More
								</Text>
							</View>
						</View>
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
				)}
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
