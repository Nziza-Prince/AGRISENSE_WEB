import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, Panel } from "../ui";
import { EmptyState } from "@/components/EmptyState";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { ApiError, farmRecordsService, sensorService, type AdminFarm, type AdminSensor } from "@/api";

const TRANSPORT_LABEL: Record<string, string> = {
  ble: "Bluetooth",
  mqtt: "Wi-Fi",
  http: "Wi-Fi",
};

const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "never";

/** What the firmware reads. One file per sensor, so the code and key never have to be retyped. */
const firmwareConfig = (code: string, key: string) =>
  `// Sensor ${code}. Private to this one sensor: do not commit it or share it.\n` +
  `// Put it next to the .ino file in firmware/agrisense_hub_raw/ (replace the existing device_config.h).\n` +
  `#pragma once\n#define AGS_DEVICE_CODE "${code}"\n#define AGS_DEVICE_KEY  "${key}"\n`;

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type SortKey =
  | "code"
  | "model"
  | "firmware"
  | "status"
  | "linked"
  | "farm"
  | "owner"
  | "pairedAt"
  | "lastSeenAt"
  | "transport";

const sortValue = (s: AdminSensor, k: SortKey): string | number => {
  switch (k) {
    case "code": return s.code;
    case "model": return (s.model ?? "").toLowerCase();
    case "firmware": return s.firmwareVersion ?? "";
    case "status": return s.status;
    case "linked": return s.farm ? 1 : 0;
    case "farm": return (s.farm ?? "").toLowerCase();
    case "owner": return (s.owner ?? "").toLowerCase();
    case "pairedAt": return s.pairedAt ? Date.parse(s.pairedAt) : 0;
    case "lastSeenAt": return s.lastSeenAt ? Date.parse(s.lastSeenAt) : 0;
    case "transport": return TRANSPORT_LABEL[s.lastTransport ?? ""] ?? "";
  }
};

/** A secret that is shown only now. Closing the dialog loses it, which is the point. */
type Secret = { title: string; code: string; key: string; pin?: string };

