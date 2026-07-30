import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Siren } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { navSections, supportNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openSections, setOpenSections] = useState<string[]>(navSections.map((s) => s.title));

  const toggleSection = (title: string) =>
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 border-r border-border/70 bg-card/70 px-3 py-5 backdrop-blur-xl transition-[width] duration-300 lg:flex",
        collapsed ? "w-[84px]" : "w-[276px]",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <Link to="/" aria-label="AEGIS home">
          <Logo compact={collapsed} />
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="rounded-xl"
          >
            <PanelLeftClose className="size-5" />
          </Button>
        )}
      </div>

      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mx-auto rounded-xl"
        >
          <PanelLeftOpen className="size-5" />
        </Button>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Main">
        {navSections.map((section) => {
          const open = openSections.includes(section.title);
          return (
            <div key={section.title}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.title}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
                  />
                </button>
              )}
              {(open || collapsed) && (
                <ul className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            collapsed && "justify-center px-0",
                            active
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <item.icon className="size-5 shrink-0" aria-hidden="true" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-3">
        {!collapsed && (
          <ul className="space-y-1">
            {supportNav.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="emergency" className={cn("w-full", collapsed && "px-0")}>
          <Link to="/emergency">
            <Siren className="size-4" />
            {!collapsed && <span>Emergency</span>}
          </Link>
        </Button>
      </div>
    </aside>
  );
}