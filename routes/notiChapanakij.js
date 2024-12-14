import { Router } from 'express';
import { notiChapanakijUsers } from '../controllers/notichapanakij.Controller.js';
import { notiEstudent } from '../controllers/notiestudent.Controller.js';


const router = Router();


router.get('/Chapanakijusers', notiChapanakijUsers);
router.get('/estudent', notiEstudent);

export default router  