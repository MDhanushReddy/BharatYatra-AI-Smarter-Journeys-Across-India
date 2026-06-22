import safetyService from '../services/safetyService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { validateRequiredQueryParams, isValidNumber } from '../utils/requestValidator.js';

// Get comprehensive safety information for destination
export const getSafetyInfo = async (req, res) => {
  try {
    const { destination = '' } = req.query;

    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['destination'])) return;

    console.log('Safety info request:', { destination });

    // Get comprehensive safety information
    const safetyInfo = safetyService.getDestinationSafety(destination);

    // Get current travel alerts for the destination
    const currentAlerts = safetyService.getTravelAlerts(destination);

    // Generate safety checklist
    const safetyChecklist = safetyService.generateSafetyChecklist({
      destination: destination,
      tripType: req.query.tripType || 'leisure',
      groupType: req.query.groupType || 'couple',
      duration: parseInt(req.query.duration) || 3
    });

    return sendSuccess(res, {
      safetyInfo: safetyInfo,
      currentAlerts: currentAlerts,
      safetyChecklist: safetyChecklist
    }, {
      destination: destination
    });

  } catch (error) {
    console.error('Safety info error:', error);
    sendError(res, 'Failed to get safety information', 'SAFETY_INFO_ERROR', error.message, 500);
  }
};

// Get emergency contacts for destination
export const getEmergencyContacts = async (req, res) => {
  try {
    const { destination = '' } = req.query;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for emergency contacts' 
      });
    }

    console.log('Emergency contacts request:', { destination });

    // Get emergency contacts
    const emergencyInfo = safetyService.getEmergencyContacts(destination);

    // Add additional emergency resources
    const additionalResources = getAdditionalEmergencyResources(destination);

    res.json({
      success: true,
      destination: destination,
      emergencyContacts: emergencyInfo.contacts,
      medicalFacilities: emergencyInfo.medicalFacilities,
      embassies: emergencyInfo.embassies,
      additionalResources: additionalResources,
      quickReference: {
        police: emergencyInfo.contacts.police,
        ambulance: emergencyInfo.contacts.ambulance,
        fire: emergencyInfo.contacts.fire,
        helpline: emergencyInfo.contacts.helpline
      }
    });

  } catch (error) {
    console.error('Emergency contacts error:', error);
    res.status(500).json({ 
      error: 'Failed to get emergency contacts',
      message: error.message 
    });
  }
};

// Get safety tips and recommendations
export const getSafetyTips = async (req, res) => {
  try {
    const {
      destination = '',
      tripType = 'leisure',
      groupType = 'couple',
      duration = 3
    } = req.query;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for safety tips' 
      });
    }

    console.log('Safety tips request:', { destination, tripType, groupType, duration });

    // Get personalized safety tips
    const safetyTips = safetyService.getSafetyTips(destination, tripType, groupType);

    // Get emergency kit recommendations
    const emergencyKit = safetyService.getEmergencyKitRecommendations(
      parseInt(duration), 
      destination, 
      tripType
    );

    // Get common scams and how to avoid them
    const scamPrevention = getScamPreventionTips(destination);

    // Get health and medical advice
    const healthAdvice = getHealthAdvice(destination, tripType);

    res.json({
      success: true,
      destination: destination,
      tripDetails: { tripType, groupType, duration },
      safetyTips: safetyTips.tips,
      riskLevel: safetyTips.riskLevel,
      commonScams: safetyTips.commonScams,
      emergencyKit: emergencyKit,
      scamPrevention: scamPrevention,
      healthAdvice: healthAdvice,
      generalTips: safetyTips.generalTips
    });

  } catch (error) {
    console.error('Safety tips error:', error);
    res.status(500).json({ 
      error: 'Failed to get safety tips',
      message: error.message 
    });
  }
};

