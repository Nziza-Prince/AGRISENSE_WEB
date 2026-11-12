import DashboardLayout from "./DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import {
  ApiError,
  marketplaceService,
  predictionService,
  type MarketplaceProduct,
  type Recommendation,
} from "@/api";
import { useFarms } from "@/hooks/useFarms";
import { usePlanEntitlements } from "@/hooks/usePlanEntitlements";
import { PlanUpgradeBanner } from "@/components/PlanUpgradeBanner";

function getProducts(data: unknown): MarketplaceProduct[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.products ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as MarketplaceProduct[]) : [];
}

export default function Marketplace() {
  const { farms } = useFarms();
  const entitlements = usePlanEntitlements();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Marketplace | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const productsRes = await marketplaceService.getProducts({ page: 1, limit: 40 });
        if (!active) return;
        setProducts(getProducts(productsRes));

        if (entitlements.marketInsights) {
          const recRes = await predictionService.getRecommendations({ limit: 20 });
          if (!active) return;
          setRecommendations((recRes.data || recRes.items || []) as Recommendation[]);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Failed to load marketplace.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [entitlements.marketInsights]);

  const firstFarm = farms[0];
  const recommendationIds = useMemo(
    () => recommendations.map((item) => item.id).filter(Boolean),
    [recommendations],
  );

  const orderProduct = async (productId: string) => {
    setOrderingId(productId);
    setError(null);
    try {
      await marketplaceService.createOrder({ productId, quantity: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create order.");
    } finally {
      setOrderingId(null);
    }
  };

  const matchedEnabled =
    entitlements.marketInsights && Boolean(firstFarm?.id && recommendationIds.length);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B6E4F]">Marketplace</h1>
          <p className="text-sm text-gray-500">
            {entitlements.marketInsights
              ? "Browse supplier products and order AI-matched items for your farms."
              : "Browse supplier products on Starter. AI market insights unlock on Pro."}
          </p>
        </div>

        {!entitlements.marketInsights && (
          <PlanUpgradeBanner
            title="AI market insights are on Pro"
            description="Starter can browse and order products. Upgrade for AI-matched product recommendations."
          />
        )}

        {matchedEnabled && (
          <button
            onClick={async () => {
              const res = await marketplaceService.getMatchedProducts(firstFarm!.id, recommendationIds);
              setProducts(getProducts(res));
            }}
            className="rounded-lg bg-[#2C6E49] px-4 py-2 text-sm font-semibold text-white"
          >
            Load AI-matched products
          </button>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border bg-white">
            <EmptyState art="box" title="New products are on their way" text="Suppliers add seeds, fertiliser and tools here. Check back soon." />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="mb-4 h-44 w-full rounded-xl object-cover"
                  />
                )}
                <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{product.category || "General"}</p>
                <p className="mt-3 text-sm text-gray-600">
                  {product.description || "No description available."}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#2C6E49]">
                      {typeof product.price === "number" ? `${product.price.toLocaleString()} RWF` : "Price on request"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.unit ? `per ${product.unit}` : "Unit not specified"}
                    </p>
                  </div>
                  <button
                    onClick={() => orderProduct(product.id)}
                    disabled={orderingId === product.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2C6E49] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {orderingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
