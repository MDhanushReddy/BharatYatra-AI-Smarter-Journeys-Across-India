import { Router } from 'express';
import { getSafetyInfo, getEmergencyContacts, getSafetyTips, getEmergencyKit } from '../controllers/safetyController.js';

const router = Router();

// Get safety information for destination
router.get('/info', getSafetyInfo);

// Get emergency contacts
router.get('/contacts', getEmergencyContacts);

// Get safety tips and recommendations
router.get('/tips', getSafetyTips);

// Get emergency kit recommendations
router.get('/emergency-kit', getEmergencyKit);

export default router;
