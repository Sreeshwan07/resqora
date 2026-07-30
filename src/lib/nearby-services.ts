export type ServiceCategory = "hospital" | "police" | "fire" | "pharmacy" | "shelter";

export type NearbyService = {
  id: string;
  name: string;
  category: ServiceCategory;
  distanceKm: number;
  etaMinutes: number;
  address: string;
  phone: string;
  open24h: boolean;
  rating: number;
};

export const serviceCategories: { value: ServiceCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire" },
  { value: "pharmacy", label: "Pharmacies" },
  { value: "shelter", label: "Shelters" },
];

export const nearbyServices: NearbyService[] = [
  {
    id: "svc-1",
    name: "St. Helena General Hospital",
    category: "hospital",
    distanceKm: 1.2,
    etaMinutes: 5,
    address: "48 Meridian Avenue",
    phone: "+1 555 0142",
    open24h: true,
    rating: 4.7,
  },
  {
    id: "svc-2",
    name: "Central Trauma Centre",
    category: "hospital",
    distanceKm: 3.4,
    etaMinutes: 11,
    address: "9 Harbour Road",
    phone: "+1 555 0188",
    open24h: true,
    rating: 4.9,
  },
  {
    id: "svc-3",
    name: "District Police Station 4",
    category: "police",
    distanceKm: 0.8,
    etaMinutes: 4,
    address: "12 Civic Square",
    phone: "+1 555 0110",
    open24h: true,
    rating: 4.2,
  },
  {
    id: "svc-4",
    name: "Riverside Police Post",
    category: "police",
    distanceKm: 2.6,
    etaMinutes: 9,
    address: "220 Riverside Drive",
    phone: "+1 555 0119",
    open24h: false,
    rating: 4.0,
  },
  {
    id: "svc-5",
    name: "Fire & Rescue Station 7",
    category: "fire",
    distanceKm: 1.9,
    etaMinutes: 6,
    address: "3 Kiln Street",
    phone: "+1 555 0133",
    open24h: true,
    rating: 4.8,
  },
  {
    id: "svc-6",
    name: "NightCare Pharmacy",
    category: "pharmacy",
    distanceKm: 0.5,
    etaMinutes: 3,
    address: "77 Lantern Lane",
    phone: "+1 555 0164",
    open24h: true,
    rating: 4.5,
  },
  {
    id: "svc-7",
    name: "Greenfield Chemist",
    category: "pharmacy",
    distanceKm: 2.1,
    etaMinutes: 8,
    address: "5 Greenfield Way",
    phone: "+1 555 0171",
    open24h: false,
    rating: 4.1,
  },
  {
    id: "svc-8",
    name: "Northside Safe Shelter",
    category: "shelter",
    distanceKm: 4.2,
    etaMinutes: 14,
    address: "18 Beacon Hill",
    phone: "+1 555 0195",
    open24h: true,
    rating: 4.4,
  },
];