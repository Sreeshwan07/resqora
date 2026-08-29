import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Emergency } from "@/lib/api";
import { ackSecondsLeft, RELAY_LABELS, relayStateOf } from "@/lib/relay";

type RelayFields = Emergency & {
  notified_at?: string | null;
  ack_at?: string | null;
  ack_by?: string | null;
  escalated_at?: string | null;
  escalation_level?: number;
  ack_timeout_seconds?: number;
};

/** Owner-side view of the Guardian relay: notified → acknowledged → responding. */
export function RelayStatusCard({ emergency }: { emergency: Emergency }) {
  const row = emergency as RelayFields;
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = ackSecondsLeft({
    notified_at: row.notified_at ?? null,
    ack_at: row.ack_at ?? null,
    ack_timeout_seconds: row.ack_timeout_seconds ?? 120,
    escalation_level: row.escalation_level ?? 0,
  });

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BellRing className="size-4 text-alert" aria-hidden="true" />
          Emergency relay
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {RELAY_LABELS[relayStateOf(emergency)] ?? relayStateOf(emergency)}
        </Badge>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Guardian notified</dt>
          <dd className="font-semibold">
            {row.notified_at ? new Date(row.notified_at).toLocaleTimeString() : "Sending…"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Acknowledged</dt>
          <dd className="font-semibold">
            {row.ack_at
              ? `${row.ack_by ?? "Guardian"} · ${new Date(row.ack_at).toLocaleTimeString()}`
              : "Awaiting"}
          </dd>
        </div>
      </dl>

      {!row.ack_at && secondsLeft != null && (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-alert">
          <Clock className="size-4" aria-hidden="true" />
          {secondsLeft > 0
            ? `Backup contacts escalate in ${secondsLeft}s`
            : "Escalating to backup contacts"}
        </p>
      )}
      {row.ack_at && (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Your Guardian is responding.
        </p>
      )}
      {(row.escalation_level ?? 0) > 0 && (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-alert">
          <ShieldAlert className="size-4" aria-hidden="true" />
          Escalated to your backup contacts.
        </p>
      )}
    </div>
  );
}
