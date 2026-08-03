import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "resqora.install.dismissed";

/**
 * Android/desktop install prompt. Only appears when the browser actually offers
 * installation (beforeinstallprompt) and the app is not already standalone.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    const handler = (incoming: Event) => {
      incoming.preventDefault();
      setEvent(incoming as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => setEvent(null);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!event) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setEvent(null);
  }

  return (
    <div
      role="dialog"
      aria-label="Install RESQORA"
      className="glass-panel fixed inset-x-3 bottom-3 z-[70] flex items-center gap-3 rounded-2xl p-3 shadow-lg sm:left-auto sm:right-4 sm:w-96"
    >
      <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install RESQORA</p>
        <p className="text-xs text-muted-foreground">
          One-tap SOS from your home screen, even on a weak connection.
        </p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          try {
            await event.prompt();
            await event.userChoice;
          } catch {
            /* the browser may have already dismissed the prompt */
          }
          setEvent(null);
        }}
      >
        <Download className="size-4" aria-hidden="true" />
        Install
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}