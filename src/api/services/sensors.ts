import { api } from "../client";

export type SensorStatus = "active" | "disabled";

/** One soil sensor as the admin console lists it. The key and PIN are never part of this. */
export interface AdminSensor {
  id: string;
  code: string;
  model: string | null;
  status: SensorStatus;
  owner: string | null;
  ownerId: string | null;
  farm: string | null;
  farmId: string | null;
  pairedAt: string | null;
  lastSeenAt: string | null;
  lastTransport: "ble" | "mqtt" | "http" | null;
  firmwareVersion: string | null;
}

/** Shown once, right after registering. The server keeps only a hash of the PIN and never stores the key. */
export interface NewSensorSecrets {
  code: string;
  pin: string;
  key: string;
}

export const sensorService = {
  list: () => api.get<{ devices: AdminSensor[] }>("/admin/devices"),

  register: (count = 1, model = "AGS-1") =>
    api.post<{ devices: NewSensorSecrets[] }>("/admin/devices", { count, model }),

  setStatus: (id: string, status: SensorStatus) =>
    api.post<{ id: string; status: SensorStatus }>(
      `/admin/devices/${id}/${status === "active" ? "enable" : "disable"}`,
    ),

  /** Gives the sensor to a farm, and so to that farm's farmer. */
  assign: (id: string, farmId: string) =>
    api.post<{ id: string; assigned: boolean; farmId: string; farm: string }>(`/admin/devices/${id}/assign`, { farmId }),

  unassign: (id: string) => api.post<{ id: string; assigned: boolean }>(`/admin/devices/${id}/unassign`),

  /** Issues a new key; the old one stops working at once, so the sensor must be flashed again. */
  rotateKey: (id: string) =>
    api.post<{ id: string; code: string; key: string }>(`/admin/devices/${id}/rotate-key`),
};
