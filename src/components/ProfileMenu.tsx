import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Camera, ChevronDown, KeyRound, Loader2, LogOut, Trash2, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApiError, authService } from "@/api";
import { useAuth } from "@/context/useAuth";
import { getUserDisplayName } from "@/lib/user";
import { sanitizeSingleLine, validateName, validatePassword, validatePhone } from "@/lib/validation";
import { UserAvatar } from "@/components/UserAvatar";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Tab = "profile" | "security";

function Notice({ error, ok }: { error?: string | null; ok?: string | null }) {
  if (!error && !ok) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || ok}</p>
  );
}

const input = "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[var(--pm-accent)] focus:ring-2 focus:ring-[var(--pm-accent)]/20";

function ProfileDrawer({ tab, onTab, onClose, accent, onLogout }: { tab: Tab; onTab: (t: Tab) => void; onClose: () => void; accent: string; onLogout: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [busy, setBusy] = useState<"save" | "photo" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reset = () => {
    setError(null);
    setOk(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    const a = validateName(firstName, "First name");
    const b = validateName(lastName, "Last name");
    const c = validatePhone(phone);
    if (!a.valid || !b.valid || !c.valid) return setError(a.message || b.message || c.message || "Check your details.");
    setBusy("save");
    try {
      await authService.updateProfile({ firstName: sanitizeSingleLine(firstName), lastName: sanitizeSingleLine(lastName), phoneNumber: phone.trim() || undefined });
      await refreshProfile();
      setOk("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your profile.");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    if (!IMAGE_TYPES.includes(file.type)) return setError("Only JPEG, PNG or WebP images are allowed.");
    if (file.size > MAX_IMAGE_BYTES) return setError("The image must be 5 MB or smaller.");
    setBusy("photo");
    try {
      await authService.uploadProfileImage(file);
      await refreshProfile();
      setOk("Photo updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async () => {
    reset();
    setBusy("photo");
    try {
      await authService.deleteProfileImage();
      await refreshProfile();
      setOk("Photo removed.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove the photo.");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!current) return setError("Enter your current password.");
    const check = validatePassword(next);
    if (!check.valid) return setError(check.message || "Choose a stronger password.");
    if (next === current) return setError("The new password must be different.");
    setBusy("password");
    try {
      await authService.changePassword({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setOk("Password changed.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change the password.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Your profile" style={{ ["--pm-accent" as string]: accent }}>
      <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Your profile</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar src={user?.profileImage} alt={getUserDisplayName(user)} sizeClassName="h-20 w-20" iconClassName="h-9 w-9" />
              {busy === "photo" && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow"
                style={{ background: accent }}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-gray-900">{getUserDisplayName(user)}</p>
              <p className="truncate text-sm text-gray-500">{user?.email}</p>
              <div className="mt-1.5 flex gap-3 text-xs font-semibold">
                <button type="button" onClick={() => fileRef.current?.click()} style={{ color: accent }}>
                  {user?.profileImage ? "Change photo" : "Add a photo"}
                </button>
                {user?.profileImage && (
                  <button type="button" onClick={removePhoto} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-1 rounded-xl bg-gray-100 p-1">
            {([["profile", "Details", User], ["security", "Password", KeyRound]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  reset();
                  onTab(key);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <Notice error={error} ok={ok} />
            {tab === "profile" ? (
              <form onSubmit={save} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-gray-600">First name<input className={`${input} mt-1`} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
                  <label className="text-xs font-medium text-gray-600">Last name<input className={`${input} mt-1`} value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
                </div>
                <label className="block text-xs font-medium text-gray-600">Email<input className={`${input} mt-1 bg-gray-50 text-gray-500`} value={user?.email || ""} disabled /></label>
                <label className="block text-xs font-medium text-gray-600">Phone<input className={`${input} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250788123456" /></label>
                <button type="submit" disabled={busy === "save"} className="h-10 w-full rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: accent }}>
                  {busy === "save" ? "Saving…" : "Save changes"}
                </button>
              </form>
            ) : (
              <form onSubmit={changePassword} className="space-y-3">
                <label className="block text-xs font-medium text-gray-600">Current password<input type="password" className={`${input} mt-1`} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></label>
                <label className="block text-xs font-medium text-gray-600">New password<input type="password" className={`${input} mt-1`} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></label>
                <button type="submit" disabled={busy === "password"} className="h-10 w-full rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: accent }}>
                  {busy === "password" ? "Updating…" : "Change password"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t px-5 py-4">
          <button onClick={onLogout} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </motion.aside>
    </div>
  );
}

/** Avatar button in the header. Opens a menu with profile, password and sign out, and a drawer to edit them. */
export function ProfileMenu({ accent, inboxHref }: { accent: string; inboxHref: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState<Tab | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const name = getUserDisplayName(user);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const signOut = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-xl border-l pl-4 pr-1 transition hover:opacity-80"
      >
        <UserAvatar src={user?.profileImage} alt={name} sizeClassName="h-9 w-9" iconClassName="h-5 w-5" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{name}</span>
          <span className="block text-xs text-gray-500">{user?.email}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl"
          >
            <div className="flex items-center gap-3 border-b bg-gray-50/70 px-4 py-4">
              <UserAvatar src={user?.profileImage} alt={name} sizeClassName="h-12 w-12" iconClassName="h-6 w-6" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${accent}14`, color: accent }}>
                  {String(user?.role || "").toLowerCase()}
                </span>
              </div>
            </div>
            <div className="p-2">
              <button role="menuitem" className={item} onClick={() => { setOpen(false); setDrawer("profile"); }}>
                <User className="h-4 w-4 text-gray-400" /> Profile and photo
              </button>
              <button role="menuitem" className={item} onClick={() => { setOpen(false); setDrawer("security"); }}>
                <KeyRound className="h-4 w-4 text-gray-400" /> Change password
              </button>
              <button role="menuitem" className={item} onClick={() => { setOpen(false); navigate(inboxHref); }}>
                <Bell className="h-4 w-4 text-gray-400" /> Notifications
              </button>
            </div>
            <div className="border-t p-2">
              <button role="menuitem" className={`${item} text-red-600 hover:bg-red-50`} onClick={signOut}>
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && <ProfileDrawer key="drawer" tab={drawer} onTab={setDrawer} onClose={() => setDrawer(null)} accent={accent} onLogout={signOut} />}
      </AnimatePresence>
    </div>
  );
}
