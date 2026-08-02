import { supabase } from "@/integrations/supabase/client";
import { coordsOf, mapsLink } from "@/lib/alerts";
import type { AlertDelivery } from "@/lib/alert-delivery";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { whatsappHref } from "@/lib/share";

const LIVE_LABELS: Record<string, string> = {
  need_help: "Needs immediate help",
  help_arrived: "Help has arrived",
  safe: "Marked safe",
};

/** Exact WhatsApp body defined by the RESQORA contact notification protocol. */
export function buildWhatsappAlert(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
}) {
  const { emergency, profile, trackingUrl } = input;
  const coords = coordsOf(emergency);
  const name = profile?.full_name || "An RESQORA user";
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  return [
    "🚨 RESQORA Emergency Alert",
    "",
    `${name} has triggered an Emergency SOS.`,
    "",
    "Emergency Status:",
    LIVE_LABELS[emergency.live_status] ?? "Emergency active",
    "",
    "Current Address:",
    address,
    "",
    "Google Maps:",
    coords ? mapsLink(coords) : "Awaiting GPS fix",
    "",
    "Live Tracking:",
    trackingUrl || "Tracking link unavailable",
    "",
    "Emergency ID:",
    emergency.id.slice(0, 8).toUpperCase(),
    "",
    "Time:",
    new Date(emergency.started_at).toLocaleString(),
  ].join("\n");
}

export function contactsWithPhone(contacts: EmergencyContact[]) {
  return contacts.filter((contact) => Boolean(contact.phone?.replace(/[^\d]/g, "")));
}

/**
 * WhatsApp cannot be delivered by a server without a paid Business API, so RESQORA
 * prepares one ready-to-send message per contact and records the share state.
 */
export async function prepareWhatsappShares(input: {
  userId: string;
  emergencyId: string;
  contacts: EmergencyContact[];
}) {
  const targets = contactsWithPhone(input.contacts);
  if (targets.length === 0) return [];

  const existing = await supabase
    .from("emergency_alert_deliveries")
    .select("*")
    .eq("emergency_id", input.emergencyId)
    .eq("channel", "whatsapp");
  if (existing.error) throw new Error(existing.error.message);
  const already = new Set((existing.data ?? []).map((row) => row.contact_id));
  const missing = targets.filter((contact) => !already.has(contact.id));
  if (missing.length === 0) return existing.data as AlertDelivery[];

  const { data, error } = await supabase
    .from("emergency_alert_deliveries")
    .insert(
      missing.map((contact) => ({
        user_id: input.userId,
        emergency_id: input.emergencyId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        channel: "whatsapp",
        status: "pending",
        kind: "alert",
      })),
    )
    .select("*");
  if (error) throw new Error(error.message);
  return [...((existing.data ?? []) as AlertDelivery[]), ...(data as AlertDelivery[])];
}

export async function markWhatsappShared(id: string) {
  const { error } = await supabase
    .from("emergency_alert_deliveries")
    .update({ status: "delivered", error: null, sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function whatsappShareLink(message: string, phone?: string | null) {
  return whatsappHref(message, phone);
}