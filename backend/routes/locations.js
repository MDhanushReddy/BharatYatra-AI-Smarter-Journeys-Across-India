import { Router } from 'express';
import { searchLocations, getLocationDetails } from '../controllers/locationController.js';

const router = Router();

router.get('/search', searchLocations);
router.get('/details/:placeId', getLocationDetails);

export default router;
