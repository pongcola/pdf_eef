import { Router } from 'express';
import { chkPayCcph } from '../controllers/approval.Controller.js'

const router = Router();


router.post('/', chkPayCcph);

export default router  