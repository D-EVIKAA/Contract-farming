import { useState, useEffect } from "react";
import {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure,
  loadRazorpayScript,
} from "../services/paymentService";
import {
  CreditCard,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { T } from "./common/SpeakableWord";

const PaymentModal = ({ contract, onClose, onPaymentSuccess }) => {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentStep, setPaymentStep] = useState("preview"); // "preview" | "gateway" | "processing" | "success" | "failed"
  const [selectedMethod, setSelectedMethod] = useState("upi"); // upi, card, netbanking
  const [upiVpa, setUpiVpa] = useState("buyer@upi");
  const [errorMessage, setErrorMessage] = useState("");
  const [successDetails, setSuccessDetails] = useState(null);

  // Initialize payment order
  const handleInitiateOrder = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const order = await createPaymentOrder(contract._id);
      setOrderData(order);

      // If official Razorpay keys are configured and script is available, open official checkout
      if (!order.isSandbox && window.Razorpay) {
        openRazorpayCheckout(order);
      } else {
        // Sandbox checkout simulation or fallback
        setPaymentStep("gateway");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to create payment order.");
    } finally {
      setLoading(false);
    }
  };

  // Open official Razorpay Checkout interface
  const openRazorpayCheckout = (order) => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Using gateway checkout fallback.");
      setPaymentStep("gateway");
      return;
    }

    const options = {
      key: order.keyId,
      amount: order.amountInPaise,
      currency: order.currency || "INR",
      name: "AgriContract SaaS Platform",
      description: `Contract Payment - ${contract.cropName} (${contract.quantity} ${contract.unit})`,
      order_id: order.orderId,
      prefill: {
        name: order.buyer?.name || "",
        email: order.buyer?.email || "",
        contact: order.buyer?.phone || "",
      },
      notes: {
        contractId: contract._id,
        cropName: contract.cropName,
      },
      theme: {
        color: "#059669",
      },
      handler: async function (response) {
        setPaymentStep("processing");
        try {
          const verifyResult = await verifyPayment({
            contractId: contract._id,
            orderId: response.razorpay_order_id || order.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            paymentMethod: selectedMethod,
            vpa: upiVpa,
          });

          setSuccessDetails({
            paymentId: response.razorpay_payment_id,
            orderId: order.orderId,
            amount: order.amount,
            method: selectedMethod,
            date: new Date().toLocaleString("en-IN"),
          });
          setPaymentStep("success");
          toast.success("Payment verified and recorded successfully!");
          if (onPaymentSuccess) onPaymentSuccess(verifyResult.contract);
        } catch (vErr) {
          setErrorMessage(vErr.response?.data?.message || "Signature verification failed.");
          setPaymentStep("failed");
        }
      },
      modal: {
        ondismiss: async function () {
          await reportPaymentFailure({
            orderId: order.orderId,
            failureReason: "User dismissed Razorpay checkout modal.",
          });
          toast.info("Payment was cancelled or dismissed.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", async function (response) {
      setPaymentStep("failed");
      setErrorMessage(response.error?.description || "Payment failed at gateway.");
      await reportPaymentFailure({
        orderId: order.orderId,
        paymentId: response.error?.metadata?.payment_id,
        failureReason: response.error?.description || "Payment failed",
      });
    });

    rzp.open();
  };

  // Handle Sandbox / Direct Test Flow
  const handleCompleteSandboxPayment = async (statusToSimulate) => {
    if (!orderData) return;

    if (statusToSimulate === "failed") {
      setLoading(true);
      try {
        await reportPaymentFailure({
          orderId: orderData.orderId,
          failureReason: "User cancelled simulated payment in Sandbox Mode.",
        });
        setPaymentStep("failed");
        setErrorMessage("Payment was cancelled by user.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setPaymentStep("processing");
    setLoading(true);

    try {
      const mockPaymentId = `pay_sb_${Date.now()}`;
      const verifyResult = await verifyPayment({
        contractId: contract._id,
        orderId: orderData.orderId,
        paymentId: mockPaymentId,
        signature: "sandbox_sig_verified",
        paymentMethod: selectedMethod,
        vpa: selectedMethod === "upi" ? upiVpa : null,
      });

      setSuccessDetails({
        paymentId: mockPaymentId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        method: selectedMethod,
        date: new Date().toLocaleString("en-IN"),
      });
      setPaymentStep("success");
      toast.success("Payment verified and marked as Paid!");
      if (onPaymentSuccess) onPaymentSuccess(verifyResult.contract);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Payment verification failed.");
      setPaymentStep("failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
            color: "#ffffff",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CreditCard size={22} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                <T>Secure Payment Checkout</T>
              </h3>
              <span style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                <T>Contract</T> #{contract._id?.slice(-8)} · <T>{contract.cropName}</T>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecdd3",
                color: "#991b1b",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} />
              <span><T>{errorMessage}</T></span>
            </div>
          )}

          {/* STEP 1: PREVIEW ORDER */}
          {paymentStep === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Amount Card */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>
                    <T>Total Agreed Amount</T>
                  </span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#065f46" }}>
                    ₹{Number(contract.totalAmount || 0).toLocaleString("en-IN")}
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#15803d" }}>
                    {contract.quantity} <T>{contract.unit || "Quintals"}</T> @ ₹{contract.pricePerUnit}/<T>{contract.unit || "Quintal"}</T>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}><T>Beneficiary Farmer</T></span>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                    <T>{contract.farmer?.name || "Assigned Farmer"}</T>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    <T>{contract.farmer?.phone || "Verified Producer"}</T>
                  </div>
                </div>
              </div>

              {/* Supported Payment Channels */}
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                  <T>Available Payment Methods via Razorpay</T>
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    <Smartphone size={16} style={{ color: "#059669" }} />
                    <span><T>UPI (GPay / PhonePe / Paytm / QR)</T></span>
                  </div>
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    <CreditCard size={16} style={{ color: "#0284c7" }} />
                    <span><T>Cards & NetBanking</T></span>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.78rem",
                  color: "#475569",
                  lineHeight: 1.4,
                }}
              >
                <Lock size={16} style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong><T>Bank-Grade 256-bit Security</T>:</strong> <T>You will be redirected to the official Razorpay checkout page/app intent. Never enter your UPI PIN or bank OTP in this web application.</T>
                </span>
              </div>

              {/* Proceed Action */}
              <button
                type="button"
                onClick={handleInitiateOrder}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: "14px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? <T>Generating Secure Gateway Order...</T> : <><T>Proceed to Pay</T> ₹{Number(contract.totalAmount || 0).toLocaleString("en-IN")}</>}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: GATEWAY / SANDBOX CHECKOUT */}
          {paymentStep === "gateway" && orderData && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orderData.isSandbox && (
                <div
                  style={{
                    background: "#fefce8",
                    border: "1px solid #fef08a",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "0.85rem",
                    color: "#854d0e",
                  }}
                >
                  <strong>Gateway Sandbox Active:</strong> Simulating official Razorpay UPI/Card checkout.
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  <T>Choose Payment Method</T>
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("upi")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedMethod === "upi" ? "#059669" : "#e2e8f0"}`,
                      background: selectedMethod === "upi" ? "#ecfdf5" : "#ffffff",
                      color: selectedMethod === "upi" ? "#065f46" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <T>UPI Apps</T>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("card")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedMethod === "card" ? "#059669" : "#e2e8f0"}`,
                      background: selectedMethod === "card" ? "#ecfdf5" : "#ffffff",
                      color: selectedMethod === "card" ? "#065f46" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <T>Debit / Credit Card</T>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("netbanking")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedMethod === "netbanking" ? "#059669" : "#e2e8f0"}`,
                      background: selectedMethod === "netbanking" ? "#ecfdf5" : "#ffffff",
                      color: selectedMethod === "netbanking" ? "#065f46" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <T>NetBanking</T>
                  </button>
                </div>
              </div>

              {selectedMethod === "upi" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    <T>UPI Virtual Payment Address (VPA)</T>
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="yourname@okaxis or yourname@paytm"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.92rem",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px", display: "block" }}>
                    <T>On mobile, Razorpay redirects directly to Google Pay / PhonePe / Paytm UPI intent.</T>
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleCompleteSandboxPayment("failed")}
                  disabled={loading}
                  className="btn btn-outline-danger"
                  style={{ flex: 1, padding: "12px" }}
                >
                  <T>Cancel Payment</T>
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteSandboxPayment("success")}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: "12px", fontWeight: 700 }}
                >
                  {loading ? <T>Verifying...</T> : <><T>Authorize</T> ₹{Number(orderData.amount).toLocaleString("en-IN")}</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING SIGNATURE */}
          {paymentStep === "processing" && (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <RefreshCw size={40} className="animate-spin" style={{ color: "#059669", margin: "0 auto 16px auto" }} />
              <h4 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#0f172a" }}>
                <T>Verifying Payment Signature...</T>
              </h4>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                <T>Validating cryptographic gateway token and updating contract lifecycle.</T>
              </p>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {paymentStep === "success" && successDetails && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", color: "#0f172a", fontWeight: 800 }}>
                  <T>Payment Verified & Completed!</T>
                </h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#16a34a", fontWeight: 600 }}>
                  ₹{Number(successDetails.amount).toLocaleString("en-IN")} <T>transferred for</T> <T>{contract.cropName}</T>
                </p>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px",
                  textAlign: "left",
                  fontSize: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}><T>Transaction Ref</T>:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{successDetails.paymentId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}><T>Order ID</T>:</span>
                  <span style={{ color: "#475569" }}>{successDetails.orderId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}><T>Payment Method</T>:</span>
                  <span style={{ textTransform: "uppercase", fontWeight: 600, color: "#059669" }}>
                    <T>{successDetails.method}</T>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}><T>Timestamp</T>:</span>
                  <span style={{ color: "#475569" }}>{successDetails.date}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: "12px", width: "100%", fontWeight: 700 }}
              >
                <T>Close & Return to Dashboard</T>
              </button>
            </div>
          )}

          {/* STEP 5: FAILED */}
          {paymentStep === "failed" && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <AlertCircle size={36} />
              </div>

              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", color: "#991b1b", fontWeight: 700 }}>
                  <T>Payment Was Not Completed</T>
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  <T>{errorMessage || "The transaction was cancelled or could not be verified by the gateway."}</T>
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "10px" }}
                >
                  <T>Close</T>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStep("preview");
                    setErrorMessage("");
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "10px" }}
                >
                  <T>Retry Payment</T>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
