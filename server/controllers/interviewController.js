import Interview from '../models/Interview.js';
import User from '../models/User.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';

// Helper: call OpenRouter LLM
async function callOpenRouter(messages, maxTokens = 2000) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'dv.interview-AI',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-maverick',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Parse resume PDF and extract skills + projects
export const resumeParse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Extract text from PDF
    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ message: 'Could not extract meaningful text from the PDF' });
    }

    // Use LLM to extract structured data
    const prompt = `Analyze the following resume text and extract:
1. A list of technical skills mentioned
2. A list of project names mentioned

Return your response as valid JSON only, with no extra text, in this exact format:
{
  "skills": ["skill1", "skill2", ...],
  "projects": ["project1", "project2", ...]
}

If no projects are found, return an empty array for projects.
If no skills are found, return an empty array for skills.

Resume text:
${resumeText}`;

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a resume parser. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ]);

    // Parse JSON from LLM response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse LLM response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.status(200).json({
      skills: parsed.skills || [],
      projects: parsed.projects || [],
    });
  } catch (error) {
    console.error('Resume parse error:', error);
    res.status(500).json({ message: 'Failed to parse resume', error: error.message });
  }
};

// Start interview — generate questions and create session
export const startInterview = async (req, res) => {
  try {
    const { role, experience, mode, interviewer, resumeSkills, resumeProjects } = req.body;

    if (!role || !mode) {
      return res.status(400).json({ message: 'Role and mode are required' });
    }

    // Check and deduct credits
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.credits < 50) {
      return res.status(403).json({ message: 'Insufficient credits. You need at least 50 credits to start an interview.' });
    }

    user.credits -= 50;
    await user.save();

    // Calculate question count based on resume depth
    const skills = resumeSkills || [];
    const projects = resumeProjects || [];
    const dataPoints = skills.length + projects.length;

    // Dynamic count: min 5, roughly 1 per skill/project, no hard cap
    let questionCount = Math.max(5, dataPoints);
    // Cap at a reasonable max for UX (15 questions)
    questionCount = Math.min(questionCount, 15);

    // Calculate tier distribution
    const easyCount = Math.max(1, Math.round(questionCount * 0.3));
    const hardCount = Math.max(1, Math.round(questionCount * 0.3));
    const midCount = questionCount - easyCount - hardCount;

    // Build prompt for question generation
    const modeDescription = mode === 'technical'
      ? 'technical interview focusing on code, frameworks, system design, and deep technical knowledge'
      : 'HR/behavioral interview focusing on soft skills, communication, teamwork, leadership, and situational questions';

    const resumeContext = skills.length > 0 || projects.length > 0
      ? `\nThe candidate's resume mentions these skills: ${skills.join(', ')}
         And these projects: ${projects.join(', ')}`
      : '';

    const prompt = `Generate exactly ${questionCount} interview questions for a ${modeDescription}.

Role: ${role}
Experience Level: ${experience || 'Not specified'}${resumeContext}

Question distribution:
- ${easyCount} EASY questions (foundational, warm-up)${projects.length > 0 ? ' — reference specific projects from the resume by name' : ''}
- ${midCount} MID questions (implementation, situational, moderate difficulty)
- ${hardCount} HARD questions (complex problem-solving, advanced scenarios)

Order them progressively: all easy questions first, then mid, then hard.

Return ONLY a valid JSON array with no extra text, in this exact format:
[
  { "text": "question text here", "difficulty": "easy" },
  { "text": "question text here", "difficulty": "mid" },
  { "text": "question text here", "difficulty": "hard" }
]`;

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert interviewer. Generate interview questions as JSON only.' },
      { role: 'user', content: prompt },
    ], 3000);

    // Parse questions from LLM response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse questions from LLM response');
    }

    const parsedQuestions = JSON.parse(jsonMatch[0]);

    // Format questions for storage
    const questions = parsedQuestions.map((q) => ({
      text: q.text,
      difficulty: q.difficulty || 'mid',
      answerText: '',
      feedback: '',
      scores: { correctness: 0, communication: 0, confidence: 0 },
    }));

    // Create interview document
    const interview = await Interview.create({
      userId: req.user.userId,
      mode,
      role,
      interviewer: interviewer || 'female',
      experience: experience || '',
      resumeSkills: skills,
      resumeProjects: projects,
      questions,
      status: 'incomplete',
    });

    res.status(201).json({
      interviewId: interview._id,
      questions: interview.questions,
      credits: user.credits,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Failed to start interview', error: error.message });
  }
};

// Submit answer for a single question
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answerText, codeContent, codeLanguage } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const question = interview.questions[questionIndex];

    // If they skipped everything
    if ((!answerText || answerText.trim() === '') && (!codeContent || codeContent.trim() === '')) {
      question.answerText = '';
      question.codeContent = '';
      question.codeLanguage = codeLanguage || 'javascript';
      question.feedback = 'No answer provided. This question was skipped.';
      question.scores = { correctness: 0, communication: 0, confidence: 0 };
      await interview.save();
      return res.status(200).json({
        feedback: question.feedback,
        scores: question.scores,
      });
    }

    // Assign code properties to the question
    question.codeContent = codeContent || '';
    question.codeLanguage = codeLanguage || 'javascript';

    // Build the AI evaluation prompt
    let prompt = `You are evaluating an interview answer.

Question: "${question.text}"
Difficulty: ${question.difficulty}
Interview Mode: ${interview.mode}
Role: ${interview.role}

Candidate's Spoken Answer: "${answerText || '[No verbal explanation provided]'}"
`;

    if (codeContent && codeContent.trim() !== '') {
      prompt += `\nThe candidate also wrote the following ${question.codeLanguage} code:\n\`\`\`${question.codeLanguage}\n${codeContent}\n\`\`\`\n`;
    }

    prompt += `\nEvaluate this answer and provide:
1. Brief, constructive feedback (2-3 sentences max)
2. Three scores from 1 to 10:
   - correctness: how accurate and relevant the answer is
   - communication: how well-structured and clear the response is
   - confidence: how confident and professional the delivery seems

Return ONLY valid JSON with no extra text:
{
  "feedback": "your feedback here",
  "scores": {
    "correctness": 7,
    "communication": 6,
    "confidence": 5
  }
}`;

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert interview evaluator. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], 500);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse scoring response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    // Update question with answer and evaluation
    question.answerText = answerText;
    question.feedback = evaluation.feedback || 'No feedback generated.';
    question.scores = {
      correctness: Math.min(10, Math.max(0, evaluation.scores?.correctness || 0)),
      communication: Math.min(10, Math.max(0, evaluation.scores?.communication || 0)),
      confidence: Math.min(10, Math.max(0, evaluation.scores?.confidence || 0)),
    };

    await interview.save();

    res.status(200).json({
      feedback: question.feedback,
      scores: question.scores,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Failed to evaluate answer', error: error.message });
  }
};

