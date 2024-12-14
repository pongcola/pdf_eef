import { Router } from 'express';
import {getAccount, registersOneIDReq, chkOneID,chkUsername} from '../controllers/regone.Controller.js';

const router = Router();

router.post('/registersOneIDReq', registersOneIDReq);
router.post('/account_user', getAccount);
router.post('/chkOneId', chkOneID);
router.post('/chkUsernameOneId', chkUsername);



export default router;