// Get emergency kit recommendations
export const getEmergencyKit = async (req, res) => {
  try {
    const {
      destination = '',
      tripType = 'leisure',
      duration = 3,
      groupSize = 2,
      specialNeeds = ''
    } = req.query;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for emergency kit recommendations' 
      });
    }

    console.log('Emergency kit request:', { destination, tripType, duration, groupSize, specialNeeds });

    // Get personalized emergency kit
    const emergencyKit = safetyService.getEmergencyKitRecommendations(
      parseInt(duration),
      destination,
      tripType
    );

    // Customize based on group size
    const customizedKit = customizeKitForGroupSize(emergencyKit, parseInt(groupSize));

    // Add special needs items
    const finalKit = addSpecialNeedsItems(customizedKit, specialNeeds);

    // Get packing recommendations
    const packingTips = getPackingTips(destination, tripType, parseInt(duration));

    res.json({
      success: true,
      destination: destination,
      tripDetails: { tripType, duration, groupSize, specialNeeds },
      emergencyKit: finalKit,
      packingTips: packingTips,
      recommendations: {
        priority: 'high',
        message: 'Emergency kit is essential for safe travel',
        notes: [
          'Check expiry dates before packing',
          'Pack items in waterproof containers',
          'Keep emergency kit easily accessible',
          'Review emergency procedures before departure'
        ]
      }
    });

  } catch (error) {
    console.error('Emergency kit error:', error);
    res.status(500).json({ 
      error: 'Failed to get emergency kit recommendations',
      message: error.message 
    });
  }
};

// Get additional emergency resources
function getAdditionalEmergencyResources() {
  return {
    travelInsurance: {
      helpline: '1800-XXX-XXXX',
      website: 'www.travelinsurance.com',
      note: 'Contact your travel insurance provider for medical emergencies'
    },
    localTouristPolice: {
      note: 'Tourist police are specifically trained to help tourists',
      services: ['Lost documents', 'Crime reporting', 'General assistance']
    },
    consularServices: {
      note: 'Your country\'s consulate can help with serious emergencies',
      services: ['Lost passport', 'Medical emergencies', 'Legal assistance']
    },
    mobileApps: [
      {
        name: 'Tourist Police App',
        description: 'Official app for tourist assistance',
        features: ['Emergency contacts', 'Safety tips', 'Report incidents']
      },
      {
        name: 'Local Emergency App',
        description: 'Local emergency services app',
        features: ['Quick dial', 'Location sharing', 'Emergency contacts']
      }
    ]
  };
}

// Get scam prevention tips
function getScamPreventionTips(destination) {
  const scamTips = {
    'mumbai': [
      {
        type: 'Taxi Scams',
        description: 'Fake taxi drivers charging excessive fares',
        prevention: ['Use registered taxis', 'Agree on fare before starting', 'Use ride-sharing apps']
      },
      {
        type: 'Tourist Information',
        description: 'Fake tourist information centers',
        prevention: ['Use official tourist centers', 'Verify information online', 'Avoid unsolicited help']
      }
    ],
    'delhi': [
      {
        type: 'Auto-rickshaw Scams',
        description: 'Drivers taking longer routes or overcharging',
        prevention: ['Negotiate fare before starting', 'Use metro when possible', 'Know approximate distances']
      },
      {
        type: 'Fake Tour Guides',
        description: 'Unauthorized tour guides at monuments',
        prevention: ['Use licensed guides', 'Book through official channels', 'Verify guide credentials']
      }
    ],
    'goa': [
      {
        type: 'Water Sports Scams',
        description: 'Beach vendors overcharging for water sports',
        prevention: ['Book through hotels', 'Compare prices', 'Check equipment safety']
      },
      {
        type: 'Timeshare Scams',
        description: 'High-pressure timeshare sales',
        prevention: ['Avoid unsolicited offers', 'Don\'t sign anything immediately', 'Research companies']
      }
    ]
  };

  return scamTips[destination.toLowerCase()] || [
    {
      type: 'General Scams',
      description: 'Common tourist scams',
      prevention: [
        'Be cautious with unsolicited help',
        'Verify prices before agreeing',
        'Keep valuables secure',
        'Use official services when possible'
      ]
    }
  ];
}

