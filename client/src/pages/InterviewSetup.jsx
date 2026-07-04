import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import API from '../utils/api';

export default function InterviewSetup() {
  const { updateCredits } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [mode, setMode] = useState('technical');
  const [interviewer, setInterviewer] = useState('female');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    setResumeFile(file);
    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await API.post('/interview/resume-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResumeData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse resume');
      setResumeFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartInterview = async () => {
    if (!role.trim()) {
      setError('Please enter a role');
      return;
    }

    setStarting(true);
    setError('');

    try {
      const { data } = await API.post('/interview/start', {
        role: role.trim(),
        experience: experience.trim(),
        mode,
        interviewer,
        resumeSkills: resumeData?.skills || [],
        resumeProjects: resumeData?.projects || [],
      });

      updateCredits(data.credits);
      navigate(`/interview/session/${data.interviewId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2"
      >
        {/* Left Panel */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Start Your AI <span className="text-gray-900">Interview</span>
          </h2>
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            Practice real interview scenarios powered by AI. Improve communication, technical skills, and confidence.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                ),
                text: 'Choose Role & Experience',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                ),
                text: 'Smart Voice Interview',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                  </svg>
                ),
                text: 'Performance Analytics',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 text-gray-700 text-sm font-medium"
              >
                <span className="text-emerald-600">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="p-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Interview Setup</h3>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Role */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Enter Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              id="setup-role"
            />
          </div>

          {/* Experience */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Experience (e.g. 2 years)"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              id="setup-experience"
            />
          </div>

          {/* Mode */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-white appearance-none cursor-pointer"
            id="setup-mode"
          >
            <option value="technical">Technical Interview</option>
            <option value="hr">HR Interview</option>
          </select>

          {/* Interviewer Preference */}
          <select
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-white appearance-none cursor-pointer"
            id="setup-interviewer"
          >
            <option value="female">Interviewer: Sarah (Female AI)</option>
            <option value="male">Interviewer: David (Male AI)</option>
          </select>

          {/* Resume Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-6 ${
              resumeData
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
            id="setup-resume-upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-emerald-500 text-2xl mb-2">📤</div>
            {analyzing ? (
              <>
                <p className="text-sm text-gray-700 font-medium">{resumeFile?.name}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                  Analyzing...
                </span>
              </>
            ) : resumeFile ? (
              <p className="text-sm text-gray-700 font-medium">{resumeFile.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to upload resume (Optional)</p>
            )}
          </div>

          {/* Resume Analysis Result */}
          {resumeData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6"
            >
              <h4 className="font-bold text-gray-900 text-sm mb-2">Resume Analysis Result</h4>
              {resumeData.projects?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Projects:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                    {resumeData.projects.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {resumeData.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills.map((s, i) => (
                      <span
                        key={i}
                        className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartInterview}
            disabled={starting}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors ${
              starting
                ? 'bg-gray-400 cursor-not-allowed'
                : resumeData
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-gray-800 hover:bg-gray-700'
            }`}
            id="setup-start-btn"
          >
            {starting ? 'Starting...' : 'Start Interview'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
