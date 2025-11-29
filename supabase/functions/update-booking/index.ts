// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

console.info("update-booking server started");

Deno.serve(async (req) => {
	try {
		const { booking_id, new_date, new_time } = await req.json();
		
		if (!booking_id || !new_date || !new_time) {
			return new Response(
				JSON.stringify({ error: "Missing required fields: booking_id, new_date, new_time" }),
				{
					headers: { "Content-Type": "application/json" },
					status: 400,
				}
			);
		}

		const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN");

		if (!adminKey || !supabaseUrl || !squareToken) {
			return new Response(
				JSON.stringify({ error: "Missing environment variables" }),
				{
					headers: { "Content-Type": "application/json" },
					status: 500,
				}
			);
		}

		const supabase = createClient(
			supabaseUrl,
			Deno.env.get("SUPABASE_ANON_KEY") ?? "",
			{
				global: {
					headers: {
						Authorization: `Bearer ${adminKey}`,
					},
				},
			}
		);

		// Fetch the booking from Supabase to get the square_booking_id and other details
		const { data: booking, error: fetchError } = await supabase
			.from("bookings")
			.select("*")
			.eq("id", booking_id)
			.single();

		if (fetchError || !booking) {
			console.error("Error fetching booking:", fetchError);
			return new Response(
				JSON.stringify({ 
					error: "Booking not found",
					details: fetchError?.message 
				}),
				{
					headers: { "Content-Type": "application/json" },
					status: 404,
				}
			);
		}

		// Check if appointment is at least 24 hours away
		const appointmentTime = new Date(`${booking.booking_day}T${booking.booking_time}Z`);
		const now = new Date();
		const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
		
		if (hoursUntilAppointment < 24) {
			console.warn(`Reschedule attempt blocked: Only ${hoursUntilAppointment.toFixed(1)} hours until appointment`);
			return new Response(
				JSON.stringify({ 
					error: "Cannot reschedule within 24 hours",
					message: "Appointments can only be rescheduled at least 24 hours in advance. Please contact us directly for assistance.",
					hours_until_appointment: hoursUntilAppointment
				}),
				{
					headers: { "Content-Type": "application/json" },
					status: 400,
				}
			);
		}

		// If there's a Square booking ID, update it on Square
		let squareUpdateSuccess = false;
		let squareWarning = null;
		
		if (booking.square_booking_id) {
			console.log("Found Square booking ID:", booking.square_booking_id);
			try {
				// First, fetch the current booking from Square to get the version
				const getBookingResponse = await fetch(
					`https://connect.squareup.com/v2/bookings/${booking.square_booking_id}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Square-Version": "2025-10-16",
							Authorization: `Bearer ${squareToken}`,
						},
					}
				);

				if (getBookingResponse.ok) {
					const bookingData = await getBookingResponse.json();
					console.log("Square booking data:", JSON.stringify(bookingData, null, 2));
					
					const currentBooking = bookingData.booking;
					const version = currentBooking?.version;

					// Check for null/undefined explicitly (version can be 0)
					if (version === null || version === undefined) {
						console.error("Could not get booking version from Square");
						console.error("Booking data structure:", bookingData);
					} else {
						// Ensure time is in UTC format with Z suffix
						const utcTime = new_time.endsWith('Z') ? new_time : `${new_time}Z`;
						const newStartAt = `${new_date}T${utcTime}`;
						
						console.log("Updating Square booking to:", newStartAt);
						console.log("Current version:", version);
						
						// Build the update payload - only send necessary fields
						const updatePayload = {
							booking: {
								version: version,
								start_at: newStartAt,
								location_id: currentBooking.location_id,
								customer_id: currentBooking.customer_id,
								appointment_segments: currentBooking.appointment_segments,
							}
						};
						
						console.log("Update payload:", JSON.stringify(updatePayload, null, 2));
						
						// Update the booking on Square
						const updateResponse = await fetch(
							`https://connect.squareup.com/v2/bookings/${booking.square_booking_id}`,
							{
								method: "PUT",
								headers: {
									"Content-Type": "application/json",
									"Square-Version": "2025-10-16",
									Authorization: `Bearer ${squareToken}`,
								},
								body: JSON.stringify(updatePayload),
							}
						);

						if (!updateResponse.ok) {
							const errorBody = await updateResponse.text();
							console.error("Error updating booking on Square. Status:", updateResponse.status);
							console.error("Error body:", errorBody);
							// Continue anyway - we'll still update in Supabase
						} else {
							const updateData = await updateResponse.json();
							console.log("Successfully updated booking on Square:", updateData);
							squareUpdateSuccess = true;
						}
					}
				} else {
					const errorBody = await getBookingResponse.text();
					console.error("Could not fetch booking from Square. Status:", getBookingResponse.status);
					console.error("Response:", errorBody);
				}
			} catch (squareError) {
				console.error("Square API error:", squareError);
				squareWarning = "Square API error: " + (squareError?.message || "Unknown error");
				// Continue anyway - we'll still update in Supabase
			}
		} else {
			console.warn("No Square booking ID found for this booking. Will only update Supabase.");
			squareWarning = "No Square booking ID found. Only Supabase was updated.";
		}

		// Update the booking in Supabase
		const { error: updateError } = await supabase
			.from("bookings")
			.update({
				booking_day: new_date,
				booking_time: new_time,
			})
			.eq("id", booking_id);

		if (updateError) {
			console.error("Error updating booking in Supabase:", updateError);
			return new Response(
				JSON.stringify({ 
					error: "Failed to update booking",
					details: updateError.message 
				}),
				{
					headers: { "Content-Type": "application/json" },
					status: 500,
				}
			);
		}

		return new Response(
			JSON.stringify({ 
				message: "Booking updated successfully",
				booking_id: booking_id,
				square_updated: squareUpdateSuccess,
				square_warning: squareWarning,
				new_date,
				new_time,
			}),
			{
				headers: { "Content-Type": "application/json" },
				status: 200,
			}
		);
	} catch (err) {
		console.error("Unexpected error:", err);
		return new Response(
			JSON.stringify({ 
				error: "Internal server error",
				details: err?.message ?? "Unknown error" 
			}),
			{
				headers: { "Content-Type": "application/json" },
				status: 500,
			}
		);
	}
});

