/**
 * AMENITY REGISTRY
 *
 * Central mapping of amenity identifier strings to:
 *  - label:  Human-readable display name
 *  - emoji:  Emoji icon for compact display
 *  - icon:   MUI icon component name (string, resolved in components)
 *
 * This is the single source of truth for all amenity identifiers.
 * The same identifiers are stored in Hotel.amenities in the database.
 */

export const AMENITY_MAP = {
  wifi: { label: "Wi-Fi", emoji: "📶" },
  pool: { label: "Swimming Pool", emoji: "🏊" },
  parking: { label: "Parking", emoji: "🅿️" },
  restaurant: { label: "Restaurant", emoji: "🍽️" },
  airConditioning: { label: "Air Conditioning", emoji: "❄️" },
  roomService: { label: "Room Service", emoji: "🛎️" },
  gym: { label: "Gym & Fitness", emoji: "🏋️" },
  spa: { label: "Spa", emoji: "💆" },
  breakfast: { label: "Breakfast Included", emoji: "☕" },
  petFriendly: { label: "Pet Friendly", emoji: "🐾" },
  laundry: { label: "Laundry", emoji: "👕" },
  airport: { label: "Airport Transfer", emoji: "✈️" },
  bar: { label: "Bar & Lounge", emoji: "🍸" },
  concierge: { label: "Concierge", emoji: "🎩" },
};

/**
 * getAmenityInfo(id)
 * Returns { label, emoji } for the given amenity identifier.
 * Falls back gracefully for unknown identifiers.
 */
export const getAmenityInfo = (id) => {
  return AMENITY_MAP[id] || { label: id, emoji: "✨" };
};

/**
 * resolveAmenities(amenityIds)
 * Takes an array of identifier strings and returns an array of
 * { id, label, emoji } objects for display.
 * Skips unknown identifiers.
 */
export const resolveAmenities = (amenityIds) => {
  if (!Array.isArray(amenityIds) || amenityIds.length === 0) return [];
  return amenityIds.map((id) => ({ id, ...getAmenityInfo(id) }));
};

/**
 * All amenity options as an array (for multi-select controls).
 * Sorted by label.
 */
export const ALL_AMENITY_OPTIONS = Object.entries(AMENITY_MAP)
  .map(([id, { label, emoji }]) => ({ id, label, emoji }))
  .sort((a, b) => a.label.localeCompare(b.label));
