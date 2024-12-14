import { Router } from 'express';
import { sendEMail} from '../controllers/sendEmail.Controller.js';
// import * as validate from '../validate.js';

const router = Router();

router.get('/sendEmail', sendEMail);


export default router;
