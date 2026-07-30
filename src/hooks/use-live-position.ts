import { useEffect, useState } from "react";

export type LivePosition = {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: Date;
};

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    return (
      [data.locality || data.city, data.principalSubdivision, data.countryName]
        .filter(Boolean)
        .join(", ") || null
    );
  } catch {
    return null;
  }
}

/** Watches the device GPS and resolves a readable address for the landing page. */
export function useLivePosition() {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDenied(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          updatedAt: new Date(),
        }),
      () => setDenied(true),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Force a fresh fix every 10s even when the device reports no movement.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            updatedAt: new Date(),
          }),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 },
      );
    }, 10_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!position) return;
    let cancelled = false;
    void reverseGeocode(position.lat, position.lng).then((value) => {
      if (!cancelled && value) setAddress(value);
    });
    return () => {
      cancelled = true;
    };
    // Re-resolve only when the rounded location changes.
  }, [position?.lat.toFixed(3), position?.lng.toFixed(3)]);

  return { position, address, denied };
}
