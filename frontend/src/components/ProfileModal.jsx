import { useState } from "react";
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

  const profileImgUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <h2>My Profile ({user?.role?.toUpperCase()})</h2>

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
                    <img key={idx} src={`${SERVER_URL}${photo}`} alt="Farm" className="photo-thumb" />
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
                    <img key={idx} src={`${SERVER_URL}${photo}`} alt="Business" className="photo-thumb" />
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
    </div>
  );
};

export default ProfileModal;
