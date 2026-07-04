import express from 'express';
import {
  resumeParse,
  startInterview,
  submitAnswer,
  completeInterview,
  getHistory,
  getInterviewDetail,
} from '../controllers/interviewController.js';
import isAuth from '../middleware/isAuth.js';
import upload from '../middleware/multerConfig.js';

const router = express.Router();

router.post('/resume-parse', isAuth, upload.single('resume'), resumeParse);
router.post('/start', isAuth, startInterview);
router.post('/answer', isAuth, submitAnswer);
router.post('/complete/:id', isAuth, completeInterview);
router.get('/history', isAuth, getHistory);
router.get('/:id', isAuth, getInterviewDetail);

export default router;
