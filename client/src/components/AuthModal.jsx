import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { auth, provider, signInWithPopup } from '../utils/firebase';
import API from '../utils/api';

export default function AuthModal() {
  const { login, setShowAuth } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const { data } = await API.post('/auth/google', { idToken });
      login(data.user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setShowAuth(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setShowAuth(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          id="auth-close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">dv.interview-AI</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Continue with</h2>
        <p className="text-center text-emerald-500 font-semibold text-lg mb-3">
          ✶ AI Smart Interview
        </p>
        <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
          Sign in to start AI-powered mock interviews, track your progress, and unlock detailed performance insights.
        </p>

        {/* Google Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
          id="auth-google-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
