// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info("server started");
Deno.serve(async (req) => {
	const { date } = await req.json();

	const availability = await fetch(
		"https://connect.squareup.com/v2/bookings/availability/search",
		{
			headers: {
				"Square-Version": "2025-10-16",
				Authorization: `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`,
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				query: {
					filter: {
						location_id: "LD3K70KJMNH4G",
						booking_id: "",
						start_at_range: {
							end_at: "2025-12-09T00:00:00.000Z",
							start_at: "2025-11-09T23:59:00.000Z",
						},
						segment_filters: [
							{
								service_variation_id: "E7WSCHQXNXKO5T4I7N35ZW4W",
							},
						],
					},
				},
			}),
			method: "POST",
		}
	);
	return availability;
});
