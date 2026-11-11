import { motion } from "framer-motion";
import { Droplets, Mail, MapPin, Pencil, Phone, Ruler, Sprout, Layers, FileText, User } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminFarm } from "@/api";
import { DISTRICTS, MAP_BOUNDS, project } from "../rwandaMap";
import { checksFor, formatArea, scoreOf, sizeM2, soilColor } from "./shared";

const PLACEHOLDER_EMAIL = /@placeholder\.invalid$/i;

function Fact({ icon: Icon, label, children }: { icon: typeof Ruler; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="text-sm font-semibold text-gray-900">{children}</div>
      </div>
    </div>
  );
}

/** The farm in Rwanda: every district in grey, this farm's district in colour, the GPS point if we have one. */
function Locator({ farm }: { farm: AdminFarm }) {
  const home = DISTRICTS.find((d) => d.name.toLowerCase() === (farm.district || "").toLowerCase());
  const hasGps = farm.latitude != null && farm.longitude != null && farm.latitude !== "" && farm.longitude !== "";
  const pt = hasGps ? project(Number(farm.longitude), Number(farm.latitude)) : null;
  return (
    <svg viewBox={`0 0 ${MAP_BOUNDS.width} ${MAP_BOUNDS.height}`} className="h-full max-h-[200px] w-full" role="img" aria-label={`${farm.district} district in Rwanda`}>
      {DISTRICTS.map((d) => (
        <path key={d.name} d={d.d} fill={d === home ? "#4338CA" : "#E5E7EB"} stroke="#fff" strokeWidth={1} />
      ))}
      {home && (
        <motion.circle
          cx={pt?.[0] ?? home.cx}
          cy={pt?.[1] ?? home.cy}
          r={9}
          fill={soilColor(farm.soilType)}
          stroke="#fff"
          strokeWidth={3}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.3 }}
          style={{ transformOrigin: `${pt?.[0] ?? home.cx}px ${pt?.[1] ?? home.cy}px` }}
        />
      )}
    </svg>
  );
}

export default function FarmProfile({ farm, onEdit }: { farm: AdminFarm; onEdit: () => void }) {
  const m2 = sizeM2(farm);
  const email = farm.user?.email ?? farm.ownerEmail ?? "";
  const phone = farm.user?.phoneNumber || farm.ownerPhone || "";
  const realEmail = email && !PLACEHOLDER_EMAIL.test(email);
  const score = scoreOf(farm);
  const missing = checksFor(farm).filter((c) => !c.ok);
  const soilNote = farm.soilInformation && !/placeholder/i.test(farm.soilInformation) ? farm.soilInformation : null;
  const person = `${farm.user?.firstName ?? ""} ${farm.user?.lastName ?? ""}`.trim() || farm.ownerName;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="h-1.5" style={{ background: soilColor(farm.soilType) }} />
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_220px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {farm.farmCode && <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-[#4338CA]">{farm.farmCode}</span>}
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-white" style={{ background: soilColor(farm.soilType) }}>
                  {farm.soilType}
                </span>
                {farm.isActive === false && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Inactive</span>}
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{farm.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {[farm.village, farm.cell, farm.sector, farm.district].filter(Boolean).join(", ")}
              </p>
            </div>
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> Edit details
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Fact icon={Ruler} label="Size">
              {m2 ? (
                <>
                  {m2.toLocaleString("en-US")} m² <span className="font-normal text-gray-400">· {formatArea(m2)}</span>
                </>
              ) : (
                <span className="text-amber-700">Not recorded</span>
              )}
            </Fact>
            <Fact icon={Layers} label="Soil">
              <span className="capitalize">{farm.soilType}</span>
            </Fact>
            <Fact icon={Droplets} label="Irrigation">
              {farm.irrigationMethod || <span className="font-normal text-gray-400">Not recorded</span>}
            </Fact>
            <Fact icon={FileText} label="Land parcel (UPI)">
              {farm.upi || <span className="font-normal text-gray-400">Not recorded</span>}
            </Fact>
            <Fact icon={MapPin} label="GPS">
              {farm.latitude != null && farm.longitude != null && farm.latitude !== "" ? (
                `${Number(farm.latitude).toFixed(4)}, ${Number(farm.longitude).toFixed(4)}`
              ) : (
                <span className="font-normal text-gray-400">Not recorded</span>
              )}
            </Fact>
            <Fact icon={Sprout} label="Registered">
              {farm.createdAt ? new Date(farm.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </Fact>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <User className="h-3.5 w-3.5" /> Farmer
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-gray-900">{person}</span>
              {realEmail ? (
                <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-[#4338CA] hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700"><Mail className="h-3.5 w-3.5" /> No real email yet</span>
              )}
              {phone ? (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-[#4338CA] hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {phone}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700"><Phone className="h-3.5 w-3.5" /> No phone yet</span>
              )}
            </div>
          </div>

          {soilNote && <p className="mt-4 rounded-xl border border-dashed px-4 py-3 text-sm text-gray-600"><span className="font-semibold text-gray-800">Soil notes · </span>{soilNote}</p>}

          {missing.length > 0 && (
            <p className="mt-4 text-xs text-gray-500">
              Still to record ({score}% complete):{" "}
              {missing.map((m) => (
                <span key={m.key} className="mr-1 inline-block rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">{m.label}</span>
              ))}
            </p>
          )}
        </div>

        <div className="hidden items-center justify-center rounded-2xl bg-indigo-50/40 p-3 lg:flex">
          <Locator farm={farm} />
        </div>
      </div>
    </motion.div>
  );
}
