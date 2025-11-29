// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

console.info("delete-booking server started");

Deno.serve(async (req) => {
	try {
		const { booking_id } = await req.json();
		
		if (!booking_id) {
			return new Response(
				JSON.stringify({ error: "Missing booking_id" }),
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

		// Fetch the booking from Supabase to get the square_booking_id
		const { data: booking, error: fetchError } = await supabase
			.from("bookings")
			.select("id, square_booking_id, user_id, booking_day, booking_time")
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

		// If there's a Square booking ID, cancel it on Square
		if (booking.square_booking_id) {
			try {
				// First, fetch the current booking version from Square
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
					const version = bookingData.booking?.version;

					// Cancel the booking on Square
					const cancelResponse = await fetch(
						`https://connect.squareup.com/v2/bookings/${booking.square_booking_id}/cancel`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"Square-Version": "2025-10-16",
								Authorization: `Bearer ${squareToken}`,
							},
							body: JSON.stringify({
								booking_version: version,
							}),
						}
					);

					if (!cancelResponse.ok) {
						const errorBody = await cancelResponse.text();
						console.error("Error canceling booking on Square:", errorBody);
						// Continue anyway - we'll still delete from Supabase
					} else {
						console.log("Successfully canceled booking on Square");
					}
				} else {
					console.warn("Could not fetch booking from Square, may already be deleted");
				}
			} catch (squareError) {
				console.error("Square API error:", squareError);
				// Continue anyway - we'll still delete from Supabase
			}
		}

		// Delete the booking from Supabase
		const { error: deleteError } = await supabase
			.from("bookings")
			.delete()
			.eq("id", booking_id);

		if (deleteError) {
			console.error("Error deleting booking from Supabase:", deleteError);
			return new Response(
				JSON.stringify({ 
					error: "Failed to delete booking",
					details: deleteError.message 
				}),
				{
					headers: { "Content-Type": "application/json" },
					status: 500,
				}
			);
		}

		return new Response(
			JSON.stringify({ 
				message: "Booking deleted successfully",
				booking_id: booking_id 
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

