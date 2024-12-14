import { Router } from 'express';
import { TestBangkok } from '../controllers/bangkok.Controller.js';

const router = Router();

router.get('/bangkok-2024032/:AppID', TestBangkok)

export default router   