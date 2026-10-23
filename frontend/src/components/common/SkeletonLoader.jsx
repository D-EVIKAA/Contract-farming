export const SkeletonCard = () => (
  <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ height: "20px", width: "40%", background: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "24px", width: "25%", background: "#e2e8f0", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
    </div>
    <div style={{ height: "14px", width: "60%", background: "#f1f5f9", borderRadius: "4px" }} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
      <div style={{ height: "36px", background: "#f8fafc", borderRadius: "6px" }} />
      <div style={{ height: "36px", background: "#f8fafc", borderRadius: "6px" }} />
    </div>
    <div style={{ height: "32px", width: "100%", background: "#e2e8f0", borderRadius: "6px", marginTop: "6px" }} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div style={{ width: "100%", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
    <div style={{ padding: "16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "20px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: "16px", flex: 1, background: "#cbd5e1", borderRadius: "4px" }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "20px", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: "14px", flex: 1, background: "#e2e8f0", borderRadius: "4px" }} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStats = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "14px", width: "50%", background: "#e2e8f0", borderRadius: "4px" }} />
        <div style={{ height: "32px", width: "40%", background: "#cbd5e1", borderRadius: "6px" }} />
      </div>
    ))}
  </div>
);
