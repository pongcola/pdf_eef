import { Router } from 'express';
import { checkTellerPayment } from '../controllers/checkTellerController.js';
import { checkPaystatus } from '../controllers/checkPaystatus.Controller.js'

const router = Router();

router.get('/',checkTellerPayment)
router.post('/checkpaystatus',checkPaystatus)

export default router  