// Complete interview session
export const completeInterview = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Mark unanswered questions with 0 scores
    interview.questions.forEach((q) => {
      if (!q.answerText || q.answerText.trim() === '') {
        q.feedback = q.feedback || 'No answer provided. This question was skipped.';
        q.scores = { correctness: 0, communication: 0, confidence: 0 };
      }
    });

    // Compute average score across all questions and metrics
    const totalQuestions = interview.questions.length;
    if (totalQuestions > 0) {
      const totalScore = interview.questions.reduce((sum, q) => {
        const qAvg = (q.scores.correctness + q.scores.communication + q.scores.confidence) / 3;
        return sum + qAvg;
      }, 0);
      interview.averageScore = Math.round((totalScore / totalQuestions) * 10) / 10;
    }

    interview.status = 'complete';

    // Generate Custom Learning Paths (Study Guide)
    if (interview.questions.length > 0) {
      const qaList = interview.questions.map((q, i) => `Q${i + 1}: ${q.text}\nAnswer: ${q.answerText || '[Skipped]'}\nScores: Correctness ${q.scores.correctness}/10, Communication ${q.scores.communication}/10`).join('\n\n');

      const studyPrompt = `Based on the following interview performance, identify 2 to 3 key areas where the candidate needs improvement.
      
Interview Q&A:
${qaList}

Return ONLY a valid JSON array containing objects with exactly two string fields: "topic" and "description".
Example:
[
  { "topic": "React Hooks", "description": "You struggled to explain useEffect. Review component lifecycles." }
]`;

      try {
        const result = await callOpenRouter([
          { role: 'system', content: 'You are an expert technical interviewer and career coach. Output JSON only.' },
          { role: 'user', content: studyPrompt }
        ], 1000);

        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          interview.studyGuide = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error('Failed to generate study guide:', err);
      }
    }

    await interview.save();

    // Gamification & Badges Logic
    const user = await User.findById(req.user.userId);
    let newBadges = [];
    if (user) {
      const completedCount = await Interview.countDocuments({ userId: req.user.userId, status: 'complete' });

      const awardBadge = (badgeName) => {
        if (!user.badges.includes(badgeName)) {
          user.badges.push(badgeName);
          newBadges.push(badgeName);
        }
      };

      // Rule: Completed their first interview
      if (completedCount === 1) awardBadge('First Steps');

      // Rule: Average score 8 or higher
      if (interview.averageScore >= 8) awardBadge('High Performer');

      // Rule: Perfect or near-perfect score
      if (interview.averageScore >= 9.5) awardBadge('Perfectionist');

      // Rule: Excellent communicator (avg Comm >= 8.5)
      const avgComm = interview.questions.reduce((sum, q) => sum + (q.scores.communication || 0), 0) / (interview.questions.length || 1);
      if (avgComm >= 8.5) awardBadge('Smooth Talker');

      if (newBadges.length > 0) {
        await user.save();
      }
    }

    res.status(200).json({
      message: 'Interview completed',
      interview,
      newBadges,
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ message: 'Failed to complete interview', error: error.message });
  }
};

// Get interview history
export const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('role mode averageScore status createdAt questions');

    const history = interviews.map((i) => ({
      _id: i._id,
      role: i.role,
      mode: i.mode,
      averageScore: i.averageScore,
      status: i.status,
      createdAt: i.createdAt,
      totalQuestions: i.questions.length,
    }));

    res.status(200).json({ interviews: history });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// Get interview detail
export const getInterviewDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ interview });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch interview detail', error: error.message });
  }
};

// Generate a hint for a specific question
export const generateHint = async (req, res) => {
  try {
    const { interviewId, questionIndex } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check credits
    if (user.credits < 5) {
      return res.status(402).json({ message: 'Insufficient credits for a hint (costs 5 credits)' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const question = interview.questions[questionIndex];

    // Generate hint using LLM
    const prompt = `You are a helpful interview coach. The candidate is stuck on the following question:
"${question.text}"

Provide a short, subtle hint (1-2 sentences) to point them in the right direction without giving away the complete answer.`;

    const hintText = await callOpenRouter([
      { role: 'system', content: 'You are an expert interview coach. Give short, subtle hints.' },
      { role: 'user', content: prompt }
    ], 300); // Small max tokens for a hint

    // Deduct credits
    user.credits -= 5;
    await user.save();

    res.status(200).json({ hint: hintText, newCredits: user.credits });
  } catch (error) {
    console.error('Hint generation error:', error);
    res.status(500).json({ message: 'Failed to generate hint', error: error.message });
  }
};
