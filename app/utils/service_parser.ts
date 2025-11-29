/**
 * Example Service TypeScript interface for reference:
 * export interface Service {
 *   id: string;
 *   name: string;
 *   price: number;       // dollars (float), e.g. 28.00
 *   timeMin: number;     // minutes (integer or float)
 *   isDeal: boolean;
 *   location_id: string;
 * }
 */

/**
 * Parse Square catalog JSON into array of Service objects (one per location).
 *
 * @param {Object} catalog - the Square catalog JSON (root object containing "objects" array)
 * @param {{id: string, name: string}[]} locations - list of all locations available in the system
 * @returns {Service[]} - array of services (one per location/variation)
 */

export default function parseSquareCatalogToServices(catalog, locations) {
	if (!catalog || !Array.isArray(catalog.objects)) return [];

	// Helper: convert cents (Square amount) to dollars as a number
	const centsToDollars = (amountCents) => {
		if (typeof amountCents !== "number") return 0;
		// divide by 100 preserving cents as decimal
		return amountCents / 100;
	};

	// Helper: find location by id in provided locations list
	const findLocation = (locId) => locations.find((l) => l.id === locId);

	const services = [];

	for (const obj of catalog.objects) {
		// We're only interested in items
		if (!obj || obj.type !== "ITEM" || !obj.item_data) continue;

		const item = obj;
		const itemData = item.item_data;
		const itemName = itemData.name || "Unnamed Item";

		// Some items might contain multiple variations
		const variations = Array.isArray(itemData.variations)
			? itemData.variations
			: [];

		for (const variation of variations) {
			// variation may be top-level "ITEM_VARIATION" entries
			const vdata = variation.item_variation_data || {};
			const variationId = variation.id || (vdata && vdata.item_id) || null;
			const variationName = vdata.name || "Default";
			const basePriceCents =
				vdata.price_money && typeof vdata.price_money.amount === "number"
					? vdata.price_money.amount
					: null;
			const basePrice =
				basePriceCents !== null ? centsToDollars(basePriceCents) : 0;

			// service_duration is in milliseconds; convert to minutes
			const serviceDurationMs =
				typeof vdata.service_duration === "number" ? vdata.service_duration : 0;
			const timeMin = serviceDurationMs / 60000; // e.g., 900000 ms => 15 minutes

			// Determine which locations this variation is present at:
			// Priority: present_at_all_locations true => all passed-in locations
			// Otherwise use present_at_location_ids (if present), then remove absent_at_location_ids
			let presentLocationIds = null;
			if (
				variation.present_at_all_locations === true ||
				item.present_at_all_locations === true
			) {
				presentLocationIds = locations.map((l) => l.id);
			} else {
				// variation-level overrides take precedence; if not present, fall back to item-level arrays
				if (
					Array.isArray(variation.present_at_location_ids) &&
					variation.present_at_location_ids.length > 0
				) {
					presentLocationIds = [...variation.present_at_location_ids];
				} else if (
					Array.isArray(item.present_at_location_ids) &&
					item.present_at_location_ids.length > 0
				) {
					presentLocationIds = [...item.present_at_location_ids];
				} else {
					// If neither says present at all nor lists present ids, default to all locations
					// (Square sometimes treats absence as present_at_all_locations true at item level;
					// adapt here—if you prefer stricter behavior, change to skip)
					presentLocationIds = locations.map((l) => l.id);
				}
			}

			// Remove any absent_at_location_ids (variation-level or item-level)
			const absentIds = new Set(
				(
					variation.absent_at_location_ids ||
					item.absent_at_location_ids ||
					[]
				).filter(Boolean)
			);
			presentLocationIds = presentLocationIds.filter(
				(id) => !absentIds.has(id)
			);

			// Prepare overrides map for quick lookup by location_id
			const overrides = Array.isArray(vdata.location_overrides)
				? vdata.location_overrides
				: [];
			const overrideMap = new Map();
			for (const ov of overrides) {
				if (!ov || !ov.location_id) continue;
				overrideMap.set(ov.location_id, ov);
			}

			// For each location this variation is present at, create a Service
			for (const locId of presentLocationIds) {
				// If location not in provided locations list, skip it (you might want to include unknowns — adjust if needed)
				const locObj = findLocation(locId);
				if (!locObj) {
					// skip locations the caller didn't give (safety)
					continue;
				}

				// Determine price for this location
				let finalPriceCents = basePriceCents; // may be null
				let isDeal = false;

				if (overrideMap.has(locId)) {
					const ov = overrideMap.get(locId);
					// If override is fixed pricing and has price_money, use that
					if (
						ov.pricing_type === "FIXED_PRICING" &&
						ov.price_money &&
						typeof ov.price_money.amount === "number"
					) {
						finalPriceCents = ov.price_money.amount;
						// if base exists and override is strictly less than base, mark as a deal
						if (basePriceCents !== null && finalPriceCents < basePriceCents)
							isDeal = true;
					} else {
						// VARIABLE_PRICING or missing price -> fall back to basePriceCents (no deal)
						// keep isDeal false
					}
				}

				// If still null, set to 0 to produce numeric price
				if (finalPriceCents === null) finalPriceCents = 0;

				const service = {
					id: `${variationId}_${locId}`, // unique id per variation+location for app
					variation_id: variationId, // actual Square variation ID for API calls
					name: `${itemName} - ${variationName}`,
					price: centsToDollars(finalPriceCents),
					timeMin: timeMin,
					isDeal: !!isDeal,
					location_id: locId,
				};

				services.push(service);
			} // end locations loop
		} // end variations loop
	} // end objects loop

	return services;
}

/* -----------------------
   Example usage:

const locations = [
  { id: "L6ZE04EYBV9W3", name: "Downtown" },
  { id: "LEW7H84VEZ48G", name: "Uptown" },
  { id: "LD3K70KJMNH4G", name: "Eastside" }
];

const catalog = /* your JSON object * /;

const services = parseSquareCatalogToServices(catalog, locations);
console.log(services);

*/
