import { Link, useRouterState } from "@tanstack/react-router";
import { mobileNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-end justify-between">
        {mobileNav.map((item) => {
          const active = pathname === item.to;
          const isEmergency = item.to === "/emergency";
          if (isEmergency) {
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  aria-label="Emergency"
                  className="mx-auto -mt-5 flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-alert text-alert-foreground shadow-lg shadow-alert/30 transition-transform active:scale-95"
                >
                  <item.icon className="size-6" aria-hidden="true" />
                  <span className="text-[10px] font-semibold">SOS</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}