import { pushPermission, requestPushPermission, showPush } from "@/lib/push";

const ASK_KEY = "aegis.notifications.asked";

/** Asks for notification permission exactly once per device. */
export async function ensureNotificationPermission() {
  if (typeof window === "undefined") return "unsupported" as const;
  const current = pushPermission();
  if (current !== "default") return current;
  if (window.localStorage.getItem(ASK_KEY)) return current;
  window.localStorage.setItem(ASK_KEY, "1");
  return requestPushPermission();
}

export type EmergencyNotice =
  | "sos_activated"
  | "location_updated"
  | "emergency_closed"
  | "checkin_reminder"
  | "services_changed";

const NOTICES: Record<EmergencyNotice, { title: string; body: string }> = {
  sos_activated: {
    title: "SOS activated",
    body: "Live tracking started and your trusted contacts are being alerted.",
  },
  location_updated: {
    title: "Location updated",
    body: "Your contacts can see your latest position.",
  },
  emergency_closed: {
    title: "Emergency closed",
    body: "Live sharing stopped and your contacts were told you are safe.",
  },
  checkin_reminder: {
    title: "Safety check reminder",
    body: "Confirm you are safe in AEGIS, or an emergency will be raised.",
  },
  services_changed: {
    title: "Nearby services changed",
    body: "A closer hospital, police or fire station is now available.",
  },
};

export function notifyEmergency(notice: EmergencyNotice, detail?: string) {
  const preset = NOTICES[notice];
  return showPush(preset.title, detail ? `${preset.body}\n${detail}` : preset.body, notice);
}