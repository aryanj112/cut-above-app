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

		// If there's a Square booking ID, update it on Square
		let squareUpdateSuccess = false;
		if (booking.square_booking_id) {
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
					const currentBooking = bookingData.booking;
					const version = currentBooking?.version;

					if (!version) {
						console.error("Could not get booking version from Square");
					} else {
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
								body: JSON.stringify({
									booking: {
										...currentBooking,
										start_at: `${new_date}T${new_time}`,
										version: version,
									},
								}),
							}
						);

						if (!updateResponse.ok) {
							const errorBody = await updateResponse.text();
							console.error("Error updating booking on Square:", errorBody);
							// Continue anyway - we'll still update in Supabase
						} else {
							console.log("Successfully updated booking on Square");
							squareUpdateSuccess = true;
						}
					}
				} else {
					console.warn("Could not fetch booking from Square");
				}
			} catch (squareError) {
				console.error("Square API error:", squareError);
				// Continue anyway - we'll still update in Supabase
			}
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

