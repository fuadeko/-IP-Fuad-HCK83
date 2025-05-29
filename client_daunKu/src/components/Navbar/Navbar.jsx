import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { useState } from "react";
import "./navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/dashboard" className="navbar-brand">
            🌱 DaunKu
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            <Link
              to="/dashboard"
              className="navbar-link"
            >
              Dashboard
            </Link>
            <Link
              to="/plants"
              className="navbar-link"
            >
              My Plants
            </Link>
            <Link
              to="/add-plant"
              className="navbar-link"
            >
              Add Plant
            </Link>
            <Link
              to="/identify"
              className="navbar-link"
            >
              Identify Plant
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="navbar-user">
            <span className="navbar-welcome">
              Welcome, {user?.userName || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="navbar-logout"
            >
              Logout
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="mobile-menu-button"
              aria-label="Toggle mobile menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link
            to="/dashboard"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
          >
            Dashboard
          </Link>
          <Link
            to="/plants"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
          >
            My Plants
          </Link>
          <Link
            to="/add-plant"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
          >
            Add Plant
          </Link>
          <Link
            to="/identify"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
          >
            Identify Plant
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
