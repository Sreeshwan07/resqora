import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-alert text-primary-foreground shadow-md shadow-primary/25">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold leading-none tracking-tight text-foreground">
            RESQORA
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Emergency Intelligence
          </span>
        </span>
      )}
    </span>
  );
}