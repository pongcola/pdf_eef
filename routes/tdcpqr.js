import { Router } from 'express';
import { tellerPayment, checkTellerPayment } from '../controllers/tdcpController.js';

const router = Router();

router.get('/', tellerPayment);
router.get('/checkltellerpayment',checkTellerPayment)

export default router  