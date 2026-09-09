import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setForm({ ...form, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Shape the payload to exactly match authController.registerUser's
    // expected body: { name, email, password, role, phone, address,
    // farmDetails (farmer only), businessName (buyer only) }
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone,
      address: form.address,
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
      navigate(roleToPath[newUser.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p className="auth-subtitle">
          Register as a farmer to supply crops, or a buyer to source them.
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="role-toggle">
          <button
            type="button"
            className={`role-option ${form.role === "farmer" ? "role-option-active" : ""}`}
            onClick={() => handleRoleSelect("farmer")}
          >
            Farmer
          </button>
          <button
            type="button"
            className={`role-option ${form.role === "buyer" ? "role-option-active" : ""}`}
            onClick={() => handleRoleSelect("buyer")}
          >
            Buyer
          </button>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Full name</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
        </div>

        <label className="field">
          <span>Address</span>
          <input type="text" name="address" value={form.address} onChange={handleChange} />
        </label>

        {form.role === "farmer" ? (
          <div className="field-row">
            <label className="field">
              <span>Farm size</span>
              <input
                type="text"
                name="farmSize"
                value={form.farmSize}
                onChange={handleChange}
                placeholder="e.g. 2 acres"
              />
            </label>
            <label className="field">
              <span>Soil type</span>
              <input
                type="text"
                name="soilType"
                value={form.soilType}
                onChange={handleChange}
                placeholder="e.g. Loamy"
              />
            </label>
            <label className="field">
              <span>Crops grown</span>
              <input
                type="text"
                name="cropsGrown"
                value={form.cropsGrown}
                onChange={handleChange}
                placeholder="e.g. Tomato, Onion"
              />
            </label>
          </div>
        ) : (
          <label className="field">
            <span>Business name</span>
            <input
              type="text"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="e.g. Fresh Foods Pvt Ltd"
            />
          </label>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
