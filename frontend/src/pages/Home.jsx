import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, ShoppingBag, ShieldCheck, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { T } from "../components/common/SpeakableWord";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "1100px", margin: "0 auto", padding: "20px 0" }}>
      {/* Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)",
          borderRadius: "24px",
          padding: "56px 40px",
          color: "#ffffff",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "40px",
          alignItems: "center",
          boxShadow: "0 20px 40px rgba(6, 78, 59, 0.25)",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "#ffffff", padding: "6px 14px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>
            <Sprout size={16} /> <T>Next-Gen Contract Farming SaaS</T>
          </div>

          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, margin: "0 0 16px 0" }}>
            <T>Digitized Contract Farming Management & Market Hub</T>
          </h1>

          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.6, margin: "0 0 28px 0" }}>
            <T>Empowering producers and commercial buyers with automated contract lifecycles, Aadhaar identity verification, real-time crop progress tracking, and secure financial settlements.</T>
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {user ? (
              <button
                type="button"
                onClick={() => navigate(`/${user.role}`)}
                className="btn"
                style={{ background: "#ffffff", color: "#064e3b", fontWeight: 800, padding: "14px 28px", borderRadius: "12px", fontSize: "1rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              >
                <T>Go to My Dashboard</T> <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn"
                  style={{ background: "#ffffff", color: "#064e3b", fontWeight: 800, padding: "14px 24px", borderRadius: "12px", fontSize: "0.95rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <T>Get Started Free</T> <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="btn"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", fontWeight: 700, padding: "14px 24px", borderRadius: "12px", fontSize: "0.95rem", border: "1px solid rgba(255,255,255,0.3)", textDecoration: "none" }}
                >
                  <T>Sign In</T>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Visual Preview Card */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", color: "#0f172a", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#059669" }}><T>Active Contract Preview</T></span>
            <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>
              <T>In Progress</T>
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}><T>Crop Commodity</T>:</span>
              <strong style={{ color: "#0f172a" }}><T>Organic Wheat (PBW-550)</T></strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}><T>Contract Volume</T>:</span>
              <strong>1,500 kg @ ₹35/kg</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}><T>Total Contract Value</T>:</span>
              <strong style={{ color: "#059669" }}>₹52,500</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}><T>Aadhaar Status</T>:</span>
              <span style={{ color: "#15803d", fontWeight: 600 }}>✓ <T>Verified Producer</T></span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>Farm Marketplace</T></h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
            <T>Direct buyer-to-farmer crop marketplace. Browse expected harvests, soil types, and farm photos.</T>
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sprout size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>Farm Progress Center</T></h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
            <T>Real-time crop stage progression logging from land preparation to harvest with photo evidence uploads.</T>
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>Smart Data Insights</T></h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
            <T>Calculated network analytics, financial performance, contract completion trends, and verification stats.</T>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
