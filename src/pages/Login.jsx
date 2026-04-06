import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
  BadgeDollarSign,
  ShieldAlert,
} from "lucide-react";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = useMemo(() => {
    const p = registerData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [registerData.password]);

  const strengthText = ["Weak", "Weak", "Fair", "Good", "Strong"][
    passwordStrength
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-500/18 blur-3xl" />
          <div className="absolute right-[-120px] top-[18%] h-96 w-96 rounded-full bg-blue-600/18 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[28%] h-80 w-80 rounded-full bg-indigo-500/16 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.10)]">
                <ShieldCheck size={16} />
                Oracle Subscription Compliance Platform
              </div>

              <div className="mt-8 max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-slate-300">
                  <Sparkles size={14} className="text-cyan-300" />
                  Enterprise intelligence
                </div>

                <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white">
                  Subscription control,
                  <span className="block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                    made premium.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-justify leading-8 text-slate-300">
                  Centralize Oracle usage visibility, detect compliance risk,
                  and uncover savings opportunities with a workspace designed to
                  feel decisive, modern, and enterprise-grade.
                </p>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<Activity size={18} />}
                  value="Usage"
                  label="active vs inactive visibility"
                />
                <MetricCard
                  icon={<ShieldAlert size={18} />}
                  value="Risk"
                  label="role and access exceptions"
                />
                <MetricCard
                  icon={<BadgeDollarSign size={18} />}
                  value="Savings"
                  label="waste and renewal insight"
                />
              </div>

              <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
                <FeatureCard
                  title="Usage analytics"
                  text="Track dormant users, low-value access, and utilization patterns across imported Oracle reports."
                />
                <FeatureCard
                  title="Compliance alerts"
                  text="Surface privileged inactive users, risky assignments, and exceptions requiring review."
                />
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-br from-cyan-400/25 via-blue-500/10 to-indigo-500/20 blur-xl" />

              <div className="relative rounded-[32px] border border-white/10 bg-[rgba(15,23,42,0.78)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                      Secure access
                    </p>
                    <h2 className="text-4xl font-semibold tracking-[-0.03em]">
                      {tab === "login" ? "Welcome back" : "Create account"}
                    </h2>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5">
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "login"
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("register")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "register"
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {tab === "login" ? (
                  <form className="space-y-4">
                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-slate-400" />}
                      type="email"
                      placeholder="Enter your email"
                    />
                    <PasswordField
                      label="Password"
                      placeholder="Enter your password"
                      show={showLoginPass}
                      setShow={setShowLoginPass}
                    />

                    <div className="flex items-center justify-between pt-1 text-sm">
                      <label className="flex items-center gap-2 text-slate-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:translate-y-[-1px]"
                    >
                      Sign in
                      <ArrowRight size={18} />
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4">
                    <Field
                      label="Full name"
                      icon={<User size={18} className="text-slate-400" />}
                      type="text"
                      placeholder="Enter your full name"
                    />
                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-slate-400" />}
                      type="email"
                      placeholder="Enter your email"
                    />
                    <PasswordField
                      label="Password"
                      placeholder="Create a password"
                      show={showRegisterPass}
                      setShow={setShowRegisterPass}
                    />

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Password strength</span>
                        <span>
                          {registerData.password ? strengthText : "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className={`h-2 rounded-full transition ${
                              passwordStrength >= n
                                ? "bg-gradient-to-r from-cyan-400 to-blue-600"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <PasswordField
                      label="Confirm password"
                      placeholder="Re-enter password"
                      show={showConfirmPass}
                      setShow={setShowConfirmPass}
                    />

                    <button
                      type="submit"
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:translate-y-[-1px]"
                    >
                      Create account
                      <ArrowRight size={18} />
                    </button>
                  </form>
                )}

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
                  Frontend-only authentication experience for design phase.
                  Backend connection comes next.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, type, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3.5 transition hover:border-cyan-400/20 focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
        {icon}
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, placeholder, show, setShow }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3.5 transition hover:border-cyan-400/20 focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
        <Lock size={18} className="text-slate-400" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-slate-400 transition hover:text-cyan-300"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-300">{label}</div>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex items-center gap-2 text-cyan-300">
        <CheckCircle2 size={18} />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}
