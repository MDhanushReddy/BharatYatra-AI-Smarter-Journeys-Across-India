import { Router } from 'express';
import { searchAttractions } from '../controllers/placesController.js';

const router = Router();

router.get('/search', searchAttractions);

export default router;


