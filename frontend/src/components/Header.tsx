import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setUserMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const closeUserMenu = () => {
    setUserMenuOpen(false);
  };

  // Close menu when clicking outside
  const handleUserMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <header className="header" onClick={closeUserMenu}>
        <div className="container">
          <Link to="/" className="logo">
            <h1>Seek</h1>
            <span className="tagline">Pipe Tobacco Price Comparison</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/search" className="nav-link">Search</Link>
            {isAdmin && (
              <Link to="/analytics" className="nav-link">Analytics</Link>
            )}
            
            {isAuthenticated ? (
              <div className="user-menu" onClick={handleUserMenuClick}>
                <button 
                  className="user-avatar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  aria-label="User menu"
                >
                  <span className="user-initials">{getUserInitials()}</span>
                  {isAdmin && <span className="admin-badge">A</span>}
                </button>
                
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="user-email">{user?.email}</div>
                      {!user?.emailVerified && (
                        <div className="email-unverified">
                          ⚠️ Email not verified
                        </div>
                      )}
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <div className="user-menu-items">
                      <button className="user-menu-item">
                        Profile Settings
                      </button>
                      {isAdmin && (
                        <Link to="/analytics" className="user-menu-item">
                          Analytics Dashboard
                        </Link>
                      )}
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <button 
                      className="user-menu-item logout"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="auth-button login"
                  onClick={() => handleAuthClick('login')}
                >
                  Sign In
                </button>
                <button 
                  className="auth-button register"
                  onClick={() => handleAuthClick('register')}
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}