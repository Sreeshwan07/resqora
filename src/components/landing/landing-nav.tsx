import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/system/theme-toggle";

const links = [
  { label: "Nearby", to: "/nearby" as const },
  { label: "History", to: "/history" as const },
  { label: "About", to: "/about" as const },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" aria-label="RESQORA home" className="min-w-0">
          <Logo size="lg" tagline="Helping you. Anytime. Anywhere." />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <Link
            to="/profile"
            aria-label="Open your profile"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <UserRound className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}