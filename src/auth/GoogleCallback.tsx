import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { authService, tokenStore, type AuthUser } from "@/api";
import { getDefaultRouteForRole, routes } from "@/lib/routes";
import AuthLayout from "./AuthLayout";
import { Alert } from "./form-fields";

/**
 * Landing page for the backend's Google OAuth redirect:
 *   /auth/callback#access_token=...&refresh_token=...
 * Tokens arrive in the URL fragment so they are never sent to a server.
 */
const GoogleCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token") || undefined;

    // Remove the tokens from the address bar and history right away.
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken) {
      setError("Google sign-in did not complete. Please try again.");
      return;
    }

    (async () => {
      try {
        tokenStore.setRemember(true);
        tokenStore.setTokens(accessToken, refreshToken);
        const { user } = await authService.getProfile();
        tokenStore.setStoredUser(user);

        const needsOnboarding =
          (user.role || "").toUpperCase() === "FARMER" &&
          (user as AuthUser).hasFarm === false;
        // Full page load so AuthProvider hydrates the session and schedules refresh.
        window.location.replace(
          needsOnboarding ? routes.auth.farmerOnboarding : getDefaultRouteForRole(user.role),
        );
      } catch {
        tokenStore.clear();
        setError("We could not finish signing you in. Please try again.");
      }
    })();
  }, []);

  return (
    <AuthLayout title="Signing you in…" subtitle="Completing Google sign-in">
      {error ? (
        <div className="space-y-4">
          <Alert type="error">{error}</Alert>
          <Link to={routes.auth.login} className="font-semibold text-[#0B6E4F] hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Please wait a moment.</p>
      )}
    </AuthLayout>
  );
};

export default GoogleCallback;
