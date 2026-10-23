import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  sendAadhaarOtp,
  verifyAadhaarOtp,
  getAadhaarStatus,
} from "../../services/aadhaarService";
import { Sprout, ShieldCheck, ShieldAlert, ArrowRight, User, Building, Lock, Mail, Phone, MapPin, RefreshCw, Info } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const roleToPath = { farmer: "/farmer", buyer: "/buyer" };

const initialFormState = {
  name: "",
  email: "",
  password: "",
  role: "farmer",
  phone: "",
  address: "",
  farmSize: "",
  soilType: "",
  cropsGrown: "",
  businessName: "",
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Aadhaar Verification States
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [clientId, setClientId] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [userConsent, setUserConsent] = useState(false);
  const [providerConfig, setProviderConfig] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    getAadhaarStatus()
      .then((data) => setProviderConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setForm({ ...form, role });
  };

  const handleSendAadhaarOtp = async () => {
    setError("");
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, "").slice(0, 12);
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!userConsent) {
      setError("Please check the voluntary consent box to proceed with Aadhaar verification.");
      return;
    }
    setSendingOtp(true);
    try {
      const data = await sendAadhaarOtp({
        aadhaar: cleanAadhaar,
        consent: true,
        consentText: "Registration identity KYC consent",
      });
      setClientId(data.clientId || data.referenceId || "");
      setOtpSent(true);
      setResendCountdown(60);
      toast.info(data.message || "OTP sent to your Aadhaar-linked mobile number.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate Aadhaar OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    setError("");
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, "").slice(0, 12);
    const cleanOtp = otpInput.replace(/\D/g, "");
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setVerifyingOtp(true);
    try {
      const data = await verifyAadhaarOtp({
        aadhaar: cleanAadhaar,
        otp: cleanOtp,
        clientId,
      });
      setAadhaarVerified(true);
      setAadhaarLast4(data.aadhaarLast4 || cleanAadhaar.slice(-4));
      toast.success(data.message || "✓ Aadhaar identity verified successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Aadhaar OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!aadhaarVerified) {
      setError("Please complete Aadhaar demo verification before creating your account.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone,
      address: form.address,
      aadhaar: aadhaarNumber.trim(),
    };

    if (form.role === "farmer") {
      payload.farmDetails = {
        farmSize: form.farmSize,
        soilType: form.soilType,
        cropsGrown: form.cropsGrown,
      };
    } else {
      payload.businessName = form.businessName;
    }

    try {
      const newUser = await register(payload);
      toast.success(`Account created! Welcome to AgriContract, ${newUser.name}.`);
      navigate(roleToPath[newUser.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "90vh", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          maxWidth: "760px",
          width: "100%",
          padding: "40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Sprout size={28} style={{ color: "#059669" }} />
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#0f172a", fontWeight: 800 }}>
            <T>Create Your Account</T>
          </h1>
        </div>
        <p style={{ margin: "0 0 24px 0", fontSize: "0.92rem", color: "#64748b" }}>
          <T>Join the contract farming ecosystem as a Producer (Farmer) or Commercial Buyer.</T>
        </p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecdd3", color: "#9f1239", padding: "12px 14px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Role Selector Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => handleRoleSelect("farmer")}
            style={{
              padding: "14px",
              borderRadius: "12px",
              border: `2px solid ${form.role === "farmer" ? "#059669" : "#e2e8f0"}`,
              background: form.role === "farmer" ? "#ecfdf5" : "#ffffff",
              color: form.role === "farmer" ? "#047857" : "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
          >
            <Sprout size={20} /> <T>Farmer (Producer)</T>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect("buyer")}
            style={{
              padding: "14px",
              borderRadius: "12px",
              border: `2px solid ${form.role === "buyer" ? "#0284c7" : "#e2e8f0"}`,
              background: form.role === "buyer" ? "#f0f9ff" : "#ffffff",
              color: form.role === "buyer" ? "#0369a1" : "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
          >
            <Building size={20} /> <T>Buyer (Commercial)</T>
          </button>
        </div>

        {/* Identity Verification Module */}
        <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #cbd5e1", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} style={{ color: aadhaarVerified ? "#10b981" : "#0284c7" }} />
              <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>
                <T>Aadhaar e-KYC Identity Verification</T>
              </h4>
            </div>

            {providerConfig && (
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "999px",
                background: providerConfig.isSandbox ? "#fef3c7" : "#dcfce7",
                color: providerConfig.isSandbox ? "#92400e" : "#166534",
              }}>
                <T>{providerConfig.isSandbox ? "Sandbox Mode" : `Live: ${providerConfig.provider}`}</T>
              </span>
            )}
          </div>

          {!aadhaarVerified ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="Enter 12-digit Aadhaar number"
                  value={aadhaarNumber.replace(/(\d{4})/g, "$1 ").trim()}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  disabled={otpSent}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "1rem",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                  }}
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendAadhaarOtp}
                    disabled={sendingOtp || aadhaarNumber.replace(/\D/g, "").length !== 12 || !userConsent}
                    className="btn btn-primary"
                    style={{ padding: "10px 18px", fontWeight: 700 }}
                  >
                    {sendingOtp ? <T>Sending...</T> : <T>Send OTP</T>}
                  </button>
                )}
              </div>

              {/* Consent Checkbox */}
              {!otpSent && (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                    <input
                      type="checkbox"
                      checked={userConsent}
                      onChange={(e) => setUserConsent(e.target.checked)}
                      style={{ marginTop: "2px", width: "15px", height: "15px", cursor: "pointer" }}
                    />
                    <span>
                      <T>I voluntarily submit my Aadhaar and consent to OTP authentication for identity KYC. My 12-digit Aadhaar number will never be saved in plaintext.</T>
                    </span>
                  </label>
                </div>
              )}

              {otpSent && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={providerConfig?.isSandbox ? "Enter OTP (Sandbox: 123456)" : "Enter 6-digit OTP"}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "1.1rem",
                        letterSpacing: "0.2em",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAadhaarOtp}
                      disabled={verifyingOtp || otpInput.replace(/\D/g, "").length !== 6}
                      className="btn btn-success"
                      style={{ padding: "10px 18px", fontWeight: 700, background: "#059669", color: "#ffffff", border: "none" }}
                    >
                      {verifyingOtp ? <T>Verifying...</T> : <T>Verify OTP</T>}
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpInput("");
                      }}
                      style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.78rem", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                    >
                      <T>Change Aadhaar Number</T>
                    </button>

                    {resendCountdown > 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        <T>Resend OTP in</T> {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendAadhaarOtp}
                        disabled={sendingOtp}
                        style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                      >
                        <RefreshCw size={12} /> <T>Resend OTP</T>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", color: "#166534", fontWeight: 600, fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} style={{ color: "#16a34a" }} />
                <span><T>Aadhaar Identity Verified</T> (XXXX-XXXX-{aadhaarLast4})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAadhaarVerified(false);
                  setOtpSent(false);
                  setOtpInput("");
                }}
                style={{ background: "none", border: "none", color: "#64748b", textDecoration: "underline", cursor: "pointer", fontSize: "0.82rem" }}
              >
                <T>Change</T>
              </button>
            </div>
          )}
        </div>

        {/* User Details Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                <T>Full Name</T>
              </label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                <T>Phone Number</T>
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                <T>Email Address</T>
              </label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="user@domain.com" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                <T>Password</T>
              </label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
              <T>Address / District</T>
            </label>
            <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="District, State" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
          </div>

          {form.role === "farmer" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  <T>Farm Size</T>
                </label>
                <input type="text" name="farmSize" value={form.farmSize} onChange={handleChange} placeholder="e.g. 3 Acres" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  <T>Soil Type</T>
                </label>
                <input type="text" name="soilType" value={form.soilType} onChange={handleChange} placeholder="e.g. Loamy" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  <T>Crops Grown</T>
                </label>
                <input type="text" name="cropsGrown" value={form.cropsGrown} onChange={handleChange} placeholder="Wheat, Rice" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                <T>Business / Company Name</T>
              </label>
              <input type="text" name="businessName" value={form.businessName} onChange={handleChange} placeholder="FreshAgro Ltd" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !aadhaarVerified}
            className="btn btn-primary"
            style={{ padding: "12px", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px", marginTop: "12px" }}
          >
            {submitting ? <T>Creating Account...</T> : <T>Complete Registration</T>}
          </button>

          <div style={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b", marginTop: "12px" }}>
            <T>Already registered?</T> <Link to="/login" style={{ color: "#059669", fontWeight: 700 }}><T>Sign In</T></Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
