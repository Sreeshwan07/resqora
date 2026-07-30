import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { StatusIndicator } from "@/components/system/status-indicator";
import { primaryNav } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, notificationsQuery, profileQuery } from "@/lib/api";

export function AppTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const { data: notifications } = useQuery(notificationsQuery(user?.id));
  const { data: activeEmergency } = useQuery(activeEmergencyQuery(user?.id));

  const unread = (notifications ?? []).filter((item) => !item.read).length;
  const initials = (profile?.full_name ?? user?.email ?? "AE")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <Link to="/" className="lg:hidden" aria-label="AEGIS home">
            <Logo />
          </Link>
          <div className="relative hidden w-full max-w-sm md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search incidents, contacts, places"
              aria-label="Search"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {activeEmergency ? (
            <StatusIndicator
              status="critical"
              label="Emergency active"
              pulse
              className="hidden sm:inline-flex"
            />
          ) : (
            <StatusIndicator status="safe" label="All clear" className="hidden sm:inline-flex" />
          )}
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative rounded-xl"
          >
            <Link to="/notifications">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-alert px-1 text-[10px] font-bold leading-4 text-alert-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </Button>
          <Link to="/profile" aria-label="Your profile">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials || "AE"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
      {menuOpen && (
        <nav aria-label="Mobile menu" className="border-t border-border/70 px-4 py-3 lg:hidden">
          <ul className="grid gap-1 sm:grid-cols-2">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}