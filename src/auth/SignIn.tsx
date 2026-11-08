import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { ApiError, authService } from "@/api";
import { useAuth } from "@/context/useAuth";
import { validateLoginIdentifier } from "@/lib/validation";
import AuthLayout from "./AuthLayout";
import GoogleButton from "./GoogleButton";
import { Alert, PasswordField, SubmitButton, TextField } from "./form-fields";
import { getDefaultRouteForRole, routes } from "@/lib/routes";

interface LocationState {
  from?: { pathname?: string };
  email?: string;
  phoneNumber?: string;
  plan?: string;
  billing?: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const state = location.state as LocationState | null;

  const [identifier, setIdentifier] = useState(state?.email || state?.phoneNumber || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign In | AGRISENSE";
  }, []);

  const from = state?.from?.pathname;

  const validate = () => {
    const next: { identifier?: string; password?: string } = {};
    const loginCheck = validateLoginIdentifier(identifier);
    if (!loginCheck.valid) next.identifier = loginCheck.message;
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const session = await login(identifier.trim(), password, remember);
      const needsOnboarding =
        Boolean(sessionStorage.getItem("agrisense.pending_identity")) ||
        session.user.hasFarm === false;
      const fallbackRoute = getDefaultRouteForRole(session.user.role);
      const targetRoute =
        needsOnboarding && (session.user.role || "").toUpperCase() === "FARMER"
          ? routes.auth.farmerOnboarding
          : from && from.startsWith(fallbackRoute) ? from : fallbackRoute;
      navigate(targetRoute, {
        replace: true,
        state:
          state?.plan || state?.billing
            ? { plan: state.plan, billing: state.billing }
            : undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 && /verif/i.test(err.message)) {
          try {
            if (identifier.includes("@")) {
              await authService.resendOtp({ email: identifier.trim() });
            }
          } catch {
            /* ignore */
          }
          navigate("/auth/verify-otp", {
            state: identifier.includes("@") ? { email: identifier.trim() } : undefined,
          });
          return;
        }
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with email or phone"
      footer={
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="font-semibold text-[#0B6E4F] hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <GoogleButton />
      <form className="mt-3.5 space-y-3.5" onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        <TextField
          id="identifier"
          label="Email or phone"
          type="text"
          value={identifier}
          onChange={(v) => setIdentifier(v)}
          placeholder="you@email.com"
          icon={<Mail className="h-5 w-5" />}
          error={errors.identifier}
          autoComplete="username"
          inputMode={identifier.includes("@") ? "email" : "tel"}
          required
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(v) => setPassword(v)}
          placeholder="Enter password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex min-h-9 cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#0B6E4F] focus:ring-[#0B6E4F]"
            />
            Remember me
          </label>
          <Link
            to="/auth/forgot-password"
            className="inline-flex min-h-9 items-center text-sm font-semibold text-[#0B6E4F] hover:underline"
          >
            Forgot?
          </Link>
        </div>

        <div className="pt-1">
          <SubmitButton loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
