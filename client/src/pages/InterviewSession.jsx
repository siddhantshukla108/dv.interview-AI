import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../utils/api';
import { speak, stopSpeaking, createRecognition, isSpeechRecognitionSupported } from '../utils/speech';

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const prevIndexRef = useRef(-1);
  const submitRef = useRef(null);

  // Play/Pause AI Interviewer video based on speech state
  useEffect(() => {
    if (videoRef.current) {
      if (aiSpeaking) {
        videoRef.current.play().catch((err) => console.log('Video play error:', err));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0; // Freeze on first frame when quiet
      }
    }
  }, [aiSpeaking]);

  // Load interview data
  useEffect(() => {
    const loadInterview = async () => {
      try {
        const { data } = await API.get(`/interview/${id}`);
        setInterview(data.interview);

        // Find first unanswered question
        const firstUnanswered = data.interview.questions.findIndex(
          (q) => !q.answerText || q.answerText.trim() === ''
        );
        setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      } catch (err) {
        console.error('Failed to load interview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInterview();

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Speak question when index changes
  useEffect(() => {
    if (!interview) return;
    if (prevIndexRef.current === currentIndex) return; // Prevent re-trigger on interview answer update
    prevIndexRef.current = currentIndex;

    const question = interview.questions[currentIndex];
    if (!question) return;

    setFeedback(null);
    setAnswer('');
    setTimer(60);

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (submitRef.current) submitRef.current(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Speak the question
    const speakQuestion = async () => {
      setAiSpeaking(true);
      await speak(question.text);
      setAiSpeaking(false);
    };
    speakQuestion();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, interview]);

  // Toggle voice recording
  const toggleListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return;

    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
    } else {
      const recognition = createRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      let fullTranscript = answer;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setAnswer(fullTranscript + interimTranscript);
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognition.start();
      setListening(true);
    }
  }, [listening, answer]);

  // Keep submit function in ref for auto-submit from interval
  useEffect(() => {
    submitRef.current = () => handleSubmitAnswer(false);
  });

  // Submit answer
  const handleSubmitAnswer = async (isSkip = false) => {
    if (submitting) return;
    setSubmitting(true);
    stopSpeaking();

    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setListening(false);
    }

    const finalAnswer = isSkip === true ? '' : answer.trim();

    try {
      const { data } = await API.post('/interview/answer', {
        interviewId: id,
        questionIndex: currentIndex,
        answerText: finalAnswer,
      });

      setFeedback(data);

      // Update local interview state
      setInterview((prev) => {
        const updated = { ...prev };
        updated.questions = [...prev.questions];
        updated.questions[currentIndex] = {
          ...updated.questions[currentIndex],
          answerText: answer.trim(),
          feedback: data.feedback,
          scores: data.scores,
        };
        return updated;
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Next question or complete
  const handleNext = async () => {
    if (currentIndex < interview.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete interview
      setCompleting(true);
      try {
        await API.post(`/interview/complete/${id}`);
        navigate(`/dashboard/${id}`);
      } catch (err) {
        console.error('Failed to complete interview:', err);
      } finally {
        setCompleting(false);
      }
    }
  };

  // Early exit
  const handleEarlyExit = async () => {
    try {
      await API.post(`/interview/complete/${id}`);
    } catch {}
    navigate(`/dashboard/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
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

  const question = interview.questions[currentIndex];
  const totalQuestions = interview.questions.length;
  const timerPercent = (timer / 60) * 100;

  const videoSrc = interview.interviewer === 'male'
    ? '/images/Videos/male-ai.mp4'
    : '/images/Videos/female-ai.mp4';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Panel — AI Interviewer */}
        <div className="md:col-span-2 space-y-4">
          {/* Avatar */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-52 bg-black flex items-center justify-center relative overflow-hidden">
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
              />
              {aiSpeaking && (
                <div className="absolute bottom-2 right-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
              )}
            </div>
            {aiSpeaking && (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">{question?.text}</p>
              </div>
            )}
          </div>

          {/* Interview Status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Interview Status</p>
              {aiSpeaking && (
                <span className="text-xs font-semibold text-emerald-500">AI Speaking</span>
              )}
            </div>

            {/* Timer Circle */}
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="35" fill="none"
                    stroke={timer > 10 ? '#10b981' : '#ef4444'}
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - timerPercent / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${timer > 10 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {timer}s
                </span>
              </div>
            </div>

            {/* Question Counter */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</p>
                <p className="text-xs text-gray-500">Current Question</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{totalQuestions}</p>
                <p className="text-xs text-gray-500">Total Questions</p>
              </div>
            </div>
          </div>

          {/* Early Exit */}
          <button
            onClick={handleEarlyExit}
            className="w-full text-center text-sm text-gray-400 hover:text-red-500 transition-colors py-2"
            id="session-early-exit"
          >
            End Interview Early
          </button>
        </div>

        {/* Right Panel — Q&A */}
        <div className="md:col-span-3 space-y-4">
          <h2 className="text-xl font-bold text-emerald-500" id="session-title">AI Smart Interview</h2>

          {/* Question */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Question {currentIndex + 1} of {totalQuestions}</p>
            <p className="text-gray-900 font-medium leading-relaxed">{question?.text}</p>
          </div>

          {/* Answer Area */}
          <div className={`rounded-2xl border-2 transition-colors ${feedback ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={!!feedback}
              className="w-full p-5 min-h-[200px] text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder-gray-400"
              id="session-answer"
            />
          </div>

          {/* Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 rounded-xl p-4 border border-green-200"
            >
              <p className="text-sm text-gray-700">{feedback.feedback}</p>
              <div className="flex gap-4 mt-3">
                {['correctness', 'communication', 'confidence'].map((key) => (
                  <div key={key} className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{feedback.scores[key]}</p>
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Mic Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              disabled={!!feedback}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              id="session-mic"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </motion.button>

            {/* Submit / Next */}
            {feedback ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={completing}
                className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                id="session-next"
              >
                {completing
                  ? 'Completing...'
                  : currentIndex < totalQuestions - 1
                    ? 'Next Question →'
                    : 'Finish Interview'}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubmitAnswer(true)}
                  disabled={submitting}
                  className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                  id="session-skip"
                >
                  Skip
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubmitAnswer(false)}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400"
                  id="session-submit"
                >
                  {submitting ? 'Evaluating...' : 'Submit Answer'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
