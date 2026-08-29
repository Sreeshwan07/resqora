import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guardianEnded, type GuardianView } from "@/lib/guardian-view";
import {
  ackSecondsLeft,
  guardianAcknowledge,
  guardianRelayQuery,
  RELAY_LABELS,
  RELAY_CHAIN,
} from "@/lib/relay";

/** Guardian-side relay panel: acknowledge the emergency and see the live chain. */
export function GuardianRelay({
  view,
  emergencyId,
  token,
  onAcknowledged,
}: {
  view: GuardianView;
  emergencyId: string;
  token: string;
  onAcknowledged?: () => void;
}) {
  const relay = useQuery(guardianRelayQuery(emergencyId, token));
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = relay.data;
  if (!status) return null;

  const ended = guardianEnded(view);
  const secondsLeft = ackSecondsLeft(status);
  const acknowledged = Boolean(status.ack_at);

  const acknowledge = async () => {
    setBusy(true);
    try {
      const result = await guardianAcknowledge(emergencyId, token);
      if (result?.acknowledged) toast.success("Acknowledged — the family has been told");
      else toast.message("This emergency is already closed");
      await relay.refetch();
      onAcknowledged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not acknowledge");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <BellRing className="size-5 text-alert" aria-hidden="true" />
          Emergency relay
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {RELAY_LABELS[status.relay_state] ?? status.relay_state}
        </Badge>
      </div>

      {!acknowledged && !ended && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm you have seen this emergency. {view.full_name.split(" ")[0]} and the backup
            contacts are told the moment you acknowledge.
          </p>
          {secondsLeft != null && (
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-alert">
              <Clock className="size-4" aria-hidden="true" />
              {secondsLeft > 0
                ? `Escalating to backup contacts in ${secondsLeft}s`
                : "Escalated to backup contacts"}
            </p>
          )}
          <Button variant="hero" className="mt-3 h-12 w-full rounded-2xl" disabled={busy} onClick={acknowledge}>
            <CheckCircle2 className="size-5" />
            I am responding — acknowledge
          </Button>
        </>
      )}

      {acknowledged && (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Acknowledged by {status.ack_by ?? view.guardian_name} at{" "}
          {new Date(status.ack_at!).toLocaleTimeString()}
        </p>
      )}

      {status.escalation_level > 0 && (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-alert">
          <ShieldAlert className="size-4" aria-hidden="true" />
          Escalated to backup contacts
          {status.escalated_at ? ` at ${new Date(status.escalated_at).toLocaleTimeString()}` : ""}
        </p>
      )}

      <ol className="mt-3 grid gap-1">
        {RELAY_CHAIN.map((step) => {
          const reached = RELAY_CHAIN.indexOf(status.relay_state) >= RELAY_CHAIN.indexOf(step);
          return (
            <li
              key={step}
              className={`flex items-center gap-2 text-xs ${reached ? "font-semibold" : "text-muted-foreground"}`}
            >
              <span
                className={`size-2 rounded-full ${reached ? "bg-primary" : "bg-muted"}`}
                aria-hidden="true"
              />
              {RELAY_LABELS[step]}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
