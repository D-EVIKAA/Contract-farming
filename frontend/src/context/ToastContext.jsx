import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px", width: "calc(100% - 48px)" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "10px",
              background: t.type === "success" ? "#064e3b" : t.type === "error" ? "#7f1d1d" : "#0f172a",
              color: "#ffffff",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              fontSize: "0.92rem",
              fontWeight: 500,
              animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" style={{ color: "#34d399" }} />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" style={{ color: "#f87171" }} />}
            {t.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0" style={{ color: "#38bdf8" }} />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log("Toast success:", msg),
      error: (msg) => console.error("Toast error:", msg),
      info: (msg) => console.log("Toast info:", msg),
    };
  }
  return context;
};
