// Enhanced AI Chatbot Service with Agentic AI capabilities
// This service provides intelligent travel assistance with context awareness

import { getDestinationDetails, searchDestinations } from './indianLocationsAPI';

// AI Agent capabilities and knowledge base
const aiCapabilities = {
  travelPlanning: {
    description: "Help with itinerary planning, destination selection, and travel logistics",
    keywords: ["plan", "itinerary", "destination", "travel", "trip", "schedule"],
    actions: ["suggest_destinations", "create_itinerary", "optimize_route", "check_weather"]
  },
  budgetManagement: {
    description: "Assist with budget allocation, cost estimation, and financial planning",
    keywords: ["budget", "cost", "price", "money", "expensive", "cheap", "affordable"],
    actions: ["calculate_budget", "suggest_accommodations", "find_deals", "split_costs"]
  },
  accommodation: {
    description: "Provide hotel, hostel, and accommodation recommendations",
    keywords: ["hotel", "accommodation", "stay", "hostel", "resort", "booking"],
    actions: ["find_hotels", "compare_prices", "check_availability", "suggest_areas"]
  },
  foodDining: {
    description: "Recommend restaurants, local cuisine, and dining options",
    keywords: ["food", "restaurant", "eat", "cuisine", "dining", "meal", "hungry"],
    actions: ["suggest_restaurants", "find_local_food", "check_dietary_options", "reserve_table"]
  },
  transportation: {
    description: "Help with transport options, routes, and logistics",
    keywords: ["transport", "flight", "train", "bus", "taxi", "route", "travel"],
    actions: ["find_transport", "book_tickets", "check_schedules", "optimize_routes"]
  },
  culturalInfo: {
    description: "Provide cultural insights, local customs, and travel tips",
    keywords: ["culture", "customs", "local", "tips", "etiquette", "traditions"],
    actions: ["explain_culture", "provide_tips", "suggest_activities", "language_help"]
  },
  emergency: {
    description: "Handle emergency situations and provide safety information",
    keywords: ["emergency", "help", "safety", "danger", "problem", "urgent"],
    actions: ["provide_emergency_contacts", "suggest_safety_measures", "guide_to_help"]
  },
  weatherClimate: {
    description: "Provide weather forecasts, climate information, and seasonal recommendations",
    keywords: ["weather", "climate", "temperature", "rain", "sunny", "hot", "cold", "forecast", "season", "monsoon"],
    actions: ["check_weather", "forecast", "climate_info", "seasonal_tips"]
  }
};

// Travel-specific knowledge base
const travelKnowledge = {
  indianDestinations: {
    "delhi": {
      bestTime: "October to March",
      mustVisit: ["Red Fort", "Qutub Minar", "India Gate", "Lotus Temple"],
      localTransport: ["Metro", "Bus", "Auto-rickshaw"],
      foodSpecialties: ["Chole Bhature", "Parathas", "Kebabs", "Jalebi"],
      culturalTips: ["Respect local customs", "Bargain at markets", "Try street food"]
    },
    "mumbai": {
      bestTime: "October to February",
      mustVisit: ["Gateway of India", "Marine Drive", "Elephanta Caves"],
      localTransport: ["Local Train", "Metro", "Taxi"],
      foodSpecialties: ["Vada Pav", "Pav Bhaji", "Bhel Puri", "Misal Pav"],
      culturalTips: ["Be punctual", "Dress modestly", "Try local street food"]
    },
    "bangalore": {
      bestTime: "October to March",
      mustVisit: ["Cubbon Park", "Lalbagh", "Vidhana Soudha"],
      localTransport: ["Metro", "Bus", "Auto-rickshaw"],
      foodSpecialties: ["Masala Dosa", "Idli", "Filter Coffee", "Bisi Bele Bath"],
      culturalTips: ["Tech-savvy city", "Garden city", "Try filter coffee"]
    }
  },
  budgetRanges: {
    budget: { daily: 1000, accommodation: 500, food: 300, transport: 200 },
    midRange: { daily: 2500, accommodation: 1500, food: 800, transport: 200 },
    luxury: { daily: 5000, accommodation: 3000, food: 1500, transport: 500 }
  },
  dietaryOptions: {
    vegetarian: "Pure vegetarian options available everywhere",
    nonVegetarian: "Wide variety of non-veg options",
    vegan: "Limited but growing vegan options",
    jain: "Jain food available in most restaurants",
    halal: "Halal food widely available"
  }
};

