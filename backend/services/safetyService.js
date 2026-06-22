// Safety and Emergency Support Service
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class SafetyService {
  constructor() {
    this.__filename = fileURLToPath(import.meta.url);
    this.__dirname = path.dirname(this.__filename);
    this.safetyData = this.loadSafetyData();
  }

  // Load safety data from JSON file
  loadSafetyData() {
    try {
      const safetyDataPath = path.join(this.__dirname, '../data/safetyData.json');
      if (fs.existsSync(safetyDataPath)) {
        const data = fs.readFileSync(safetyDataPath, 'utf8');
        return JSON.parse(data);
      } else {
        // Create default safety data if file doesn't exist
        return this.createDefaultSafetyData();
      }
    } catch (error) {
      console.error('Error loading safety data:', error);
      return this.createDefaultSafetyData();
    }
  }

  // Create default safety data for major Indian destinations
  createDefaultSafetyData() {
    return {
      destinations: {
        'mumbai': {
          emergencyContacts: {
            police: '100',
            ambulance: '108',
            fire: '101',
            helpline: '1091',
            tourismPolice: '022-22620364'
          },
          safetyTips: [
            'Avoid traveling alone at night in isolated areas',
            'Keep your belongings secure in crowded places like railway stations',
            'Use registered taxis or ride-sharing apps',
            'Be cautious when using ATMs at night',
            'Keep emergency contacts handy'
          ],
          medicalFacilities: [
            { name: 'KEM Hospital', address: 'Parel, Mumbai', phone: '022-2410 7000' },
            { name: 'Lilavati Hospital', address: 'Bandra West, Mumbai', phone: '022-2675 1000' },
            { name: 'Apollo Hospital', address: 'Navi Mumbai', phone: '022-7171 7171' }
          ],
          embassies: [
            { name: 'US Consulate', address: 'Bandra Kurla Complex', phone: '022-2672 4000' },
            { name: 'UK Consulate', address: 'Maker Chambers IV, Nariman Point', phone: '022-6650 2222' }
          ],
          riskLevel: 'medium',
          commonScams: [
            'Fake taxi drivers charging excessive fares',
            'Pickpocketing in crowded areas',
            'Tourist information scams'
          ]
        },
        'delhi': {
          emergencyContacts: {
            police: '100',
            ambulance: '108',
            fire: '101',
            helpline: '1091',
            tourismPolice: '011-2323 4090'
          },
          safetyTips: [
            'Avoid walking alone in Old Delhi after dark',
            'Be cautious when crossing roads - traffic can be chaotic',
            'Keep valuables secure in crowded markets',
            'Use metro for safe and efficient travel',
            'Stay hydrated and avoid street food if you have a sensitive stomach'
          ],
          medicalFacilities: [
            { name: 'AIIMS', address: 'Ansari Nagar, New Delhi', phone: '011-2658 8500' },
            { name: 'Apollo Hospital', address: 'Sarita Vihar, New Delhi', phone: '011-2692 5858' },
            { name: 'Max Hospital', address: 'Saket, New Delhi', phone: '011-4055 4055' }
          ],
          embassies: [
            { name: 'US Embassy', address: 'Shantipath, Chanakyapuri', phone: '011-2419 8000' },
            { name: 'UK High Commission', address: 'Shantipath, Chanakyapuri', phone: '011-2419 2100' }
          ],
          riskLevel: 'medium',
          commonScams: [
            'Auto-rickshaw drivers taking longer routes',
            'Fake tour guides',
            'Overcharging at tourist sites'
          ]
        },
        'goa': {
          emergencyContacts: {
            police: '100',
            ambulance: '108',
            fire: '101',
            helpline: '1091',
            tourismPolice: '0832-242 0794'
          },
          safetyTips: [
            'Be careful with water sports - ensure safety equipment',
            'Avoid swimming in rough seas',
            'Protect yourself from sunburn',
            'Be cautious with alcohol consumption',
            'Keep your belongings secure on beaches'
          ],
          medicalFacilities: [
            { name: 'Goa Medical College', address: 'Bambolim, Goa', phone: '0832-245 8700' },
            { name: 'Apollo Hospital', address: 'Mapusa, Goa', phone: '0832-242 8888' }
          ],
          embassies: [],
          riskLevel: 'low',
          commonScams: [
            'Beach vendors overcharging for water sports',
            'Fake taxi drivers',
            'Timeshare scams'
          ]
        },
        'bangalore': {
          emergencyContacts: {
            police: '100',
            ambulance: '108',
            fire: '101',
            helpline: '1091',
            tourismPolice: '080-2221 8888'
          },
          safetyTips: [
            'Traffic can be heavy - plan accordingly',
            'Be cautious in crowded areas',
            'Use reputable transportation services',
            'Keep emergency contacts handy',
            'Stay aware of your surroundings'
          ],
          medicalFacilities: [
            { name: 'NIMHANS', address: 'Hosur Road, Bangalore', phone: '080-2699 5000' },
            { name: 'Apollo Hospital', address: 'Bannerghatta Road, Bangalore', phone: '080-2630 4050' },
            { name: 'Manipal Hospital', address: 'Airport Road, Bangalore', phone: '080-2502 4444' }
          ],
          embassies: [
            { name: 'US Consulate', address: 'Thimmaiah Road, Bangalore', phone: '080-2227 5000' }
          ],
          riskLevel: 'low',
          commonScams: [
            'IT company recruitment scams',
            'Fake job offers',
            'Online fraud'
          ]
        }
      },
      generalTips: [
        'Always carry a copy of your passport and important documents',
        'Keep emergency contacts saved in your phone',
        'Inform someone about your travel plans',
        'Register with your embassy if staying for extended periods',
        'Carry a basic first aid kit',
        'Know the local emergency numbers',
        'Be aware of local customs and laws',
        'Keep some local currency for emergencies'
      ],
      emergencyKits: {
        basic: [
          'First aid kit',
          'Emergency contact list',
          'Flashlight with extra batteries',
          'Portable charger',
          'Water bottle',
          'Energy bars',
          'Whistle',
          'Emergency blanket'
        ],
        extended: [
          'Basic first aid kit',
          'Emergency contact list',
          'Flashlight with extra batteries',
          'Portable charger',
          'Water purification tablets',
          'Non-perishable food',
          'Multi-tool',
          'Emergency blanket',
          'Cash in local currency',
          'Copies of important documents'
        ]
      }
    };
  }

  // Get safety information for a specific destination
  getDestinationSafety(destination) {
    const dest = this.safetyData.destinations[destination.toLowerCase()];
    if (!dest) {
      // Return general safety tips if destination not found
      return {
        destination: destination,
        emergencyContacts: {
          police: '100',
          ambulance: '108',
          fire: '101',
          helpline: '1091'
        },
        safetyTips: this.safetyData.generalTips,
        medicalFacilities: [],
        embassies: [],
        riskLevel: 'unknown',
        commonScams: [],
        message: 'Specific safety data not available for this destination. Using general safety guidelines.'
      };
    }

    return {
      destination: destination,
      ...dest,
      generalTips: this.safetyData.generalTips
    };
  }

  // Get emergency contacts for a destination
  getEmergencyContacts(destination) {
    const safety = this.getDestinationSafety(destination);
    return {
      destination: destination,
      contacts: safety.emergencyContacts,
      medicalFacilities: safety.medicalFacilities,
      embassies: safety.embassies
    };
  }

  // Get safety tips based on trip type and destination
  getSafetyTips(destination, tripType, groupType) {
    const safety = this.getDestinationSafety(destination);
    let tips = [...safety.safetyTips];

    // Add trip type specific tips
    if (tripType === 'adventure') {
      tips.push(
        'Inform local authorities about your adventure activities',
        'Carry appropriate safety equipment',
        'Check weather conditions before outdoor activities',
        'Travel with experienced guides when possible'
      );
    } else if (tripType === 'business') {
      tips.push(
        'Keep business documents secure',
        'Be cautious when sharing sensitive information',
        'Use secure internet connections',
        'Keep receipts for business expenses'
      );
    } else if (tripType === 'family') {
      tips.push(
        'Keep children supervised at all times',
        'Carry child identification documents',
        'Know the location of nearest medical facilities',
        'Pack extra supplies for children'
      );
    }

    // Add group type specific tips
    if (groupType === 'solo') {
      tips.push(
        'Share your itinerary with family/friends',
        'Avoid isolated areas, especially at night',
        'Trust your instincts - if something feels wrong, leave',
        'Stay in well-lit, populated areas'
      );
    } else if (groupType === 'couple') {
      tips.push(
        'Keep each other informed of plans',
        'Have a meeting point in case you get separated',
        'Be cautious when displaying affection in public',
        'Share important contacts with each other'
      );
    }

    return {
      destination: destination,
      tripType: tripType,
      groupType: groupType,
      tips: tips,
      riskLevel: safety.riskLevel,
      commonScams: safety.commonScams
    };
  }

  // Generate emergency kit recommendations
  getEmergencyKitRecommendations(tripDuration, destination, tripType) {
    let kit = [...this.safetyData.emergencyKits.basic];

    // Add items based on trip duration
    if (tripDuration > 7) {
      kit = [...this.safetyData.emergencyKits.extended];
    }

    // Add destination-specific items
    const dest = this.safetyData.destinations[destination.toLowerCase()];
    if (dest) {
      if (destination.toLowerCase() === 'goa') {
        kit.push('Sunscreen SPF 50+', 'Water shoes', 'Beach safety whistle');
      } else if (destination.toLowerCase() === 'delhi') {
        kit.push('Air pollution mask', 'Hand sanitizer', 'Tissue papers');
      }
    }

    // Add trip type specific items
    if (tripType === 'adventure') {
      kit.push('Emergency shelter', 'Fire starter', 'Compass', 'Emergency food');
    }

    return {
      tripDuration: tripDuration,
      destination: destination,
      tripType: tripType,
      emergencyKit: kit,
      recommendations: [
        'Check expiry dates of medications before packing',
        'Pack items in waterproof containers',
        'Keep emergency kit easily accessible',
        'Review emergency procedures before departure'
      ]
    };
  }

  // Generate safety checklist
  generateSafetyChecklist(tripDetails) {
    const checklist = {
      beforeTravel: [
        'Research destination safety and local laws',
        'Check travel advisories from government websites',
        'Purchase comprehensive travel insurance',
        'Make copies of important documents',
        'Register with embassy if required',
        'Download offline maps',
        'Save emergency contacts in phone',
        'Inform bank about travel plans',
        'Check vaccination requirements',
        'Pack emergency kit'
      ],
      duringTravel: [
        'Stay aware of surroundings',
        'Keep valuables secure',
        'Use reputable transportation',
        'Follow local customs and laws',
        'Stay in touch with family/friends',
        'Keep emergency contacts handy',
        'Trust your instincts',
        'Avoid excessive alcohol consumption',
        'Stay hydrated and eat safely',
        'Keep important documents safe'
      ],
      emergency: [
        'Call local emergency number',
        'Contact embassy if needed',
        'Inform travel insurance company',
        'Document incident if possible',
        'Seek medical help if injured',
        'Contact family/friends',
        'Keep receipts for insurance claims',
        'Follow local authorities\' instructions'
      ]
    };

    // Customize based on trip details
    if (tripDetails.groupType === 'solo') {
      checklist.beforeTravel.push('Share detailed itinerary with family');
      checklist.duringTravel.push('Check in regularly with family/friends');
    }

    if (tripDetails.tripType === 'adventure') {
      checklist.beforeTravel.push('Get appropriate training for activities');
      checklist.duringTravel.push('Follow safety protocols for activities');
    }

    return {
      tripDetails: tripDetails,
      checklist: checklist,
      priority: 'high',
      lastUpdated: new Date().toISOString()
    };
  }

  // Get current travel alerts for destination
  getTravelAlerts(destination) {
    // In a real implementation, this would fetch from government travel advisory APIs
    const mockAlerts = {
      'mumbai': [
        {
          type: 'traffic',
          severity: 'medium',
          message: 'Heavy traffic expected during peak hours (7-10 AM, 6-9 PM)',
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      'delhi': [
        {
          type: 'air_quality',
          severity: 'high',
          message: 'Poor air quality expected. Consider wearing masks.',
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      'goa': [
        {
          type: 'weather',
          severity: 'low',
          message: 'Monsoon season - expect occasional heavy rains',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    return mockAlerts[destination.toLowerCase()] || [];
  }

  // Create safety data JSON file
  async createSafetyDataFile() {
    try {
      const dataDir = path.join(this.__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'safetyData.json');
      fs.writeFileSync(filePath, JSON.stringify(this.safetyData, null, 2));
      console.log('Safety data file created successfully');
      return true;
    } catch (error) {
      console.error('Error creating safety data file:', error);
      return false;
    }
  }
}

export default new SafetyService();
