/**
 * Canonical app routes.
 * Keep path strings here so navigations stay consistent across the app.
 */
export const routes = {
  home: "/",
  about: "/about",
  services: "/services",
  blog: "/blog",
  contact: "/contact",

  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verifyOtp: "/auth/verify-otp",
    forgotPassword: "/auth/forgot-password",
    farmerOnboarding: "/auth/farmer-onboarding",
  },

  legal: {
    terms: "/legal/terms",
    privacy: "/legal/privacy",
  },

  app: {
    root: "/app",
    marketplace: "/app/marketplace",
    orders: "/app/orders",
    notifications: "/app/notifications",
    predictionHistory: "/app/predictions",
    cropCare: "/app/crop-care",
    soil: "/app/soil",
    weather: "/app/weather",
    analytics: "/app/analytics",
    community: "/app/community",
    messages: "/app/messages",
    help: "/app/help",
    settings: "/app/settings",
    subscription: "/app/subscription",
  },

  supplier: {
    root: "/supplier",
    products: "/supplier/products",
    orders: "/supplier/orders",
    buyers: "/supplier/buyers",
    analytics: "/supplier/analytics",
    notifications: "/supplier/notifications",
    settings: "/supplier/settings",
  },

  admin: {
    root: "/admin",
    users: "/admin/users",
    suppliers: "/admin/suppliers",
    waitlist: "/admin/waitlist",
    billing: "/admin/billing",
    moderation: "/admin/moderation",
    analytics: "/admin/analytics",
    notifications: "/admin/notifications",
    settings: "/admin/settings",
  },

  ngo: {
    root: "/ngo",
    programs: "/ngo/programs",
    regions: "/ngo/regions",
    diseaseRisk: "/ngo/disease-risk",
    advisories: "/ngo/advisories",
    farmers: "/ngo/farmers",
    reports: "/ngo/reports",
    notifications: "/ngo/notifications",
    settings: "/ngo/settings",
  },

  finance: {
    root: "/finance",
    transactions: "/finance/transactions",
    accounts: "/finance/accounts",
    reports: "/finance/reports",
    audit: "/finance/audit",
    notifications: "/finance/notifications",
  },
} as const;

export function getDefaultRouteForRole(role?: string | null): string {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return routes.admin.root;
    case "CFO":
      return routes.finance.root;
    case "SUPPLIER":
      return routes.supplier.root;
    case "NGO":
    case "GOVERNMENT":
      return routes.ngo.root;
    case "FARMER":
    default:
      return routes.app.root;
  }
}
