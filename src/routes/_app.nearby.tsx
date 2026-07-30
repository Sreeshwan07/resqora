import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Building2,
  Clock3,
  Droplets,
  Flame,
  MapPinned,
  Navigation,
  Phone,
  Pill,
  Search,
  Shield,
  Star,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { mapsDirectionsLink } from "@/lib/alerts";
import { useAuth } from "@/hooks/use-auth";
import { favoritesQuery, toggleFavorite } from "@/lib/aegis-data";
import {
  nearbyServices,
  serviceCategories,
  type ServiceCategory,
} from "@/lib/nearby-services";

export const Route = createFileRoute("/_app/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby emergency services — AEGIS" },
      {
        name: "description",
        content:
          "Find hospitals, police stations, fire stations, pharmacies and shelters near you with distance, ETA and direct call links.",
      },
      { property: "og:title", content: "Nearby emergency services — AEGIS" },
      { property: "og:description", content: "Hospitals, police, fire and pharmacies around you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NearbyPage,
});

const categoryIcon: Record<ServiceCategory, typeof Building2> = {
  hospital: Building2,
  police: Shield,
  fire: Flame,
  blood_bank: Droplets,
  pharmacy: Pill,
  shelter: Navigation,
};

function NearbyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const favorites = useQuery(favoritesQuery(user?.id));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [openOnly, setOpenOnly] = useState(false);

  const favoriteByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const favorite of favorites.data ?? []) map.set(favorite.place_key, favorite.id);
    return map;
  }, [favorites.data]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return nearbyServices
      .filter((service) => (category === "all" ? true : service.category === category))
      .filter((service) => (openOnly ? service.open24h : true))
      .filter((service) =>
        needle
          ? service.name.toLowerCase().includes(needle) ||
            service.address.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => {
        // Saved places always surface first during an emergency.
        const favoriteDelta =
          Number(favoriteByKey.has(b.id)) - Number(favoriteByKey.has(a.id));
        return favoriteDelta !== 0 ? favoriteDelta : a.distanceKm - b.distanceKm;
      });
  }, [query, category, openOnly, favoriteByKey]);

  async function onToggleFavorite(service: (typeof nearbyServices)[number]) {
    if (!user) return;
    try {
      const saved = await toggleFavorite(
        user.id,
        {
          place_key: service.id,
          name: service.name,
          category: service.category,
          address: service.address,
          phone: service.phone,
        },
        favoriteByKey.get(service.id),
      );
      toast.success(saved ? `${service.name} saved to favourites` : "Removed from favourites");
      await queryClient.invalidateQueries({ queryKey: ["favorite-places", user.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update favourites");
    }
  }

  return (
    <>
      <PageHeader
        icon={MapPinned}
        title="Nearby services"
        description="The closest hospitals, police, fire crews, blood banks, pharmacies and shelters around you."
      />

      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or address"
            aria-label="Search nearby services"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                aria-pressed={category === item.value}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  category === item.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="open-only" className="text-xs text-muted-foreground">
              Open 24h only
            </Label>
            <Switch id="open-only" checked={openOnly} onCheckedChange={setOpenOnly} />
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No services match"
          description="Try a different category or clear your search filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setOpenOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {results.map((service, index) => {
            const Icon = categoryIcon[service.category];
            return (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="glass-panel rounded-2xl p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="truncate text-sm font-semibold text-foreground">{service.name}</h2>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                        {service.rating}
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(service)}
                          aria-label={
                            favoriteByKey.has(service.id)
                              ? `Remove ${service.name} from favourites`
                              : `Save ${service.name} to favourites`
                          }
                          aria-pressed={favoriteByKey.has(service.id)}
                          className="ml-1 rounded-full p-1 transition-colors hover:bg-muted"
                        >
                          <Heart
                            className={cn(
                              "size-4",
                              favoriteByKey.has(service.id)
                                ? "fill-alert text-alert"
                                : "text-muted-foreground",
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </span>
                    </div>
                    {favoriteByKey.has(service.id) && (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-alert">
                        Saved place
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-muted-foreground">{service.address}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                        {service.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-1 font-medium text-info">
                        <Clock3 className="size-3" aria-hidden="true" />
                        {service.etaMinutes} min
                      </span>
                      {service.open24h && (
                        <span className="rounded-full bg-success/10 px-2.5 py-1 font-medium text-success">
                          Open 24h
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="hero">
                        <a href={`tel:${service.phone.replace(/\s/g, "")}`}>
                          <Phone className="size-4" />
                          Call
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={mapsDirectionsLink(`${service.name}, ${service.address}`)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Navigation className="size-4" />
                          Directions
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </>
  );
}