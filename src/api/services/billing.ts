import { api } from "../client";
import type {
  AdminAssignSubscriptionDto,
  AdminRevokeSubscriptionDto,
  BillingPlan,
  CancelSubscriptionDto,
  CheckoutDto,
  CheckoutResponse,
  EnterpriseInquiryDto,
  MessageResponse,
  UserSubscription,
} from "../types";

function unwrapList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function unwrapSubscription(payload: unknown): UserSubscription {
  if (!payload || typeof payload !== "object") {
    return { planId: "starter", status: "active" };
  }
  const record = payload as Record<string, unknown>;
  const nested = record.subscription;
  if (nested && typeof nested === "object") {
    return nested as UserSubscription;
  }
  return payload as UserSubscription;
}

export type SeasonPassStatus = "awaiting_payment" | "submitted" | "paid" | "rejected";

export interface AdminSeasonPass {
  id: string;
  reference: string;
  status: SeasonPassStatus;
  amount: number;
  currency: string;
  seasonLabel: string;
  momoTransactionId: string | null;
  payerPhone: string | null;
  submittedAt: string | null;
  paidAt: string | null;
  adminNote: string | null;
  createdAt: string;
  farmId?: string;
  farmName?: string;
  farmer?: { id: string; name: string; email: string; phone: string | null };
}

export interface SeasonPassList {
  items: AdminSeasonPass[];
  total: number;
  page: number;
  limit: number;
  summary: Partial<Record<SeasonPassStatus, { count: number; amount: number }>>;
}

export const billingService = {
  getPlans: async () => {
    const res = await api.get<BillingPlan[] | { plans?: BillingPlan[]; data?: BillingPlan[]; items?: BillingPlan[] }>(
      "/billing/plans",
      { auth: false },
    );
    return unwrapList<BillingPlan>(res, ["plans", "data", "items"]);
  },

  getSubscription: async () => {
    const res = await api.get<UserSubscription | { subscription?: UserSubscription }>(
      "/billing/subscription",
    );
    return unwrapSubscription(res);
  },

  activateStarter: () =>
    api.post<UserSubscription | { subscription?: UserSubscription; message?: string }>(
      "/billing/subscription/starter",
      {},
    ),

  checkout: (dto: CheckoutDto) =>
    api.post<CheckoutResponse>("/billing/checkout", dto),

  getCheckout: (checkoutId: string) =>
    api.get<CheckoutResponse>(`/billing/checkout/${checkoutId}`),

  cancel: (dto: CancelSubscriptionDto = { atPeriodEnd: true }) =>
    api.post<UserSubscription | { subscription?: UserSubscription }>("/billing/subscription/cancel", dto),

  resume: () =>
    api.post<UserSubscription | { subscription?: UserSubscription }>(
      "/billing/subscription/resume",
      {},
    ),

  enterpriseInquiry: (dto: EnterpriseInquiryDto) =>
    api.post<MessageResponse>("/billing/enterprise/inquiry", dto),

  // Admin
  adminListSubscriptions: (params: Record<string, string | number | undefined> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    return api.get<unknown>(`/admin/billing/subscriptions${qs ? `?${qs}` : ""}`);
  },

  adminListTransactions: (params: Record<string, string | number | undefined> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    return api.get<unknown>(`/admin/billing/transactions${qs ? `?${qs}` : ""}`);
  },

  // Season pass payments (mobile money, confirmed by an admin)
  adminListSeasonPasses: (params: Record<string, string | number | undefined> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    return api.get<SeasonPassList>(`/admin/billing/season-passes${qs ? `?${qs}` : ""}`);
  },

  adminMarkSeasonPassPaid: (passId: string, note?: string) =>
    api.post<AdminSeasonPass>(`/admin/billing/season-passes/${passId}/mark-paid`, note ? { note } : {}),

  adminRejectSeasonPass: (passId: string, reason: string) =>
    api.post<AdminSeasonPass>(`/admin/billing/season-passes/${passId}/reject`, { reason }),

  adminAssign: (userId: string, dto: AdminAssignSubscriptionDto) =>
    api.post<MessageResponse>(`/admin/billing/subscriptions/${userId}/assign`, dto),

  adminRevoke: (userId: string, dto: AdminRevokeSubscriptionDto = {}) =>
    api.post<MessageResponse>(`/admin/billing/subscriptions/${userId}/revoke`, dto),
};
