import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/hooks/use-install-app";

/**
 * Compact floating install invitation for inner app pages. It shares its state
 * with the Home install card and the Profile menu entry, so dismissing any of
 * them silences all of them. Chrome/Edge use the native `beforeinstallprompt`
 * flow; iOS/iPadOS Safari gets the manual Add to Home Screen steps.
 */
export function InstallPrompt() {
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
    <div
      role="dialog"
      aria-label="Install RESQORA"
      className="glass-panel fixed inset-x-3 bottom-20 z-[70] flex items-center gap-3 rounded-2xl p-3 shadow-lg sm:left-auto sm:right-4 sm:w-96 lg:bottom-4"
    >
      <img src="/icons/icon-192.png" alt="" className="size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install RESQORA</p>
        {mode === "ios-instructions" ? (
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            Tap <Share className="size-3.5 shrink-0" aria-hidden="true" /> Share, then
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Install RESQORA for faster emergency access.
          </p>
        )}
      </div>
      {mode === "native" && (
        <Button size="sm" className="shrink-0" disabled={busy} onClick={() => void onInstall()}>
          <Download className="size-4" aria-hidden="true" />
          Install
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Maybe later"
        className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
