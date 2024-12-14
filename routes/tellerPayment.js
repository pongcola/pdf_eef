import { Router } from 'express';
import { tellerPayment } from '../controllers/tellerpaymentController.js';
import { newtellerPayment } from '../controllers/newtellerpaymentController.js';


const router = Router();

router.get('/', tellerPayment);
router.get('/newteller', newtellerPayment);

export default router  