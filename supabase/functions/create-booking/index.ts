// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
console.info("server started");
Deno.serve(async (req) => {
	const payload = await req.json();
	const adminKey = await Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

	const supabase = await createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_ANON_KEY") ?? "",
		{
			global: {
				headers: {
					Authorization: `Bearer ${adminKey}`,
				},
			},
		}
	);

	// verify that this row that was inserted is actually in the bookings table
	const { data, error } = await supabase
		.from("bookings")
		.select("user_id, service_id, booking_day, booking_time, notes")
		.eq("id", payload.record.id)
		.single();

	let booking_data = data;

	// handle error
	if (error) {
		console.log("error", error);
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
				status: 400,
			}
		);
	}

	await console.log("booking_data", booking_data);

	if (payload.type == "INSERT") {
		let user_id = payload.record.user_id;

		// use the user_id to fetch square_id for user's profile
		const { data, error } = await supabase
			.from("profiles")
			.select("square_id")
			.eq("id", user_id)
			.single();

		// handle error
		if (error) {
			return new Response(
				JSON.stringify({
					error: error.message,
				}),
				{
					headers: {
						"Content-Type": "application/json",
					},
					status: 400,
				}
			);
		}

		let square_id = data?.square_id;
		await console.log(booking_data);

		// create a booking on square
		const createClientResponse = await fetch(
			"https://connect.squareup.com/v2/bookings",
			{
				method: "POST",
				headers: {
					"Content-type": "application/json",
					"Square-Version": "2025-10-16",
					Authorization: `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`,
				},
				body: JSON.stringify({
					booking: {
						customer_id: square_id,
						location_id: "LD3K70KJMNH4G",
						location_type: "BUSINESS_LOCATION",
						start_at: `${booking_data.booking_day}T${booking_data.booking_time}Z`,
						appointment_segments: [
							{
								team_member_id: "TMTmMRxU9_Ci4_x3",
								service_variation_id: booking_data.service_id,
								service_variation_version: 1,
							},
						],
						customer_note: booking_data.notes || "",
					},
				}),
			}
		);

		// handle error creating booking on square
		if (!createClientResponse.ok) {
			const errorBody = await createClientResponse.text();
			console.log("Error creating booking on Square:", errorBody);
			return new Response(
				JSON.stringify({
					error: "Error creating booking on Square",
				}),
				{
					headers: {
						"Content-Type": "application/json",
					},
					status: 400,
				}
			);
		}
	}

	return new Response(
		JSON.stringify({
			message: "Booking created successfully",
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
});
