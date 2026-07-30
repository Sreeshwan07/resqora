/** Real-world emergency service lookup (no placeholder data). */
export type PlaceCategory = "hospital" | "police" | "fire" | "blood_bank";

export type NearbyPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  openNow: boolean | null;
  distanceKm: number;
  etaMinutes: number;
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function etaMinutes(distanceKm: number) {
  return Math.max(2, Math.round((distanceKm / 26) * 60) + 2);
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const FILTERS: Record<PlaceCategory, string[]> = {
  hospital: ['["amenity"="hospital"]', '["healthcare"="hospital"]'],
  police: ['["amenity"="police"]'],
  fire: ['["amenity"="fire_station"]'],
  blood_bank: ['["healthcare"="blood_donation"]', '["amenity"="blood_bank"]'],
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function buildQuery(lat: number, lng: number, radius: number) {
  const union = Object.values(FILTERS)
    .flat()
    .flatMap((filter) =>
      ["node", "way", "relation"].map(
        (kind) => `${kind}${filter}(around:${radius},${lat},${lng});`,
      ),
    )
    .join("\n");
  return `[out:json][timeout:20];(\n${union}\n);out center tags 120;`;
}

function categorise(tags: Record<string, string>): PlaceCategory | null {
  if (tags.healthcare === "blood_donation" || tags.amenity === "blood_bank") return "blood_bank";
  if (tags.amenity === "hospital" || tags.healthcare === "hospital") return "hospital";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "fire_station") return "fire";
  return null;
}

function formatAddress(tags: Record<string, string>) {
  const line = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  return (
    [line, tags["addr:suburb"], tags["addr:city"] || tags["addr:town"] || tags["addr:village"], tags["addr:postcode"], tags["addr:state"]]
      .filter(Boolean)
      .join(", ") || tags["addr:full"] || ""
  );
}

function parseOpenNow(tags: Record<string, string>): boolean | null {
  const hours = tags.opening_hours;
  if (!hours) return null;
  if (/24\/7/.test(hours)) return true;
  return null;
}

async function overpass(query: string) {
  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      return (await res.json()) as { elements: OverpassElement[] };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass unavailable");
}

/** Top N real services per category, sorted by straight-line distance. */
export async function findNearbyServices(
  origin: { lat: number; lng: number },
  perCategory = 3,
): Promise<Record<PlaceCategory, NearbyPlace[]>> {
  const result: Record<PlaceCategory, NearbyPlace[]> = {
    hospital: [],
    police: [],
    fire: [],
    blood_bank: [],
  };

  let elements: OverpassElement[] = [];
  for (const radius of [8000, 25000, 60000]) {
    const data = await overpass(buildQuery(origin.lat, origin.lng, radius));
    elements = data.elements ?? [];
    const named = elements.filter((el) => el.tags?.name);
    if (named.length >= 4) break;
  }

  const seen = new Set<string>();
  const places: NearbyPlace[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const category = categorise(tags);
    if (!category) continue;
    const key = `${category}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const distanceKm = Number(haversineKm(origin, { lat, lng }).toFixed(2));
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      category,
      lat,
      lng,
      address: formatAddress(tags),
      phone: tags.phone || tags["contact:phone"] || tags["emergency:phone"] || null,
      openNow: parseOpenNow(tags),
      distanceKm,
      etaMinutes: etaMinutes(distanceKm),
    });
  }

  places.sort((a, b) => a.distanceKm - b.distanceKm);
  for (const place of places) {
    if (result[place.category].length < perCategory) result[place.category].push(place);
  }
  return result;
}

/** Forward geocode a typed address / city into coordinates. */
export async function geocodePlace(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "AEGIS-emergency-app" } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const hit = data[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name };
}
