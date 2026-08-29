import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, type Emergency } from "@/lib/api";
import { escalateUnacknowledged } from "@/lib/relay";

/**
 * Watches the running SOS and escalates to the backup contacts once the
 * Guardian acknowledgement window lapses. The database enforces the one-time
 * escalation, so a retry or a second tab can never double-escalate.
 */
export function useRelayEscalation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const emergency = active.data as (Emergency & { notified_at?: string | null }) | null | undefined;
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!emergency?.id) return;
    const row = emergency as Emergency & {
      notified_at?: string | null;
      ack_at?: string | null;
      escalation_level?: number;
      ack_timeout_seconds?: number;
    };
    if (!row.notified_at || row.ack_at || (row.escalation_level ?? 0) > 0) return;
    if (attempted.current === emergency.id) return;

    const timeout = (row.ack_timeout_seconds ?? 120) * 1000;
    const dueIn = new Date(row.notified_at).getTime() + timeout - Date.now();
    const timer = window.setTimeout(
      () => {
        attempted.current = emergency.id;
        void (async () => {
          try {
            const result = await escalateUnacknowledged(emergency.id);
            if (result?.escalated) {
              toast.warning("No Guardian acknowledgement — backup contacts escalated");
              await queryClient.invalidateQueries({ queryKey: ["active-emergency", user?.id] });
              await queryClient.invalidateQueries({ queryKey: ["emergency-events", emergency.id] });
            }
          } catch {
            /* escalation retries on the next poll; never break the emergency UI */
          }
        })();
      },
      Math.max(0, dueIn),
    );
    return () => window.clearTimeout(timer);
  }, [emergency, queryClient, user?.id]);
}
