export const mockAttractions = [
  {
    id: 1,
    name: "Eiffel Tower",
    type: "Landmark",
    rating: 4.7,
    price: 25,
    image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f",
    location: "Paris, France",
    description: "Iconic iron lattice tower on the Champ de Mars in Paris.",
    openingHours: "9:00 AM - 12:45 AM",
    duration: 120,
    coordinates: [48.8584, 2.2945]
  },
  {
    id: 2,
    name: "Louvre Museum",
    type: "Museum",
    rating: 4.8,
    price: 17,
    image: "https://images.unsplash.com/photo-1499856871958-5b9357976b82",
    location: "Paris, France",
    description: "World's largest art museum and historic monument.",
    openingHours: "9:00 AM - 6:00 PM",
    duration: 180,
    coordinates: [48.8606, 2.3376]
  }
];

export const mockRestaurants = [
  {
    id: 1,
    name: "Le Cheval d'Or",
    cuisine: "French",
    rating: 4.6,
    priceRange: "€€€",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    location: "Paris, France",
    description: "Classic French cuisine in an elegant setting.",
    openingHours: "7:00 PM - 10:30 PM",
    dietaryOptions: ["Vegetarian", "Gluten-free"],
    coordinates: [48.8566, 2.3522]
  },
  {
    id: 2,
    name: "Bistrot Chez L'Ami Louis",
    cuisine: "French Bistro",
    rating: 4.4,
    priceRange: "€€",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
    location: "Paris, France",
    description: "Traditional French bistro fare in a cozy atmosphere.",
    openingHours: "12:00 PM - 10:00 PM",
    dietaryOptions: ["Vegetarian"],
    coordinates: [48.8649, 2.3800]
  }
];

export const mockAccommodations = [
  {
    id: 1,
    name: "Le Grand Hotel",
    type: "Hotel",
    rating: 4.8,
    price: 350,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    location: "Paris, France",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant"],
    roomTypes: ["Standard", "Deluxe", "Suite"],
    coordinates: [48.8697, 2.3284]
  },
  {
    id: 2,
    name: "Cozy Montmartre Apartment",
    type: "Apartment",
    rating: 4.6,
    price: 150,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    location: "Paris, France",
    amenities: ["WiFi", "Kitchen", "Washer"],
    roomTypes: ["1 Bedroom", "2 Bedroom"],
    coordinates: [48.8865, 2.3431]
  }
];

export const mockTransportation = [
  {
    id: 1,
    type: "Flight",
    operator: "Air France",
    departure: {
      time: "10:00 AM",
      location: "London Heathrow"
    },
    arrival: {
      time: "12:30 PM",
      location: "Paris Charles de Gaulle"
    },
    duration: 150,
    price: 200,
    class: "Economy",
    availableSeats: 45
  },
  {
    id: 2,
    type: "Train",
    operator: "Eurostar",
    departure: {
      time: "09:15 AM",
      location: "London St Pancras"
    },
    arrival: {
      time: "12:47 PM",
      location: "Paris Gare du Nord"
    },
    duration: 212,
    price: 150,
    class: "Standard",
    availableSeats: 88
  }
]; 