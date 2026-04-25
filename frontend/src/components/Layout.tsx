import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const navLinks = [
  { href: '/search', text: 'Search' },
  { href: '/dashboard', text: 'Dashboard' },
  { href: '/upload-data', text: 'Upload Data' }, // Add link for data upload
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth(); // Get user, logout, isLoading

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <div className="nav-inner">
          <Link className="brand" to="/dashboard">
            Retail Intelligence Platform
          </Link>
          <nav className="nav-links" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.href);
              return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.text}
                  </Link>
              );
            })}
          </nav>
          <div className="nav-user">
              {isLoading ? (
                 <span>Loading user...</span>
              ) : user ? (
                <>
                  <span>Welcome, {user}</span>
                  <button
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    Logout
                  </button>

                </>
              ) : (
                 <Link to="/login" className="logout-button">
                   Login
                 </Link>
              )}
          </div>
        </div>
      </header>

      <main>
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout; 
