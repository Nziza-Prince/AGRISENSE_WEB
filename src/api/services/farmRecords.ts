import { api } from "../client";

export type MonitoringStatus = "normal" | "attention_required" | "alert";

export interface AdminFarm {
  id: string;
  name: string;
  farmCode: string | null;
  upi: string | null;
  size: number | string;
  soilType: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string;
  irrigationMethod: string | null;
  soilInformation: string | null;
  userId: string;
  province?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isActive?: boolean;
  createdAt?: string;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null; phoneNumber: string | null; status?: string };
}

export interface FieldVisit {
  id: string;
  seasonRecordId: string;
  representative: string | null;
  visitDate: string | null;
  nextMonitoringDate: string | null;
  notes: string | null;
  photoUrls: string[] | null;
}

export interface SeasonRecord {
  id: string;
  farmId: string;
  season: string;
  seasonYear: number;
  selectedCrop: string | null;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  measuredAt: string | null;
  moisture: number | string | null;
  temperature: number | string | null;
  ph: number | string | null;
  nitrogen: number | string | null;
  phosphorus: number | string | null;
  potassium: number | string | null;
  ec: number | string | null;
  farmCondition: string | null;
  monitoringStatus: MonitoringStatus | null;
  observations: string | null;
  recommendedAction: string | null;
  visits: FieldVisit[];
}

export type SeasonRecordInput = Partial<Omit<SeasonRecord, "id" | "farmId" | "visits">>;
export type FieldVisitInput = Partial<Omit<FieldVisit, "id" | "seasonRecordId">>;
export type FarmInput = Partial<
  Pick<
    AdminFarm,
    | "name" | "farmCode" | "upi" | "soilType" | "district" | "sector" | "cell" | "village"
    | "irrigationMethod" | "soilInformation"
  >
> & { size?: number };
export interface ContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
}

export const farmRecordsService = {
  listFarms: () => api.get<{ farms: AdminFarm[]; total: number }>("/admin/farms?page=1&limit=100"),
  getFarm: (id: string) => api.get<AdminFarm>(`/admin/farms/${id}`),
  updateFarm: (id: string, body: FarmInput) => api.patch<AdminFarm>(`/admin/farms/${id}`, body),
  updateContact: (userId: string, body: ContactInput) =>
    api.patch<unknown>(`/admin/farmers/${userId}/contact`, body),
  listRecords: (farmId: string) => api.get<SeasonRecord[]>(`/admin/farms/${farmId}/season-records`),
  createRecord: (farmId: string, body: SeasonRecordInput) =>
    api.post<SeasonRecord>(`/admin/farms/${farmId}/season-records`, body),
  updateRecord: (id: string, body: SeasonRecordInput) =>
    api.patch<SeasonRecord>(`/admin/season-records/${id}`, body),
  deleteRecord: (id: string) => api.delete<unknown>(`/admin/season-records/${id}`),
  createVisit: (recordId: string, body: FieldVisitInput) =>
    api.post<FieldVisit>(`/admin/season-records/${recordId}/visits`, body),
  updateVisit: (id: string, body: FieldVisitInput) =>
    api.patch<FieldVisit>(`/admin/field-visits/${id}`, body),
  deleteVisit: (id: string) => api.delete<unknown>(`/admin/field-visits/${id}`),
};
