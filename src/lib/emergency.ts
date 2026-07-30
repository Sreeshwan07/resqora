import { supabase } from "@/integrations/supabase/client";
import { getCurrentPosition, logEvent, notify, type Emergency } from "@/lib/api";

export const EMERGENCY_TYPES = [
  { value: "medical", label: "Medical" },
  { value: "accident", label: "Road accident" },
  { value: "fire", label: "Fire" },
  { value: "crime", label: "Crime / assault" },
  { value: "natural", label: "Natural disaster" },
  { value: "sos", label: "General SOS" },
] as const;

export const STATUS_FLOW = [
  { key: "created", label: "SOS triggered", detail: "Alert created on your device." },
  { key: "locating", label: "Location captured", detail: "GPS coordinates attached to the alert." },
  { key: "ai_analysis", label: "AI analysis started", detail: "AEGIS is scoring severity and routing priority." },
  { key: "contacts_notified", label: "Contacts notified", detail: "Your 3 trusted contacts were alerted." },
  { key: "active", label: "Emergency active", detail: "Responders are engaged and tracking your location." },
  { key: "resolved", label: "Resolved", detail: "Emergency closed." },
] as const;

export type EmergencyStatus = (typeof STATUS_FLOW)[number]["key"];

/** Statuses used before the current workflow, kept so old history still reads well. */
const LEGACY_LABELS: Record<string, string> = {
  dispatched: "Responders dispatched",
  en_route: "Help en route",
};

export function statusIndex(status: string) {
  const index = STATUS_FLOW.findIndex((step) => step.key === status);
  if (index === -1 && status in LEGACY_LABELS) return STATUS_FLOW.length - 2;
  return index === -1 ? 0 : index;
}

export function statusLabel(status: string) {
  if (status === "cancelled") return "Cancelled";
  if (status in LEGACY_LABELS) return LEGACY_LABELS[status];
  return STATUS_FLOW[statusIndex(status)].label;
}

export async function createEmergency(options: {
  userId: string;
  type: string;
  severity?: string;
  notes?: string;
  contactCount: number;
}): Promise<Emergency> {
  const { data, error } = await supabase
    .from("emergencies")
    .insert({
      user_id: options.userId,
      type: options.type,
      severity: options.severity ?? "high",
      status: "created",
      notes: options.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logEvent(data.id, options.userId, "SOS triggered", "Alert created on your device.");

  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    await supabase
      .from("emergencies")
      .update({ status: "locating", latitude, longitude })
      .eq("id", data.id);
    await logEvent(
      data.id,
      options.userId,
      "Location captured",
      `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(position.coords.accuracy)}m)`,
    );
  } catch {
    await logEvent(
      data.id,
      options.userId,
      "Location unavailable",
      "GPS permission denied — responders will use your saved home address.",
    );
  }

  await supabase.from("emergencies").update({ status: "ai_analysis" }).eq("id", data.id);
  await logEvent(
    data.id,
    options.userId,
    "AI analysis started",
    "Severity scoring and response priority calculated from your emergency type.",
  );

  await supabase.from("emergencies").update({ status: "contacts_notified" }).eq("id", data.id);
  await logEvent(
    data.id,
    options.userId,
    "Contacts notified",
    `${options.contactCount} trusted contact${options.contactCount === 1 ? "" : "s"} alerted with your live location.`,
  );

  await supabase.from("emergencies").update({ status: "active" }).eq("id", data.id);
  await logEvent(
    data.id,
    options.userId,
    "Emergency active",
    "Responders are engaged and following your live location.",
  );

  await notify(options.userId, {
    category: "emergency",
    title: "Emergency alert sent",
    body: "Your trusted contacts and nearby responders have been notified.",
  });

  const { data: fresh } = await supabase.from("emergencies").select("*").eq("id", data.id).single();
  return (fresh ?? data) as Emergency;
}

export async function advanceEmergency(emergency: Emergency) {
  const next = STATUS_FLOW[Math.min(statusIndex(emergency.status) + 1, STATUS_FLOW.length - 1)];
  if (next.key === "resolved") return resolveEmergency(emergency);
  await supabase.from("emergencies").update({ status: next.key }).eq("id", emergency.id);
  await logEvent(emergency.id, emergency.user_id, next.label, next.detail);
}

export async function resolveEmergency(emergency: Emergency) {
  const resolvedAt = new Date();
  const duration = Math.max(
    1,
    Math.round((resolvedAt.getTime() - new Date(emergency.started_at).getTime()) / 1000),
  );
  await supabase
    .from("emergencies")
    .update({
      status: "resolved",
      resolved_at: resolvedAt.toISOString(),
      duration_seconds: duration,
    })
    .eq("id", emergency.id);
  await logEvent(emergency.id, emergency.user_id, "Resolved", "Emergency marked as resolved.");
  await notify(emergency.user_id, {
    category: "emergency",
    title: "Emergency resolved",
    body: "Glad you're safe. A summary was added to your history.",
  });
}

export async function cancelEmergency(emergency: Emergency) {
  await supabase
    .from("emergencies")
    .update({ status: "cancelled", resolved_at: new Date().toISOString() })
    .eq("id", emergency.id);
  await logEvent(emergency.id, emergency.user_id, "Cancelled", "You cancelled this alert.");
}

export function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}