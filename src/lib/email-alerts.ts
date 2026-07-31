import { supabase } from "@/integrations/supabase/client";
import { coordsOf, mapsLink } from "@/lib/alerts";
import type { AlertDelivery } from "@/lib/alert-delivery";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";

/** Full emergency email body defined by the AEGIS communication protocol. */
export function buildEmergencyEmail(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
  status?: string;
}) {
  const { emergency, profile, trackingUrl } = input;
  const coords = coordsOf(emergency);
  const name = profile?.full_name || "An AEGIS user";
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  const subject = `🚨 AEGIS Emergency Alert — ${name}`;
  const shareMedical = profile?.share_medical_in_alerts !== false;
  const medical = shareMedical
    ? [
        profile?.blood_group ? `Blood group: ${profile.blood_group}` : null,
        profile?.allergies ? `Allergies: ${profile.allergies}` : null,
        profile?.medical_conditions ? `Conditions: ${profile.medical_conditions}` : null,
        profile?.medications ? `Medications: ${profile.medications}` : null,
      ].filter(Boolean)
    : [];
  const message = [
    "🚨 AEGIS Emergency Alert",
    "",
    `${name} has triggered an Emergency SOS and may need immediate assistance.`,
    "",
    `User Name: ${name}`,
    `Emergency Type: ${emergency.type.replace(/_/g, " ")}`,
    `Current Status: ${(input.status ?? emergency.status).replace(/_/g, " ")}`,
    `Their Phone Number: ${profile?.phone || "Not provided"}`,
    `Emergency Started: ${new Date(emergency.started_at).toLocaleString()}`,
    `Current Address: ${address}`,
    `Latitude: ${coords ? coords.lat.toFixed(6) : "Awaiting GPS"}`,
    `Longitude: ${coords ? coords.lng.toFixed(6) : "Awaiting GPS"}`,
    `Google Maps: ${coords ? mapsLink(coords) : "Pending location capture"}`,
    `Live Tracking Link: ${trackingUrl || "Not available"}`,
    `Emergency Time: ${new Date().toLocaleString()}`,
    `Emergency ID: ${emergency.id.slice(0, 8).toUpperCase()}`,
    ...(medical.length > 0 ? ["", "Medical information:", ...medical] : []),
    "",
    trackingUrl ? `▶ OPEN LIVE TRACKING: ${trackingUrl}` : "",
    "",
    "Please call them now or contact local emergency services.",
  ]
    .filter((line) => line !== "" || true)
    .join("\n");
  return { subject, message, trackingUrl: trackingUrl ?? null };
}

export function buildResolvedEmail(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
}) {
  const name = input.profile?.full_name || "An AEGIS user";
  return {
    subject: `✅ AEGIS Emergency Resolved — ${name}`,
    message: [
      "✅ AEGIS Emergency Resolved",
      "",
      `${name} has confirmed they are safe.`,
      "",
      `Emergency ID: ${input.emergency.id.slice(0, 8).toUpperCase()}`,
      `Resolved at: ${new Date().toLocaleString()}`,
      "",
      "Live location sharing has been stopped.",
    ].join("\n"),
  };
}

export function contactsWithEmail(contacts: EmergencyContact[]) {
  return contacts.filter((contact) => Boolean(contact.email?.includes("@")));
}

/** Creates one pending email delivery row per contact that has an address. */
export async function seedEmailDeliveries(input: {
  userId: string;
  emergencyId: string;
  contacts: EmergencyContact[];
  kind?: "alert" | "resolved";
}) {
  const targets = contactsWithEmail(input.contacts);
  if (targets.length === 0) return [];
  const { data, error } = await supabase
    .from("emergency_alert_deliveries")
    .insert(
      targets.map((contact) => ({
        user_id: input.userId,
        emergency_id: input.emergencyId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        channel: "email",
        status: "pending",
        kind: input.kind ?? "alert",
      })),
    )
    .select("*");
  if (error) throw new Error(error.message);
  return data as AlertDelivery[];
}

/**
 * Sends the emergency email to every trusted contact and records the delivery
 * outcome. Returns false when no free email service is connected yet so the UI
 * can offer the mail-app hand-off instead.
 */
export async function dispatchEmailAlerts(input: {
  deliveries: AlertDelivery[];
  subject: string;
  message: string;
}) {
  const targets = input.deliveries.filter((d) => d.contact_email && d.status !== "delivered");
  if (targets.length === 0) return true;
  const { sendEmergencyEmails } = await import("@/lib/email.functions");
  const response = await sendEmergencyEmails({
    data: {
      subject: input.subject,
      message: input.message,
      recipients: targets.map((d) => ({
        id: d.id,
        name: d.contact_name,
        email: d.contact_email!,
      })),
    },
  });
  if (!response.configured) return false;
  await Promise.all(
    response.results.map(async (result) => {
      const { error } = await supabase
        .from("emergency_alert_deliveries")
        .update({
          status: result.status,
          error: result.error ?? null,
          sent_at: result.status === "delivered" ? new Date().toISOString() : null,
        })
        .eq("id", result.id);
      if (error) throw new Error(error.message);
    }),
  );
  return true;
}

/** One call: seed rows + send. Used by the SOS workflow and the share centre. */
export async function sendEmergencyEmailAlerts(input: {
  userId: string;
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
  address?: string | null;
  trackingUrl?: string | null;
  kind?: "alert" | "resolved";
}) {
  const targets = contactsWithEmail(input.contacts);
  if (targets.length === 0) return { sent: 0, configured: true, skipped: true };
  const deliveries = await seedEmailDeliveries({
    userId: input.userId,
    emergencyId: input.emergency.id,
    contacts: targets,
    kind: input.kind,
  });
  const payload =
    input.kind === "resolved"
      ? buildResolvedEmail({ emergency: input.emergency, profile: input.profile })
      : buildEmergencyEmail({
          emergency: input.emergency,
          profile: input.profile,
          address: input.address,
          trackingUrl: input.trackingUrl,
        });
  const configured = await dispatchEmailAlerts({ deliveries, ...payload });
  return { sent: configured ? deliveries.length : 0, configured, skipped: false };
}