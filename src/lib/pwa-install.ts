/**
 * Real PWA installation plumbing. `beforeinstallprompt` fires once, very early —
 * often before any React component mounts — so the event is captured at module
 * load and shared with every consumer. No fake download buttons, no APKs: this
 * only ever forwards the browser's own install mechanism.
 */

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "resqora.install.dismissed";

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDeferredPrompt() {
  return deferred;
}

export function wasInstalledThisSession() {
  return installed;
}

export function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iPadOs = /Macintosh/.test(ua) && "ontouchend" in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

/** True when RESQORA is already running as an installed app. */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function isDismissed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode — the prompt simply reappears next session */
  }
}

/** Clears the dismissal so the Profile menu entry can always offer install. */
export function forgetDismissal() {
  try {
    window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignored */
  }
}

/**
 * Triggers the browser's install flow. Returns the outcome so callers can show
 * honest feedback instead of assuming success.
 */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferred;
  if (!event) return "unavailable";
  try {
    await event.prompt();
    const choice = await event.userChoice;
    deferred = null;
    emit();
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}
