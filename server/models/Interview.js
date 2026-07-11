import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'mid', 'hard'],
    required: true,
  },
  answerText: { type: String, default: '' },
  feedback: { type: String, default: '' },
  scores: {
    correctness: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
  },
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: {
    type: String,
    enum: ['technical', 'hr'],
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    default: '',
  },
  resumeSkills: [String],
  resumeProjects: [String],
  questions: [questionSchema],
  averageScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['complete', 'incomplete'],
    default: 'incomplete',
  },
  interviewer: {
    type: String,
    enum: ['female', 'male'],
    default: 'female',
  },
  studyGuide: [
    {
      topic: String,
      description: String,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
