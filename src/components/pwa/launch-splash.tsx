import { useEffect, useState } from "react";

/**
 * Standalone launch splash. Android/iOS show a system splash from the manifest,
 * but the app shell still needs a beat to hydrate — this keeps the launch branded
 * instead of flashing an empty screen. It only runs in installed (standalone) mode.
 */
export function LaunchSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background"
    >
      <img src="/icons/icon-192.png" alt="" className="size-20 rounded-3xl shadow-lg" />
      <p className="text-lg font-bold tracking-tight text-foreground">RESQORA</p>
      <p className="text-xs text-muted-foreground">Every Second Matters. Every Life Connected.</p>
    </div>
  );
}