// AI Response Generator with context awareness
export class AITravelAssistant {
  constructor() {
    this.conversationHistory = [];
    this.userContext = {
      currentLocation: null,
      destination: null,
      budget: null,
      groupSize: 1,
      interests: [],
      dietaryPreferences: [],
      travelDates: null
    };
  }

  // Main method to process user queries
  async processQuery(query, context = {}) {
    this.updateContext(context);
    this.conversationHistory.push({ role: 'user', content: query, timestamp: new Date() });

    const intent = this.identifyIntent(query);
    const response = await this.generateResponse(query, intent);
    
    this.conversationHistory.push({ role: 'assistant', content: response, timestamp: new Date() });
    
    return {
      response,
      intent,
      suggestions: this.generateSuggestions(intent),
      actions: this.getRecommendedActions(intent)
    };
  }

  // Identify user intent from query
  identifyIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    for (const [capability, info] of Object.entries(aiCapabilities)) {
      if (info.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return {
          capability,
          confidence: this.calculateConfidence(lowerQuery, info.keywords),
          description: info.description
        };
      }
    }
    
    return {
      capability: 'general',
      confidence: 0.5,
      description: 'General travel assistance'
    };
  }

  // Generate contextual response
  async generateResponse(query, intent) {
    const lowerQuery = query.toLowerCase();
    
    // Emergency responses
    if (intent.capability === 'emergency') {
      return this.handleEmergencyQuery(query);
    }
    
    // Budget-related queries
    if (intent.capability === 'budgetManagement') {
      return this.handleBudgetQuery(query);
    }
    
    // Destination queries
    if (lowerQuery.includes('destination') || lowerQuery.includes('place') || lowerQuery.includes('visit')) {
      return this.handleDestinationQuery(query);
    }
    
    // Accommodation queries
    if (intent.capability === 'accommodation') {
      return this.handleAccommodationQuery(query);
    }
    
    // Food queries
    if (intent.capability === 'foodDining') {
      return this.handleFoodQuery(query);
    }
    
    // Transportation queries
    if (intent.capability === 'transportation') {
      return this.handleTransportQuery(query);
    }
    
    // Cultural information
    if (intent.capability === 'culturalInfo') {
      return this.handleCulturalQuery(query);
    }
    
    // Weather/Climate queries - check this BEFORE general travel planning
    if (intent.capability === 'weatherClimate') {
      return this.handleWeatherQuery(query);
    }
    
    // General travel planning
    if (intent.capability === 'travelPlanning') {
      return this.handleTravelPlanningQuery(query);
    }
    
    // Default response
    return this.generateDefaultResponse(query);
  }

  // Handle emergency queries
  handleEmergencyQuery(query) {
    const emergencyContacts = {
      police: "100",
      ambulance: "102",
      fire: "101",
      tourist_helpline: "1363",
      women_helpline: "1091"
    };
    
    return `🚨 **Emergency Assistance**
    
**Emergency Contacts:**
- Police: ${emergencyContacts.police}
- Ambulance: ${emergencyContacts.ambulance}
- Fire: ${emergencyContacts.fire}
- Tourist Helpline: ${emergencyContacts.tourist_helpline}
- Women's Helpline: ${emergencyContacts.women_helpline}

**Safety Tips:**
- Stay in well-lit areas
- Keep emergency contacts handy
- Inform someone about your whereabouts
- Trust your instincts

Is there anything specific I can help you with regarding your safety?`;
  }

  // Handle budget-related queries
  handleBudgetQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('split') || lowerQuery.includes('divide')) {
      return this.handleBudgetSplitting(query);
    }
    
    if (lowerQuery.includes('cost') || lowerQuery.includes('price')) {
      return this.handleCostEstimation(query);
    }
    
    return `💰 **Budget Management Help**
    
I can help you with:
- Budget allocation across different categories
- Cost estimation for your trip
- Budget splitting for groups
- Finding budget-friendly options
- Comparing prices and deals

What specific budget assistance do you need?`;
  }

  // Handle budget splitting for groups
  handleBudgetSplitting(query) {
    const { groupSize, budget } = this.userContext;
    
    if (!groupSize || !budget) {
      return `To help you split the budget, I need to know:
- How many people are traveling?
- What's your total budget?
- What type of group (couple, family, friends)?

Please provide these details so I can calculate the per-person budget allocation.`;
    }
    
    const perPersonBudget = budget / groupSize;
    const budgetBreakdown = this.calculateBudgetBreakdown(perPersonBudget);
    
    return `💰 **Budget Split for ${groupSize} People**
    
**Total Budget:** ₹${budget}
**Per Person:** ₹${perPersonBudget}

**Suggested Allocation (per person):**
- Accommodation: ₹${budgetBreakdown.accommodation} (${Math.round(budgetBreakdown.accommodation/perPersonBudget*100)}%)
- Food & Dining: ₹${budgetBreakdown.food} (${Math.round(budgetBreakdown.food/perPersonBudget*100)}%)
- Transportation: ₹${budgetBreakdown.transport} (${Math.round(budgetBreakdown.transport/perPersonBudget*100)}%)
- Activities: ₹${budgetBreakdown.activities} (${Math.round(budgetBreakdown.activities/perPersonBudget*100)}%)
- Miscellaneous: ₹${budgetBreakdown.misc} (${Math.round(budgetBreakdown.misc/perPersonBudget*100)}%)

This ensures equal distribution while maintaining flexibility for individual preferences.`;
  }

  // Handle destination queries
  handleDestinationQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('suggest') || lowerQuery.includes('recommend')) {
      return this.suggestDestinations(query);
    }
    
    if (lowerQuery.includes('best time') || lowerQuery.includes('when to visit')) {
      return this.provideBestTimeInfo(query);
    }
    
    return `🏛️ **Destination Information**
    
I can help you with:
- Destination recommendations based on your interests
- Best time to visit different places
- Must-visit attractions
- Local transportation options
- Cultural insights and tips

What specific destination information are you looking for?`;
  }

  // Suggest destinations based on context
  suggestDestinations(query) {
    const { interests, budget, groupSize } = this.userContext;
    
    let suggestions = [];
    
    if (interests.includes('history') || interests.includes('heritage')) {
      suggestions.push("Delhi (Red Fort, Qutub Minar)", "Agra (Taj Mahal)", "Jaipur (Amber Fort)");
    }
    
    if (interests.includes('beaches') || interests.includes('relaxation')) {
      suggestions.push("Goa (Beaches)", "Kerala (Backwaters)", "Mumbai (Marine Drive)");
    }
    
    if (interests.includes('nature') || interests.includes('adventure')) {
      suggestions.push("Himachal Pradesh (Hill Stations)", "Kerala (Munnar)", "Rajasthan (Desert)");
    }
    
    if (interests.includes('culture') || interests.includes('food')) {
      suggestions.push("Kolkata (Cultural Heritage)", "Hyderabad (Biryani)", "Chennai (Temples)");
    }
    
    if (suggestions.length === 0) {
      suggestions = ["Delhi", "Mumbai", "Bangalore", "Goa", "Kerala"];
    }
    
    return `🌟 **Destination Recommendations**
    
Based on your interests and preferences, I recommend:

${suggestions.map((dest, index) => `${index + 1}. ${dest}`).join('\n')}

**Next Steps:**
- Would you like detailed information about any of these destinations?
- I can help you plan a detailed itinerary
- I can suggest accommodations and activities
- I can help with budget planning for your chosen destination

Which destination interests you most?`;
  }

  // Handle accommodation queries
  handleAccommodationQuery(query) {
    const { destination, budget } = this.userContext;
    
    if (!destination) {
      return `🏨 **Accommodation Assistance**
      
To suggest the best accommodations, I need to know:
- Your destination
- Your budget range
- Group size
- Preferred type (hotel, hostel, homestay)

Please provide these details for personalized recommendations.`;
    }
    
    const budgetRange = this.getBudgetRange(budget);
    const accommodationSuggestions = this.getAccommodationSuggestions(destination, budgetRange);
    
    return `🏨 **Accommodation Recommendations for ${destination}**
    
**Budget Range:** ${budgetRange}
**Suggested Options:**
${accommodationSuggestions.map(acc => `• ${acc.name} - ₹${acc.price}/night`).join('\n')}

**Tips:**
- Book in advance for better rates
- Check reviews and ratings
- Consider location vs. price trade-offs
- Look for package deals

Would you like me to help you compare specific options or find deals?`;
  }

  // Handle food queries
  handleFoodQuery(query) {
    const { destination, dietaryPreferences } = this.userContext;
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('dietary') || lowerQuery.includes('vegetarian') || lowerQuery.includes('vegan')) {
      return this.handleDietaryPreferences(query);
    }
    
    if (!destination) {
      return `🍽️ **Food & Dining Assistance**
      
I can help you with:
- Restaurant recommendations
- Local cuisine suggestions
- Dietary preference options
- Food tour planning
- Budget-friendly dining

Please specify your destination and dietary preferences for personalized recommendations.`;
    }
    
    const foodSuggestions = this.getFoodSuggestions(destination, dietaryPreferences);
    
    return `🍽️ **Food Recommendations for ${destination}**
    
**Local Specialties:**
${foodSuggestions.specialties.map(food => `• ${food}`).join('\n')}

**Restaurant Types:**
${foodSuggestions.restaurants.map(rest => `• ${rest}`).join('\n')}

**Dietary Options:**
${foodSuggestions.dietary.map(diet => `• ${diet}`).join('\n')}

**Tips:**
- Try local street food for authentic experience
- Ask about spice levels
- Check for hygiene ratings
- Consider meal timings

Would you like specific restaurant recommendations or food tour suggestions?`;
  }

  // Handle dietary preferences
  handleDietaryPreferences(query) {
    const { dietaryPreferences } = this.userContext;
    const lowerQuery = query.toLowerCase();
    
    let dietaryInfo = "";
    
    if (lowerQuery.includes('vegetarian')) {
      dietaryInfo = "🌱 **Vegetarian Options**: Widely available everywhere in India. Most restaurants have separate vegetarian sections.";
    } else if (lowerQuery.includes('vegan')) {
      dietaryInfo = "🌿 **Vegan Options**: Limited but growing. Look for plant-based restaurants and ask about dairy-free options.";
    } else if (lowerQuery.includes('jain')) {
      dietaryInfo = "🕉️ **Jain Food**: Available in most restaurants. Jain food excludes root vegetables and follows specific dietary rules.";
    } else if (lowerQuery.includes('halal')) {
      dietaryInfo = "🕌 **Halal Food**: Widely available, especially in Muslim-majority areas. Look for halal-certified restaurants.";
    } else {
      dietaryInfo = "🍽️ **Dietary Preferences**: I can help you find options for vegetarian, vegan, Jain, halal, or any other dietary requirements.";
    }
    
    return `${dietaryInfo}

**Tips for Dietary Requirements:**
- Always inform restaurants about your dietary needs
- Carry translation cards if needed
- Research local cuisine beforehand
- Look for specialty restaurants
- Ask about ingredients and preparation methods

Would you like specific restaurant recommendations based on your dietary preferences?`;
  }

  // Handle transportation queries
  handleTransportQuery(query) {
    const { destination } = this.userContext;
    
    if (!destination) {
      return `🚗 **Transportation Assistance**
      
I can help you with:
- Flight bookings and comparisons
- Train reservations
- Local transport options
- Route optimization
- Cost comparisons

Please specify your destination and travel dates for detailed transportation options.`;
    }
    
    const transportOptions = this.getTransportOptions(destination);
    
    return `🚗 **Transportation Options for ${destination}**
    
**Getting There:**
${transportOptions.intercity.map(option => `• ${option}`).join('\n')}

**Local Transport:**
${transportOptions.local.map(option => `• ${option}`).join('\n')}

**Tips:**
- Book flights/trains in advance for better rates
- Use local transport apps for convenience
- Consider package deals
- Check for seasonal variations

Would you like help with specific bookings or route planning?`;
  }

  // Handle cultural information queries
  handleCulturalQuery(query) {
    const { destination } = this.userContext;
    
    if (!destination) {
      return `🎭 **Cultural Information**
      
I can provide insights about:
- Local customs and traditions
- Cultural etiquette
- Language tips
- Religious considerations
- Social norms

Please specify your destination for detailed cultural information.`;
    }
    
    const culturalInfo = this.getCulturalInfo(destination);
    
    return `🎭 **Cultural Insights for ${destination}**
    
**Local Customs:**
${culturalInfo.customs.map(custom => `• ${custom}`).join('\n')}

**Etiquette Tips:**
${culturalInfo.etiquette.map(tip => `• ${tip}`).join('\n')}

**Language:**
${culturalInfo.language.map(lang => `• ${lang}`).join('\n')}

**Religious Considerations:**
${culturalInfo.religious.map(rel => `• ${rel}`).join('\n')}

**General Tips:**
- Respect local traditions
- Dress modestly when visiting religious sites
- Learn basic local phrases
- Be mindful of cultural sensitivities

Would you like more specific cultural information or language help?`;
  }

  // Handle weather/climate queries
  handleWeatherQuery(query) {
    const { destination, travelDates } = this.userContext;
    const lowerQuery = query.toLowerCase();
    
    if (!destination) {
      return `🌤️ **Weather & Climate Information**
      
I can provide:
- Current weather conditions
- Weather forecasts
- Climate information
- Seasonal recommendations
- Best time to visit

Please specify your destination for detailed weather information.`;
    }
    
    // Get destination details for weather info
    const destDetails = getDestinationDetails(destination);
    const weatherInfo = destDetails?.weather || {
      summer: "Warm to hot temperatures",
      monsoon: "Moderate to heavy rainfall",
      winter: "Pleasant weather"
    };
    
    let response = `🌤️ **Weather Information for ${destination}**
    
**Climate Overview:**
• **Summer**: ${weatherInfo.summer || "Warm to hot"}
• **Monsoon**: ${weatherInfo.monsoon || "Rainy season"}
• **Winter**: ${weatherInfo.winter || "Pleasant weather"}

**Best Time to Visit:**
${destDetails?.bestSeason || "October to March"}

**Current Season Recommendations:**
`;
    
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 3 && currentMonth <= 5) {
      response += "• It's summer - pack light cotton clothes\n• Stay hydrated and use sunscreen\n• Plan indoor activities during peak heat\n• Early morning and evening are best for outdoor activities";
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      response += "• It's monsoon season - carry an umbrella\n• Check for heavy rainfall warnings\n• Some outdoor activities may be restricted\n• Indoor attractions are ideal";
    } else {
      response += "• Pleasant weather - perfect for sightseeing\n• Light layers recommended\n• Ideal for outdoor activities\n• Great time for festivals and events";
    }
    
    response += `\n\n**Packing Tips:**
• Check weather forecast before packing
• Carry appropriate clothing for the season
• Include rain gear during monsoon
• Sun protection essentials for summer

Would you like a detailed weather forecast for your travel dates?`;
    
    return response;
  }

  // Handle travel planning queries
  handleTravelPlanningQuery(query) {
    return `🗺️ **Travel Planning Assistance**
    
I can help you create a comprehensive travel plan:

**Planning Services:**
• Itinerary creation and optimization
• Destination selection and comparison
• Budget planning and allocation
• Accommodation recommendations
• Transportation planning
• Activity suggestions
• Cultural insights and tips

**To get started, please provide:**
- Your destination(s)
- Travel dates
- Group size and type
- Budget range
- Interests and preferences

Would you like me to help you plan a specific trip or do you have questions about any particular aspect?`;
  }

  // Generate default response
  generateDefaultResponse(query) {
    return `🤖 **AI Travel Assistant**
    
I'm here to help you plan your perfect trip! I can assist with:

**Planning & Logistics:**
• Destination recommendations
• Itinerary creation
• Budget planning
• Transportation options

**Accommodation & Dining:**
• Hotel and accommodation suggestions
• Restaurant recommendations
• Dietary preference options
• Local food experiences

**Cultural & Practical:**
• Cultural insights and tips
• Local customs and etiquette
• Emergency information
• Language assistance

**What would you like help with today?**`;
  }

  // Helper methods
  updateContext(context) {
    this.userContext = { ...this.userContext, ...context };
  }

  calculateConfidence(query, keywords) {
    const matches = keywords.filter(keyword => query.includes(keyword)).length;
    return Math.min(matches / keywords.length, 1);
  }

  calculateBudgetBreakdown(perPersonBudget) {
    return {
      accommodation: Math.round(perPersonBudget * 0.4),
      food: Math.round(perPersonBudget * 0.3),
      transport: Math.round(perPersonBudget * 0.15),
      activities: Math.round(perPersonBudget * 0.1),
      misc: Math.round(perPersonBudget * 0.05)
    };
  }

  getBudgetRange(budget) {
    if (budget < 1500) return "Budget";
    if (budget < 3000) return "Mid-range";
    return "Luxury";
  }

  getAccommodationSuggestions(destination, budgetRange) {
    // Mock data - in real implementation, this would fetch from API
    return [
      { name: "Budget Hotel", price: 800 },
      { name: "Mid-range Hotel", price: 2000 },
      { name: "Luxury Resort", price: 5000 }
    ].filter(acc => {
      if (budgetRange === "Budget") return acc.price < 1500;
      if (budgetRange === "Mid-range") return acc.price >= 1500 && acc.price < 3000;
      return acc.price >= 3000;
    });
  }

  getFoodSuggestions(destination, dietaryPreferences) {
    const destinationInfo = travelKnowledge.indianDestinations[destination.toLowerCase()];
    
    if (destinationInfo) {
      return {
        specialties: destinationInfo.foodSpecialties,
        restaurants: ["Fine Dining", "Street Food", "Local Eateries", "Cafes"],
        dietary: Object.keys(travelKnowledge.dietaryOptions)
      };
    }
    
    return {
      specialties: ["Local Cuisine", "Street Food", "Traditional Dishes"],
      restaurants: ["Fine Dining", "Casual Dining", "Street Food"],
      dietary: Object.keys(travelKnowledge.dietaryOptions)
    };
  }

  getTransportOptions(destination) {
    return {
      intercity: ["Flights", "Trains", "Buses", "Private Cars"],
      local: ["Metro", "Buses", "Taxis", "Auto-rickshaws", "Walking"]
    };
  }

  getCulturalInfo(destination) {
    const destinationInfo = travelKnowledge.indianDestinations[destination.toLowerCase()];
    
    if (destinationInfo) {
      return {
        customs: destinationInfo.culturalTips,
        etiquette: ["Respect local customs", "Dress appropriately", "Be punctual"],
        language: ["Hindi", "English", "Local language"],
        religious: ["Respect religious sites", "Follow dress codes", "Be mindful of prayer times"]
      };
    }
    
    return {
      customs: ["Respect local traditions", "Follow cultural norms"],
      etiquette: ["Be polite", "Dress modestly", "Respect elders"],
      language: ["Hindi", "English"],
      religious: ["Respect all religions", "Follow temple rules"]
    };
  }

  generateSuggestions(intent) {
    const suggestions = {
      travelPlanning: ["Plan my itinerary", "Suggest destinations", "Help with budget"],
      budgetManagement: ["Split budget for group", "Find budget options", "Calculate costs"],
      accommodation: ["Find hotels", "Compare prices", "Check availability"],
      foodDining: ["Restaurant recommendations", "Local food", "Dietary options"],
      transportation: ["Book transport", "Find routes", "Compare options"],
      culturalInfo: ["Cultural tips", "Local customs", "Language help"],
      emergency: ["Emergency contacts", "Safety tips", "Get help"]
    };
    
    return suggestions[intent.capability] || ["How can I help?", "What do you need?"];
  }

  getRecommendedActions(intent) {
    const actions = {
      travelPlanning: ["create_itinerary", "suggest_destinations", "plan_activities"],
      budgetManagement: ["calculate_budget", "split_costs", "find_deals"],
      accommodation: ["search_hotels", "compare_prices", "book_accommodation"],
      foodDining: ["find_restaurants", "check_dietary", "reserve_table"],
      transportation: ["search_transport", "book_tickets", "plan_routes"],
      culturalInfo: ["explain_culture", "provide_tips", "language_help"],
      emergency: ["emergency_contacts", "safety_guide", "get_help"]
    };
    
    return actions[intent.capability] || [];
  }
}

// Export the AI Assistant class
export default AITravelAssistant;








