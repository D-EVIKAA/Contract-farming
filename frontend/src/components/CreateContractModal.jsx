import { useState, useEffect } from "react";
import { getActiveFarmers } from "../services/userService";
import { T } from "./common/SpeakableWord";

const initialFormState = {
  farmerId: "",
  cropName: "",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  expectedDeliveryDate: "",
  location: "",
  additionalRequirements: "",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const CreateContractModal = ({ onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initialFormState);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [error, setError] = useState("");
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  const loadFarmers = async (query = "") => {
    try {
      setLoadingFarmers(true);
      const data = await getActiveFarmers(query ? { search: query } : {});
      setFarmers(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load farmers list.");
    } finally {
      setLoadingFarmers(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFarmerSearch(val);
    loadFarmers(val);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectedFarmer = farmers.find((f) => f._id === form.farmerId);

  const totalAmount =
    Number(form.quantity) > 0 && Number(form.pricePerUnit) > 0
      ? Number(form.quantity) * Number(form.pricePerUnit)
      : 0;

  const validate = () => {
    if (!form.farmerId) return "Please select a target farmer.";
    if (!form.cropName.trim()) return "Please enter a crop name.";
    if (!form.quantity || Number(form.quantity) <= 0) return "Quantity must be greater than 0.";
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0)
      return "Price per unit must be greater than 0.";
    if (!form.expectedDeliveryDate) return "Please select an expected delivery date.";
    if (new Date(form.expectedDeliveryDate) < new Date())
      return "Expected delivery date must be in the future.";
    if (!form.location.trim()) return "Please enter a location.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    await onSubmit({
      farmerId: form.farmerId,
      cropName: form.cropName.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      expectedDeliveryDate: form.expectedDeliveryDate,
      location: form.location.trim(),
      additionalRequirements: form.additionalRequirements.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <h2><T>Create New Contract</T></h2>
        <p className="auth-subtitle">
          <T>Select an active farmer to assign this contract directly in</T> <strong><T>Pending</T></strong> <T>status.</T>
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}><T>Search Farmers (Name, Location, Crop)</T></span>
            <input
              type="text"
              placeholder="Type to filter farmers..."
              value={farmerSearch}
              onChange={handleSearchChange}
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.9rem" }}
            />
          </div>

          <label className="field">
            <span><T>Select Farmer (Required)</T></span>
            {loadingFarmers ? (
              <div className="loading-inline"><T>Loading available farmers...</T></div>
            ) : farmers.length === 0 ? (
              <p className="form-warning"><T>No active farmers match your search.</T></p>
            ) : (
              <select name="farmerId" value={form.farmerId} onChange={handleChange} required>
                <option value="">-- Choose an active farmer ({farmers.length} available) --</option>
                {farmers.map((farmer) => {
                  const statusTag = farmer.verificationStatus === "Verified" ? " [✓ Verified]" : farmer.verificationStatus === "Rejected" ? " [✕ Rejected]" : " [Pending]";
                  return (
                    <option key={farmer._id} value={farmer._id}>
                      {farmer.name}{statusTag} ({farmer.phone || farmer.email}) {farmer.farmDetails?.farmSize ? `· ${farmer.farmDetails.farmSize}` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </label>

          {selectedFarmer && (
            <div className="selected-farmer-card" style={{ padding: "0.85rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}><T>Selected Farmer</T>: {selectedFarmer.name}</h4>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: selectedFarmer.verificationStatus === "Verified" ? "#dcfce7" : selectedFarmer.verificationStatus === "Rejected" ? "#fee2e2" : "#fef3c7",
                        color: selectedFarmer.verificationStatus === "Verified" ? "#15803d" : selectedFarmer.verificationStatus === "Rejected" ? "#b91c1c" : "#b45309",
                      }}
                    >
                      {selectedFarmer.verificationStatus === "Verified" ? <>✓ <T>Verified</T></> : selectedFarmer.verificationStatus === "Rejected" ? <T>Verification Rejected</T> : <T>Verification Pending</T>}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowFarmerModal(true)}
                >
                  🔍 <T>View Full Profile & Photos</T>
                </button>
              </div>

              <p style={{ margin: "0.25rem 0" }}><strong><T>Phone</T>:</strong> {selectedFarmer.phone || "N/A"} | <strong><T>Location</T>:</strong> {selectedFarmer.address || "N/A"}</p>
              {selectedFarmer.farmDetails?.cropsGrown && (
                <p style={{ margin: "0.25rem 0" }}><strong><T>Crops Grown</T>:</strong> {selectedFarmer.farmDetails.cropsGrown}</p>
              )}
            </div>
          )}

          <div className="field-row">
            <label className="field">
              <span><T>Crop name</T></span>
              <input type="text" name="cropName" value={form.cropName} onChange={handleChange} required />
            </label>
            <label className="field">
              <span><T>Unit</T></span>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span><T>Quantity</T></span>
              <input
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field">
              <span><T>Price per unit (₹)</T></span>
              <input
                type="number"
                name="pricePerUnit"
                min="1"
                value={form.pricePerUnit}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span><T>Expected delivery date</T></span>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={form.expectedDeliveryDate}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field">
              <span><T>Location</T></span>
              <input type="text" name="location" value={form.location} onChange={handleChange} required />
            </label>
          </div>

          <label className="field">
            <span><T>Additional requirements (optional)</T></span>
            <textarea
              rows={3}
              name="additionalRequirements"
              value={form.additionalRequirements}
              onChange={handleChange}
              placeholder="e.g. Grade A quality, packed in 20kg crates"
            />
          </label>

          <div className="total-preview">
            <span className="label"><T>Total amount</T></span>
            <span className="total-preview-value">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              <T>Cancel</T>
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingFarmers || farmers.length === 0}>
              {submitting ? <T>Creating...</T> : <T>Create contract</T>}
            </button>
          </div>
        </form>
      </div>

      {/* FARMER PROFILE INSPECTION MODAL */}
      {showFarmerModal && selectedFarmer && (
        <div className="modal-overlay" onClick={() => setShowFarmerModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <h2><T>Farmer Profile & Farm Information</T></h2>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1rem 0" }}>
              {selectedFarmer.profileImage ? (
                <img
                  src={selectedFarmer.profileImage.startsWith("http") ? selectedFarmer.profileImage : `${SERVER_URL}${selectedFarmer.profileImage}`}
                  alt={selectedFarmer.name}
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {selectedFarmer.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0 }}>{selectedFarmer.name}</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>{selectedFarmer.email}</p>
                <div style={{ marginTop: "0.25rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: selectedFarmer.verificationStatus === "Verified" ? "#dcfce7" : selectedFarmer.verificationStatus === "Rejected" ? "#fee2e2" : "#fef3c7",
                      color: selectedFarmer.verificationStatus === "Verified" ? "#15803d" : selectedFarmer.verificationStatus === "Rejected" ? "#b91c1c" : "#b45309",
                    }}
                  >
                    {selectedFarmer.verificationStatus === "Verified" ? <>✓ <T>Verified</T></> : selectedFarmer.verificationStatus === "Rejected" ? <T>Verification Rejected</T> : <T>Verification Pending</T>}
                  </span>
                </div>
              </div>
            </div>

            <div className="contract-card-grid" style={{ marginBottom: "1rem" }}>
              <div>
                <span className="label"><T>Phone</T></span>
                <span>{selectedFarmer.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="label"><T>Location / Address</T></span>
                <span>{selectedFarmer.address || "Not provided"}</span>
              </div>
              <div>
                <span className="label"><T>Farm Size</T></span>
                <span>{selectedFarmer.farmDetails?.farmSize || "Not specified"}</span>
              </div>
              <div>
                <span className="label"><T>Soil Type</T></span>
                <span>{selectedFarmer.farmDetails?.soilType || "Not specified"}</span>
              </div>
            </div>

            <div style={{ background: "var(--bg-primary)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0" }}>🌾 <T>Crops Grown & Farm Photos</T></h4>
              <p><strong><T>Crops</T>:</strong> {selectedFarmer.farmDetails?.cropsGrown || "Not specified"}</p>

              {selectedFarmer.farmDetails?.farmPhotos?.length > 0 ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <span className="label"><T>Farm Photos</T>:</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                    {selectedFarmer.farmDetails.farmPhotos.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.startsWith("http") ? img : `${SERVER_URL}${img}`}
                        alt={`Farm photo ${idx + 1}`}
                        style={{ width: "120px", height: "90px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border-color)" }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="empty-note"><T>No farm photos uploaded by this farmer.</T></p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowFarmerModal(false)}>
                <T>Close & Proceed with Selection</T>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContractModal;
