// Types generated from the Agrisense OpenAPI spec.
// The API base URL is configured via VITE_API_BASE_URL (see .env.example);
// the interactive docs are served at `${VITE_API_BASE_URL}/api/docs`.

export type SoilType = "clay" | "sandy" | "loamy" | "silty" | "peaty" | "chalky";

export type RecommendationType =
  | "crop"
  | "fertilizer"
  | "irrigation"
  | "disease"
  | "weather"
  | "general";

export type PredictionSource = "manual" | "image";

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isEmailVerified?: boolean;
  provider?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  farmsCount?: number;
  hasFarm?: boolean;
  nationalId?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  farm?: Farm | null;
  /** Present when billing module is enabled (from auth/me / profile / tokens). */
  subscription?: UserSubscriptionSummary | null;
}

export interface RegisterDto {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface LoginDto {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  user: AuthUser;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  user: AuthUser;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyResetOtpDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
}

export interface IdentityVerificationDto {
  nationalId: string;
  documentType: "NATIONAL_ID" | string;
  idImageUrl?: string;
}

export interface OnboardingFarmDto {
  name: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  size: number;
  soilType: SoilType | string;
  latitude?: number;
  longitude?: number;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface MessageResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Farm management
// ---------------------------------------------------------------------------

export interface Farm {
  id: string;
  name: string;
  size: number;
  soilType: SoilType | string;
  country: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFarmDto {
  name: string;
  size: number;
  soilType: SoilType;
  country: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail: string;
}

export type UpdateFarmDto = Partial<CreateFarmDto>;

export type FarmCropStatus =
  | "PLANNED"
  | "PLANTED"
  | "GROWING"
  | "READY_FOR_HARVEST"
  | "HARVESTED";

export interface FarmCrop {
  id: string;
  cropType: string;
  variety?: string;
  plantingSeason?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  harvestSeason?: string;
  status?: FarmCropStatus | string;
  estimatedYield?: number;
  areaPlanted?: number;
  [key: string]: unknown;
}

export interface CreateFarmCropDto {
  cropType: string;
  variety?: string;
  plantingSeason?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  harvestSeason?: string;
  status?: FarmCropStatus | string;
  estimatedYield?: number;
  areaPlanted?: number;
}

export interface UpdateFarmCropDto extends Partial<CreateFarmCropDto> {}

export interface FarmListResponse {
  count: number;
  farms: Farm[];
}

export interface CreateFarmResponse {
  message: string;
  farm: Farm;
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export interface PostAuthor {
  id: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  deleted?: boolean;
  banned?: boolean;
  status?: string;
}

export interface PostLike {
  id: string;
  user: PostAuthor;
}

export interface PostComment {
  id: string;
  content: string;
  author: PostAuthor;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityPost {
  id: string;
  title?: string;
  description: string;
  imageUrl?: string | null;
  author: PostAuthor;
  likes: PostLike[];
  comments: PostComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostDto {
  title?: string;
  description: string;
  image?: File;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

// ---------------------------------------------------------------------------
// Community chat (direct + group)
// ---------------------------------------------------------------------------

export type ConversationType = "direct" | "group";

export interface ChatUserSummary {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string | null;
  [key: string]: unknown;
}

export interface ConversationMember {
  id?: string;
  userId?: string;
  role?: string;
  muted?: boolean;
  lastReadAt?: string | null;
  user?: ChatUserSummary;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  senderId?: string;
  sender?: ChatUserSummary;
  author?: ChatUserSummary;
  user?: ChatUserSummary;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  type?: ConversationType | string;
  name?: string | null;
  imageUrl?: string | null;
  createdById?: string;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  members?: ConversationMember[];
  participants?: ChatUserSummary[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  muted?: boolean;
  [key: string]: unknown;
}

export interface CreateDirectConversationDto {
  userId: string;
}

export interface CreateGroupConversationDto {
  name: string;
  memberIds: string[];
}

export interface UpdateGroupDto {
  name: string;
}

export interface GroupMembersDto {
  memberIds: string[];
}

export interface MuteConversationDto {
  muted?: boolean;
}

export interface SendMessageDto {
  content: string;
}

export interface ConversationsResponse {
  conversations?: Conversation[];
  items?: Conversation[];
  data?: Conversation[];
  [key: string]: unknown;
}

export interface ChatMessagesResponse {
  messages?: ChatMessage[];
  items?: ChatMessage[];
  data?: ChatMessage[];
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

export interface CreatePredictionDto {
  image: File;
  farmId: string;
  source?: PredictionSource;
  rawImageUrl?: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  crop_type?: string;
  soil_moisture?: number;
  lat?: number;
  lon?: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilType?: string;
  phLevel?: number;
  organicLevels?: number;
  soilColor?: string;
  soilStructure?: string;
  propertyRates?: Record<string, unknown>;
  npkRates?: Record<string, unknown>;
  modelName?: string;
  modelVersion?: string;
  metadata?: Record<string, unknown>;
}

export interface Recommendation {
  id: string;
  type: RecommendationType | string;
  title?: string;
  description?: string;
  content?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PredictionRun {
  id: string;
  farmId?: string;
  createdAt?: string;
  recommendations?: Recommendation[];
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data?: T[];
  items?: T[];
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

// Dashboard shape is loosely typed since the backend returns a rich object.
export interface DashboardData {
  latest?: Record<string, unknown> | null;
  soilComposition?: Record<string, unknown> | null;
  history?: unknown[];
  trends?: unknown[];
  suggestions?: unknown[];
  runs?: PredictionRun[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface NotificationListResponse extends PaginatedResponse<NotificationItem> {
  notifications?: NotificationItem[];
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  stock?: number;
  supplier?: {
    id?: string;
    businessName?: string;
    name?: string;
  };
  [key: string]: unknown;
}

export interface MarketplaceProductsResponse extends PaginatedResponse<MarketplaceProduct> {
  products?: MarketplaceProduct[];
}

export interface MarketplaceOrder {
  id: string;
  status?: string;
  quantity?: number;
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
  product?: MarketplaceProduct;
  [key: string]: unknown;
}

export interface MarketplaceOrdersResponse extends PaginatedResponse<MarketplaceOrder> {
  orders?: MarketplaceOrder[];
}

export interface CreateMarketplaceOrderDto {
  productId: string;
  quantity: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type AdminUserRole = "FARMER" | "SUPPLIER" | "ADMIN" | "NGO" | "GOVERNMENT" | "CFO";
export type AdminUserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";

export interface AdminUserSummary {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: AdminUserRole | string;
  status?: AdminUserStatus | string;
  createdAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export interface AdminUsersResponse extends PaginatedResponse<AdminUserSummary> {
  users?: AdminUserSummary[];
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminUserRole;
  phoneNumber?: string;
  assignedRegions?: string[];
}

export interface AdminFarmStatistics {
  totalFarms?: number;
  averageFarmSize?: number;
  activeFarms?: number;
  archivedFarms?: number;
  byProvince?: Array<{ name?: string; province?: string; value?: number; count?: number }>;
  [key: string]: unknown;
}

export interface AdminReportItem {
  id: string;
  reason?: string;
  description?: string;
  status?: string;
  postId?: string;
  excerpt?: string;
  createdAt?: string;
  author?: PostAuthor;
  [key: string]: unknown;
}

export interface AdminAuditLog {
  id: string;
  action?: string;
  createdAt?: string;
  actor?: PostAuthor | null;
  targetUser?: AdminUserSummary | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ApprovalDto {
  reason?: string;
}

export interface BroadcastDto {
  title: string;
  message: string;
  /** Optional role audience; omit to broadcast to everyone. */
  targetRole?: AdminUserRole | string;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export interface JoinWaitlistDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  interest?: "FARMER" | "SUPPLIER" | "NGO" | "GOVERNMENT" | "OTHER";
  organization?: string;
  province?: string;
  message?: string;
  source?: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  interest?: string;
  organization?: string;
  province?: string;
  isActive?: boolean;
  status?: string;
  emailSentAt?: string | null;
  createdAt?: string;
  deactivatedAt?: string | null;
  [key: string]: unknown;
}

export interface WaitlistStats {
  total?: number;
  active?: number;
  inactive?: number;
  emailsSent?: number;
  [key: string]: unknown;
}

export interface WaitlistListResponse extends PaginatedResponse<WaitlistEntry> {
  entries?: WaitlistEntry[];
  waitlist?: WaitlistEntry[];
}

export interface CreateOrgAccountDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  businessName?: string;
  organizationName?: string;
  description?: string;
  registrationNumber?: string;
  website?: string;
  assignedRegions?: string[];
  focusAreas?: string[];
  autoApprove?: boolean;
}

export type ModeratePostAction = "hide" | "unhide" | "delete";

export interface ModeratePostDto {
  action: ModeratePostAction;
}

export interface AdminOverviewStatistics {
  totalUsers?: number;
  activeUsers?: number;
  suspendedUsers?: number;
  bannedUsers?: number;
  totalFarms?: number;
  pendingSuppliers?: number;
  pendingNgos?: number;
  waitlistTotal?: number;
  reportedPosts?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// NGO / Government regional portal
// ---------------------------------------------------------------------------

export interface NgoProfile {
  id?: string;
  organizationName?: string;
  description?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  focusAreas?: string[];
  assignedRegions?: string[];
  status?: string;
  isApproved?: boolean;
  [key: string]: unknown;
}

export interface UpdateNgoProfileDto {
  organizationName?: string;
  description?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  focusAreas?: string[];
}

export interface NgoProgram {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  targetRegions?: string[];
  budget?: string | number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  status?: string;
  farmersReached?: number;
  progress?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateProgramDto {
  title: string;
  description?: string;
  targetRegions?: string[];
  budget?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProgramDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface OrgStatistics {
  totalFarmers?: number;
  totalFarms?: number;
  activeFarms?: number;
  regionsCovered?: number;
  activePrograms?: number;
  averageFarmSize?: number;
  cropsCultivated?: number;
  diseaseAlerts?: number;
  [key: string]: unknown;
}

export interface RegionalStatRow {
  region?: string;
  province?: string;
  district?: string;
  name?: string;
  farms?: number;
  totalFarms?: number;
  farmers?: number;
  totalFarmers?: number;
  mainCrop?: string;
  crop?: string;
  diseaseRisk?: string;
  harvestProgress?: number | string;
  averageFarmSize?: number;
  [key: string]: unknown;
}

export interface DiseaseTrendItem {
  id?: string;
  disease?: string;
  diseaseName?: string;
  crop?: string;
  region?: string;
  province?: string;
  district?: string;
  affectedFarms?: number;
  percentage?: number;
  severity?: string;
  trend?: string;
  confidence?: number;
  recommendation?: string;
  [key: string]: unknown;
}

export interface OrgFarmerSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  province?: string;
  district?: string;
  farmsCount?: number;
  [key: string]: unknown;
}

export interface OrgFarmSummary {
  id: string;
  name?: string;
  farmName?: string;
  province?: string;
  district?: string;
  cropType?: string;
  crop?: string;
  size?: number;
  sizeHa?: number;
  status?: string;
  [key: string]: unknown;
}

export interface GovernmentAdvisory {
  id: string;
  title?: string;
  content?: string;
  type?: "GENERAL" | "WEATHER" | "DISEASE" | "EMERGENCY" | "FOOD_SECURITY" | string;
  targetRegions?: string[];
  isPublished?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateAdvisoryDto {
  title: string;
  content: string;
  type: "GENERAL" | "WEATHER" | "DISEASE" | "EMERGENCY" | "FOOD_SECURITY";
  targetRegions?: string[];
}

export interface UpdateAdvisoryDto {
  title?: string;
  content?: string;
  isPublished?: boolean;
}

export interface SendOrgNotificationDto {
  title?: string;
  message?: string;
  content?: string;
  targetRegions?: string[];
  crop?: string;
  [key: string]: unknown;
}

export const RWANDA_PROVINCES = [
  "Northern Province",
  "Southern Province",
  "Eastern Province",
  "Western Province",
  "Kigali City",
] as const;

// ---------------------------------------------------------------------------
// Billing / Subscriptions
// ---------------------------------------------------------------------------

export type BillingPlanId = "starter" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type BillingPaymentMethod = "momo" | "airtel" | "card" | "manual" | "none";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "pending_payment"
  | "expired";

export interface PlanLimits {
  maxFarms?: number | null;
  weatherDays?: number | null;
  aiRecommendations?: boolean;
  marketInsights?: boolean;
  prioritySupport?: boolean;
  unlimitedSoilReports?: boolean;
  [key: string]: unknown;
}

/** Compact subscription attached to auth profile / tokens. */
export interface UserSubscriptionSummary {
  planId?: BillingPlanId | string;
  status?: SubscriptionStatus | string;
  billingCycle?: BillingCycle | null;
  limits?: PlanLimits;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  [key: string]: unknown;
}

export interface BillingPlan {
  id: BillingPlanId | string;
  name?: string;
  title?: string;
  description?: string;
  features?: string[];
  /** Preferred backend field names */
  priceMonthly?: number | null;
  priceAnnualPerMonth?: number | null;
  /** Aliases some responses may use */
  monthly?: number | null;
  annualPerMonth?: number | null;
  limits?: PlanLimits;
  isPublic?: boolean;
  popular?: boolean;
  [key: string]: unknown;
}

export interface UserSubscription {
  id?: string;
  planId: BillingPlanId | string;
  billingCycle?: BillingCycle | null;
  status: SubscriptionStatus | string;
  paymentMethod?: BillingPaymentMethod | string;
  paymentLabel?: string;
  label?: string;
  amount?: number;
  currency?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  limits?: PlanLimits;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CheckoutDto {
  planId: "pro";
  billingCycle: BillingCycle;
  method: "momo" | "airtel" | "card";
  phone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutPaymentInfo {
  provider?: string;
  mode?: string;
  redirectUrl?: string;
  message?: string;
  providerRef?: string;
  [key: string]: unknown;
}

export interface CheckoutResponse {
  checkoutId: string;
  status?: SubscriptionStatus | string;
  providerRef?: string;
  payment?: CheckoutPaymentInfo;
  subscription?: UserSubscription;
  [key: string]: unknown;
}

export interface CancelSubscriptionDto {
  atPeriodEnd?: boolean;
}

export interface EnterpriseInquiryDto {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
}

export interface AdminAssignSubscriptionDto {
  planId: BillingPlanId;
  periodDays?: number;
  note?: string;
  billingCycle?: BillingCycle;
}

export interface AdminRevokeSubscriptionDto {
  note?: string;
}

// ---------------------------------------------------------------------------
// Finance (CFO portal)
// ---------------------------------------------------------------------------

export type FinanceAccountType =
  | "BANK"
  | "CASH"
  | "MOBILE_MONEY"
  | "PAYMENT_PLATFORM"
  | "OTHER";

export type FinanceCategoryKind = "INCOME" | "EXPENSE";
export type FinanceTransactionType = "INCOME" | "EXPENSE";
export type FinanceTransactionStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type FinanceAuditAction =
  | "CREATED"
  | "UPDATED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type FinanceAuditEntity = "TRANSACTION" | "ACCOUNT" | "CATEGORY";
export type FinanceRangePreset = "week" | "month" | "quarter" | "year" | "custom";

export interface FinanceAccount {
  id: string;
  name: string;
  type: FinanceAccountType | string;
  currency?: string;
  institution?: string | null;
  accountNumber?: string | null;
  description?: string | null;
  isActive?: boolean;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  kind: FinanceCategoryKind | string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType | string;
  status: FinanceTransactionStatus | string;
  amount: number;
  currency?: string;
  occurredAt: string;
  description: string;
  notes?: string | null;
  reference?: string | null;
  counterparty?: string | null;
  accountId: string;
  categoryId: string;
  account?: { id: string; name: string; type?: string };
  category?: { id: string; name: string; kind?: string };
  createdById?: string;
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceDashboard {
  currency: string;
  range: { preset: string; from: string; to: string };
  totals: {
    currentBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    pendingExpenses: number;
    pendingExpenseCount: number;
  };
  accounts: FinanceAccount[];
  recentTransactions: FinanceTransaction[];
  incomeVsExpenses: Array<{
    period: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  expensesByCategory: Array<{
    categoryId: string;
    name: string;
    color?: string | null;
    amount: number;
  }>;
}

export interface FinanceReport {
  kind: string;
  currency: string;
  range: { preset: string; from: string; to: string };
  summary: { income: number; expenses: number; net: number; count: number };
  expensesByCategory?: Array<{ categoryId: string; name: string; amount: number }>;
  rows: FinanceTransaction[];
}

export interface FinanceAuditLog {
  id: string;
  action: FinanceAuditAction | string;
  entityType: FinanceAuditEntity | string;
  entityId: string;
  userId?: string | null;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateFinanceAccountDto {
  name: string;
  type: FinanceAccountType;
  institution?: string;
  accountNumber?: string;
  description?: string;
}

export interface UpdateFinanceAccountDto extends Partial<CreateFinanceAccountDto> {
  isActive?: boolean;
}

export interface CreateFinanceCategoryDto {
  name: string;
  kind: FinanceCategoryKind;
  description?: string;
  color?: string;
}

export interface UpdateFinanceCategoryDto extends Partial<CreateFinanceCategoryDto> {
  isActive?: boolean;
}

export interface CreateFinanceTransactionDto {
  type: FinanceTransactionType;
  amount: number;
  occurredAt: string;
  description: string;
  accountId: string;
  categoryId: string;
  counterparty?: string;
  reference?: string;
  notes?: string;
  status?: FinanceTransactionStatus;
}

export interface UpdateFinanceTransactionDto
  extends Partial<Omit<CreateFinanceTransactionDto, "status">> {}


