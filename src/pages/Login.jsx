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
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute right-[-120px] top-[18%] h-96 w-96 rounded-full bg-white/6 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[28%] h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <section className="flex items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85">
                <ShieldCheck size={16} />
                Oracle Subscription Compliance Platform
              </div>

              <div className="mt-6 max-w-2xl">
                <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-6xl">
                  Subscription Control,
                  <span className="mt-2 block text-white/75">
                    Built for clarity.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
                  Centralize Oracle usage visibility, detect compliance risk,
                  and uncover savings opportunities with a clean enterprise
                  workspace designed for clarity, speed, and daily usability.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  icon={<Activity size={18} />}
                  value="Usage"
                  label="Active and inactive visibility"
                />
                <MetricCard
                  icon={<ShieldAlert size={18} />}
                  value="Risk"
                  label="Role and access exceptions"
                />
                <MetricCard
                  icon={<BadgeDollarSign size={18} />}
                  value="Savings"
                  label="Waste and renewal insight"
                />
              </div>

              <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="rounded-3xl border border-white/15 bg-black/65 p-6 backdrop-blur-xl sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Secure access
                    </p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                      {tab === "login" ? "Welcome back" : "Create account"}
                    </h2>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/12 bg-white/[0.03] p-1.5">
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "login"
                        ? "bg-white text-black"
                        : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      tab === "register"
                        ? "bg-white text-black"
                        : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {errorMsg && (
                  <div className="mb-4 rounded-2xl border border-white/15 bg-white/6 px-4 py-3 text-sm text-white">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 rounded-2xl border border-white/15 bg-white/6 px-4 py-3 text-sm text-white">
                    {successMsg}
                  </div>
                )}

                {tab === "login" ? (
                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-white/45" />}
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
                      <label className="flex items-center gap-2 text-white/65">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent accent-white"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        className="text-white/70 transition hover:text-white"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                    <Field
                      label="Full name"
                      icon={<User size={18} className="text-white/45" />}
                      type="text"
                      name="fullName"
                      value={registerData.fullName}
                      onChange={handleRegisterChange}
                      placeholder="Enter your full name"
                    />

                    <Field
                      label="Email address"
                      icon={<Mail size={18} className="text-white/45" />}
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
                      <div className="mb-2 flex items-center justify-between text-xs text-white/45">
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
                              passwordStrength >= n ? "bg-white" : "bg-white/12"
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
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
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
      <label className="mb-2 block text-sm font-medium text-white/85">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5 transition hover:border-white/25 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/15">
        {icon}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
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
      <label className="mb-2 block text-sm font-medium text-white/85">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5 transition hover:border-white/25 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/15">
        <Lock size={18} className="text-white/45" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
          required
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="text-white/45 transition hover:text-white"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] text-white">
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm leading-6 text-white/60">{label}</div>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2 text-white">
        <CheckCircle2 size={18} />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-sm leading-7 text-white/60">{text}</p>
    </div>
  );
}
