import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleToPath = { farmer: "/farmer", buyer: "/buyer", admin: "/admin" };

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Contract Farming
      </Link>

      <nav className="navbar-links">
        {user ? (
          <>
            <Link to={roleToPath[user.role] || "/"}>Dashboard</Link>
            <span className="navbar-user">
              {user.name} · {user.role}
            </span>
            <button type="button" className="btn btn-outline" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
