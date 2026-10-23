import api from "./api";

// Dynamically load Razorpay standard checkout script if not already on the page
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load official Razorpay checkout script from CDN.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create a payment order for a contract
export const createPaymentOrder = async (contractId) => {
  const { data } = await api.post("/payments/create-order", { contractId });
  return data;
};

// Verify payment signature on backend
export const verifyPayment = async (payload) => {
  const { data } = await api.post("/payments/verify", payload);
  return data;
};

// Report payment failure or dismissal
export const reportPaymentFailure = async (payload) => {
  const { data } = await api.post("/payments/failure", payload);
  return data;
};

// Get payment history (Buyer sees theirs, Farmer sees received, Admin sees all)
export const getPaymentHistory = async (params = {}) => {
  const { data } = await api.get("/payments/history", { params });
  return data.payments || [];
};

// Get payments for a specific contract
export const getContractPayments = async (contractId) => {
  const { data } = await api.get(`/payments/contract/${contractId}`);
  return data.payments || [];
};

// Get gateway configuration and active mode
export const getPaymentConfig = async () => {
  const { data } = await api.get("/payments/config");
  return data;
};
