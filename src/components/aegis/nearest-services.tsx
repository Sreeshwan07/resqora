import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  Droplets,
  ExternalLink,
  Flame,
  MapPin,
  Navigation,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { mapsDirectionsLink, mapsLink } from "@/lib/alerts";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { useNearbyServices, type NearbyOrigin } from "@/hooks/use-nearby-services";
import type { LivePosition } from "@/hooks/use-live-position";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<PlaceCategory, typeof Stethoscope> = {
  hospital: Stethoscope,
  police: ShieldCheck,
  fire: Flame,
  blood_bank: Droplets,
};

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  hospital: "Hospitals",
  police: "Police stations",
  fire: "Fire & rescue",
  blood_bank: "Blood banks",
};

export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  hospital: "🏥",
  police: "🚓",
  fire: "🚒",
  blood_bank: "🩸",
};

const DEFAULT_CATEGORIES: PlaceCategory[] = ["hospital", "police", "fire", "blood_bank"];

export function PlaceCard({
  place,
  origin,
  selected,
  onSelect,
  rank,
}: {
  place: NearbyPlace;
  origin: NearbyOrigin | null;
  selected?: boolean;
  onSelect?: (place: NearbyPlace) => void;
  rank?: number;
}) {
  const tel = place.phone ? place.phone.replace(/[^+\d]/g, "") : null;
  const destination = `${place.lat},${place.lng}`;
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-background/60 p-3 transition-colors",
        selected && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {rank ? `${rank}. ` : ""}
            {place.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {place.address || "Address not published"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
              {place.distanceKm.toFixed(1)} km
            </Badge>
            <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
              ~{place.etaMinutes} min
            </Badge>
            {place.openNow === true && (
              <Badge className="rounded-full bg-safe/15 text-[10px] font-semibold text-safe">
                Open 24/7
              </Badge>
            )}
            {place.phone && (
              <span className="text-[11px] text-muted-foreground">{place.phone}</span>
            )}
          </div>
        </div>
        {onSelect && (
          <Button
            size="sm"
            variant={selected ? "secondary" : "ghost"}
            className="shrink-0 text-[11px]"
            onClick={() => onSelect(place)}
          >
            {selected ? "Selected" : "Select"}
          </Button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {tel ? (
          <Button asChild size="sm" variant="emergency" className="flex-1 min-w-[92px]">
            <a href={`tel:${tel}`}>
              <PhoneCall className="size-3.5" /> Call
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="flex-1 min-w-[92px]" disabled>
            <PhoneCall className="size-3.5" /> No number
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="flex-1 min-w-[92px]">
          <a
            href={mapsDirectionsLink(destination, origin ? { lat: origin.lat, lng: origin.lng } : null)}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="size-3.5" /> Navigate
          </a>
        </Button>
        <Button asChild size="sm" variant="ghost" className="flex-1 min-w-[92px]">
          <a href={mapsLink({ lat: place.lat, lng: place.lng })} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" /> Maps
          </a>
        </Button>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  places,
  origin,
  loading,
}: {
  category: PlaceCategory;
  places: NearbyPlace[];
  origin: NearbyOrigin | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const Icon = CATEGORY_ICON[category];

  const ordered = selectedId
    ? [...places].sort((a, b) =>
        a.id === selectedId ? -1 : b.id === selectedId ? 1 : a.distanceKm - b.distanceKm,
      )
    : places;
  const visible = expanded ? ordered : ordered.slice(0, 1);

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <Icon className="size-4" />
          </span>
          {CATEGORY_EMOJI[category]} {CATEGORY_LABEL[category]}
        </h3>
        {places.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[11px]"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "View more"}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </Button>
        )}
      </div>

      <div className="mt-2 grid gap-2">
        {loading && places.length === 0 ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : places.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            No nearby services found.
          </p>
        ) : (
          visible.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <PlaceCard
                place={place}
                origin={origin}
                rank={ordered.indexOf(place) + 1}
                selected={selectedId === place.id}
                onSelect={
                  places.length > 1
                    ? (value) => setSelectedId((current) => (current === value.id ? null : value.id))
                    : undefined
                }
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/** Real-time nearest emergency services grouped into expandable category cards. */
export function NearestServices({
  position,
  categories = DEFAULT_CATEGORIES,
  title = "Nearest emergency services",
  nearby,
}: {
  position: LivePosition | null;
  categories?: PlaceCategory[];
  title?: string;
  nearby?: ReturnType<typeof useNearbyServices>;
}) {
  const fallback = useNearbyServices(nearby ? null : position);
  const state = nearby ?? fallback;
  const [addressInput, setAddressInput] = useState("");
  const needsManual = !position && !state.manual;

  return (
    <section aria-label={title} className="glass-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-muted-foreground">
            {state.updatedAt
              ? `Updated ${state.updatedAt.toLocaleTimeString()}`
              : state.origin
                ? "Searching…"
                : "Awaiting location"}
          </p>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Refresh nearby services"
            disabled={!state.origin || state.isFetching}
            onClick={() => void state.refresh()}
          >
            <RefreshCw className={cn("size-4", state.isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {state.manualLabel && (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3" /> Searching around {state.manualLabel}
          <button
            type="button"
            className="ml-1 underline"
            onClick={() => {
              state.clearManual();
              setAddressInput("");
            }}
          >
            reset
          </button>
        </p>
      )}

      {needsManual && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (addressInput.trim().length > 1) void state.searchAddress(addressInput.trim());
          }}
        >
          <Input
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            placeholder="Enter your address or city"
            aria-label="Address or city"
          />
          <Button type="submit" variant="secondary" disabled={state.geocoding}>
            <Search className="size-4" /> Find
          </Button>
        </form>
      )}
      {state.manualError && (
        <p className="mt-2 text-xs text-alert">{state.manualError}</p>
      )}
      {state.error && (
        <p className="mt-2 text-xs text-alert">
          Live service lookup failed. Tap refresh to try again.
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard
            key={category}
            category={category}
            places={state.data[category]}
            origin={state.origin}
            loading={state.isLoading}
          />
        ))}
      </div>
    </section>
  );
}
