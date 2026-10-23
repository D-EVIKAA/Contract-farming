import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sprout, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const roleToPath = { farmer: "/farmer", buyer: "/buyer", admin: "/admin" };

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      navigate(roleToPath[loggedInUser.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "85vh", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "960px",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Left Visual Hero */}
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)",
            padding: "48px 40px",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sprout size={24} style={{ color: "#ffffff" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }}><T>AgriContract SaaS</T></span>
            </div>

            <h2 style={{ fontSize: "1.8rem", color: "#ffffff", fontWeight: 800, lineHeight: 1.3, marginBottom: "16px" }}>
              <T>Enterprise Contract Farming Management Platform</T>
            </h2>

            <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
              <T>Secure role-based governance for farmers, buyers, and administrators. Track crop production, digital contracts, and payouts.</T>
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={20} style={{ color: "#34d399", flexShrink: 0 }} />
            <span><T>End-to-end encrypted JWT auth & Aadhaar identity verification.</T></span>
          </div>
        </div>

        {/* Right Form */}
        <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "1.6rem", color: "#0f172a", fontWeight: 800 }}><T>Account Login</T></h2>
          <p style={{ margin: "0 0 24px 0", fontSize: "0.9rem", color: "#64748b" }}>
            <T>Sign in using your registered Email, Phone, or Aadhaar number.</T>
          </p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecdd3", color: "#9f1239", padding: "12px 14px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                <T>Email / Phone / 12-Digit Aadhaar</T>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px" }}>
                <Mail size={18} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  name="email"
                  placeholder="name@domain.com or phone"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: "0.95rem", color: "#0f172a" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                <T>Password</T>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px" }}>
                <Lock size={18} style={{ color: "#64748b" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: "0.95rem", color: "#0f172a" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "12px", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px", marginTop: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {submitting ? <T>Authenticating...</T> : <T>Sign In to Dashboard</T>} <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b", marginTop: "12px" }}>
              <T>Don't have an account?</T>{" "}
              <Link to="/register" style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>
                <T>Register as Farmer / Buyer</T>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
