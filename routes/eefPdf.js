import { Router } from 'express';
import { Pdf1, TestPdf } from '../controllers/eef.Controller.js';
import { PdfSp1, TestPdfSp } from '../controllers/eefSp.Controller.js';
import { MainPee1, MainPee } from '../controllers/margePee1.Controller.js';
import { PdfATC } from '../controllers/atc.Controller.js';
import { MergeSP, MergeSp2, MergeSPDownload } from '../controllers/margePeeSp.Controller.js';
import { Bangkok202402 } from '../controllers/bangkok202402.Controller.js';

import { TestBangkok } from '../controllers/bangkok.Controller.js';
import { Bangkok2 } from '../controllers/bangkok2.Controller.js';


import { TestPdf2025 } from '../controllers/eef-normal-2025.Controller.js';

const router = Router();

router.get('/bangkok-2024032/:AppID', TestBangkok)
router.get('/bangkok-2024022/:AppID', Bangkok2)
router.get('/bangkok-202402/:AppID', Bangkok202402)
router.get('/pdf1/:u_id&:u_type&:u_type2', Pdf1)
router.get('/pdfpee1/:u_id&:u_type&:u_type2', MainPee1)
router.get('/test/:u_id&:u_type&:u_type2', TestPdf)
router.get('/download/:u_id&:u_type&:u_type2', MainPee)


router.get('/pdf-sp1/:u_id', PdfSp1)
router.get('/pdf-merge-sp/:u_id', MergeSP)
router.get('/pdf-merge-sp-download/:u_id', MergeSPDownload)
router.get('/test-sp/:u_id', TestPdfSp)
// router.get('/download/:u_id', MainPee)


// EEF 2025
router.get('/eef2025/normal/year2/:u_id', MainPee1)
router.get('/eef2025/test', TestPdf2025)




router.get('/pdf-score1/:u_id', PdfATC)


export default router   