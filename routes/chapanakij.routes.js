import { Router } from 'express';
import * as con from '../controllers/chapanakij.Controller.js';

const router = Router();

router.post('/login',con.mainController); // *** ดึงข้อมูล MemBer Show หน้าบ้าน

router.get('/checkDG/:RefNo1&:RefNo2&:Amount', con.checkDG);
export default router;     