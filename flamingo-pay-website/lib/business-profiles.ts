/**
 * Business-type monitoring profiles.
 *
 * This file is safe to import from both client and server components.
 * It contains only pure data and functions with no server-side dependencies.
 */

export type BusinessProfile = {
  /** Max single transaction before flagging */
  highAmountThreshold: number;
  /** Transactions in the velocity window before flagging */
  velocityMax: number;
  /** Window in minutes for velocity check */
  velocityWindowMinutes: number;
  /** Hour of day when "unusual" starts (e.g. 23 = 23:00) */
  unusualHourStart: number;
  /** Hour of day when "unusual" ends (e.g. 5 = 05:00) */
  unusualHourEnd: number;
  /** Flag if txn amount ≥ multiplier × merchant avg */
  anomalyMultiplier: number;
};

/**
 * Business-type → monitoring profile map.
 * Taxi-rank merchants (spaza, tuckshop, street vendor, fruit & veg)
 * get high velocity limits and later trading hours.
 * Service providers and "Other" get moderate limits.
 * All categories get anomaly detection to catch amounts way above
 * the merchant's own baseline.
 */
export const BUSINESS_PROFILES: Record<string, BusinessProfile> = {
  // HIGH-VOLUME / LOW-VALUE — taxi rank economy
  "Spaza / General Dealer": {
    highAmountThreshold: 5000,
    velocityMax: 60,
    velocityWindowMinutes: 15,
    unusualHourStart: 0,   // spaza shops: 24-hour trading is normal
    unusualHourEnd: 4,     // only flag between midnight and 4am
    anomalyMultiplier: 8,
  },
  "Tuckshop": {
    highAmountThreshold: 3000,
    velocityMax: 50,
    velocityWindowMinutes: 15,
    unusualHourStart: 0,
    unusualHourEnd: 4,
    anomalyMultiplier: 8,
  },
  "Street vendor": {
    highAmountThreshold: 3000,
    velocityMax: 50,
    velocityWindowMinutes: 15,
    unusualHourStart: 23,
    unusualHourEnd: 4,
    anomalyMultiplier: 8,
  },
  "Fruit & veg": {
    highAmountThreshold: 5000,
    velocityMax: 40,
    velocityWindowMinutes: 15,
    unusualHourStart: 23,
    unusualHourEnd: 3,    // fruit vendors start early
    anomalyMultiplier: 6,
  },

  // MEDIUM-VOLUME
  "Butchery": {
    highAmountThreshold: 8000,
    velocityMax: 25,
    velocityWindowMinutes: 15,
    unusualHourStart: 22,
    unusualHourEnd: 5,
    anomalyMultiplier: 5,
  },
  "Takeaway / Food": {
    highAmountThreshold: 5000,
    velocityMax: 35,
    velocityWindowMinutes: 15,
    unusualHourStart: 0,   // late-night takeaways are normal
    unusualHourEnd: 4,
    anomalyMultiplier: 5,
  },
  "Hair salon / Barber": {
    highAmountThreshold: 5000,
    velocityMax: 15,
    velocityWindowMinutes: 15,
    unusualHourStart: 22,
    unusualHourEnd: 6,
    anomalyMultiplier: 4,
  },
  "Car wash": {
    highAmountThreshold: 3000,
    velocityMax: 20,
    velocityWindowMinutes: 15,
    unusualHourStart: 21,
    unusualHourEnd: 6,
    anomalyMultiplier: 5,
  },

  // LOWER-VOLUME / HIGHER-VALUE
  "Service provider": {
    highAmountThreshold: 10000,
    velocityMax: 15,
    velocityWindowMinutes: 15,
    unusualHourStart: 22,
    unusualHourEnd: 6,
    anomalyMultiplier: 4,
  },
};

/** Default profile for "Other" or unrecognised business types. */
const DEFAULT_PROFILE: BusinessProfile = {
  highAmountThreshold: 5000,
  velocityMax: 20,
  velocityWindowMinutes: 15,
  unusualHourStart: 23,
  unusualHourEnd: 5,
  anomalyMultiplier: 5,
};

export function getBusinessProfile(businessType: string): BusinessProfile {
  return BUSINESS_PROFILES[businessType] ?? DEFAULT_PROFILE;
}
