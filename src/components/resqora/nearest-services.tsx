import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  Droplets,
  Ambulance,
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
import { mapsDirectionsLink } from "@/lib/alerts";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { useNearbyServices, type NearbyOrigin } from "@/hooks/use-nearby-services";
import type { LivePosition } from "@/hooks/use-live-position";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<PlaceCategory, typeof Stethoscope> = {
  hospital: Stethoscope,
  ambulance: Ambulance,
  police: ShieldCheck,
  fire: Flame,
  blood_bank: Droplets,
};

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  hospital: "Hospitals",
  ambulance: "Ambulance services",
  police: "Police stations",
  fire: "Fire & rescue",
  blood_bank: "Blood banks",
};

export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  hospital: "🏥",
  ambulance: "🚑",
  police: "🚓",
  fire: "🚒",
  blood_bank: "🩸",
};

const DEFAULT_CATEGORIES: PlaceCategory[] = [
  "hospital",
  "ambulance",
  "police",
  "fire",
  "blood_bank",
];

/** Official Indian emergency numbers used when a facility publishes no number. */
const NATIONAL_NUMBER: Record<PlaceCategory, string> = {
  hospital: "108",
  ambulance: "108",
  police: "112",
  fire: "101",
  blood_bank: "108",
};

export function PlaceCard({
  place,
  origin,
  rank,
}: {
  place: NearbyPlace;
  origin: NearbyOrigin | null;
  rank?: number;
}) {
  const verified = place.phone ? place.phone.replace(/[^+\d]/g, "") : null;
  const tel = verified ?? NATIONAL_NUMBER[place.category];
  const destination = `${place.lat},${place.lng}`;
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
      <p className="text-sm font-semibold leading-snug text-foreground">
        {rank ? `${rank}. ` : ""}
        {place.name}
      </p>
      {place.address && (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{place.address}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
          {place.distanceKm.toFixed(1)} km
        </Badge>
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
          ~{place.etaMinutes} min
        </Badge>
        {!verified && (
          <span className="text-[10px] text-muted-foreground">
            No published number — calls {NATIONAL_NUMBER[place.category]}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button asChild size="lg" variant="emergency" className="h-11 flex-1 text-sm">
          <a href={`tel:${tel}`}>
            <PhoneCall className="size-4" /> Call
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-11 flex-1 text-sm">
          <a
            href={mapsDirectionsLink(destination, origin ? { lat: origin.lat, lng: origin.lng } : null)}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="size-4" /> Navigate
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
  const Icon = CATEGORY_ICON[category];

  const ordered = [...places].sort((a, b) => a.distanceKm - b.distanceKm);
  const visible = expanded ? ordered.slice(0, 3) : ordered.slice(0, 1);

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
              ? `Location updated · ${state.updatedAt.toLocaleTimeString()}`
              : state.origin
                ? "Finding nearby emergency services…"
                : "Getting your location…"}
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
