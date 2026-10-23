import { useState } from "react";
import api from "../services/api";
import {
  updateMyProfile,
  uploadProfilePicture,
  uploadFarmPhoto,
  uploadBusinessPhoto,
} from "../services/userService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const ProfileModal = ({ user, onClose, onProfileUpdated }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    businessName: user?.businessName || "",
    farmSize: user?.farmDetails?.farmSize || "",
    soilType: user?.farmDetails?.soilType || "",
    cropsGrown: user?.farmDetails?.cropsGrown || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Demo Aadhaar Verification States for existing users
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");

  const handleSendOtp = async () => {
    setAadhaarError("");
    const clean = aadhaarInput.trim();
    if (!/^\d{12}$/.test(clean)) {
      setAadhaarError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    try {
      await api.post("/auth/aadhaar/send-otp", { aadhaar: clean });
      setOtpSent(true);
    } catch (err) {
      setAadhaarError(err.response?.data?.message || "Failed to generate demo OTP.");
    }
  };

  const handleCompleteVerification = async () => {
    setAadhaarError("");
    const clean = aadhaarInput.trim();
    if (!otpInput.trim()) {
      setAadhaarError("Please enter the demo OTP (123456).");
      return;
    }
    setVerifyingAadhaar(true);
    try {
      const { data } = await api.post("/auth/aadhaar/complete-verification", {
        aadhaar: clean,
        otp: otpInput.trim(),
      });
      setSuccess("Aadhaar verified successfully!");
      setShowVerifyModal(false);
      if (onProfileUpdated) onProfileUpdated(data.user);
    } catch (err) {
      setAadhaarError(err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (user.role === "farmer") {
        payload.farmDetails = {
          farmSize: form.farmSize.trim(),
          soilType: form.soilType.trim(),
          cropsGrown: form.cropsGrown.trim(),
        };
      }
      if (user.role === "buyer") {
        payload.businessName = form.businessName.trim();
      }

      const updatedUser = await updateMyProfile(payload);
      setSuccess("Profile updated successfully!");
      if (onProfileUpdated) onProfileUpdated(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds the 10MB limit. Please choose a smaller image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingPic(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await uploadProfilePicture(formData);
      setSuccess("Profile picture uploaded!");
      if (onProfileUpdated) onProfileUpdated(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleRolePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds the 10MB limit. Please choose a smaller image.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      let updatedUser;
      if (user.role === "farmer") {
        updatedUser = await uploadFarmPhoto(formData);
        setSuccess("Farm photo uploaded!");
      } else if (user.role === "buyer") {
        updatedUser = await uploadBusinessPhoto(formData);
        setSuccess("Business photo uploaded!");
      }
      if (onProfileUpdated) onProfileUpdated(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getImageUrl = (urlStr) => {
    if (!urlStr) return null;
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) return urlStr;
    return `${SERVER_URL}${urlStr.startsWith("/") ? "" : "/"}${urlStr}`;
  };

  const profileImgUrl = getImageUrl(user?.profileImage);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>My Profile ({user?.role?.toUpperCase()})</h2>
          <span
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "12px",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: user?.verificationStatus === "Verified" ? "#dcfce7" : user?.verificationStatus === "Rejected" ? "#fee2e2" : "#fef3c7",
              color: user?.verificationStatus === "Verified" ? "#15803d" : user?.verificationStatus === "Rejected" ? "#b91c1c" : "#b45309",
            }}
          >
            {user?.verificationStatus === "Verified" ? "✓ Verified Account" : user?.verificationStatus === "Rejected" ? "Verification Rejected" : "Verification Pending"}
          </span>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="profile-header-section">
          <div className="profile-avatar-container">
            {profileImgUrl ? (
              <img src={profileImgUrl} alt={user?.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div className="profile-upload-actions">
            <label className="btn btn-outline file-upload-btn">
              {uploadingPic ? "Uploading..." : "Change Profile Picture"}
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} disabled={uploadingPic} hidden />
            </label>
          </div>
        </div>
        {/* Identity Verification Section (Aadhaar Demo Module) */}
        <div style={{ background: "var(--bg-primary)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", margin: "0.75rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem" }}>🆔 Aadhaar Identity Verification</h4>
              {user?.aadhaarVerified ? (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Aadhaar Status: <strong style={{ color: "#15803d" }}>✓ Verified</strong> (Aadhaar: XXXX-XXXX-{user.aadhaarLast4 || "1234"})
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#b45309" }}>
                  Aadhaar Status: <strong>⚠ Not Verified</strong>
                </p>
              )}
            </div>
            {!user?.aadhaarVerified && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setShowVerifyModal(true)}
              >
                Verify Aadhaar
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="field-row">
            <label className="field">
              <span>Full Name</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Phone Number</span>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} />
            </label>
          </div>

          <label className="field">
            <span>Address</span>
            <input type="text" name="address" value={form.address} onChange={handleChange} />
          </label>

          {user?.role === "farmer" && (
            <div className="role-specific-section">
              <h3>Farm Details</h3>
              <div className="field-row">
                <label className="field">
                  <span>Farm Size</span>
                  <input type="text" name="farmSize" value={form.farmSize} onChange={handleChange} placeholder="e.g. 10 Acres" />
                </label>
                <label className="field">
                  <span>Soil Type</span>
                  <input type="text" name="soilType" value={form.soilType} onChange={handleChange} placeholder="e.g. Loam" />
                </label>
              </div>
              <label className="field">
                <span>Crops Grown</span>
                <input type="text" name="cropsGrown" value={form.cropsGrown} onChange={handleChange} placeholder="e.g. Wheat, Rice, Cotton" />
              </label>

              <div className="photos-upload-block">
                <h4>Farm Photos</h4>
                <label className="btn btn-outline file-upload-btn">
                  {uploadingPhoto ? "Uploading Photo..." : "Upload Farm Photo"}
                  <input type="file" accept="image/*" onChange={handleRolePhotoUpload} disabled={uploadingPhoto} hidden />
                </label>
                <div className="photo-grid">
                  {user?.farmDetails?.farmPhotos?.map((photo, idx) => (
                    <img key={idx} src={getImageUrl(photo)} alt="Farm" className="photo-thumb" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {user?.role === "buyer" && (
            <div className="role-specific-section">
              <h3>Business Details</h3>
              <label className="field">
                <span>Business Name</span>
                <input type="text" name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. AgriCorp Pvt Ltd" />
              </label>

              <div className="photos-upload-block">
                <h4>Business Photos</h4>
                <label className="btn btn-outline file-upload-btn">
                  {uploadingPhoto ? "Uploading Photo..." : "Upload Business Photo"}
                  <input type="file" accept="image/*" onChange={handleRolePhotoUpload} disabled={uploadingPhoto} hidden />
                </label>
                <div className="photo-grid">
                  {user?.businessPhotos?.map((photo, idx) => (
                    <img key={idx} src={getImageUrl(photo)} alt="Business" className="photo-thumb" />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* DEMO AADHAAR VERIFICATION MODAL FOR EXISTING USERS */}
      {showVerifyModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowVerifyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>🆔 Aadhaar Identity Verification (Demo)</h2>
            <p className="auth-subtitle">Verify your 12-digit Aadhaar number using local demo OTP.</p>

            {aadhaarError && <div className="form-error">{aadhaarError}</div>}

            <label className="field">
              <span>12-Digit Aadhaar Number</span>
              <input
                type="text"
                maxLength={12}
                placeholder="Enter 12-digit Aadhaar"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ""))}
                disabled={otpSent}
              />
            </label>

            {!otpSent ? (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={handleSendOtp}
                disabled={aadhaarInput.length !== 12}
                style={{ marginTop: "0.5rem" }}
              >
                Send Demo OTP
              </button>
            ) : (
              <>
                <label className="field" style={{ marginTop: "0.5rem" }}>
                  <span>Demo OTP (Use: <strong>123456</strong>)</span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter demo OTP (123456)"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={handleCompleteVerification}
                  disabled={verifyingAadhaar}
                  style={{ marginTop: "0.75rem" }}
                >
                  {verifyingAadhaar ? "Verifying..." : "Complete Aadhaar Verification"}
                </button>
              </>
            )}

            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.75rem", marginBottom: 0 }}>
              ℹ️ Demo/Sandbox verification only. This local application does not perform real UIDAI verification.
            </p>

            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;
