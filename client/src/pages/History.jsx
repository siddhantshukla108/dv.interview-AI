import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../utils/api';
import { AuthContext } from '../App';

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get('/interview/history');
        setInterviews(data.interviews);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900 transition-colors"
            id="history-back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Interview History</h1>
        </div>

        {/* User Badges Banner */}
        {user?.badges && user.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 mb-8 flex items-center gap-6 overflow-x-auto"
          >
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Your Achievements</h2>
              <div className="flex items-center gap-6 mt-3">
                {user.badges.map((badge, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200 border border-yellow-300 w-14 h-14 rounded-full shadow-sm mb-2" title={badge}>
                      <span className="text-2xl">🏆</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {interviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-500 mb-4">No interviews yet. Start your first one!</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/interview')}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              Start Interview
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview, i) => (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/dashboard/${interview._id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
                id={`history-item-${i}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{interview.role}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="capitalize">{interview.mode} Interview</span>
                      <span>•</span>
                      <span>{interview.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-500">{interview.averageScore}/10</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        interview.status === 'complete'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {interview.status === 'complete' ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
