import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../utils/api';
import { AuthContext } from '../App';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useContext(AuthContext);
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  useEffect(() => {
    if (location.state?.newBadges && location.state.newBadges.length > 0) {
      setEarnedBadges(location.state.newBadges);
      setShowBadgeModal(true);
      navigate(location.pathname, { replace: true, state: {} }); // Properly clear React Router state
      checkAuth(); // Refresh user profile to update the badges array in context!
    }
  }, [location.state, checkAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/interview/${id}`);
        setInterview(data.interview);
      } catch (err) {
        console.error('Failed to load interview:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const generatePDF = () => {
    if (!interview) return;

    const doc = new jsPDF();

    // 1. Header Banner
    doc.setFillColor(17, 24, 39); // Slate Grey
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('dv.interview-AI', 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('AI Smart Performance Evaluation Report', 15, 27);

    // 2. Grid - Two Columns Layout
    // Left Column - Candidate Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('CANDIDATE DETAILS', 15, 48);

    doc.setDrawColor(229, 231, 235);
    doc.line(15, 51, 110, 51);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(`Role: ${interview.role}`, 15, 57);
    doc.text(`Mode: ${interview.mode === 'technical' ? 'Technical Interview' : 'HR/Behavioral Interview'}`, 15, 63);
    doc.text(`Date: ${new Date(interview.createdAt).toLocaleDateString()}`, 15, 69);
    doc.text(`Status: ${interview.status.toUpperCase()}`, 15, 75);

    // Right Column - Overall Performance Card
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(130, 44, 65, 33, 4, 4, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('OVERALL SCORE', 136, 52);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.text(`${avgScore} / 10`, 136, 64);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(perfLabel.substring(0, 32) + (perfLabel.length > 32 ? '..' : ''), 136, 71);

    // 3. Horizontal Visual Progress Bars (Dimension Scores)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('DIMENSION EVALUATION', 15, 88);
    doc.line(15, 91, 195, 91);

    const metricsList = [
      { name: 'Correctness (Accuracy)', score: parseFloat(avgCorr), color: [59, 130, 246] }, // blue
      { name: 'Communication (Clarity)', score: parseFloat(avgComm), color: [168, 85, 247] }, // purple
      { name: 'Confidence (Delivery)', score: parseFloat(avgConf), color: [249, 115, 22] }, // orange
    ];

    metricsList.forEach((m, idx) => {
      const yPos = 98 + (idx * 13);
      
      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.text(m.name, 15, yPos);

      // Bar Track
      doc.setFillColor(243, 244, 246);
      doc.rect(15, yPos + 2, 155, 3.5, 'F');

      // Bar Fill
      doc.setFillColor(m.color[0], m.color[1], m.color[2]);
      doc.rect(15, yPos + 2, (m.score / 10) * 155, 3.5, 'F');

      // Score Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(`${m.score} / 10`, 178, yPos + 5);
    });

    // 4. Questions & Detailed Analysis Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('DETAILED QUESTIONS & AI EVALUATION', 15, 142);
    doc.line(15, 145, 195, 145);

    const tableData = interview.questions.map((q, i) => [
      `Q${i + 1}: ${q.text}`,
      q.answerText || 'Skipped / No answer',
      `${q.feedback || 'No feedback'}\n\n[Score: ${((q.scores.correctness + q.scores.communication + q.scores.confidence) / 3).toFixed(1)}/10]`
    ]);

    autoTable(doc, {
      startY: 149,
      head: [['Question', 'Your Answer', 'AI Feedback & Score']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [17, 24, 39], fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: { 
        0: { cellWidth: 65 }, 
        1: { cellWidth: 55 }, 
        2: { cellWidth: 60 } 
      },
      didDrawPage: (data) => {
        // Footer (Page Numbers)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text("dv.interview-AI — AI Smart Interview Assessment", 15, 287);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, 185, 287);
      }
    });

    // 5. Custom Learning Paths (Study Guide)
    if (interview.studyGuide && interview.studyGuide.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 160;
      let startY = finalY + 15;
      
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text('CUSTOM LEARNING PATHS (STUDY GUIDE)', 15, startY);
      doc.line(15, startY + 3, 195, startY + 3);
      
      startY += 10;
      interview.studyGuide.forEach(item => {
        if (startY > 270) {
          doc.addPage();
          startY = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`• ${item.topic}`, 15, startY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99); // gray-600
        const splitDesc = doc.splitTextToSize(item.description, 175);
        doc.text(splitDesc, 20, startY + 5);
        
        startY += (splitDesc.length * 4) + 6;
      });
    }

    doc.save(`dv_interview_AI_Report_${interview.role.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Interview not found.</p>
      </div>
    );
  }

  const questions = interview.questions;
  const avgScore = interview.averageScore;

  const avgCorr = (questions.reduce((s, q) => s + q.scores.correctness, 0) / questions.length).toFixed(1);
  const avgComm = (questions.reduce((s, q) => s + q.scores.communication, 0) / questions.length).toFixed(1);
  const avgConf = (questions.reduce((s, q) => s + q.scores.confidence, 0) / questions.length).toFixed(1);

  // Chart data
  const chartData = questions.map((q, i) => ({
    name: `Q${i + 1}`,
    score: ((q.scores.correctness + q.scores.communication + q.scores.confidence) / 3).toFixed(1),
  }));

  // Performance label
  let perfLabel = '';
  if (avgScore >= 8) perfLabel = 'Excellent performance!';
  else if (avgScore >= 6) perfLabel = 'Good performance. Keep improving.';
  else if (avgScore >= 4) perfLabel = 'Average performance. Room for improvement.';
  else perfLabel = 'Significant improvement required.';

  let perfSub = '';
  if (avgScore >= 6) perfSub = 'Strong technical and communication skills.';
  else perfSub = 'Work on clarity and confidence.';

  // Donut chart
  const donutPercent = (avgScore / 10) * 100;
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const radarData = [
    { subject: 'Correctness', value: parseFloat(avgCorr) },
    { subject: 'Communication', value: parseFloat(avgComm) },
    { subject: 'Confidence', value: parseFloat(avgConf) },
  ];

  const barChartData = questions.map((q, i) => ({
    name: `Q${i + 1}`,
    Correctness: q.scores.correctness,
    Communication: q.scores.communication,
    Confidence: q.scores.confidence,
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/history')}
              className="text-gray-500 hover:text-gray-900 transition-colors"
              id="dashboard-back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">AI-powered performance insights</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePDF}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
            id="dashboard-download-pdf"
          >
            Download PDF
          </motion.button>
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

        {/* First Visuals Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Interview Role</p>
              <h4 className="text-base font-bold text-gray-900 truncate max-w-[150px]">{interview.role}</h4>
              <p className="text-xs text-gray-500 capitalize">{interview.mode} Mode</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Correctness</p>
              <h4 className="text-lg font-bold text-gray-900">{avgCorr} / 10</h4>
              <p className="text-xs text-gray-500">Average accuracy</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Communication</p>
              <h4 className="text-lg font-bold text-gray-900">{avgComm} / 10</h4>
              <p className="text-xs text-gray-500">Grammar & flow</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Confidence</p>
              <h4 className="text-lg font-bold text-gray-900">{avgConf} / 10</h4>
              <p className="text-xs text-gray-500">Pacing & assurance</p>
            </div>
          </div>
        </div>

        {/* First Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Performance Ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center lg:col-span-1"
          >
            <p className="text-sm font-semibold text-gray-700 mb-6">Overall Assessment</p>
            <div className="relative w-36 h-36 mb-6">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={donutRadius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="70" cy="70" r={donutRadius} fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutCircumference * (1 - donutPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-emerald-500">{avgScore}</span>
                <span className="text-xs text-gray-400 font-medium">Out of 10</span>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{perfLabel}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{perfSub}</p>
          </motion.div>

          {/* Performance Radar Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center lg:col-span-1"
          >
            <p className="text-sm font-semibold text-gray-700 mb-2 w-full text-left">Dimension Strengths</p>
            <div className="w-full flex-grow flex items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                  <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Performance Trend Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1"
          >
            <p className="text-sm font-semibold text-gray-700 mb-4">Question Score Trend</p>
            <div className="min-h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }} />
                  <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#colorScore)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Second Visuals Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Detailed Question Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2"
          >
            <p className="text-sm font-semibold text-gray-700 mb-4">Metric Score per Question</p>
            <div className="min-h-[260px]">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barChartData} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Correctness" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="Communication" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="Confidence" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skill Bars list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1"
          >
            <p className="text-sm font-semibold text-gray-700 mb-5">Skill Evaluation Bars</p>
            <div className="space-y-6 pt-2">
              {[
                { label: 'Correctness (Accuracy)', value: avgCorr, color: 'bg-blue-500' },
                { label: 'Communication (Clarity)', value: avgComm, color: 'bg-purple-500' },
                { label: 'Confidence (Delivery)', value: avgConf, color: 'bg-orange-500' },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600 font-medium">{skill.label}</span>
                    <span className="text-sm font-bold text-gray-900">{skill.value} / 10</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.value / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full ${skill.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Question Breakdown Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
        >
          <p className="text-sm font-semibold text-gray-700 mb-6">Detailed Questions & AI Analysis</p>
          <div className="space-y-6">
            {questions.map((q, i) => {
              const qScore = ((q.scores.correctness + q.scores.communication + q.scores.confidence) / 3).toFixed(1);
              return (
                <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mr-2">Q{i + 1}</span>
                      <span className="text-xs text-gray-400 capitalize">{q.difficulty} Difficulty</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">{qScore} / 10 Avg</span>
                  </div>
                  <p className="text-sm text-gray-900 font-semibold mb-3 leading-relaxed">{q.text}</p>
                  
                  {/* Answers & Feedback Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Answer */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Your Answer</p>
                      <p className="text-xs text-gray-700 italic leading-relaxed">
                        {q.answerText ? `"${q.answerText}"` : 'No answer provided. This question was skipped.'}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    {q.feedback && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">AI Evaluation & Improvement</p>
                        <p className="text-xs text-emerald-800 leading-relaxed">{q.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      
      {/* Custom Learning Paths (Study Guide) */}
      {interview.studyGuide && interview.studyGuide.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 shadow-md mb-8 text-white"
        >
          <div className="flex items-center gap-3 mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <h2 className="text-2xl font-bold">Personalized Study Guide</h2>
          </div>
          <p className="text-emerald-50 mb-6 max-w-3xl">Based on your interview performance, our AI has identified these key areas for you to focus your studies on before your real interview.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interview.studyGuide.map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-2">{item.topic}</h3>
                <p className="text-emerald-50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      </div>

      {/* New Badge Modal overlay */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">New Badges Unlocked!</h2>
            <p className="text-gray-500 mb-8">You performed exceptionally well and earned some new achievements.</p>
            
            <div className="flex justify-center gap-4 mb-8">
              {earnedBadges.map((badge, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-gradient-to-br from-amber-300 to-yellow-500 w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2 text-3xl">
                    🏆
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{badge}</span>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setShowBadgeModal(false)}
              className="w-full bg-gray-900 text-white font-bold rounded-xl py-3 hover:bg-gray-800 transition-colors"
            >
              Awesome!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
