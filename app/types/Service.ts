export interface Service {
  id: string; // Composite ID for app use (variation_id + location_id)
  variation_id: string; // Actual Square variation ID (for API calls)
  name: string;
  price: number;
  timeMin: number;
  isDeal: boolean;
  location_id: string;
}
