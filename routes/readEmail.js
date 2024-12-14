import express from 'express';
import { readEmail, readFile, removeFile } from '../controllers/readEmailController.js'

const router = express.Router();

router.post('/reademail', readEmail);
router.post('/readfile', readFile);
router.post('/removefile',removeFile)

export default router;