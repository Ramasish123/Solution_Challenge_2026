import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, LockKeyhole, Mail, Shield, UserCircle2, UserPlus2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function LoginCard({ onSignIn, onSignUp, loading, error, rememberedIdentifier }) {
  const [mode, setMode] = useState("signin");
  const [identifier, setIdentifier] = useState(rememberedIdentifier || "admin001");
  const [password, setPassword] = useState("Admin@123");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (mode === "signin") {
      setIdentifier(rememberedIdentifier || "admin001");
    }
  }, [mode, rememberedIdentifier]);

  // Reset admin flag when switching away from teacher
  useEffect(() => {
    if (role !== "teacher") {
      setIsAdmin(false);
    }
  }, [role]);

  const signupDisabled =
    loading ||
    !fullName.trim() ||
    !identifier.trim() ||
    !email.trim() ||
    !password ||
    password !== confirmPassword;

  const effectiveRole = role === "teacher" && isAdmin ? "admin" : role;

  return (
    <div className="relative">
      {/* ── Theme toggle on login page ──────── */}
      <div className="absolute -top-12 right-0 z-10">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel subtle-grid mx-auto flex w-full max-w-5xl flex-col overflow-hidden lg:flex-row"
      >
      <div className="flex-1 space-y-6 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-primary-200">Optimization Studio</p>
        <h1 className="max-w-lg text-4xl font-bold leading-tight text-white lg:text-5xl">
          Smart Classroom & Timetable Intelligence System
        </h1>
        <p className="max-w-xl text-base text-primary-100/80">
          Generate multi-solution, conflict-aware academic schedules with adaptive genetic optimization,
          analytics, and rapid disruption recovery.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "Genetic optimization",
            "Dynamic faculty rescheduling",
            "Multi-shift dashboard analytics",
          ].map((item) => (
            <div key={item} className="rounded-xl border border-white/20 bg-white/10 px-4 py-5 text-sm text-white backdrop-blur-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <form
        className="flex w-full max-w-xl flex-col justify-center gap-5 p-10 bg-white"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "signin") {
            onSignIn(identifier, password);
            return;
          }
          onSignUp({
            username: identifier,
            email,
            full_name: fullName,
            password,
            role: effectiveRole,
          });
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Secure Access</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">Role-based timetable command center</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setPassword("");
              setConfirmPassword("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === "signin" ? "bg-primary-700 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setIdentifier("");
              setPassword("");
              setConfirmPassword("");
              setEmail("");
              setFullName("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === "signup" ? "bg-primary-700 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === "signup" ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600">Full Name</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <UserPlus2 className="h-5 w-5 text-emerald-500" />
              <input
                className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
          </label>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-600">
            {mode === "signin" ? "Sign In ID or Email" : "Create User ID"}
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <UserCircle2 className="h-5 w-5 text-primary-500" />
            <input
              placeholder={mode === "signin" ? "Enter user ID or email" : "Choose a user ID"}
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </div>
        </label>

        {mode === "signup" ? (
          <>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">Email</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Mail className="h-5 w-5 text-primary-500" />
                <input
                  type="email"
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">Role</span>
              <div className="grid grid-cols-2 gap-3">
                {["teacher", "student"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                      role === option
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-primary-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </label>

            {/* ── Admin Toggle (only for teachers) ───── */}
            {role === "teacher" && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsAdmin((prev) => !prev)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 transition ${
                    isAdmin
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <div className={`rounded-lg p-1.5 ${isAdmin ? "bg-amber-200 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className={`text-sm font-semibold ${isAdmin ? "text-amber-700" : "text-slate-600"}`}>
                      Join as Administrator
                    </span>
                  </span>
                  <div className={`relative h-6 w-11 rounded-full transition-colors ${isAdmin ? "bg-amber-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${isAdmin ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>
                {isAdmin && (
                  <p className="text-xs text-amber-600 px-1">
                    Administrators can manage data, run optimizations, change preferences, and control all scheduling settings.
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-600">
            {mode === "signin" ? "Password" : "Password (minimum 8 characters)"}
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            <input
              type="password"
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>

        {mode === "signup" ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600">Confirm Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <LockKeyhole className="h-5 w-5 text-amber-500" />
              <input
                type="password"
                className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            {confirmPassword && password !== confirmPassword ? (
              <p className="text-sm text-amber-600">Passwords do not match yet.</p>
            ) : null}
          </label>
        ) : null}

        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={mode === "signup" ? signupDisabled : loading}
          className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <p className="text-sm text-slate-400">
          {mode === "signin"
            ? `Your account is stored in the on-device database and can be used again on the next login.${rememberedIdentifier ? ` Last used: ${rememberedIdentifier}.` : ""}`
            : "Create a teacher or student account once. If that user ID already exists, you'll be asked to sign in instead of registering again."}
        </p>
      </form>
    </motion.div>
    </div>
  );
}
