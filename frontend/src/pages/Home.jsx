import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <h1>Farming agreements, written down and tracked — from sowing to payment.</h1>
          <p className="hero-subtitle">
            Buyers set out what they need. Farmers accept and grow it. Both sides watch the
            same contract move from pending to paid, with nothing left to a phone call.
          </p>
          {!user && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Register as a farmer
              </Link>
              <Link to="/register" className="btn btn-outline">
                Register as a buyer
              </Link>
            </div>
          )}
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="contract-preview">
            <div className="contract-preview-row">
              <span className="contract-preview-label">Crop</span>
              <span>Tomato</span>
            </div>
            <div className="contract-preview-row">
              <span className="contract-preview-label">Quantity</span>
              <span>100 kg</span>
            </div>
            <div className="contract-preview-row">
              <span className="contract-preview-label">Price</span>
              <span>₹30 / kg</span>
            </div>
            <div className="contract-preview-row">
              <span className="contract-preview-label">Delivery</span>
              <span>12 Oct 2026</span>
            </div>
            <div className="contract-preview-status">Pending</div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How a contract moves</h2>
        <div className="steps">
          <div className="step">
            <h3>Buyer creates a contract</h3>
            <p>Crop, quantity, price, delivery date and location — all in one place.</p>
          </div>
          <div className="step">
            <h3>Farmer accepts</h3>
            <p>Farmers browse open contracts and accept the ones that fit their land.</p>
          </div>
          <div className="step">
            <h3>Progress is tracked</h3>
            <p>The farmer logs updates as the crop grows, right up to delivery.</p>
          </div>
          <div className="step">
            <h3>Delivery &amp; payment</h3>
            <p>The buyer confirms delivery and marks the payment as settled.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