// Get health advice
function getHealthAdvice(destination, tripType) {
  const healthAdvice = {
    general: [
      'Drink bottled or purified water',
      'Avoid street food if you have a sensitive stomach',
      'Carry basic first aid supplies',
      'Know the location of nearest medical facilities'
    ],
    vaccinations: [
      'Check if any vaccinations are required',
      'Update routine vaccinations',
      'Consider travel-specific vaccinations'
    ],
    foodSafety: [
      'Eat at reputable restaurants',
      'Avoid raw or undercooked food',
      'Wash hands frequently',
      'Carry hand sanitizer'
    ],
    sunProtection: [
      'Use sunscreen SPF 30 or higher',
      'Wear protective clothing',
      'Stay hydrated',
      'Avoid peak sun hours (10 AM - 4 PM)'
    ]
  };

  // Add trip-specific advice
  if (tripType === 'adventure') {
    healthAdvice.adventure = [
      'Get appropriate training for activities',
      'Use proper safety equipment',
      'Inform someone about your plans',
      'Carry emergency communication device'
    ];
  } else if (tripType === 'family') {
    healthAdvice.family = [
      'Keep children supervised at all times',
      'Carry child identification documents',
      'Pack extra supplies for children',
      'Know child-friendly medical facilities'
    ];
  }

  return healthAdvice;
}

// Customize emergency kit for group size
function customizeKitForGroupSize(emergencyKit, groupSize) {
  const customizedKit = { ...emergencyKit };

  if (groupSize > 2) {
    // Add extra supplies for larger groups
    customizedKit.essentials = customizedKit.essentials.map(item => {
      if (item.includes('bandage') || item.includes('medicine')) {
        return `${item} (x${Math.ceil(groupSize / 2)})`;
      }
      return item;
    });

    // Add group-specific items
    customizedKit.essentials.push('Group emergency contact list');
    customizedKit.essentials.push('Whistle for group coordination');
  }

  return customizedKit;
}

// Add special needs items to emergency kit
function addSpecialNeedsItems(emergencyKit, specialNeeds) {
  const finalKit = { ...emergencyKit };

  if (specialNeeds) {
    const needs = specialNeeds.split(',').map(need => need.trim().toLowerCase());
    
    needs.forEach(need => {
      switch (need) {
        case 'diabetes':
          finalKit.essentials.push('Blood glucose monitor');
          finalKit.essentials.push('Insulin (if applicable)');
          finalKit.essentials.push('Glucose tablets');
          break;
        case 'allergies':
          finalKit.essentials.push('Epinephrine auto-injector');
          finalKit.essentials.push('Antihistamines');
          finalKit.essentials.push('Allergy identification card');
          break;
        case 'asthma':
          finalKit.essentials.push('Inhaler');
          finalKit.essentials.push('Spacer (if needed)');
          break;
        case 'heart':
          finalKit.essentials.push('Heart medication');
          finalKit.essentials.push('Blood pressure monitor');
          break;
        case 'mobility':
          finalKit.essentials.push('Mobility aid backup');
          finalKit.essentials.push('Accessibility information');
          break;
      }
    });
  }

  return finalKit;
}

// Get packing tips
function getPackingTips(destination, tripType, duration) {
  const packingTips = {
    essentials: [
      'Pack light but be prepared',
      'Roll clothes to save space',
      'Use packing cubes for organization',
      'Pack versatile clothing items'
    ],
    documents: [
      'Make copies of important documents',
      'Keep originals and copies separate',
      'Store digital copies in cloud',
      'Carry emergency contact list'
    ],
    electronics: [
      'Bring universal power adapter',
      'Pack portable charger',
      'Download offline maps',
      'Keep devices charged'
    ],
    clothing: [
      'Pack according to weather forecast',
      'Bring comfortable walking shoes',
      'Pack layers for temperature changes',
      'Include formal wear if needed'
    ]
  };

  // Add duration-specific tips
  if (duration > 7) {
    packingTips.extended = [
      'Pack laundry detergent',
      'Bring extra toiletries',
      'Consider luggage storage options',
      'Pack versatile items for multiple uses'
    ];
  }

  // Add trip-type specific tips
  if (tripType === 'business') {
    packingTips.business = [
      'Pack formal business attire',
      'Bring presentation materials',
      'Include business cards',
      'Pack laptop and chargers'
    ];
  } else if (tripType === 'adventure') {
    packingTips.adventure = [
      'Pack appropriate gear for activities',
      'Bring quick-dry clothing',
      'Include safety equipment',
      'Pack repair kit for gear'
    ];
  }

  return packingTips;
}
