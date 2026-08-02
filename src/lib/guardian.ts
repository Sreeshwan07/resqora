import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { coordsOf, mapsLink } from "@/lib/alerts";
import { origin, randomToken } from "@/lib/share";

export type GuardianSession = Database["public"]["Tables"]["guardian_sessions"]["Row"];

/** The Guardian link stays readable for a short grace period after resolution. */
const GRACE_MINUTES = 30;

export function guardianOf(contacts: EmergencyContact[] | undefined) {
  return contacts?.find((contact) => contact.is_guardian) ?? null;
}

export function guardianUrl(session: Pick<GuardianSession, "emergency_id" | "token">) {
  return `${origin()}/guardian/${session.emergency_id}/${session.token}`;
}

/** Promotes one trusted contact to Guardian; only one can be active at a time. */
export async function setGuardian(userId: string, contactId: string | null) {
  const clear = await supabase
    .from("emergency_contacts")
    .update({ is_guardian: false })
    .eq("user_id", userId)
    .eq("is_guardian", true);
  if (clear.error) throw new Error(clear.error.message);
  if (!contactId) return;
  const { error } = await supabase
    .from("emergency_contacts")
    .update({ is_guardian: true })
    .eq("id", contactId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Secure Guardian session for one emergency, created on demand. */
export async function ensureGuardianSession(input: {
  userId: string;
  emergencyId: string;
  guardian: EmergencyContact;
}) {
  const existing = await supabase
    .from("guardian_sessions")
    .select("*")
    .eq("emergency_id", input.emergencyId)
    .eq("active", true)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as GuardianSession;

  const { data, error } = await supabase
    .from("guardian_sessions")
    .insert({
      user_id: input.userId,
      emergency_id: input.emergencyId,
      guardian_contact_id: input.guardian.id,
      guardian_name: input.guardian.name,
      guardian_email: input.guardian.email,
      guardian_phone: input.guardian.phone,
      token: randomToken(24),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as GuardianSession;
}

/** Called when the emergency ends — the link expires after a short grace period. */
export async function expireGuardianSessions(emergencyId: string) {
  const expiresAt = new Date(Date.now() + GRACE_MINUTES * 60_000).toISOString();
  const { error } = await supabase
    .from("guardian_sessions")
    .update({ expires_at: expiresAt })
    .eq("emergency_id", emergencyId)
    .eq("active", true);
  if (error) throw new Error(error.message);
}

export const guardianSessionQuery = (emergencyId: string | undefined) =>
  queryOptions({
    queryKey: ["guardian-session", emergencyId],
    enabled: Boolean(emergencyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_sessions")
        .select("*")
        .eq("emergency_id", emergencyId!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as GuardianSession | null;
    },
  });

/** The Guardian email defined by the RESQORA Guardian protocol. */
export function buildGuardianEmail(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  guardian: EmergencyContact;
  address?: string | null;
  trackingUrl?: string | null;
  dashboardUrl: string;
}) {
  const { emergency, profile, guardian, dashboardUrl } = input;
  const coords = coordsOf(emergency);
  const name = profile?.full_name || "An RESQORA user";
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  return {
    subject: `🚨 RESQORA Emergency Alert — ${name} needs you (Guardian)`,
    message: [
      "🚨 RESQORA Emergency Alert",
      "",
      `${guardian.name}, you are the Guardian for ${name}.`,
      `${name} has activated Emergency SOS.`,
      "",
      `Current Address: ${address}`,
      `Live GPS Location: ${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Awaiting GPS"}`,
      `Google Maps Link: ${coords ? mapsLink(coords) : "Pending location capture"}`,
      `Secure Live Tracking Link: ${input.trackingUrl || "Not available"}`,
      `Emergency Time: ${new Date(emergency.started_at).toLocaleString()}`,
      `Emergency ID: ${emergency.id.slice(0, 8).toUpperCase()}`,
      `Current Emergency Status: ${emergency.status.replace(/_/g, " ")}`,
      "",
      "Open Guardian Dashboard:",
      dashboardUrl,
      "",
      "The dashboard shows live location, movement trail, nearest emergency services and a live timeline. It expires automatically once the emergency ends.",
    ].join("\n"),
  };
}

/**
 * Creates the Guardian session and emails the Guardian. Returns the session so
 * the app can show the link and its delivery status.
 */
export async function notifyGuardian(input: {
  userId: string;
  emergency: Emergency;
  profile: Profile | null | undefined;
  guardian: EmergencyContact;
  address?: string | null;
  trackingUrl?: string | null;
}) {
  const session = await ensureGuardianSession({
    userId: input.userId,
    emergencyId: input.emergency.id,
    guardian: input.guardian,
  });
  const dashboardUrl = guardianUrl(session);
  if (!input.guardian.email?.includes("@")) {
    return { session, dashboardUrl, configured: true, emailed: false };
  }

  const payload = buildGuardianEmail({ ...input, dashboardUrl });
  const seeded = await supabase
    .from("emergency_alert_deliveries")
    .insert({
      user_id: input.userId,
      emergency_id: input.emergency.id,
      contact_id: input.guardian.id,
      contact_name: `${input.guardian.name} (Guardian)`,
      contact_phone: input.guardian.phone,
      contact_email: input.guardian.email,
      channel: "email",
      status: "pending",
      kind: "guardian",
    })
    .select("*")
    .single();
  if (seeded.error) throw new Error(seeded.error.message);

  const { sendEmergencyEmails } = await import("@/lib/email.functions");
  const response = await sendEmergencyEmails({
    data: {
      subject: payload.subject,
      message: payload.message,
      recipients: [
        { id: seeded.data.id, name: input.guardian.name, email: input.guardian.email },
      ],
    },
  });
  if (!response.configured) {
    await supabase
      .from("emergency_alert_deliveries")
      .update({ status: "failed", error: "Email service is not connected yet" })
      .eq("id", seeded.data.id);
    return { session, dashboardUrl, configured: false, emailed: false };
  }
  const result = response.results[0];
  await supabase
    .from("emergency_alert_deliveries")
    .update({
      status: result.status,
      error: result.error ?? null,
      sent_at: result.status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", seeded.data.id);
  return { session, dashboardUrl, configured: true, emailed: result.status === "delivered" };
}