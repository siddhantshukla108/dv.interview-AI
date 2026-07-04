import express from 'express';
import { googleLogin, logout, getProfile } from '../controllers/authController.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.post('/google', googleLogin);
router.get('/logout', isAuth, logout);
router.get('/profile', isAuth, getProfile);

export default router;
