import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, logout, showAuth, setShowAuth } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" id="nav-logo">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">dv.interview-AI</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Credits */}
                <Link to="/pricing" className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors" id="nav-credits">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {user.credits}
                </Link>

                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                    id="nav-avatar"
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-emerald-600">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { navigate('/history'); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          id="nav-history-link"
                        >
                          Interview History
                        </button>
                        <button
                          onClick={() => { logout(); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                          id="nav-logout"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                id="nav-login"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && <AuthModal />}
      </AnimatePresence>
    </>
  );
}
