import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import NotificationDrawer from "../common/NotificationDrawer";
import GlobalSearchModal from "../common/GlobalSearchModal";
import UserProfileDrawer from "../common/UserProfileDrawer";
import CreateContractModal from "../CreateContractModal";
import { useAuth } from "../../context/AuthContext";
import { getContracts, createContract } from "../../services/contractService";
import { getActiveFarmers } from "../../services/userService";
import { getDisputes } from "../../services/disputeService";
import { useToast } from "../../context/ToastContext";
import { Sprout } from "lucide-react";
import { LanguageSelector, T } from "../common/SpeakableWord";

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // User Profile Drawer state
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState(null);

  // Global search data states
  const [contracts, setContracts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    if (user) {
      Promise.all([
        getContracts().catch(() => []),
        getActiveFarmers().catch(() => []),
        getDisputes().catch(() => []),
      ]).then(([cData, fData, dData]) => {
        setContracts(cData || []);
        setFarmers(fData || []);
        setDisputes(dData || []);
      });
    }
  }, [user]);

  // Global Keybindings (Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateContractSubmit = async (payload) => {
    try {
      await createContract(payload);
      toast.success("Contract created and assigned to farmer successfully!");
      setIsCreateContractOpen(false);
      // Reload contracts
      const freshContracts = await getContracts();
      setContracts(freshContracts || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create contract.");
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", display: "flex", flexDirection: "column" }}>
        {/* Public Header Navbar */}
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sprout size={22} style={{ color: "#ffffff" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a", letterSpacing: "-0.02em" }}>
              <T>AgriContract</T>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <LanguageSelector />
            <Link to="/login" style={{ color: "#475569", fontWeight: 600, textDecoration: "none", fontSize: "0.92rem" }}>
              <T>Log in</T>
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.92rem" }}>
              <T>Sign up</T>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopHeader
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenQuickAction={() => setIsCreateContractOpen(true)}
        />

        <main style={{ flex: 1, padding: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>

      {/* Slide-out Drawers and Overlays */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        user={user}
        contracts={contracts}
        farmers={farmers}
        disputes={disputes}
        onSelectUser={(u) => setSelectedUserForDrawer(u)}
      />

      <UserProfileDrawer
        user={selectedUserForDrawer}
        isOpen={!!selectedUserForDrawer}
        onClose={() => setSelectedUserForDrawer(null)}
        contracts={contracts}
        onRequestContract={() => {
          setIsCreateContractOpen(true);
        }}
      />

      {isCreateContractOpen && (
        <CreateContractModal
          onClose={() => setIsCreateContractOpen(false)}
          onSubmit={handleCreateContractSubmit}
        />
      )}
    </div>
  );
};

export default AppLayout;
