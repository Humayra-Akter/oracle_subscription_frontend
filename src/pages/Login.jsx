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
import { useNavigate } from "react-router-dom";
import { authApi } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [loginData, setLoginData] = useState({
    email: "admin@example.com",
    password: "Admin@12345",
  });

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

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    resetMessages();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const data = await authApi.login({
        email: loginData.email.trim(),
        password: loginData.password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMsg("Login successful.");
      navigate("/dashboard");
    } catch (error) {
      setErrorMsg(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    const fullName = registerData.fullName.trim();
    const email = registerData.email.trim();
    const password = registerData.password;
    const confirmPassword = registerData.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.register({
        name: fullName,
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMsg("Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      setErrorMsg(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-500/18 blur-3xl" />
          <div className="absolute right-[-120px] top-[18%] h-96 w-96 rounded-full bg-blue-600/18 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[28%] h-80 w-80 rounded-full bg-indigo-500/16 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] px-10">
          <section className="flex items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.10)]">
                <ShieldCheck size={16} />
                Oracle Subscription Compliance Platform
              </div>

              <div className="mt-6 max-w-xl">
                <h1 className="text-6xl font-semibold leading-[1.02] tracking-[-0.04em] text-white ">
                  Subscription Control,
                  <span className="block mt-3 bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                    Made Premium.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-justify text-slate-300">
                  Centralize Oracle usage visibility, detect compliance risk,
                  and uncover savings opportunities with a workspace designed to
                  feel decisive, modern, and enterprise-grade.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
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

              <div className="mt-6 grid max-w-2xl gap-4 grid-cols-2">
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
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-cyan-400/25 via-blue-500/10 to-indigo-500/20 blur-xl" />

              <div className="relative rounded-xl border border-white/10 bg-[rgba(15,23,42,0.78)] p-6 shadow-md backdrop-blur-2xl sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
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
                    onClick={() => switchTab("login")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "login"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "register"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {errorMsg && (
                  <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {successMsg}
                  </div>
                )}

                {tab === "login" ? (
                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-slate-400" />}
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                    />

                    <PasswordField
                      label="Password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
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
                      disabled={loading}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                    <Field
                      label="Full name"
                      icon={<User size={18} className="text-slate-400" />}
                      type="text"
                      name="fullName"
                      value={registerData.fullName}
                      onChange={handleRegisterChange}
                      placeholder="Enter your full name"
                    />

                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-slate-400" />}
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="Enter your email"
                    />

                    <PasswordField
                      label="Password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
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
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Re-enter password"
                      show={showConfirmPass}
                      setShow={setShowConfirmPass}
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Creating account..." : "Create account"}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, type, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3.5 transition hover:border-cyan-400/20 focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
        {icon}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
          required
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  show,
  setShow,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3.5 transition hover:border-cyan-400/20 focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
        <Lock size={18} className="text-slate-400" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
          required
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
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
