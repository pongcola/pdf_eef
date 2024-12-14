import { Router } from 'express';
import { ApprovalTellerpayment } from '../controllers/approval.Controller.js'

const router = Router();

router.post('/', ApprovalTellerpayment);

export default router  