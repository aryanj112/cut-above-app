// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info("server started");
Deno.serve(async (req) => {
	try {
		const { date, location_id, service_variation_id, timezone } = await req.json();

		// Validate required parameters
		if (!date) {
			return new Response(
				JSON.stringify({
					error: "Missing required parameter: date"
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" }
				}
			);
		}

		// Use the provided location_id or fallback to default
		const locationId = location_id || "LD3K70KJMNH4G";

		// Calculate date range for the selected day in the location's timezone
		// Parse date string manually to avoid timezone issues
		const [year, month, day] = date.split('-').map(Number);
		
		let startOfDay: Date;
		let endOfDay: Date;
		
		if (timezone) {
			// Helper function to convert a local date/time in a specific timezone to UTC
			const getUTCDateFromTimezone = (dateStr: string, timeStr: string, tz: string): Date => {
				// Create an ISO string in the target timezone
				const isoString = `${dateStr}T${timeStr}`;
				
				// Use Intl to parse this time in the given timezone
				// We create a date, format it in the target timezone, then calculate offset
				const testDate = new Date(isoString + 'Z'); // Start with UTC interpretation
				
				const formatter = new Intl.DateTimeFormat('en-US', {
					timeZone: tz,
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				});
				
				// Format the test date in the target timezone
				const parts = formatter.formatToParts(testDate);
				const tzYear = parts.find(p => p.type === 'year')?.value;
				const tzMonth = parts.find(p => p.type === 'month')?.value;
				const tzDay = parts.find(p => p.type === 'day')?.value;
				const tzHour = parts.find(p => p.type === 'hour')?.value;
				const tzMinute = parts.find(p => p.type === 'minute')?.value;
				const tzSecond = parts.find(p => p.type === 'second')?.value;
				
				const tzString = `${tzYear}-${tzMonth}-${tzDay}T${tzHour}:${tzMinute}:${tzSecond}`;
				
				// Calculate offset
				const offset = testDate.getTime() - new Date(tzString).getTime();
				
				// Apply offset to our desired local time
				return new Date(new Date(isoString).getTime() + offset);
			};
			
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			startOfDay = getUTCDateFromTimezone(dateStr, '00:00:00', timezone);
			endOfDay = getUTCDateFromTimezone(dateStr, '23:59:59', timezone);
		} else {
			// Fallback to UTC if no timezone provided
			startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
			endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
		}

		// Build the query filter
		const queryFilter: any = {
			location_id: locationId,
			start_at_range: {
				start_at: startOfDay.toISOString(),
				end_at: endOfDay.toISOString(),
			},
		};

		// Only add segment_filters if service_variation_id is provided
		if (service_variation_id) {
			queryFilter.segment_filters = [
				{
					service_variation_id: service_variation_id,
				},
			];
		}

		console.log("Fetching availability for:", {
			locationId,
			date,
			timezone,
			dateRange: {
				start: startOfDay.toISOString(),
				end: endOfDay.toISOString()
			}
		});

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
						filter: queryFilter,
					},
				}),
				method: "POST",
			}
		);

		if (!availability.ok) {
			const errorText = await availability.text();
			console.error("Square API Error:", errorText);
			return new Response(
				JSON.stringify({
					error: "Failed to fetch availability from Square",
					details: errorText
				}),
				{
					status: availability.status,
					headers: { "Content-Type": "application/json" }
				}
			);
		}

		const data = await availability.json();
		return new Response(
			JSON.stringify(data),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			}
		);
	} catch (error) {
		console.error("Error in get-availability function:", error);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				message: error.message
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" }
			}
		);
	}
});
