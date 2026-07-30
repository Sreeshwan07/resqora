import { nearbyServices, type NearbyService, type ServiceCategory } from "@/lib/nearby-services";

export type CoordinationEntry = {
  role: string;
  service: NearbyService;
};

const PLAN: Record<string, ServiceCategory[]> = {
  accident: ["hospital", "police", "fire"],
  fire: ["fire", "hospital", "police"],
  medical: ["hospital", "pharmacy"],
  crime: ["police", "hospital"],
  natural: ["shelter", "hospital", "fire"],
  sos: ["hospital", "police"],
};

const ROLE_LABEL: Record<ServiceCategory, string> = {
  hospital: "Hospital & ambulance",
  police: "Police response",
  fire: "Fire & rescue",
  blood_bank: "Blood supply",
  pharmacy: "Pharmacy",
  shelter: "Disaster helpline & shelter",
};

export function nearestOf(category: ServiceCategory) {
  return nearbyServices
    .filter((service) => service.category === category)
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
}

/** Chooses which services matter for an emergency type, most relevant first. */
export function coordinationPlan(type: string, severity?: string | null): CoordinationEntry[] {
  const categories = [...(PLAN[type] ?? PLAN.sos)];
  if ((severity === "critical" || severity === "high") && !categories.includes("blood_bank")) {
    categories.push("blood_bank");
  }
  return categories
    .map((category) => ({ role: ROLE_LABEL[category], service: nearestOf(category) }))
    .filter((entry): entry is CoordinationEntry => Boolean(entry.service));
}

export const PANEL_CATEGORIES: ServiceCategory[] = ["hospital", "police", "fire", "blood_bank"];

export const PANEL_LABEL: Record<string, string> = {
  hospital: "Nearest hospital",
  police: "Nearest police station",
  fire: "Nearest fire station",
  blood_bank: "Nearest blood bank",
};
