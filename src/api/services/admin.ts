import { api } from "../client";
import type {
  AdminAuditLog,
  AdminFarmStatistics,
  AdminOverviewStatistics,
  AdminReportItem,
  AdminUserRole,
  AdminUserSummary,
  AdminUsersResponse,
  AdminUserStatus,
  ApprovalDto,
  BroadcastDto,
  CreateAdminUserDto,
  CreateOrgAccountDto,
  FarmListResponse,
  MessageResponse,
  ModeratePostDto,
} from "../types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface OnboardFarmerInput {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  farmName: string;
  sizeM2?: number;
  soilType: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  latitude?: number;
  longitude?: number;
  irrigationMethod?: string;
  farmCode?: string;
}

export const adminService = {
  onboardFarmer: (dto: OnboardFarmerInput) =>
    api.post<{ message: string; farmer: { id: string; email: string; firstName: string; lastName: string }; farm: { id: string; name: string } }>("/admin/farmers", dto),

  createUser: (dto: CreateAdminUserDto) =>
    api.post<MessageResponse>("/admin/users", dto),

  getUsers: (
    params: {
      page?: number;
      limit?: number;
      role?: AdminUserRole;
      status?: AdminUserStatus;
      search?: string;
      includeDeleted?: boolean;
    } = {},
  ) =>
    api.get<AdminUsersResponse>(
      `/admin/users${buildQuery({
        ...params,
        includeDeleted: params.includeDeleted ? "true" : undefined,
      })}`,
    ),

  getUserById: (id: string) =>
    api.get<AdminUserSummary>(`/admin/users/${id}`),

  getFarmStatistics: () => api.get<AdminFarmStatistics>("/admin/statistics/farms"),

  getOverviewStatistics: () =>
    api.get<AdminOverviewStatistics>("/admin/statistics/overview"),

  getAllFarms: (page = 1, limit = 50) =>
    api.get<FarmListResponse>(`/admin/farms${buildQuery({ page, limit })}`),

  updateUserStatus: (id: string, status: Exclude<AdminUserStatus, "PENDING">) =>
    api.put<MessageResponse>(`/admin/users/${id}/status`, { status }),

  suspendUser: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/suspend`, {}),

  banUser: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/ban`, {}),

  reactivateUser: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/reactivate`, {}),

  verifyUserEmail: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/verify-email`, {}),

  resetUserPassword: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/reset-password`, {}),

  updateUserRole: (id: string, role: AdminUserRole) =>
    api.put<MessageResponse>(`/admin/users/${id}/role`, { role }),

  assignRegions: (id: string, regions: string[]) =>
    api.put<MessageResponse>(`/admin/users/${id}/regions`, { regions }),

  softDeleteUser: (id: string) =>
    api.delete<MessageResponse>(`/admin/users/${id}`),

  restoreUser: (id: string) =>
    api.put<MessageResponse>(`/admin/users/${id}/restore`, {}),

  createSupplier: (dto: CreateOrgAccountDto) =>
    api.post<MessageResponse>("/admin/suppliers", dto),

  getSuppliers: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<{ data?: AdminUserSummary[]; items?: AdminUserSummary[]; suppliers?: AdminUserSummary[] }>(
      `/admin/suppliers${buildQuery(params)}`,
    ),

  approveSupplier: (id: string) =>
    api.put<MessageResponse>(`/admin/suppliers/${id}/approve`, {}),

  rejectSupplier: (id: string, dto: ApprovalDto = {}) =>
    api.put<MessageResponse>(`/admin/suppliers/${id}/reject`, dto),

  getPendingSuppliers: () =>
    api.get<{ data?: AdminUserSummary[]; items?: AdminUserSummary[]; suppliers?: AdminUserSummary[] }>(
      "/admin/suppliers/pending",
    ),

  createNgo: (dto: CreateOrgAccountDto) =>
    api.post<MessageResponse>("/admin/ngos", dto),

  getNgos: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<{ data?: AdminUserSummary[]; items?: AdminUserSummary[]; ngos?: AdminUserSummary[] }>(
      `/admin/ngos${buildQuery(params)}`,
    ),

  approveNgo: (id: string) =>
    api.put<MessageResponse>(`/admin/ngos/${id}/approve`, {}),

  rejectNgo: (id: string, dto: ApprovalDto = {}) =>
    api.put<MessageResponse>(`/admin/ngos/${id}/reject`, dto),

  getPendingNgos: () =>
    api.get<{ data?: AdminUserSummary[]; items?: AdminUserSummary[]; ngos?: AdminUserSummary[] }>(
      "/admin/ngos/pending",
    ),

  getReports: (page = 1, limit = 20) =>
    api.get<{ data?: AdminReportItem[]; items?: AdminReportItem[]; reports?: AdminReportItem[] }>(
      `/community/reports?page=${page}&limit=${limit}`,
    ),

  getReportedPosts: (page = 1, limit = 20) =>
    api.get<{ data?: AdminReportItem[]; items?: AdminReportItem[]; reports?: AdminReportItem[]; posts?: AdminReportItem[] }>(
      `/admin/posts/reported${buildQuery({ page, limit })}`,
    ),

  moderateReportedPost: (postId: string) =>
    api.post<MessageResponse>(`/community/posts/${postId}/moderate`, {}),

  moderatePost: (postId: string, dto: ModeratePostDto) =>
    api.put<MessageResponse>(`/admin/posts/${postId}/moderate`, dto),

  broadcastAnnouncement: (dto: BroadcastDto) =>
    api.post<MessageResponse>("/admin/announcements", dto),

  getAuditLogs: (page = 1, limit = 20, action?: string) =>
    api.get<{ data?: AdminAuditLog[]; items?: AdminAuditLog[]; logs?: AdminAuditLog[] }>(
      `/admin/audit-logs${buildQuery({ page, limit, action })}`,
    ),
};
