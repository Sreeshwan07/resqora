import type { Emergency, EmergencyContact, Profile } from "@/lib/api";

export type Coords = { lat: number; lng: number };

export function coordsOf(emergency: Emergency | null | undefined): Coords | null {
  if (!emergency || emergency.latitude == null || emergency.longitude == null) return null;
  return { lat: emergency.latitude, lng: emergency.longitude };
}

export function mapsLink(coords: Coords) {
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
}

export function mapsDirectionsLink(destination: string, origin?: Coords | null) {
  const params = new URLSearchParams({ api: "1", destination });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function mapsEmbedUrl(coords: Coords, zoom = 16) {
  return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=${zoom}&output=embed`;
}

/**
 * Builds the alert body delivered to a trusted contact. Channels (SMS, WhatsApp,
 * email) are simulated for now — this single payload is what a real provider
 * integration would send.
 */
export function buildAlertMessage(input: {
  contact: EmergencyContact;
  profile: Profile | null | undefined;
  emergency: Emergency;
}) {
  const { contact, profile, emergency } = input;
  const coords = coordsOf(emergency);
  const started = new Date(emergency.started_at);
  const lines = [
    `EMERGENCY ALERT — AEGIS`,
    ``,
    `${contact.name}, you are listed as a trusted contact for ${profile?.full_name || "an AEGIS user"}.`,
    ``,
    `Person: ${profile?.full_name || "Unknown"}${profile?.blood_group ? ` (blood group ${profile.blood_group})` : ""}`,
    `Type: ${emergency.type} emergency`,
    `Time: ${started.toLocaleString()}`,
    `Address: ${emergency.address || profile?.home_address || "Address unavailable"}`,
    `Coordinates: ${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Awaiting GPS"}`,
    `Map: ${coords ? mapsLink(coords) : "Pending location capture"}`,
    `Status: ${emergency.status.replace(/_/g, " ")}`,
    `Reference: ${emergency.id.slice(0, 8).toUpperCase()}`,
  ];
  if (emergency.notes) lines.push(`Notes: ${emergency.notes}`);
  lines.push(``, `Please call them now or contact local emergency services.`);
  return lines.join("\n");
}

export const alertChannels = [
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
] as const;

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export async function shareText(title: string, text: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title,
        text,
      });
      return true;
    } catch {
      return false;
    }
  }
  await copyText(text);
  return false;
}