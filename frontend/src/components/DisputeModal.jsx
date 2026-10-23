import { useState } from "react";
import { T } from "./common/SpeakableWord";

const DisputeModal = ({ contract, onClose, onSubmit, submitting }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a dispute title.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the dispute issue.");
      return;
    }
    setError("");
    await onSubmit({
      contractId: contract._id,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2><T>Raise Dispute</T></h2>
        <p className="auth-subtitle">
          <T>Contract</T>: <strong><T>{contract.cropName}</T></strong> ({contract._id})
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span><T>Dispute Title</T></span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quality disagreement or delivery delay"
              required
            />
          </label>

          <label className="field">
            <span><T>Description</T></span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details about the issue..."
              required
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              <T>Cancel</T>
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? <T>Submitting...</T> : <T>Submit Dispute</T>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
