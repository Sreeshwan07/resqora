import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Emergency } from "@/lib/api";

/**
 * Emergency Relay & Acknowledgement.
 *
 * Every SOS moves through a real, auditable relay chain:
 * created → notified → waiting_for_ack → acknowledged/responding → resolved.
 * If the Guardian does not acknowledge within the timeout, the emergency
 * escalates once to the backup contacts.
 */
export type RelayState =
  | "created"
  | "notified"
  | "waiting_for_ack"
  | "acknowledged"
  | "responding"
  | "resolved"
  | "cancelled";

export type RelayStatus = {
  relay_state: RelayState;
  notified_at: string | null;
  ack_at: string | null;
  ack_by: string | null;
  escalated_at: string | null;
  escalation_level: number;
  ack_timeout_seconds: number;
  guardian_opened_at: string | null;
  guardian_acknowledged_at: string | null;
};

export const RELAY_LABELS: Record<RelayState, string> = {
  created: "SOS created",
  notified: "Guardian notified",
  waiting_for_ack: "Waiting for Guardian acknowledgement",
  acknowledged: "Guardian acknowledged",
  responding: "Guardian is responding",
  resolved: "Emergency resolved",
  cancelled: "Emergency cancelled",
};

/** Ordered relay chain used by the progress rails on both sides. */
export const RELAY_CHAIN: RelayState[] = [
  "created",
  "notified",
  "waiting_for_ack",
  "acknowledged",
  "responding",
  "resolved",
];

export function relayStateOf(emergency: Emergency): RelayState {
  const raw = (emergency as Emergency & { relay_state?: string }).relay_state;
  return (raw as RelayState) ?? "created";
}

/** Seconds left before the escalation fires; null when it does not apply. */
export function ackSecondsLeft(status: {
  notified_at: string | null;
  ack_at: string | null;
  ack_timeout_seconds: number;
  escalation_level: number;
}) {
  if (!status.notified_at || status.ack_at || status.escalation_level > 0) return null;
  const deadline = new Date(status.notified_at).getTime() + status.ack_timeout_seconds * 1000;
  return Math.max(0, Math.round((deadline - Date.now()) / 1000));
}

/** Marks the relay as notified the moment the Guardian alert goes out. */
export async function markRelayNotified(emergencyId: string) {
  const { error } = await supabase
    .from("emergencies")
    .update({ relay_state: "waiting_for_ack", notified_at: new Date().toISOString() })
    .eq("id", emergencyId)
    .is("notified_at", null);
  if (error) throw new Error(error.message);
}

/** Guardian-side acknowledgement, gated by the secure session token. */
export async function guardianAcknowledge(emergencyId: string, token: string) {
  const { data, error } = await supabase.rpc("guardian_acknowledge", {
    _emergency_id: emergencyId,
    _token: token,
  });
  if (error) throw new Error(error.message);
  return data as unknown as { acknowledged: boolean; relay_state: RelayState } | null;
}

/** Owner-side escalation: fires once when the acknowledgement window lapses. */
export async function escalateUnacknowledged(emergencyId: string) {
  const { data, error } = await supabase.rpc("escalate_unacknowledged", {
    _emergency_id: emergencyId,
  });
  if (error) throw new Error(error.message);
  return data as unknown as { escalated: boolean; relay_state: RelayState } | null;
}

/** Lightweight relay poll for the Guardian dashboard (token-gated RPC). */
export const guardianRelayQuery = (emergencyId: string, token: string) =>
  queryOptions({
    queryKey: ["guardian-relay", emergencyId, token],
    refetchInterval: 5_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_guardian_relay", {
        _emergency_id: emergencyId,
        _token: token,
      });
      if (error) throw new Error(error.message);
      return (data as unknown as RelayStatus | null) ?? null;
    },
  });
