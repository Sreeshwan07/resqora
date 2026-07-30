import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Copy, Loader2, MapPin, Siren, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { StatusIndicator } from "@/components/system/status-indicator";
import { ConfirmModal } from "@/components/system/confirm-modal";
import { SosButton } from "@/components/aegis/sos-button";
import { CrashDetectionPanel } from "@/components/aegis/crash-detection";
import { EmergencyAlerts } from "@/components/aegis/emergency-alerts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  activeEmergencyQuery,
  contactsQuery,
  emergencyEventsQuery,
  profileQuery,
} from "@/lib/api";
import { coordsOf, copyText, mapsLink } from "@/lib/alerts";
import {
  EMERGENCY_TYPES,
  STATUS_FLOW,
  advanceEmergency,
  cancelEmergency,
  createEmergency,
  formatDuration,
  resolveEmergency,
  statusIndex,
  statusLabel,
} from "@/lib/emergency";

export const Route = createFileRoute("/_app/emergency")({
  validateSearch: (search: Record<string, unknown>): { auto?: boolean } =>
    search.auto === true || search.auto === "true" ? { auto: true } : {},
  head: () => ({
    meta: [
      { title: "Emergency SOS — AEGIS" },
      {
        name: "description",
        content:
          "Trigger an AEGIS SOS with GPS capture, instant contact alerts, live status tracking and automatic crash detection.",
      },
      { property: "og:title", content: "AEGIS Emergency SOS" },
      { property: "og:description", content: "One tap alerts your contacts and nearby responders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { auto } = Route.useSearch();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const active = useQuery(activeEmergencyQuery(user?.id));
  const events = useQuery(emergencyEventsQuery(active.data?.id));

  const [type, setType] = useState("sos");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const current = active.data;

  // Landing page "Emergency SOS" arrives with ?auto=true and starts the
  // existing workflow immediately — no extra questions.
  useEffect(() => {
    if (!auto || !user || busy || current || active.isPending || contacts.isPending) return;
    void (async () => {
      await trigger("sos");
      await navigate({ to: "/emergency", search: {}, replace: true });
      await navigate({ to: "/live" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, user, current, active.isPending, contacts.isPending]);

  useEffect(() => {
    if (!current) {
      setElapsed(0);
      return;
    }
    const startedAt = new Date(current.started_at).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [current]);

  async function refresh() {
    await queryClient.invalidateQueries();
  }

  async function trigger(emergencyType = type) {
    if (!user || busy) return;
    setBusy(true);
    try {
      await createEmergency({
        userId: user.id,
        type: emergencyType,
        notes: notes.trim() || undefined,
        contactCount: contacts.data?.length ?? 0,
      });
      await refresh();
      toast.success("SOS sent — your contacts have been alerted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send SOS");
    } finally {
      setBusy(false);
    }
  }

  function requestSos(emergencyType = type) {
    if (busy || current) return;
    setPendingType(emergencyType);
    setConfirmOpen(true);
  }

  async function handleAdvance() {
    if (!active.data) return;
    setBusy(true);
    await advanceEmergency(active.data);
    await refresh();
    setBusy(false);
  }

  async function handleResolve() {
    if (!active.data) return;
    setBusy(true);
    await resolveEmergency(active.data);
    await refresh();
    setBusy(false);
    toast.success("Emergency resolved");
  }

  async function handleCancel() {
    if (!active.data) return;
    setBusy(true);
    await cancelEmergency(active.data);
    await refresh();
    setBusy(false);
    toast("Alert cancelled");
  }

  async function toggleCrashDetection(value: boolean) {
    if (!user) return;
    await supabase.from("profiles").update({ crash_detection: value }).eq("id", user.id);
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const currentStep = current ? statusIndex(current.status) : -1;
  const coords = coordsOf(current);

  return (
    <>
      <PageHeader
        icon={Siren}
        title="Emergency SOS"
        description="One tap shares your live location, medical ID and alerts your three trusted contacts."
        actions={
          current ? (
            <StatusIndicator status="critical" label={statusLabel(current.status)} pulse />
          ) : (
            <StatusIndicator status="safe" label="Standing by" />
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="glass-panel rounded-3xl p-6">
          <SosButton
            onTrigger={() => requestSos()}
            disabled={busy || Boolean(current)}
            active={Boolean(current)}
          />

          {current ? (
            <div className="mt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-3 rounded-2xl border border-alert/40 bg-alert/5 p-4 sm:grid-cols-2"
              >
                <LiveDetail
                  label="Emergency ID"
                  value={current.id.slice(0, 8).toUpperCase()}
                />
                <LiveDetail label="Status" value={statusLabel(current.status)} />
                <LiveDetail
                  label="Elapsed"
                  value={formatDuration(elapsed)}
                  icon={<Timer className="size-3.5" aria-hidden="true" />}
                />
                <LiveDetail
                  label="Started"
                  value={new Date(current.started_at).toLocaleTimeString()}
                />
                <LiveDetail
                  label="Latitude"
                  value={coords ? coords.lat.toFixed(6) : "Awaiting GPS"}
                />
                <LiveDetail
                  label="Longitude"
                  value={coords ? coords.lng.toFixed(6) : "Awaiting GPS"}
                />
              </motion.div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="hero">
                  <Link to="/live">
                    <MapPin className="size-4" />
                    Live tracking
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  disabled={!coords}
                  onClick={async () => {
                    if (!coords) return;
                    await copyText(mapsLink(coords));
                    toast.success("Location link copied");
                  }}
                >
                  <Copy className="size-4" />
                  Copy location
                </Button>
                <Button variant="outline" onClick={handleAdvance} disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Advance status
                </Button>
                <Button variant="outline" onClick={handleResolve} disabled={busy}>
                  <CheckCircle2 className="size-4" />
                  Mark resolved
                </Button>
                <Button variant="ghost" onClick={handleCancel} disabled={busy}>
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Emergency notification centre
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Messages delivered to your trusted contacts across SMS, WhatsApp and email.
                </p>
                <div className="mt-4">
                  <EmergencyAlerts
                    emergency={current}
                    profile={profile.data}
                    contacts={contacts.data ?? []}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              <div className="space-y-2">
                <Label>Emergency type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes for responders (optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  className="rounded-xl"
                  placeholder="Second floor, blue door. Two people injured."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We will attach your GPS position, medical ID
                {profile.data?.blood_group ? ` (blood ${profile.data.blood_group})` : ""} and notify{" "}
                {contacts.data?.length ?? 0} trusted contacts.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CrashDetectionPanel
            enabled={profile.data?.crash_detection ?? true}
            onToggle={toggleCrashDetection}
            onConfirm={() => requestSos("accident")}
            busy={busy}
          />

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">Response timeline</h2>
            {!current ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No active emergency. Steps appear here in real time when an SOS is sent.
              </p>
            ) : (
              <ol className="mt-4 space-y-4">
                {STATUS_FLOW.map((step, index) => {
                  const done = index <= currentStep;
                  return (
                    <li key={step.key} className="flex gap-3">
                      <span className="flex flex-col items-center">
                        <motion.span
                          initial={false}
                          animate={{ scale: done ? 1 : 0.75, opacity: done ? 1 : 0.4 }}
                          className={
                            done
                              ? "size-3 rounded-full bg-alert"
                              : "size-3 rounded-full bg-muted-foreground/40"
                          }
                        />
                        {index < STATUS_FLOW.length - 1 && (
                          <span className="mt-1 h-8 w-px bg-border" />
                        )}
                      </span>
                      <div className="min-w-0 pb-1">
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {events.data && events.data.length > 0 && (
              <AnimatePresence initial={false}>
                <motion.p
                  key={events.data[events.data.length - 1].id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground"
                >
                  Latest: {events.data[events.data.length - 1].label}
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Emergency SOS"
        description="Are you sure you want to request emergency assistance?"
        cancelLabel="Cancel"
        confirmLabel="Send SOS"
        tone="emergency"
        onConfirm={() => {
          const chosen = pendingType ?? type;
          setPendingType(null);
          void trigger(chosen).then(() => navigate({ to: "/live" }));
        }}
      />
    </>
  );
}

function LiveDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}