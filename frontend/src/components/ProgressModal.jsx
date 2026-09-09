import { useState } from "react";

const ProgressModal = ({ contract, onClose, onSubmit, submitting }) => {
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please enter a progress note.");
      return;
    }
    setError("");

    if (file) {
      const formData = new FormData();
      formData.append("note", note.trim());
      formData.append("image", file);
      await onSubmit(contract._id, formData);
    } else {
      await onSubmit(contract._id, note.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Add Progress Update</h2>
        <p className="auth-subtitle">
          Contract: <strong>{contract.cropName}</strong>
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Progress Note</span>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Seeds germinated, applied organic fertilizer"
              required
            />
          </label>

          <label className="field">
            <span>Progress Photo Evidence (Optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Progress"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressModal;
