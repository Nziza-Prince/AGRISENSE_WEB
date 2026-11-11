import { useCallback, useEffect, useState } from "react";
import {
  getWeatherByCoords,
  getWeatherByPlace,
  getWeatherByPlaceQueries,
  type WeatherBundle,
} from "@/lib/weather";

const DEFAULT_PLACE = "Kigali, Rwanda";

interface UseWeatherOptions {
  /** Preferred place query, e.g. from a farm (used when GPS is off or fails). */
  place?: string;
  /** Multiple candidates from most-specific to broadest (village → country). */
  placeCandidates?: string[];
  /** Prefer the browser geolocation API (device location). Default true. */
  useGeolocation?: boolean;
  /** Prefer device GPS over farm place queries. Default true. */
  preferDevice?: boolean;
}

interface UseWeatherResult {
  weather: WeatherBundle | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function getGeolocation(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 },
    );
  });
}

export function useWeather({
  place,
  placeCandidates,
  useGeolocation = true,
  preferDevice = true,
}: UseWeatherOptions = {}): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const candidatesKey = (placeCandidates ?? []).join("|");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const queries = [
          ...(candidatesKey ? candidatesKey.split("|") : []),
          ...(place && place.trim() ? [place.trim()] : []),
        ].filter((q, i, arr) => q && arr.indexOf(q) === i);

        const tryPlace = async () => {
          if (queries.length === 0) return null;
          return getWeatherByPlaceQueries(queries);
        };

        const tryGps = async () => {
          if (!useGeolocation) return null;
          const pos = await getGeolocation();
          if (!pos) return null;
          return getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        };

        // Device location first (unless a farm place is explicitly preferred).
        if (preferDevice && useGeolocation) {
          const byGps = await tryGps();
          if (byGps) {
            if (active) setWeather(byGps);
            return;
          }
        }

        const byPlace = await tryPlace();
        if (byPlace) {
          if (active) setWeather(byPlace);
          return;
        }

        if (!preferDevice && useGeolocation) {
          const byGps = await tryGps();
          if (byGps) {
            if (active) setWeather(byGps);
            return;
          }
        }

        const fallback = await getWeatherByPlace(DEFAULT_PLACE);
        if (active) {
          if (fallback) setWeather(fallback);
          else setError("Unable to load weather data.");
        }
      } catch {
        if (active) setError("Unable to load weather data.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [place, candidatesKey, useGeolocation, preferDevice, nonce]);

  return { weather, loading, error, reload };
}
