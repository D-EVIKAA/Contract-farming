import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updateMyProfile,
  uploadProfilePicture,
  uploadFarmPhoto,
  uploadBusinessPhoto,
} from "../../services/userService";
import {
  sendAadhaarOtp,
  completeProfileAadhaarVerification,
  getAadhaarStatus,
} from "../../services/aadhaarService";
import { User, ShieldCheck, ShieldAlert, Phone, Mail, MapPin, Camera, Upload, CheckCircle2, Lock, AlertCircle, Info, RefreshCw } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  // Farmer specific state
  const [farmSize, setFarmSize] = useState(user?.farmDetails?.farmSize || "");
  const [soilType, setSoilType] = useState(user?.farmDetails?.soilType || "");
  const [cropsGrown, setCropsGrown] = useState(user?.farmDetails?.cropsGrown || "");
  const [farmLocation, setFarmLocation] = useState(user?.farmDetails?.location || "");

  // Buyer specific state
  const [businessName, setBusinessName] = useState(user?.businessName || "");

  // Aadhaar Verification State
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [aadhaarStep, setAadhaarStep] = useState(1); // 1: Enter Aadhaar, 2: Enter OTP
  const [clientId, setClientId] = useState("");
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [providerConfig, setProviderConfig] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  if (!user) return null;

  const isFarmer = user.role === "farmer";
  const avatarUrl = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        phone,
        address,
        ...(isFarmer
          ? { farmDetails: { farmSize, soilType, cropsGrown, location: farmLocation } }
          : { businessName }),
      };

      const updatedUser = await updateMyProfile(payload);
      updateUser(updatedUser);
      toast.success("Profile details updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const updatedUser = await uploadProfilePicture(formData);
      updateUser(updatedUser);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Failed to upload avatar image.");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      let updatedUser;
      if (isFarmer) {
        updatedUser = await uploadFarmPhoto(formData);
      } else {
        updatedUser = await uploadBusinessPhoto(formData);
      }
      updateUser(updatedUser);
      toast.success(`${isFarmer ? "Farm" : "Business"} photo added!`);
    } catch (err) {
      toast.error("Failed to upload photo evidence.");
    }
  };

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

  // Aadhaar OTP Verification Handlers
  const handleSendAadhaarOtp = async (e) => {
    if (e) e.preventDefault();
    if (!userConsent) {
      toast.error("Please read and accept the Aadhaar verification consent terms.");
      return;
    }
    if (aadhaarNumber.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setVerifyingAadhaar(true);
    try {
      const data = await sendAadhaarOtp({
        aadhaar: aadhaarNumber,
        consent: true,
        consentText: "User consented to Aadhaar OTP verification for contract farming KYC",
      });
      setClientId(data.clientId || data.referenceId || "");
      setAadhaarStep(2);
      setResendCountdown(60);
      toast.info(data.message || "OTP sent to your Aadhaar-linked mobile number.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send Aadhaar OTP. Please check the number.");
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleVerifyAadhaarOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    setVerifyingAadhaar(true);
    try {
      const data = await completeProfileAadhaarVerification({
        aadhaar: aadhaarNumber,
        otp,
        clientId,
        consent: true,
      });
      if (data?.user) {
        updateUser(data.user);
      }
      toast.success(data.message || "Aadhaar identity verified successfully!");
      setShowAadhaarModal(false);
      setAadhaarStep(1);
      setOtp("");
      setAadhaarNumber("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP code or verification failed.");
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Profile Card Header */}
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ position: "relative" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "4px solid #10b981" }} />
          ) : (
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 700 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <label style={{ position: "absolute", bottom: 0, right: 0, background: "#0f172a", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #ffffff" }}>
            <Camera size={16} />
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: 800 }}>{user.name}</h2>
            <span style={{ background: isFarmer ? "#dcfce7" : "#e0f2fe", color: isFarmer ? "#15803d" : "#0369a1", fontSize: "0.78rem", fontWeight: 700, padding: "2px 10px", borderRadius: "999px", textTransform: "uppercase" }}>
              <T>{user.role}</T>
            </span>
          </div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}>{user.email}</div>

          {/* Verification Badge Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
            <StatusBadge status={user.verificationStatus || "Pending"} />
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: user.aadhaarVerified ? "#15803d" : "#b45309", display: "flex", alignItems: "center", gap: "4px" }}>
              {user.aadhaarVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              <span>
                {user.aadhaarVerified
                  ? <><T>Aadhaar Verified</T> (XXXX-XXXX-{user.aadhaarLast4 || "XXXX"})</>
                  : <T>Aadhaar Identity Unverified</T>}
              </span>
            </div>

            {!user.aadhaarVerified && (
              <button
                type="button"
                onClick={() => setShowAadhaarModal(true)}
                style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", cursor: "pointer" }}
              >
                <T>Verify via Aadhaar OTP</T>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>Personal & Contact Details</T></h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Phone Number</T></label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Address / Location</T></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="District, State"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
            />
          </div>
        </div>

        {/* Role Specific Section */}
        {isFarmer ? (
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>🌾 Farm Details</T></h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Farm Size (Acres / Hectares)</T></label>
                <input
                  type="text"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g. 5.5 Acres"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Soil Type</T></label>
                <input
                  type="text"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  placeholder="e.g. Alluvial / Black Soil"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Crops Grown (Comma separated)</T></label>
                <input
                  type="text"
                  value={cropsGrown}
                  onChange={(e) => setCropsGrown(e.target.value)}
                  placeholder="Wheat, Rice, Cotton"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
                />
              </div>
            </div>

            {/* Farm Photos Upload */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}><T>Farm Photos Evidence</T></label>
                <label style={{ background: "#0f172a", color: "#ffffff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  <T>+ Upload Photo</T>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {user.farmDetails?.farmPhotos?.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.startsWith("http") ? p : `${SERVER_URL}${p}`}
                    alt="Farm evidence"
                    style={{ width: "100px", height: "80px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>🏢 Business Details</T></h3>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Business / Company Name</T></label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="AgriCorp Logistics Ltd"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.92rem" }}>
            {loading ? <T>Saving Changes...</T> : <T>Save Profile Details</T>}
          </button>
        </div>
      </form>

      {/* Aadhaar Real Verification Modal */}
      {showAadhaarModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "18px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#ecfdf5", padding: "8px", borderRadius: "10px" }}>
                  <ShieldCheck size={24} style={{ color: "#059669" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 800 }}><T>Aadhaar Identity Verification</T></h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}><T>UIDAI Compliant Paperless e-KYC</T></span>
                </div>
              </div>

              {/* Provider Badge */}
              {providerConfig && (
                <div style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: providerConfig.isSandbox ? "#fef3c7" : "#dcfce7",
                  color: providerConfig.isSandbox ? "#92400e" : "#166534",
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: providerConfig.isSandbox ? "#d97706" : "#16a34a" }} />
                  <T>{providerConfig.isSandbox ? "Sandbox Mode" : `Live: ${providerConfig.provider}`}</T>
                </div>
              )}
            </div>

            {/* Provider Notice */}
            {providerConfig?.isSandbox ? (
              <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px", fontSize: "0.82rem", color: "#92400e", display: "flex", gap: "8px" }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong><T>Development Sandbox</T>:</strong> <T>Provider API keys not set in</T> <code>.env</code>. <T>Test OTP</T>: <strong>123456</strong>.
                </div>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px", fontSize: "0.82rem", color: "#166534", display: "flex", gap: "8px" }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong><T>Authorized Provider Active</T>:</strong> <T>OTP will be sent directly from UIDAI to your mobile registered with Aadhaar.</T>
                </div>
              </div>
            )}

            {aadhaarStep === 1 ? (
              <form onSubmit={handleSendAadhaarOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    <T>12-Digit Aadhaar Number</T>
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="1234 5678 9012"
                    value={aadhaarNumber.replace(/(\d{4})/g, "$1 ").trim()}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "1.1rem",
                      letterSpacing: "0.15em",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                    🔒 <T>Data Minimization: Full Aadhaar is never saved in our database. Only a secure one-way hash and last 4 digits are retained.</T>
                  </div>
                </div>

                {/* Statutory UIDAI Explicit Consent Checkbox */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "0.8rem", color: "#334155", lineHeight: "1.4" }}>
                    <input
                      type="checkbox"
                      checked={userConsent}
                      onChange={(e) => setUserConsent(e.target.checked)}
                      style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span>
                      <T>I hereby give voluntary consent to authenticate my identity via Aadhaar OTP with an authorized verification provider for KYC identity verification under Contract Farming rules.</T>
                    </span>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAadhaarModal(false);
                      setUserConsent(false);
                    }}
                    className="btn btn-outline"
                    style={{ padding: "10px 18px", borderRadius: "8px" }}
                  >
                    <T>Cancel</T>
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingAadhaar || aadhaarNumber.length !== 12 || !userConsent}
                    className="btn btn-primary"
                    style={{ padding: "10px 22px", borderRadius: "8px", fontWeight: 700 }}
                  >
                    {verifyingAadhaar ? <T>Requesting OTP...</T> : <T>Get OTP Code</T>}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAadhaarOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>
                      <T>Enter 6-Digit OTP Code</T>
                    </label>
                    {clientId && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        <T>Ref</T>: {clientId.slice(0, 10)}...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "1.4rem",
                      letterSpacing: "0.3em",
                      textAlign: "center",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      <T>{providerConfig?.isSandbox ? "Sandbox Test OTP: 123456" : "OTP valid for 10 minutes"}</T>
                    </span>
                    {resendCountdown > 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        <T>Resend in</T> {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendAadhaarOtp}
                        disabled={verifyingAadhaar}
                        style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                      >
                        <RefreshCw size={12} /> <T>Resend OTP</T>
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAadhaarStep(1);
                      setOtp("");
                    }}
                    className="btn btn-outline"
                    style={{ padding: "10px 18px", borderRadius: "8px" }}
                  >
                    <T>Back</T>
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingAadhaar || otp.length !== 6}
                    className="btn btn-success"
                    style={{ padding: "10px 22px", borderRadius: "8px", fontWeight: 700, background: "#059669", color: "#ffffff", border: "none" }}
                  >
                    {verifyingAadhaar ? <T>Verifying...</T> : <T>Verify & Complete</T>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
