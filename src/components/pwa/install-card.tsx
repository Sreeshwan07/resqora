import { useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/hooks/use-install-app";

/**
 * Post-login install invitation. It uses the browser's real PWA install flow
 * (Chrome/Edge on Android, Windows and macOS) and falls back to the Share →
 * Add to Home Screen steps on iOS/iPadOS, where Safari offers no API. Once the
 * user picks "Maybe later" — or the app is already installed — it stays hidden.
 */
export function InstallCard() {
  const { shouldOffer, dismissed, mode, install, dismiss } = useInstallApp();
  const [busy, setBusy] = useState(false);

  if (!shouldOffer || dismissed) return null;

  async function onInstall() {
    setBusy(true);
    const outcome = await install();
    setBusy(false);
    if (outcome === "accepted") toast.success("RESQORA is installing on your device");
    if (outcome === "unavailable")
      toast.info("Your browser handles installs from its own menu — look for “Install app”.");
  }

  return (
    <section
      aria-label="Install RESQORA"
      className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"
        >
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold tracking-tight text-foreground">
            📱 Install RESQORA
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Emergency help, always within reach — install RESQORA for faster emergency access.
          </p>
          {mode === "ios-instructions" && (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-sm font-medium text-foreground">
              Tap <Share className="size-4 shrink-0 text-primary" aria-hidden="true" /> Share, then
              <span className="font-semibold">Add to Home Screen</span>.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {mode === "native" && (
          <Button
            size="lg"
            className="min-h-12 flex-1 rounded-2xl"
            disabled={busy}
            onClick={() => void onInstall()}
          >
            <Download className="size-4" aria-hidden="true" />
            {busy ? "Opening installer…" : "Install RESQORA"}
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          className="min-h-12 flex-1 rounded-2xl"
          onClick={dismiss}
        >
          Maybe later
        </Button>
      </div>
    </section>
  );
}