const AdminSensors = () => {
  const [sensors, setSensors] = useState<AdminSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [rotating, setRotating] = useState<AdminSensor | null>(null);
  const [assigning, setAssigning] = useState<AdminSensor | null>(null);
  const [farms, setFarms] = useState<AdminFarm[] | null>(null);
  const [farmQuery, setFarmQuery] = useState("");
  const [pickedFarm, setPickedFarm] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "code", dir: 1 });

  const toggleSort = (key: SortKey) =>
    setSort((cur) => (cur.key === key ? { key, dir: cur.dir === 1 ? -1 : 1 } : { key, dir: key === "pairedAt" || key === "lastSeenAt" ? -1 : 1 }));

  const SortHead = ({ k, children }: { k: SortKey; children: string }) => {
    const Icon = sort.key !== k ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th className="whitespace-nowrap px-3 py-3 font-semibold">
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1.5 uppercase tracking-wide transition hover:text-gray-900 ${sort.key === k ? "text-gray-900" : ""}`}
        >
          {children}
          <Icon className="h-3 w-3" />
        </button>
      </th>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sensorService.list();
      setSensors(res.devices);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load sensors.");
      setSensors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Sensors | Admin | AGRISENSE";
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (err: unknown, fallback: string) =>
    setError(err instanceof ApiError ? err.message : fallback);

  const register = async () => {
    setBusy("register");
    setError(null);
    try {
      const res = await sensorService.register(1);
      const made = res.devices[0];
      setSaved(false);
      setSecret({ title: "New sensor registered", code: made.code, key: made.key, pin: made.pin });
      await load();
    } catch (err) {
      fail(err, "Could not register the sensor.");
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (sensor: AdminSensor) => {
    setBusy(sensor.id);
    setError(null);
    try {
      const next = sensor.status === "active" ? "disabled" : "active";
      await sensorService.setStatus(sensor.id, next);
      setNotice(
        next === "disabled"
          ? `${sensor.code} is switched off. It can no longer send readings.`
          : `${sensor.code} is switched on again.`,
      );
      await load();
    } catch (err) {
      fail(err, "Could not change the sensor.");
    } finally {
      setBusy(null);
    }
  };

  const openAssign = async (sensor: AdminSensor) => {
    setAssigning(sensor);
    setFarmQuery("");
    setPickedFarm(sensor.farmId);
    if (!farms) {
      try {
        const res = await farmRecordsService.listFarms();
        setFarms(res.farms);
      } catch (err) {
        fail(err, "Could not load the farms.");
        setAssigning(null);
      }
    }
  };

  const assign = async () => {
    if (!assigning || !pickedFarm) return;
    const sensor = assigning;
    setBusy(sensor.id);
    setError(null);
    try {
      const res = await sensorService.assign(sensor.id, pickedFarm);
      setNotice(`${sensor.code} now belongs to ${res.farm}. The farmer will see it in the app.`);
      setAssigning(null);
      await load();
    } catch (err) {
      fail(err, "Could not assign the sensor.");
    } finally {
      setBusy(null);
    }
  };

  const unassign = async (sensor: AdminSensor) => {
    if (!window.confirm(`Take ${sensor.code} back from ${sensor.farm}? The farmer will no longer see it.`)) return;
    setBusy(sensor.id);
    setError(null);
    try {
      await sensorService.unassign(sensor.id);
      setNotice(`${sensor.code} is unassigned.`);
      await load();
    } catch (err) {
      fail(err, "Could not take the sensor back.");
    } finally {
      setBusy(null);
    }
  };

  const farmChoices = useMemo(() => {
    const q = farmQuery.trim().toLowerCase();
    const list = farms ?? [];
    return (q
      ? list.filter((f) => [f.name, f.ownerName, f.ownerEmail, f.district, f.sector].some((v) => (v ?? "").toLowerCase().includes(q)))
      : list
    ).slice(0, 50);
  }, [farms, farmQuery]);

  const rotate = async () => {
    if (!rotating) return;
    const sensor = rotating;
    setBusy(sensor.id);
    setError(null);
    try {
      const res = await sensorService.rotateKey(sensor.id);
      setRotating(null);
      setSaved(false);
      setSecret({ title: "New key issued", code: res.code, key: res.key });
      await load();
    } catch (err) {
      fail(err, "Could not issue a new key.");
      setRotating(null);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
    } catch {
      setError("Copying is blocked by the browser. Download the config file instead.");
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = q
      ? sensors.filter((x) =>
          [x.code, x.model, x.firmwareVersion, x.farm, x.owner, x.status].some((v) => (v ?? "").toLowerCase().includes(q)),
        )
      : sensors;
    return [...shown].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      return (x < y ? -1 : x > y ? 1 : a.code.localeCompare(b.code)) * sort.dir;
    });
  }, [sensors, query, sort]);

  const active = sensors.filter((s) => s.status === "active").length;
  const linked = sensors.filter((s) => s.farm).length;

  return (
    <RoleLayout
      title="Sensors"
      subtitle="Register soil sensors and keep track of which farm each one belongs to"
      links={adminLinks}
      accent={ADMIN_ACCENT}
      roleLabel="Admin"
    >
      <div className="space-y-6">
        {notice && (
          <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button type="button" className="ml-4 font-medium underline" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Panel
          title="Registered sensors"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => load()}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                type="button"
                onClick={register}
                disabled={busy === "register"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy === "register" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Register a sensor
              </button>
            </div>
          }
        >
          <p className="mb-4 text-sm text-gray-600">
            {sensors.length} registered · {active} switched on · {linked} linked to a farm. A farmer links a sensor by
            standing next to it with Bluetooth on; no code or PIN is typed.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading sensors
            </div>
          ) : sensors.length === 0 ? (
            <EmptyState
              art="coins"
              title="No sensors yet"
              text="Register one, write its code on the label, and put its key in the sensor's firmware."
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search code, farm, owner, model"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{rows.length}</span> of{" "}
                  <span className="font-semibold text-gray-800">{sensors.length}</span> sensors
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500">
                      <SortHead k="code">Code</SortHead>
                      <SortHead k="model">Model</SortHead>
                      <SortHead k="firmware">Firmware</SortHead>
                      <SortHead k="status">Power</SortHead>
                      <SortHead k="linked">Link</SortHead>
                      <SortHead k="farm">Farm</SortHead>
                      <SortHead k="owner">Owner</SortHead>
                      <SortHead k="pairedAt">Linked on</SortHead>
                      <SortHead k="lastSeenAt">Last reading</SortHead>
                      <SortHead k="transport">Via</SortHead>
                      <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-gray-500">
                          No sensor matches "{query}".
                        </td>
                      </tr>
                    ) : (
                      rows.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-indigo-50/40">
                          <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold text-gray-900">{s.code}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.model || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.firmwareVersion || "—"}</td>
                          <td className="px-3 py-3">
                            <Badge color={s.status === "active" ? "green" : "gray"}>
                              {s.status === "active" ? "On" : "Off"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge color={s.farm ? "green" : "blue"}>{s.farm ? "Linked" : "Not linked"}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.farm || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.owner || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.pairedAt ? when(s.pairedAt) : "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">{s.lastSeenAt ? when(s.lastSeenAt) : "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                            {s.lastTransport ? TRANSPORT_LABEL[s.lastTransport] : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openAssign(s)}
                                disabled={busy === s.id}
                                title={s.farm ? "Move to another farm" : "Give to a farmer"}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                <UserPlus className="h-3.5 w-3.5" /> {s.farm ? "Reassign" : "Assign"}
                              </button>
                              {s.farm && (
                                <button
                                  type="button"
                                  onClick={() => unassign(s)}
                                  disabled={busy === s.id}
                                  title="Take it back"
                                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-60"
                                >
                                  <UserMinus className="h-3.5 w-3.5" /> Unassign
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setRotating(s)}
                                disabled={busy === s.id}
                                title="Issue a new key"
                                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-60"
                              >
                                <KeyRound className="h-3.5 w-3.5" /> New key
                              </button>
                              <button
                                type="button"
                                onClick={() => toggle(s)}
                                disabled={busy === s.id}
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                                  s.status === "active"
                                    ? "border border-red-200 text-red-600 hover:bg-red-50"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                                {s.status === "active" ? "Switch off" : "Switch on"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      </div>

      {secret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">{secret.title}</h2>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                The key is shown only now. The server does not keep a copy you can look at again. Download the config
                file before closing. If you lose it, use "New key" and flash the sensor again.
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Code (write it on the label)</dt>
                <dd className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="font-mono text-base font-semibold text-gray-900">{secret.code}</span>
                  <button type="button" onClick={() => copy("code", secret.code)} className="text-gray-500 hover:text-gray-900" aria-label="Copy code">
                    {copied === "code" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Key (secret, goes into the firmware only)</dt>
                <dd className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="break-all font-mono text-xs text-gray-900">{secret.key}</span>
                  <button type="button" onClick={() => copy("key", secret.key)} className="shrink-0 text-gray-500 hover:text-gray-900" aria-label="Copy key">
                    {copied === "key" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
              {secret.pin && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">PIN (for support only)</dt>
                  <dd className="mt-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-gray-900">{secret.pin}</dd>
                  <p className="mt-1 text-xs text-gray-500">Farmers no longer type this; the phone links the sensor by Bluetooth.</p>
                </div>
              )}
            </dl>

            <button
              type="button"
              onClick={() => {
                downloadText("device_config.h", firmwareConfig(secret.code, secret.key));
                setSaved(true);
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" /> Download device_config.h for the firmware
            </button>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSecret(null)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {saved ? "Done" : "Close without downloading"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">Give {assigning.code} to a farmer</h2>
              <button type="button" onClick={() => setAssigning(null)} className="text-gray-400 hover:text-gray-700" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">Pick the farm the sensor will be used on. It will show up in that farmer's app.</p>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={farmQuery}
                onChange={(e) => setFarmQuery(e.target.value)}
                placeholder="Search farm, farmer, district"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border">
              {!farms ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading farms
                </div>
              ) : farmChoices.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No farm matches.</p>
              ) : (
                farmChoices.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPickedFarm(f.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left text-sm last:border-0 hover:bg-indigo-50/60 ${
                      pickedFarm === f.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900">{f.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {f.ownerName || f.ownerEmail} · {[f.district, f.sector].filter(Boolean).join(", ") || "no location"}
                      </span>
                    </span>
                    {pickedFarm === f.id && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAssigning(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={assign}
                disabled={!pickedFarm || pickedFarm === assigning.farmId || busy === assigning.id}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy === assigning.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Assign sensor
              </button>
            </div>
          </div>
        </div>
      )}

      {rotating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Issue a new key for {rotating.code}?</h2>
            <p className="mt-3 text-sm text-gray-600">
              The old key stops working at once. The sensor will not be able to send readings until it is flashed with
              the new key. Use this if the key was lost or may have been seen by someone else.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRotating(null)}
                disabled={busy === rotating.id}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={rotate}
                disabled={busy === rotating.id}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy === rotating.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Issue new key
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default AdminSensors;
