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
    <div className="relative min-h-screen overflow-hidden bg-[#020203] text-[#f5f5f4]">
      <BackgroundIllusion />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="flex items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-black/60 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm">
              <ShieldCheck size={14} />
              Oracle Subscription Compliance Platform
            </div>

            <div className="mt-6">
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Subscription control,
                <span className="mt-1 block text-slate-300">
                  built for clarity.
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Review usage, compliance exposure, and savings opportunities
                from uploaded Oracle reports in one clean operational workspace.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard
                title="Usage visibility"
                text="Active users, dormant accounts, and low-value access."
              />
              <InfoCard
                title="Compliance review"
                text="Privileged inactive users and risky assignments."
              />
              <InfoCard
                title="Import-driven"
                text="Structured results from uploaded Oracle reports."
              />
              <InfoCard
                title="Savings insight"
                text="Waste, underutilization, and renewal opportunities."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Tag text="Audit ready" />
              <Tag text="Secure access" />
              <Tag text="Operational clarity" />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-xl border border-slate-700/70 bg-black/55 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-black/80 text-slate-200">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Secure access
                </p>
                <h2 className="mt-0.5 text-2xl font-semibold tracking-[-0.02em] text-slate-100">
                  {tab === "login" ? "Welcome back" : "Create account"}
                </h2>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-black/80 p-1">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  tab === "login"
                    ? "bg-slate-200 text-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  tab === "register"
                    ? "bg-slate-200 text-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-green-400/20 bg-green-400/10 px-3.5 py-2.5 text-sm text-green-200">
                {successMsg}
              </div>
            )}

            {tab === "login" ? (
              <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
                <Field
                  label="Email"
                  icon={<Mail size={17} className="text-slate-500" />}
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
                  <label className="flex items-center gap-2 text-slate-400">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-slate-200"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-slate-400 transition hover:text-slate-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            ) : (
              <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                <Field
                  label="Full name"
                  icon={<User size={17} className="text-slate-500" />}
                  type="text"
                  name="fullName"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  placeholder="Enter your full name"
                />

                <Field
                  label="Email"
                  icon={<Mail size={17} className="text-slate-500" />}
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
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Password strength</span>
                    <span>{registerData.password ? strengthText : "—"}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 rounded-full transition ${
                          passwordStrength >= n ? "bg-slate-200" : "bg-white/10"
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
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            )}

            <div className="mt-5 rounded-xl border border-slate-700 bg-black/60 px-4 py-3 text-xs leading-6 text-slate-500">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#111827_0%,#050505_40%,#000000_100%)]" />

      <div className="absolute inset-0 opacity-45 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:144px_144px]" />

      <div className="absolute left-[-10%] top-[-12%] h-[30rem] w-[30rem] rounded-full bg-white/[0.08] blur-[130px]" />
      <div className="absolute right-[-8%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-slate-300/[0.08] blur-[120px]" />
      <div className="absolute bottom-[-18%] left-[18%] h-[24rem] w-[24rem] rounded-full bg-slate-200/[0.06] blur-[120px]" />
      <div className="absolute left-[42%] top-[55%] h-[18rem] w-[18rem] rounded-full bg-white/[0.04] blur-[100px]" />

      <div className="absolute left-[6%] top-[-18%] h-[150%] w-[22%] -rotate-[18deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_24%,transparent_68%)] blur-3xl opacity-45" />
      <div className="absolute left-[28%] top-[-12%] h-[120%] w-[14%] -rotate-[22deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_26%,transparent_72%)] blur-3xl opacity-30" />
      <div className="absolute right-[5%] top-[-10%] h-[125%] w-[18%] rotate-[14deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_26%,transparent_70%)] blur-3xl opacity-30" />

      <div className="absolute left-[10%] top-[18%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_35%,transparent_72%)] blur-2xl" />
      <div className="absolute right-[10%] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_30%,transparent_74%)] blur-2xl" />

      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent)]" />
      <div className="absolute inset-y-0 right-0 w-40 bg-[linear-gradient(to_left,rgba(255,255,255,0.03),transparent)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.28)_70%,rgba(0,0,0,0.7)_100%)]" />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}

function Field({ label, icon, type, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-black/80 px-4 py-3 transition focus-within:border-white/20">
        {icon}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
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
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-black/80 px-4 py-3 transition focus-within:border-white/20">
        <Lock size={17} className="text-slate-500" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          required
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="text-slate-500 transition hover:text-slate-200"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-black/35 p-4 backdrop-blur-md">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="rounded-full border border-slate-700/70 bg-black/35 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md">
      {text}
    </span>
  );
}
