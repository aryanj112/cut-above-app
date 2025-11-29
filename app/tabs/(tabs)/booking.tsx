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
import parseSquareCatalogToServices from "../../utils/service_parser";

export default function BookingPage() {
	const [isCartExpanded, setIsCartExpanded] = useState(true);
	const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
	const [regularServices, setRegularServices] = useState<Service[]>([]);
	const [dealServices, setDealServices] = useState<Service[]>([]);
	const [locations, setLocations] = useState<{ id: string; name: string; timezone?: string }[]>(
		[]
	);
	const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
	const cart = useCart();
	const { colors, colorMode, toggleColorMode } = useTheme();

	// useEffect to call Supabase edge function
	useEffect(() => {
		const callEdgeFunction = async () => {
			const { data: locationsData, error: locationsError } =
				await supabase.functions.invoke("get-locations");

			if (locationsError) {
				console.error(
					"Error calling get-locations edge function:",
					locationsError
				);
			} else {
				// Assuming data contains an array of locations, we take the first one
				if (locationsData?.locations && locationsData.locations.length > 0) {
					// map to only include the business name, id, and timezone
					const mappedLocations = locationsData.locations.map(
						(location: any) => ({
							id: location.id,
							name: location.business_name,
							timezone: location.timezone,
						})
					);
					// store in state for UI, but also keep the local copy to avoid
					// relying on the (async) state update when mapping services below
					setLocations(mappedLocations);
				}
			}

			const { data: servicesData, error: servicesError } =
				await supabase.functions.invoke("get-services");

			if (servicesError) {
				console.error(
					"Error calling get-services edge function:",
					servicesError
				);
			} else {
				//console.log("Edge function response:", servicesData);

				// Map Square API service data to your Service type
				// Important: use the locally-mapped locations (if present) instead
				// of the `locations` state variable which won't reflect the
				// newly-set locations immediately due to setState being async.
				const effectiveLocations =
					locations && locations.length > 0
						? locations
						: locationsData &&
						  locationsData.locations &&
						  locationsData.locations.length > 0
						? locationsData.locations.map((location: any) => ({
								id: location.id,
								name: location.business_name,
								timezone: location.timezone,
						  }))
						: [];

				const mappedServices: Service[] = parseSquareCatalogToServices(
					servicesData,
					effectiveLocations
				);

				// Separate regular services and deals
				setRegularServices(mappedServices.filter(s => !s.isDeal));
				setDealServices(mappedServices.filter(s => s.isDeal));
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

	const handleConfirmBooking = async (bookingData: BookingFormData) => {
		const booking = {
			booking_day: bookingData.date,
			booking_time: bookingData.time,
			user_id: await supabase.auth
				.getUser()
				.then(({ data }) => data.user?.id || ""),
			service_id: cart.getCartVariationIds()[0], // Use actual Square variation ID
			booking_length: cart.getTotalTime(),
			notes: bookingData.notes || "",
			location_id: selectedLocation,
		};

		// create a booking the bookings table of supabase
		await supabase
			.from("bookings")
			.insert(booking)
			.then(({ data, error }) => {
				if (error) {
					console.error("Error creating booking:", error);
					Alert.alert(
						"Booking Failed",
						"An error occurred while creating your booking. Please try again."
					);
				} else {
					console.log("Booking created successfully:", data);
				}
			});

		// Show success message
		await Alert.alert(
			"Booking Confirmed! 🎉",
			`Your appointment is scheduled for ${bookingData.displayDate || bookingData.date} at ${bookingData.displayTime || bookingData.time}. We'll send you a confirmation shortly.`,
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

	const handleLocationSelect = (locationId: string) => {
		setSelectedLocation(locationId);
	};

	const handleBackToLocationSelect = () => {
		setSelectedLocation(null);
		cart.clearCart();
	};

	// Filter services based on selected location
	const filteredServices = selectedLocation
		? regularServices.filter((s) => s.location_id === selectedLocation)
		: regularServices;
	
	const filteredDeals = selectedLocation
		? dealServices.filter((s) => s.location_id === selectedLocation)
		: dealServices;

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
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
						{selectedLocation && (
							<TouchableOpacity
								onPress={handleBackToLocationSelect}
								style={{
									width: 44,
									height: 44,
									borderRadius: 22,
									backgroundColor: colors.backgroundSecondary,
									justifyContent: "center",
									alignItems: "center",
									borderWidth: 1,
									borderColor: colors.border,
									marginRight: 12,
								}}
							>
								<Ionicons
									name="arrow-back"
									size={22}
									color={colors.text}
								/>
							</TouchableOpacity>
						)}
						<Text
							style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}
						>
							Book Services
						</Text>
					</View>
					<TouchableOpacity
						onPress={toggleColorMode}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							backgroundColor: colors.backgroundSecondary,
							justifyContent: "center",
							alignItems: "center",
							borderWidth: 1,
							borderColor: colors.border,
						}}
					>
						<Ionicons
							name={colorMode === "dark" ? "sunny" : "moon"}
							size={22}
							color={colors.text}
						/>
					</TouchableOpacity>
				</View>
			</View>

			{selectedLocation === null && locations.length > 0 && (
				<View
					className="px-5 pt-5 pb-5 border-b"
					style={{
						borderBottomColor: colors.border,
						backgroundColor: colors.backgroundSecondary,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 16,
						}}
					>
						<View
							style={{
								width: 4,
								height: 28,
								backgroundColor: colors.primary,
								marginRight: 12,
								borderRadius: 2,
							}}
						/>
						<Text
							style={{ fontSize: 24, fontWeight: "700", color: colors.text }}
						>
							Select Category
						</Text>
					</View>

					{/* Full-width buttons styled like service cards */}
					<View className="space-y-3">
						{locations.map((location) => {
							const selected = selectedLocation === location.id;
							return (
								<TouchableOpacity
									key={location.id}
									onPress={() => handleLocationSelect(location.id)}
									activeOpacity={0.85}
									className="w-full rounded-lg px-4 py-4"
									style={{
										backgroundColor: selected
											? colors.primary
											: colors.background,
										borderWidth: 1,
										borderColor: selected ? colors.primary : colors.border,
									}}
								>
									<Text
										className="text-lg font-semibold"
										style={{ color: selected ? "#fff" : colors.text }}
									>
										{location.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			)}

			{selectedLocation && (
				<ScrollView
					style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingBottom: scrollViewBottomPadding,
					}}
				>
					{/* Regular Services */}
					<View style={{ marginBottom: 24 }}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 16,
							}}
						>
							<View
								style={{
									width: 4,
									height: 28,
									backgroundColor: colors.primary,
									marginRight: 12,
									borderRadius: 2,
								}}
							/>
							<Text
								style={{ fontSize: 24, fontWeight: "700", color: colors.text }}
							>
								Services
							</Text>
						</View>
						{filteredServices?.map((service) => (
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
					{filteredDeals.length > 0 && (
						<View style={{ marginBottom: 24 }}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginBottom: 16,
								}}
							>
								<View
									style={{
										width: 4,
										height: 28,
										backgroundColor: colors.secondary,
										marginRight: 12,
										borderRadius: 2,
									}}
								/>
								<Text
									style={{
										fontSize: 24,
										fontWeight: "700",
										color: colors.text,
									}}
								>
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
									<Text
										style={{
											color: colors.secondary,
											fontSize: 12,
											fontWeight: "600",
										}}
									>
										💰 Save More
									</Text>
								</View>
							</View>
							{filteredDeals.map((service) => (
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
			)}

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
				locationId={selectedLocation}
				locationTimezone={locations.find(loc => loc.id === selectedLocation)?.timezone}
			/>
		</View>
	);
}
