import { api } from "../client";
import type {
  CreateFinanceAccountDto,
  CreateFinanceCategoryDto,
  CreateFinanceTransactionDto,
  FinanceAccount,
  FinanceAuditLog,
  FinanceCategory,
  FinanceCategoryKind,
  FinanceDashboard,
  FinanceRangePreset,
  FinanceReport,
  FinanceTransaction,
  FinanceTransactionStatus,
  FinanceTransactionType,
  UpdateFinanceAccountDto,
  UpdateFinanceCategoryDto,
  UpdateFinanceTransactionDto,
} from "../types";

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const financeService = {
  getDashboard: (params: { preset?: FinanceRangePreset; from?: string; to?: string } = {}) =>
    api.get<FinanceDashboard>(`/finance/dashboard${buildQuery(params)}`),

  listAccounts: () => api.get<{ currency: string; accounts: FinanceAccount[] }>("/finance/accounts"),

  createAccount: (dto: CreateFinanceAccountDto) =>
    api.post<FinanceAccount>("/finance/accounts", dto),

  updateAccount: (id: string, dto: UpdateFinanceAccountDto) =>
    api.patch<FinanceAccount>(`/finance/accounts/${id}`, dto),

  listCategories: (kind?: FinanceCategoryKind) =>
    api.get<{ categories: FinanceCategory[] }>(
      `/finance/categories${buildQuery({ kind })}`,
    ),

  createCategory: (dto: CreateFinanceCategoryDto) =>
    api.post<FinanceCategory>("/finance/categories", dto),

  updateCategory: (id: string, dto: UpdateFinanceCategoryDto) =>
    api.patch<FinanceCategory>(`/finance/categories/${id}`, dto),

  listTransactions: (
    params: {
      page?: number;
      limit?: number;
      type?: FinanceTransactionType;
      status?: FinanceTransactionStatus;
      accountId?: string;
      categoryId?: string;
      search?: string;
      preset?: FinanceRangePreset;
      from?: string;
      to?: string;
    } = {},
  ) =>
    api.get<{
      transactions: FinanceTransaction[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/finance/transactions${buildQuery(params)}`),

  getTransaction: (id: string) => api.get<FinanceTransaction>(`/finance/transactions/${id}`),

  createTransaction: (dto: CreateFinanceTransactionDto) =>
    api.post<FinanceTransaction>("/finance/transactions", dto),

  updateTransaction: (id: string, dto: UpdateFinanceTransactionDto) =>
    api.patch<FinanceTransaction>(`/finance/transactions/${id}`, dto),

  approveTransaction: (id: string) =>
    api.post<FinanceTransaction>(`/finance/transactions/${id}/approve`, {}),

  rejectTransaction: (id: string, reason?: string) =>
    api.post<FinanceTransaction>(`/finance/transactions/${id}/reject`, { reason }),

  cancelTransaction: (id: string, reason?: string) =>
    api.post<FinanceTransaction>(`/finance/transactions/${id}/cancel`, { reason }),

  getReport: (params: {
    kind?: string;
    preset?: FinanceRangePreset;
    from?: string;
    to?: string;
    accountId?: string;
    categoryId?: string;
  } = {}) => api.get<FinanceReport>(`/finance/reports${buildQuery(params)}`),

  listAudit: (
    params: { page?: number; limit?: number; action?: string; entityType?: string } = {},
  ) =>
    api.get<{
      logs: FinanceAuditLog[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/finance/audit${buildQuery(params)}`),
};
