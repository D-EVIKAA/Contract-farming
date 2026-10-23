import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getActiveFarmers } from "../../services/userService";
import { createContract } from "../../services/contractService";
import { Search, Filter, ShoppingBag, Plus, MapPin, Calendar, CheckCircle2, ShieldCheck, User, Image as ImageIcon, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import UserProfileDrawer from "../../components/common/UserProfileDrawer";
import CreateContractModal from "../../components/CreateContractModal";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const CATEGORIES = ["All Categories", "Grains & Cereals", "Vegetables", "Fruits", "Pulses & Legumes", "Spices", "Oilseeds", "Organic Produce"];

const MOCK_CATEGORIES = ["Grains & Cereals", "Vegetables", "Fruits", "Pulses & Legumes", "Spices"];

const FarmMarketplace = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const [selectedFarmerForDrawer, setSelectedFarmerForDrawer] = useState(null);
  const [contractModalFarmer, setContractModalFarmer] = useState(null);

  useEffect(() => {
    getActiveFarmers()
      .then((data) => setFarmers(data || []))
      .catch(() => toast.error("Could not load marketplace farmers."))
      .finally(() => setLoading(false));
  }, []);

  // Transform farmers data into marketplace crop product listings
  const marketplaceListings = useMemo(() => {
    const listings = [];
    farmers.forEach((farmer) => {
      const cropsGrown = farmer.farmDetails?.cropsGrown;
      const farmPhotos = farmer.farmDetails?.farmPhotos || [];

      if (cropsGrown) {
        const cropsList = cropsGrown.split(",").map((c) => c.trim());
        cropsList.forEach((crop, idx) => {
          listings.push({
            id: `${farmer._id}-${idx}`,
            cropName: crop,
            category: MOCK_CATEGORIES[idx % MOCK_CATEGORIES.length],
            quantity: 500 + (idx * 250),
            unit: "kg",
            pricePerUnit: 40 + (idx * 15),
            location: farmer.farmDetails?.location || farmer.address || "Punjab, India",
            farmer: farmer,
            harvestDate: new Date(Date.now() + (idx + 1) * 15 * 86400000).toISOString().split("T")[0],
            photos: farmPhotos,
            soilType: farmer.farmDetails?.soilType || "Alluvial Soil",
            availability: "Available for Contract",
          });
        });
      }
    });
    return listings;
  }, [farmers]);

  const filteredListings = useMemo(() => {
    return marketplaceListings.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "All Categories" || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [marketplaceListings, searchQuery, selectedCategory]);

  const handleContractSubmit = async (payload) => {
    try {
      await createContract(payload);
      toast.success("Contract proposal sent to farmer successfully!");
      setContractModalFarmer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit contract request.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
          borderRadius: "16px",
          padding: "32px 28px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.3)",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
            <ShoppingBag size={14} /> <T>Direct Producer Marketplace</T>
          </div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "1.8rem", color: "#ffffff", fontWeight: 800 }}>
            <T>Agricultural Produce Marketplace</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.9, maxWidth: "560px" }}>
            <T>Browse verified farmer crops, view crop stages and farm photos, and request direct contract farming agreements.</T>
          </p>
        </div>

        {user.role === "buyer" && (
          <button
            type="button"
            onClick={() => setContractModalFarmer(farmers[0] || null)}
            className="btn"
            style={{ background: "#ffffff", color: "#064e3b", fontWeight: 700, padding: "12px 20px", borderRadius: "10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          >
            + <T>Create Direct Request</T>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div style={{ flex: 1, minWidth: "280px", display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 14px" }}>
          <Search size={18} style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search produce by crop name, farmer name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: "0.92rem", color: "#0f172a" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: selectedCategory === cat ? "#059669" : "#e2e8f0",
                background: selectedCategory === cat ? "#ecfdf5" : "#ffffff",
                color: selectedCategory === cat ? "#047857" : "#475569",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <T>{cat}</T>
            </button>
          ))}
        </div>
      </div>

      {/* Crop Listings Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No produce listings match your search"
          description="Try broadening your category filter or search keywords."
          actionLabel="Clear Search Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("All Categories");
          }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredListings.map((item) => {
            const hasPhotos = item.photos && item.photos.length > 0;
            const photoUrl = hasPhotos
              ? item.photos[0].startsWith("http")
                ? item.photos[0]
                : `${SERVER_URL}${item.photos[0]}`
              : null;

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.25s",
                }}
              >
                {/* Image header */}
                <div style={{ height: "160px", background: "#f1f5f9", position: "relative", overflow: "hidden" }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={item.cropName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" }}>
                      <ImageIcon size={40} opacity={0.5} />
                    </div>
                  )}

                  <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", color: "#ffffff", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                    <T>{item.category}</T>
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}><T>{item.cropName}</T></h3>
                      <div style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <MapPin size={14} /> <T>{item.location}</T>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>
                        ₹{item.pricePerUnit}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}> / {item.unit}</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.82rem" }}>
                    <div>
                      <span style={{ color: "#64748b" }}><T>Expected Quantity</T>:</span>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.quantity} {item.unit}</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}><T>Expected Harvest</T>:</span>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.harvestDate}</div>
                    </div>
                  </div>

                  {/* Farmer profile link bar */}
                  <div
                    onClick={() => setSelectedFarmerForDrawer(item.farmer)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                  >
                    <User size={18} style={{ color: "#059669" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#065f46" }}>{item.farmer.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                        {item.farmer.verificationStatus === "Verified" ? <>✓ <T>Verified Farmer</T></> : <T>Pending Verification</T>}
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: "#059669" }} />
                  </div>

                  {/* Actions */}
                  {user.role === "buyer" && (
                    <button
                      type="button"
                      onClick={() => setContractModalFarmer(item.farmer)}
                      className="btn btn-primary"
                      style={{ padding: "10px", fontSize: "0.88rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
                    >
                      <T>Propose Contract Request</T>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Drawer & Modal */}
      <UserProfileDrawer
        user={selectedFarmerForDrawer}
        isOpen={!!selectedFarmerForDrawer}
        onClose={() => setSelectedFarmerForDrawer(null)}
        onRequestContract={(f) => setContractModalFarmer(f)}
      />

      {contractModalFarmer && (
        <CreateContractModal
          initialFarmerId={contractModalFarmer._id}
          onClose={() => setContractModalFarmer(null)}
          onSubmit={handleContractSubmit}
        />
      )}
    </div>
  );
};

export default FarmMarketplace;
