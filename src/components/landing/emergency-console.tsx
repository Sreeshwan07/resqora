import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Loader2, Navigation, PhoneCall, Siren, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { contactsQuery } from "@/lib/api";
import { createEmergency } from "@/lib/emergency";
import { coordinationPlan } from "@/lib/coordination";
import { mapsDirectionsLink } from "@/lib/alerts";
import { analyzeEmergencyImage, type AccidentAnalysis } from "@/lib/vision.functions";
import type { LivePosition } from "@/hooks/use-live-position";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<string, string> = {
  low: "border-success/40 bg-success/5 text-success",
  medium: "border-warning/40 bg-warning/5 text-warning",
  high: "border-alert/40 bg-alert/5 text-alert",
  critical: "border-alert/60 bg-alert/10 text-alert",
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
}

export function EmergencyConsole({ position }: { position: LivePosition | null }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const contacts = useQuery(contactsQuery(user?.id));
  const analyze = useServerFn(analyzeEmergencyImage);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AccidentAnalysis | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const plan = coordinationPlan(analysis?.emergencyType ?? "sos", analysis?.severity);
  const coords = position ? { lat: position.lat, lng: position.lng } : null;

  function startSos() {
    navigate({ to: "/emergency", search: { auto: true } });
  }

  async function handleImage(file: File) {
    setBusy(true);
    setAnalysis(null);
    try {
      const dataUrl = await readFile(file);
      setPreview(dataUrl);
      const result = await analyze({ data: { imageDataUrl: dataUrl } });
      setAnalysis(result);
      if (result.severity === "high" || result.severity === "critical") setConfirmOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image analysis failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function notifyContacts() {
    setConfirmOpen(false);
    if (!user) {
      navigate({ to: "/emergency", search: { auto: true } });
      return;
    }
    setBusy(true);
    try {
      await createEmergency({
        userId: user.id,
        type: analysis?.emergencyType ?? "sos",
        severity: analysis?.severity ?? "high",
        notes: analysis?.summary,
        contactCount: contacts.data?.length ?? 0,
      });
      await queryClient.invalidateQueries();
      toast.success("Emergency contacts notified");
      navigate({ to: "/live" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not notify contacts");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Emergency actions" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="emergency"
          size="xl"
          className="h-20 rounded-3xl text-lg"
          onClick={startSos}
        >
          <Siren className="size-6" aria-hidden="true" />
          Emergency SOS
        </Button>
        <Button
          variant="glass"
          size="xl"
          className="h-20 rounded-3xl text-lg"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-6" aria-hidden="true" />
          )}
          Report accident
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          aria-label="Capture or upload an accident photo"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImage(file);
          }}
        />
      </div>

      <AnimatePresence>
        {(analysis || busy) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-3xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">AI image analysis</h2>
            </div>
            {busy && !analysis ? (
              <p className="mt-3 text-sm text-muted-foreground">Analysing the scene…</p>
            ) : analysis ? (
              <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                {preview && (
                  <img
                    src={preview}
                    alt="Reported emergency scene"
                    className="h-28 w-full rounded-2xl object-cover sm:w-40"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
                      {analysis.emergencyType}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold uppercase",
                        SEVERITY_STYLES[analysis.severity],
                      )}
                    >
                      {analysis.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Confidence {analysis.confidence}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>
                  {analysis.recommendedActions.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {analysis.recommendedActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <section aria-label="Emergency coordination" className="glass-panel rounded-3xl p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Emergency coordination</h2>
          <span className="text-[11px] text-muted-foreground">
            {analysis ? `Routed for ${analysis.emergencyType}` : "Standing by"}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {plan.map((entry) => (
            <li
              key={entry.role}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {entry.role}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {entry.service.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.service.distanceKm} km · {entry.service.etaMinutes} min ·{" "}
                  {analysis ? "Ready to dispatch" : "On standby"}
                </p>
              </div>
              <Button asChild size="icon" variant="emergency" aria-label={`Call ${entry.service.name}`}>
                <a href={`tel:${entry.service.phone.replace(/\s/g, "")}`}>
                  <PhoneCall className="size-4" />
                </a>
              </Button>
              <Button asChild size="icon" variant="outline" aria-label={`Navigate to ${entry.service.name}`}>
                <a
                  href={mapsDirectionsLink(`${entry.service.name} ${entry.service.address}`, coords)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="size-4" />
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>A serious emergency may have been detected.</DialogTitle>
            <DialogDescription>
              {analysis?.summary} Severity {analysis?.severity} · confidence {analysis?.confidence}%.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="emergency" disabled={busy} onClick={notifyContacts}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Notify emergency contacts
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setServicesOpen(true);
              }}
            >
              Call emergency services
            </Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={servicesOpen} onOpenChange={setServicesOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nearest emergency services</DialogTitle>
            <DialogDescription>One tap to call, or open directions.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {plan.map((entry) => (
              <li
                key={entry.role}
                className="flex items-center gap-3 rounded-2xl border border-border/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {entry.service.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.service.distanceKm} km · {entry.service.etaMinutes} min
                  </p>
                </div>
                <Button asChild variant="emergency" size="sm">
                  <a href={`tel:${entry.service.phone.replace(/\s/g, "")}`}>
                    <PhoneCall className="size-4" />
                    Call
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
