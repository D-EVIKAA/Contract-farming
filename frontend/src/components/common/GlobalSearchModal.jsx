import { useState, useMemo } from "react";
import { Search, X, FileText, User, ShoppingBag, ShieldAlert, ArrowRight } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { T } from "./SpeakableWord";

const GlobalSearchModal = ({ isOpen, onClose, user, contracts = [], farmers = [], disputes = [], marketplaceItems = [], onSelectContract, onSelectUser }) => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { contracts: [], users: [], disputes: [], marketplace: [] };

    const matchingContracts = contracts.filter(
      (c) =>
        c.cropName?.toLowerCase().includes(q) ||
        c._id?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.farmer?.name?.toLowerCase().includes(q) ||
        c.buyer?.name?.toLowerCase().includes(q)
    );

    const matchingUsers = farmers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.farmDetails?.cropsGrown?.toLowerCase().includes(q) ||
        u.address?.toLowerCase().includes(q)
    );

    const matchingDisputes = disputes.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.contract?.cropName?.toLowerCase().includes(q)
    );

    const matchingMarketplace = marketplaceItems.filter(
      (m) =>
        m.cropName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        m.farmerName?.toLowerCase().includes(q)
    );

    return {
      contracts: matchingContracts.slice(0, 4),
      users: matchingUsers.slice(0, 4),
      disputes: matchingDisputes.slice(0, 4),
      marketplace: matchingMarketplace.slice(0, 4),
    };
  }, [query, contracts, farmers, disputes, marketplaceItems]);

  if (!isOpen) return null;

  const totalResults =
    results.contracts.length +
    results.users.length +
    results.disputes.length +
    results.marketplace.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "80px", paddingLeft: "16px", paddingRight: "16px" }}>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "680px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          zIndex: 10000,
        }}
      >
        {/* Search Header Bar */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0" }}>
          <Search size={22} style={{ color: "#059669" }} />
          <input
            type="text"
            placeholder="Search contracts, farmers, buyers, crop marketplace, disputes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "1.1rem",
              color: "#0f172a",
              background: "transparent",
            }}
          />
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "16px 20px" }}>
          {!query.trim() ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              <p style={{ margin: 0, fontSize: "0.95rem" }}><T>Type keyword to search across the entire contract farming network...</T></p>
            </div>
          ) : totalResults === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              <p style={{ margin: 0, fontSize: "0.95rem" }}><T>No matching results found for</T> "{query}".</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Contracts */}
              {results.contracts.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={14} /> <T>Contracts</T> ({results.contracts.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {results.contracts.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => {
                          onClose();
                          if (onSelectContract) onSelectContract(c);
                        }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.92rem" }}><T>{c.cropName}</T></div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            <T>Farmer</T>: {c.farmer?.name || "N/A"} · <T>Buyer</T>: {c.buyer?.name || "N/A"} · ₹{(c.totalAmount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <StatusBadge status={c.status} size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={14} /> <T>Farmers & Profiles</T> ({results.users.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {results.users.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          onClose();
                          if (onSelectUser) onSelectUser(u);
                        }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.92rem" }}>{u.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {u.email} · {u.farmDetails?.cropsGrown ? <><T>Crops</T>: {u.farmDetails.cropsGrown}</> : u.address || "Location set"}
                          </div>
                        </div>
                        <StatusBadge status={u.verificationStatus || "Pending"} size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketplace Items */}
              {results.marketplace.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShoppingBag size={14} /> <T>Farm Marketplace</T> ({results.marketplace.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {results.marketplace.map((m) => (
                      <div
                        key={m.id}
                        onClick={onClose}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#065f46", fontSize: "0.92rem" }}><T>{m.cropName}</T> (<T>{m.category}</T>)</div>
                          <div style={{ fontSize: "0.8rem", color: "#047857" }}>
                            <T>Farmer</T>: {m.farmerName} · {m.quantity} {m.unit} @ ₹{m.pricePerUnit}/{m.unit}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669" }}><T>Request Contract</T></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disputes */}
              {results.disputes.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={14} /> <T>Disputes</T> ({results.disputes.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {results.disputes.map((d) => (
                      <div
                        key={d._id}
                        onClick={onClose}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#fef2f2",
                          border: "1px solid #fecdd3",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#9f1239", fontSize: "0.92rem" }}><T>{d.title}</T></div>
                          <div style={{ fontSize: "0.8rem", color: "#881337" }}><T>{d.description}</T></div>
                        </div>
                        <StatusBadge status={d.status} size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
