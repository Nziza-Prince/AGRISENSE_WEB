import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, User } from 'lucide-react';
import { ApiError, authService } from "@/api";
import {
  sanitizeText,
  sanitizeSingleLine,
  validateEmail,
  validateName,
  validateNationalId,
  validatePassword,
  validateRequiredPhone,
} from "@/lib/validation";
import AuthLayout from "./AuthLayout";
import GoogleButton from "./GoogleButton";
import { Alert, PasswordField, SubmitButton, TextField } from "./form-fields";

const PENDING_IDENTITY_KEY = "agrisense.pending_identity";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  nationalId?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

interface SignUpState {
  plan?: string;
  billing?: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const planState = (location.state as SignUpState | null) ?? {};
  const isPro = planState.plan === "pro";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign Up | AGRISENSE";
  }, []);

  const validate = () => {
    const next: FieldErrors = {};
    const first = validateName(firstName, "First name");
    if (!first.valid) next.firstName = first.message;
    const last = validateName(lastName, "Last name");
    if (!last.valid) next.lastName = last.message;
    const em = validateEmail(email);
    if (!em.valid) next.email = em.message;
    const phone = validateRequiredPhone(phoneNumber);
    if (!phone.valid) next.phoneNumber = phone.message;
    const id = validateNationalId(nationalId);
    if (!id.valid) next.nationalId = id.message;
    const pw = validatePassword(password);
    if (!pw.valid) next.password = pw.message;
    if (confirm !== password) next.confirm = "Passwords do not match.";
    if (!terms) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register({
        firstName: sanitizeSingleLine(firstName),
        lastName: sanitizeSingleLine(lastName),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      sessionStorage.setItem(
        PENDING_IDENTITY_KEY,
        JSON.stringify({
          nationalId: sanitizeText(nationalId).replace(/\s+/g, ""),
          documentType: "NATIONAL_ID",
        }),
      );
      navigate("/auth/verify-otp", {
        state: { email: email.trim(), plan: planState.plan, billing: planState.billing },
      });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        isPro
          ? "Start your Pro free trial after you verify your email"
          : "Start managing your farms in minutes"
      }
      footer={
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-[#2C6E49] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="firstName"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="John"
            icon={<User className="h-5 w-5" />}
            error={errors.firstName}
            autoComplete="given-name"
            required
          />

          <TextField
            id="lastName"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Doe"
            icon={<User className="h-5 w-5" />}
            error={errors.lastName}
            autoComplete="family-name"
            required
          />
        </div>

        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email}
          autoComplete="email"
          required
        />

        <TextField
          id="phoneNumber"
          label="Phone number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="+250788123456"
          icon={<Phone className="h-5 w-5" />}
          error={errors.phoneNumber}
          autoComplete="tel"
          inputMode="tel"
          required
        />

        <TextField
          id="nationalId"
          label="National ID"
          value={nationalId}
          onChange={setNationalId}
          placeholder="1199880012345678"
          icon={<User className="h-5 w-5" />}
          error={errors.nationalId}
          inputMode="numeric"
          maxLength={16}
          required
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a strong password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password}
          autoComplete="new-password"
          showStrength
          required
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter your password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.confirm}
          autoComplete="new-password"
          required
        />

        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#2C6E49] focus:ring-[#2C6E49]"
            />
            <span>
              I agree to the{" "}
              <Link
                to="/legal/terms"
                target="_blank"
                className="text-[#2C6E49] font-medium hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/legal/privacy"
                target="_blank"
                className="text-[#2C6E49] font-medium hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}
        </div>

        <SubmitButton loading={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
