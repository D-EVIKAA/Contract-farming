import { useState, useEffect } from "react";
import { getActiveFarmers } from "../services/userService";

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

const CreateContractModal = ({ onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initialFormState);
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFarmers = async () => {
      try {
        const data = await getActiveFarmers();
        setFarmers(data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load farmers list.");
      } finally {
        setLoadingFarmers(false);
      }
    };
    loadFarmers();
  }, []);

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
        <h2>Create New Contract</h2>
        <p className="auth-subtitle">
          Select an active farmer to assign this contract directly in <strong>Pending</strong> status.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Select Farmer (Required)</span>
            {loadingFarmers ? (
              <div className="loading-inline">Loading available farmers...</div>
            ) : farmers.length === 0 ? (
              <p className="form-warning">No active farmers available at the moment.</p>
            ) : (
              <select name="farmerId" value={form.farmerId} onChange={handleChange} required>
                <option value="">-- Choose an active farmer --</option>
                {farmers.map((farmer) => (
                  <option key={farmer._id} value={farmer._id}>
                    {farmer.name} ({farmer.phone || farmer.email}) {farmer.farmDetails?.farmSize ? `· ${farmer.farmDetails.farmSize}` : ""}
                  </option>
                ))}
              </select>
            )}
          </label>

          {selectedFarmer && (
            <div className="selected-farmer-card">
              <h4>Selected Farmer Details:</h4>
              <p><strong>Name:</strong> {selectedFarmer.name}</p>
              <p><strong>Email:</strong> {selectedFarmer.email} | <strong>Phone:</strong> {selectedFarmer.phone || "N/A"}</p>
              <p><strong>Address:</strong> {selectedFarmer.address || "N/A"}</p>
              {selectedFarmer.farmDetails?.cropsGrown && (
                <p><strong>Crops Grown:</strong> {selectedFarmer.farmDetails.cropsGrown}</p>
              )}
            </div>
          )}

          <div className="field-row">
            <label className="field">
              <span>Crop name</span>
              <input type="text" name="cropName" value={form.cropName} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Unit</span>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Quantity</span>
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
              <span>Price per unit (₹)</span>
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
              <span>Expected delivery date</span>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={form.expectedDeliveryDate}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input type="text" name="location" value={form.location} onChange={handleChange} required />
            </label>
          </div>

          <label className="field">
            <span>Additional requirements (optional)</span>
            <textarea
              rows={3}
              name="additionalRequirements"
              value={form.additionalRequirements}
              onChange={handleChange}
              placeholder="e.g. Grade A quality, packed in 20kg crates"
            />
          </label>

          <div className="total-preview">
            <span className="label">Total amount</span>
            <span className="total-preview-value">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingFarmers || farmers.length === 0}>
              {submitting ? "Creating..." : "Create contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContractModal;
