import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  Loader2,
  PhoneCall,
  ShieldCheck,
  Siren,
  Sparkles,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, contactsQuery, profileQuery } from "@/lib/api";
import {
  confirmSafe,
  createEmergency,
  type NotificationOutcome,
} from "@/lib/emergency";
import { EMERGENCY_LINE } from "@/lib/coordination";
import { analyzeEmergencyImage, type AccidentAnalysis } from "@/lib/vision.functions";
import { checkRateLimit } from "@/lib/security";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<string, string> = {
  low: "border-success/40 bg-success/10 text-success",
  medium: "border-warning/40 bg-warning/10 text-warning",
  high: "border-alert/40 bg-alert/10 text-alert",
  critical: "border-alert/60 bg-alert/15 text-alert",
};

const CHANNEL_LABELS: Record<NotificationOutcome["channel"], string> = {
  email: "Email alerts",
  sms: "SMS alerts",
  whatsapp: "WhatsApp alerts",
  guardian: "Guardian alert",
};

const OUTCOME_STYLES: Record<NotificationOutcome["status"], string> = {
  sent: "text-success",
  ready: "text-info",
  unavailable: "text-warning",
  skipped: "text-muted-foreground",
  failed: "text-alert",
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/** Videos are analysed from their first clear frame, captured in-browser. */
function grabVideoFrame(file: File) {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.6, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read the video"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video"));
    };
  });
}

