import { useCallback, useEffect, useState } from "react";
import {
  getDeferredPrompt,
  isDismissed,
  isIosSafari,
  isStandalone,
  promptInstall,
  rememberDismissal,
  subscribeInstall,
} from "@/lib/pwa-install";

export type InstallMode = "native" | "ios-instructions" | "unsupported";

/**
 * Single source of truth for the install experience: whether the app is already
 * installed, whether the browser offers a native prompt, and whether the user
 * has dismissed the invitation before.
 */
export function useInstallApp() {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIosSafari());
    setDismissed(isDismissed());
    setCanPrompt(Boolean(getDeferredPrompt()));
    setReady(true);
    const unsubscribe = subscribeInstall(() => {
      setCanPrompt(Boolean(getDeferredPrompt()));
      setStandalone(isStandalone());
    });
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplay = () => setStandalone(isStandalone());
    media.addEventListener("change", onDisplay);
    return () => {
      unsubscribe();
      media.removeEventListener("change", onDisplay);
    };
  }, []);

  const mode: InstallMode = canPrompt ? "native" : ios ? "ios-instructions" : "unsupported";

  const install = useCallback(async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") setDismissed(true);
    return outcome;
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setDismissed(true);
  }, []);

  return {
    ready,
    installed: standalone,
    dismissed,
    mode,
    canPrompt,
    /** Show the invitation only when it can actually lead somewhere. */
    shouldOffer: ready && !standalone && (canPrompt || ios),
    install,
    dismiss,
  };
}
