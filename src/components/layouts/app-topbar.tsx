import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { StatusIndicator } from "@/components/system/status-indicator";
import { primaryNav } from "@/lib/navigation";

export function AppTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <StatusIndicator status="safe" label="All clear" className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Notifications" className="rounded-xl">
            <Bell className="size-5" />
          </Button>
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              AE
            </AvatarFallback>
          </Avatar>
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