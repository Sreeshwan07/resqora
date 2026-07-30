import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/system/theme-toggle";

const links = [
  { label: "Nearby", to: "/nearby" as const },
  { label: "History", to: "/history" as const },
  { label: "About", to: "/about" as const },
  { label: "Profile", to: "/profile" as const },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="AEGIS home" className="min-w-0">
          <Logo />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <nav aria-label="Sections" className="mr-2 hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <Button asChild variant="hero" className="min-h-11">
            <Link to="/dashboard">Open app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}