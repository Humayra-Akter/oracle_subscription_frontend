import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
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
    email: "admin@oracle.com",
    password: "Admin@123",
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <BackgroundIllusion />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <section className="flex items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700 shadow-sm backdrop-blur-sm">
              <ShieldCheck size={14} />
              Oracle Subscription Compliance Platform
            </div>

            <div className="mt-6">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Secure access to your
                <span className="mt-1 block text-indigo-800">
                  compliance workspace
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Review usage trends, license waste, compliance exposure, and
                savings opportunities from uploaded Oracle reports in one clean,
                structured, audit-ready platform.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard
                title="Usage Visibility"
                text="Track active users, dormant accounts, and low-value subscription usage."
              />
              <InfoCard
                title="Compliance Review"
                text="Surface privileged inactive users, risky assignments, and exceptions."
              />
              <InfoCard
                title="Import Driven"
                text="Work from validated Oracle uploads with consistent operational traceability."
              />
              <InfoCard
                title="Savings Insight"
                text="Identify waste, underutilization, and renewal optimization opportunities."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Tag text="Audit ready" />
              <Tag text="Protected access" />
              <Tag text="Operational clarity" />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 shadow-sm">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Secure access
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  {tab === "login" ? "Welcome back" : "Create account"}
                </h2>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === "login"
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === "register"
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {successMsg}
              </div>
            )}

            {tab === "login" ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <Field
                  label="Email"
                  icon={<Mail size={17} className="text-slate-400" />}
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

                <div className="flex items-center justify-between pt-0.5 text-sm">
                  <label className="flex items-center gap-2 text-slate-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 bg-white accent-indigo-600"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-slate-500 transition hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <Field
                  label="Full name"
                  icon={<User size={17} className="text-slate-400" />}
                  type="text"
                  name="fullName"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  placeholder="Enter your full name"
                />

                <Field
                  label="Email"
                  icon={<Mail size={17} className="text-slate-400" />}
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
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Password strength</span>
                    <span>{registerData.password ? strengthText : "—"}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 rounded-full transition ${
                          passwordStrength >= n
                            ? "bg-indigo-600"
                            : "bg-slate-200"
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
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            )}

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-6 text-slate-500">
              Access is restricted to approved organization users and monitored
              for compliance operations.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BackgroundIllusion() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#eef2ff_0%,#f8fafc_45%,#ffffff_100%)]" />

      <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />

      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:140px_140px]" />

      <div className="absolute left-[-8%] top-[-10%] h-[26rem] w-[26rem] rounded-full bg-indigo-200/40 blur-[100px]" />
      <div className="absolute right-[-8%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-sky-100/50 blur-[100px]" />
      <div className="absolute bottom-[-15%] left-[18%] h-[22rem] w-[22rem] rounded-full bg-violet-100/40 blur-[100px]" />
      <div className="absolute left-[45%] top-[58%] h-[16rem] w-[16rem] rounded-full bg-indigo-100/50 blur-[90px]" />

      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(255,255,255,0.15)_72%,rgba(248,250,252,0.65)_100%)]" />
    </div>
  );
}

function Field({ label, icon, type, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-100">
        {icon}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
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
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-100">
        <Lock size={17} className="text-slate-400" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          required
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="text-slate-400 transition hover:text-indigo-700"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-md">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="rounded-full border border-indigo-100 bg-white/90 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur-md">
      {text}
    </span>
  );
}
