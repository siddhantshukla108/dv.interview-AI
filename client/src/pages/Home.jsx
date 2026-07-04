import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const steps = [
  {
    step: 'STEP 1',
    title: 'Role & Experience Selection',
    desc: 'AI adjusts difficulty based on selected job role.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    highlight: false,
  },
  {
    step: 'STEP 2',
    title: 'Smart Voice Interview',
    desc: 'Dynamic follow-up questions based on your answers.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    highlight: true,
  },
  {
    step: 'STEP 3',
    title: 'Timer Based Simulation',
    desc: 'Real interview pressure with time tracking.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    highlight: false,
  },
];

const capabilities = [
  {
    title: 'AI Answer Evaluation',
    desc: 'Scores communication, technical accuracy and confidence.',
    image: '/images/ai-evaluation.png',
  },
  {
    title: 'Resume Based Interview',
    desc: 'Project-specific questions based on uploaded resume.',
    image: '/images/resume-interview.png',
  },
  {
    title: 'Downloadable PDF Report',
    desc: 'Detailed strengths, weaknesses and improvement insights.',
    image: '/images/pdf-report.png',
  },
  {
    title: 'History & Analytics',
    desc: 'Track progress with performance graphs and topic analysis.',
    image: '/images/history-analytics.png',
  },
];

const modes = [
  {
    title: 'HR Interview Mode',
    desc: 'Behavioral and communication based evaluation.',
    icon: (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    ),
  },
  {
    title: 'Technical Mode',
    desc: 'Deep technical questioning based on selected role.',
    icon: (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      </div>
    ),
  },
  {
    title: 'Confidence Detection',
    desc: 'Basic tone and voice analysis insights.',
    icon: (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
    ),
  },
  {
    title: 'Credits System',
    desc: 'Unlock premium interview sessions easily.',
    icon: (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow-md">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>
    ),
  },
];

export default function Home() {
  const { user, setShowAuth } = useAuth();
  const navigate = useNavigate();

  const handleStartInterview = () => {
    if (user) {
      navigate('/interview');
    } else {
      setShowAuth(true);
    }
  };

  const handleViewHistory = () => {
    if (user) {
      navigate('/history');
    } else {
      setShowAuth(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-8 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium mb-6">
            <span className="text-emerald-400">✶</span>
            AI Powered Smart Interview Platform
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Practice Interviews with
            <br />
            <span className="text-emerald-500">AI Intelligence</span>
          </h1>

          <p className="text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Role-based mock interviews with smart follow-ups, adaptive difficulty and real-time performance evaluation.
          </p>

          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartInterview}
              className="bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              id="home-start-interview"
            >
              Start Interview
            </motion.button>
            <button
              onClick={handleViewHistory}
              className="text-gray-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-900/5 hover:text-gray-900 transition-all"
              id="home-view-history"
            >
              View History
            </button>
          </div>
        </motion.div>
      </section>

      {/* 3-Step Cards */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-white rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-shadow ${
                s.highlight ? 'border-2 border-emerald-200' : 'border border-gray-100'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                s.highlight
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-gray-50 text-emerald-600 border border-gray-200'
              }`}>
                {s.icon}
              </div>
              <p className="text-emerald-600 text-xs font-bold tracking-wider mb-1">{s.step}</p>
              <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Advanced AI Capabilities */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Advanced AI <span className="text-emerald-500">Capabilities</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 flex items-center gap-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <img src={cap.image} alt={cap.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h3 className="font-bold text-gray-900 text-lg">{cap.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm">{cap.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multiple Interview Modes */}
      <section className="py-16 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Multiple Interview <span className="text-emerald-500">Modes</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modes.map((mode, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{mode.title}</h3>
                  <p className="text-gray-500 text-sm">{mode.desc}</p>
                </div>
                <div className="flex-shrink-0 ml-4">{mode.icon}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
