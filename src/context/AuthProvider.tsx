import { useCallback, useEffect, useRef, useState } from "react";
import {
  authService,
  refreshSession,
  setUnauthorizedHandler,
  tokenStore,
  type AuthUser,
} from "@/api";
import { getTokenExpiry } from "@/lib/jwt";
import { AuthContext, type AuthContextValue } from "./auth-context";

// Auto-logout after this much inactivity (ms). 30 minutes.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// Refresh the access token this long before it expires (ms).
const REFRESH_SKEW_MS = 60 * 1000;
// Fallback refresh cadence if the token has no readable expiry (ms). 10 min.
const FALLBACK_REFRESH_MS = 10 * 60 * 1000;

function buildLoginPayload(identifier: string, password: string) {
  const value = identifier.trim();
  return value.includes("@")
    ? { email: value, password }
    : { phoneNumber: value, password };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() =>
    tokenStore.getStoredUser<AuthUser>(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    if (next) tokenStore.setStoredUser(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    refreshTimer.current = null;
    idleTimer.current = null;
  }, []);

  const logout = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_reason?: string) => {
      clearTimers();
      const refreshToken = tokenStore.getRefreshToken() || undefined;
      try {
        await authService.logout(refreshToken);
      } catch {
        // Ignore network/auth errors during logout.
      } finally {
        tokenStore.clear();
        setUserState(null);
      }
    },
    [clearTimers],
  );

  // ----- Proactive token refresh -------------------------------------------
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const token = tokenStore.getAccessToken();
    if (!token) return;

    const expiry = getTokenExpiry(token);
    let delay = FALLBACK_REFRESH_MS;
    if (expiry) {
      delay = Math.max(expiry - Date.now() - REFRESH_SKEW_MS, 5 * 1000);
    }

    refreshTimer.current = setTimeout(async () => {
      const newToken = await refreshSession();
      if (newToken) {
        scheduleRefresh();
      } else {
        // Refresh failed – session is no longer valid.
        tokenStore.clear();
        setUserState(null);
        clearTimers();
      }
    }, delay);
  }, [clearTimers]);

  // ----- Idle auto-logout ---------------------------------------------------
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!tokenStore.getAccessToken()) return;
    idleTimer.current = setTimeout(() => {
      logout("idle");
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  const refreshProfile = useCallback(async () => {
    if (!tokenStore.getAccessToken()) {
      setUserState(null);
      return;
    }
    try {
      const { user: profile } = await authService.getProfile();
      setUser(profile);
    } catch {
      // Handled by the unauthorized hook.
    }
  }, [setUser]);

  const login = useCallback(
    async (identifier: string, password: string, remember = false) => {
      tokenStore.setRemember(remember);
      const res = await authService.login(buildLoginPayload(identifier, password));
      tokenStore.setTokens(res.access_token, res.refresh_token);
      setUser(res.user);
      scheduleRefresh();
      resetIdleTimer();
      return res;
    },
    [setUser, scheduleRefresh, resetIdleTimer],
  );

  // Wire the client's "session lost" hook to clear local state.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTimers();
      tokenStore.clear();
      setUserState(null);
    });
  }, [clearTimers]);

  // Attach activity listeners for the idle timer.
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const handler = () => {
      if (document.visibilityState === "hidden") return;
      resetIdleTimer();
    };
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    document.addEventListener("visibilitychange", handler);
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", handler);
    };
  }, [resetIdleTimer]);

  // Keep sessions in sync across tabs (logout in one tab -> logout everywhere).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "agrisense.refresh_token" && e.newValue === null) {
        clearTimers();
        setUserState(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearTimers]);

  // On mount, hydrate/verify the session from the stored token.
  useEffect(() => {
    let active = true;
    (async () => {
      if (tokenStore.getAccessToken() || tokenStore.getRefreshToken()) {
        try {
          const { user: profile } = await authService.getProfile();
          if (active) {
            setUser(profile);
            scheduleRefresh();
            resetIdleTimer();
          }
        } catch {
          // Handled by unauthorized handler.
        }
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!tokenStore.getAccessToken(),
    isLoading,
    login,
    logout,
    refreshProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