export function EmergencyConsole({ mode = "full" }: { mode?: "full" | "report" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const contacts = useQuery(contactsQuery(user?.id));
  const profile = useQuery(profileQuery(user?.id));
  const active = useQuery(activeEmergencyQuery(user?.id));
  const analyze = useServerFn(analyzeEmergencyImage);

  const emergency = active.data ?? null;
  const sosActive = Boolean(
    emergency && emergency.status !== "resolved" && emergency.status !== "cancelled",
  );

  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [sosBusy, setSosBusy] = useState(false);
  const [report, setReport] = useState<NotificationOutcome[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AccidentAnalysis | null>(null);

  const urgent = analysis?.severity === "high" || analysis?.severity === "critical";

  async function handleFile(file: File) {
    // Capture media only, with a hard size ceiling before anything is read.
    const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!isMedia) {
      toast.error("Please choose a photo or video of the scene.");
      return;
    }
    if (file.size === 0 || file.size > 25 * 1024 * 1024) {
      toast.error("That file is empty or larger than 25 MB.");
      return;
    }
    const limit = checkRateLimit("report");
    if (!limit.allowed) {
      toast.error(limit.message);
      return;
    }
    setBusy(true);
    setAnalysis(null);
    try {
      const dataUrl = file.type.startsWith("video/")
        ? await grabVideoFrame(file)
        : await readFile(file);
      setPreview(dataUrl);
      setAnalysis(await analyze({ data: { imageDataUrl: dataUrl } }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
      for (const ref of [cameraRef, photoRef, videoRef]) {
        if (ref.current) ref.current.value = "";
      }
    }
  }

  /** One tap: create the session, capture GPS, start tracking and notify. */
  async function triggerSos(input?: { type?: string; severity?: string; notes?: string }) {
    if (!user) {
      await navigate({ to: "/auth" });
      return;
    }
    setSosBusy(true);
    setReport(null);
    try {
      const created = await createEmergency({
        userId: user.id,
        type: input?.type ?? "sos",
        severity: input?.severity ?? "high",
        notes: input?.notes,
        contactCount: contacts.data?.length ?? 0,
        contacts: contacts.data ?? [],
        profile: profile.data ?? null,
      });
      setReport(created.notifications);
      await queryClient.invalidateQueries();
      const sent = created.notifications.filter((n) => n.status === "sent").length;
      if (sent > 0) toast.success("SOS active — your contacts have been notified");
      else toast.warning("SOS active — no automatic channel delivered, see the status below");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the SOS");
    } finally {
      setSosBusy(false);
    }
  }

  /** Cancel SOS: stops tracking, closes the session, tells contacts you're safe. */
  async function cancelSos() {
    if (!emergency) return;
    setSosBusy(true);
    try {
      await confirmSafe({
        emergency,
        profile: profile.data,
        contacts: contacts.data ?? [],
      });
      setReport(null);
      await queryClient.invalidateQueries();
      toast.success("Emergency resolved — your contacts know you're safe");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel the SOS");
    } finally {
      setSosBusy(false);
    }
  }

  async function notifyContacts() {
    if (!user) {
      navigate({ to: "/emergency", search: { auto: true } });
      return;
    }
    setNotifying(true);
    try {
      const created = await createEmergency({
        userId: user.id,
        type: analysis?.emergencyType ?? "sos",
        severity: analysis?.severity ?? "high",
        notes: analysis?.summary,
        contactCount: contacts.data?.length ?? 0,
        contacts: contacts.data ?? [],
        profile: profile.data ?? null,
      });
      setReport(created.notifications);
      await queryClient.invalidateQueries();
      toast.success("Emergency contacts notified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not notify contacts");
    } finally {
      setNotifying(false);
    }
  }

  function fileInput(ref: React.RefObject<HTMLInputElement | null>, props: Record<string, string>) {
    return (
      <input
        ref={ref}
        type="file"
        className="sr-only"
        tabIndex={-1}
        {...props}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    );
  }

  return (
    <section aria-label="Emergency actions" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "full" &&
          (sosActive ? (
            <Button
              size="xl"
              disabled={sosBusy}
              onClick={cancelSos}
              className="h-18 rounded-2xl bg-linear-to-r from-success to-success/80 text-base font-semibold text-white shadow-lg shadow-success/25 hover:opacity-95 sm:h-20 sm:text-lg"
            >
              {sosBusy ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-6" aria-hidden="true" />
              )}
              Cancel SOS — I'm safe
            </Button>
          ) : (
            <Button
              variant="emergency"
              size="xl"
              disabled={sosBusy}
              className="h-18 rounded-2xl text-base font-semibold shadow-lg shadow-alert/25 sm:h-20 sm:text-lg"
              onClick={() => triggerSos()}
            >
              {sosBusy ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <Siren className="size-6" aria-hidden="true" />
              )}
              Emergency SOS
            </Button>
          ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="glass"
              size="xl"
              className="h-18 rounded-2xl text-base font-semibold sm:h-20 sm:text-lg"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-6" aria-hidden="true" />
              )}
              Report accident
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 rounded-2xl">
            <DropdownMenuItem onSelect={() => cameraRef.current?.click()}>
              <Camera className="size-4" aria-hidden="true" />
              Take photo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => photoRef.current?.click()}>
              <ImageUp className="size-4" aria-hidden="true" />
              Upload image
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => videoRef.current?.click()}>
              <Video className="size-4" aria-hidden="true" />
              Upload video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {fileInput(cameraRef, {
          accept: "image/*",
          capture: "environment",
          "aria-label": "Take an accident photo",
        })}
        {fileInput(photoRef, { accept: "image/*", "aria-label": "Upload an accident image" })}
        {fileInput(videoRef, { accept: "video/*", "aria-label": "Upload an accident video" })}
      </div>

      {sosBusy && !sosActive && (
        <div className="space-y-2 rounded-2xl border border-alert/40 bg-alert/5 p-4">
          <p className="text-sm font-semibold text-foreground">Activating emergency response…</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Creating the emergency session</li>
            <li>• Capturing GPS location and address</li>
            <li>• Starting live location tracking</li>
            <li>• Notifying your trusted contacts</li>
          </ul>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-alert" />
          </div>
        </div>
      )}

      {report && report.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
          <h2 className="text-sm font-semibold text-foreground">Notification results</h2>
          <ul className="mt-2 space-y-1.5 text-xs">
            {report.map((item) => (
              <li key={item.channel} className="flex items-start gap-2">
                {item.status === "sent" || item.status === "ready" ? (
                  <CheckCircle2
                    className={cn("mt-0.5 size-3.5 shrink-0", OUTCOME_STYLES[item.status])}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={cn("mt-0.5 size-3.5 shrink-0", OUTCOME_STYLES[item.status])}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0">
                  <span className="font-medium text-foreground">
                    {CHANNEL_LABELS[item.channel]}:
                  </span>{" "}
                  <span className={OUTCOME_STYLES[item.status]}>{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence>
        {(analysis || busy) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">AI scene analysis</h2>
            </div>
            {busy && !analysis ? (
              <p className="mt-3 text-sm text-muted-foreground">Analysing the scene…</p>
            ) : analysis ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {preview && (
                    <img
                      src={preview}
                      alt="Reported emergency scene"
                      className="h-28 w-full rounded-xl object-cover sm:w-40"
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

                {urgent && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="emergency" disabled={notifying} onClick={notifyContacts}>
                      {notifying && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      Notify contacts
                    </Button>
                    <Button asChild variant="outline">
                      <a href={`tel:${EMERGENCY_LINE.phone}`}>
                        <PhoneCall className="size-4" aria-hidden="true" />
                        Call emergency services
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}