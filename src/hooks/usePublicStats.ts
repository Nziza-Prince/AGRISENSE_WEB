import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/api/client";

export type PublicStats = { farmers: number; farms: number; districts: number; hectares: number; partners: number };

/** Live counts for the landing page. Returns null until loaded, or if the API is unreachable, so no number is ever invented. */
export function usePublicStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/public/stats`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && [data.farmers, data.farms, data.districts, data.hectares, data.partners].every((n) => Number.isFinite(n))) {
          setStats(data as PublicStats);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return stats;
}
