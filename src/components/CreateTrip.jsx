import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BudgetAllocation from './trip/BudgetAllocation'
import Transportation from './trip/Transportation'
import { searchLocations } from '../services/api'

const indianDestinations = [
  // North India
  'Delhi', 'Chandigarh', 'Shimla, Himachal Pradesh', 'Manali, Himachal Pradesh', 'Dharamshala, Himachal Pradesh',
  'Kullu, Himachal Pradesh', 'Kasauli, Himachal Pradesh', 'Dalhousie, Himachal Pradesh', 'Kangra, Himachal Pradesh',
  'Srinagar, Jammu & Kashmir', 'Leh-Ladakh, Ladakh', 'Kargil, Ladakh', 'Pahalgam, Jammu & Kashmir',
  'Gulmarg, Jammu & Kashmir', 'Sonamarg, Jammu & Kashmir', 'Amritsar, Punjab', 'Chandigarh', 'Ludhiana, Punjab',
  'Jalandhar, Punjab', 'Patiala, Punjab', 'Bathinda, Punjab', 'Dehradun, Uttarakhand', 'Mussoorie, Uttarakhand',
  'Nainital, Uttarakhand', 'Rishikesh, Uttarakhand', 'Haridwar, Uttarakhand', 'Almora, Uttarakhand',
  'Ranikhet, Uttarakhand', 'Kausani, Uttarakhand', 'Auli, Uttarakhand', 'Jim Corbett National Park, Uttarakhand',
  
  // South India
  'Bangalore (Bengaluru), Karnataka', 'Mysore (Mysuru), Karnataka', 'Hampi, Karnataka', 'Coorg (Kodagu), Karnataka',
  'Mangalore, Karnataka', 'Udupi, Karnataka', 'Chikmagalur, Karnataka', 'Gokarna, Karnataka', 'Badami, Karnataka',
  'Pattadakal, Karnataka', 'Bijapur, Karnataka', 'Chennai, Tamil Nadu', 'Madurai, Tamil Nadu', 'Coimbatore, Tamil Nadu',
  'Tiruchirapalli, Tamil Nadu', 'Salem, Tamil Nadu', 'Tirunelveli, Tamil Nadu', 'Erode, Tamil Nadu',
  'Ooty (Udhagamandalam), Tamil Nadu', 'Kodaikanal, Tamil Nadu', 'Mahabalipuram, Tamil Nadu', 'Rameswaram, Tamil Nadu',
  'Kanchipuram, Tamil Nadu', 'Thanjavur, Tamil Nadu', 'Tirupati, Andhra Pradesh', 'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh', 'Guntur, Andhra Pradesh', 'Nellore, Andhra Pradesh', 'Anantapur, Andhra Pradesh',
  'Hyderabad, Telangana', 'Warangal, Telangana', 'Nizamabad, Telangana', 'Karimnagar, Telangana',
  'Kochi (Cochin), Kerala', 'Thiruvananthapuram, Kerala', 'Kozhikode, Kerala', 'Thrissur, Kerala',
  'Kollam, Kerala', 'Palakkad, Kerala', 'Kannur, Kerala', 'Kasaragod, Kerala', 'Munnar, Kerala',
  'Alleppey (Alappuzha), Kerala', 'Kovalam, Kerala', 'Varkala, Kerala', 'Thekkady, Kerala',
  'Wayanad, Kerala', 'Kumarakom, Kerala', 'Bekal, Kerala', 'Kannur, Kerala',
  
  // East India
  'Kolkata, West Bengal', 'Darjeeling, West Bengal', 'Sundarbans, West Bengal', 'Digha, West Bengal',
  'Shantiniketan, West Bengal', 'Bishnupur, West Bengal', 'Murshidabad, West Bengal', 'Gangtok, Sikkim',
  'Pelling, Sikkim', 'Ravangla, Sikkim', 'Lachung, Sikkim', 'Lachen, Sikkim', 'Yuksom, Sikkim',
  'Guwahati, Assam', 'Kaziranga National Park, Assam', 'Manas National Park, Assam', 'Jorhat, Assam',
  'Tezpur, Assam', 'Dibrugarh, Assam', 'Silchar, Assam', 'Dispur, Assam', 'Shillong, Meghalaya',
  'Cherrapunji, Meghalaya', 'Mawlynnong, Meghalaya', 'Dawki, Meghalaya', 'Tura, Meghalaya',
  'Imphal, Manipur', 'Ukhrul, Manipur', 'Chandel, Manipur', 'Bishnupur, Manipur', 'Aizawl, Mizoram',
  'Lunglei, Mizoram', 'Champhai, Mizoram', 'Kolasib, Mizoram', 'Agartala, Tripura', 'Udaipur, Tripura',
  'Dharmanagar, Tripura', 'Kailashahar, Tripura', 'Bhubaneswar, Odisha', 'Puri, Odisha', 'Konark, Odisha',
  'Cuttack, Odisha', 'Rourkela, Odisha', 'Berhampur, Odisha', 'Sambalpur, Odisha', 'Bargarh, Odisha',
  'Patna, Bihar', 'Gaya, Bihar', 'Bodh Gaya, Bihar', 'Nalanda, Bihar', 'Rajgir, Bihar', 'Vaishali, Bihar',
  'Muzaffarpur, Bihar', 'Darbhanga, Bihar', 'Bhagalpur, Bihar', 'Purnia, Bihar', 'Ranchi, Jharkhand',
  'Jamshedpur, Jharkhand', 'Dhanbad, Jharkhand', 'Bokaro, Jharkhand', 'Deoghar, Jharkhand', 'Hazaribagh, Jharkhand',
  
  // West India
  'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Nagpur, Maharashtra', 'Nashik, Maharashtra', 'Aurangabad, Maharashtra',
  'Solapur, Maharashtra', 'Amravati, Maharashtra', 'Kolhapur, Maharashtra', 'Sangli, Maharashtra',
  'Satara, Maharashtra', 'Ratnagiri, Maharashtra', 'Sindhudurg, Maharashtra', 'Lonavala, Maharashtra',
  'Mahabaleshwar, Maharashtra', 'Alibaug, Maharashtra', 'Matheran, Maharashtra', 'Lavasa, Maharashtra',
  'Ajanta Caves, Maharashtra', 'Ellora Caves, Maharashtra', 'Elephanta Caves, Maharashtra',
  'Ahmedabad, Gujarat', 'Surat, Gujarat', 'Vadodara, Gujarat', 'Rajkot, Gujarat', 'Bhavnagar, Gujarat',
  'Jamnagar, Gujarat', 'Gandhinagar, Gujarat', 'Junagadh, Gujarat', 'Dwarka, Gujarat', 'Somnath, Gujarat',
  'Palanpur, Gujarat', 'Bharuch, Gujarat', 'Anand, Gujarat', 'Nadiad, Gujarat', 'Mehsana, Gujarat',
  'Goa', 'Panaji, Goa', 'Margao, Goa', 'Vasco da Gama, Goa', 'Mapusa, Goa', 'Ponda, Goa', 'Bicholim, Goa',
  'Quepem, Goa', 'Canacona, Goa', 'Sanguem, Goa', 'Jaipur, Rajasthan', 'Jodhpur, Rajasthan', 'Udaipur, Rajasthan',
  'Jaisalmer, Rajasthan', 'Bikaner, Rajasthan', 'Ajmer, Rajasthan', 'Pushkar, Rajasthan', 'Mount Abu, Rajasthan',
  'Chittorgarh, Rajasthan', 'Kota, Rajasthan', 'Bharatpur, Rajasthan', 'Alwar, Rajasthan', 'Sikar, Rajasthan',
  'Bhilwara, Rajasthan', 'Pali, Rajasthan', 'Ganganagar, Rajasthan', 'Hanumangarh, Rajasthan',
  
  // Central India
  'Bhopal, Madhya Pradesh', 'Indore, Madhya Pradesh', 'Gwalior, Madhya Pradesh', 'Jabalpur, Madhya Pradesh',
  'Ujjain, Madhya Pradesh', 'Sagar, Madhya Pradesh', 'Dewas, Madhya Pradesh', 'Satna, Madhya Pradesh',
  'Rewa, Madhya Pradesh', 'Chhindwara, Madhya Pradesh', 'Ratlam, Madhya Pradesh', 'Morena, Madhya Pradesh',
  'Bhind, Madhya Pradesh', 'Guna, Madhya Pradesh', 'Shivpuri, Madhya Pradesh', 'Datia, Madhya Pradesh',
  'Khajuraho, Madhya Pradesh', 'Orchha, Madhya Pradesh', 'Pachmarhi, Madhya Pradesh', 'Mandu, Madhya Pradesh',
  'Sanchi, Madhya Pradesh', 'Omkareshwar, Madhya Pradesh', 'Maheshwar, Madhya Pradesh', 'Chitrakoot, Madhya Pradesh',
  'Amarkantak, Madhya Pradesh', 'Panna, Madhya Pradesh', 'Bandhavgarh National Park, Madhya Pradesh',
  'Kanha National Park, Madhya Pradesh', 'Pench National Park, Madhya Pradesh', 'Satpura National Park, Madhya Pradesh',
  'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh', 'Agra, Uttar Pradesh', 'Varanasi, Uttar Pradesh',
  'Meerut, Uttar Pradesh', 'Allahabad, Uttar Pradesh', 'Bareilly, Uttar Pradesh', 'Aligarh, Uttar Pradesh',
  'Moradabad, Uttar Pradesh', 'Ghaziabad, Uttar Pradesh', 'Noida, Uttar Pradesh', 'Firozabad, Uttar Pradesh',
  'Gorakhpur, Uttar Pradesh', 'Saharanpur, Uttar Pradesh', 'Muzaffarnagar, Uttar Pradesh', 'Mathura, Uttar Pradesh',
  'Ayodhya, Uttar Pradesh', 'Vrindavan, Uttar Pradesh', 'Fatehpur Sikri, Uttar Pradesh', 'Sarnath, Uttar Pradesh',
  'Kushinagar, Uttar Pradesh', 'Sravasti, Uttar Pradesh', 'Kapilavastu, Uttar Pradesh', 'Chitrakoot, Uttar Pradesh',
  
  // Union Territories
  'Delhi', 'Chandigarh', 'Puducherry', 'Lakshadweep', 'Andaman & Nicobar Islands', 'Daman & Diu', 'Dadra & Nagar Haveli',
  'Jammu & Kashmir', 'Ladakh'
].sort()

const destinationCategories = {
  'Popular Cities': [
    'Delhi', 'Mumbai, Maharashtra', 'Bangalore (Bengaluru), Karnataka', 'Hyderabad, Telangana', 'Kolkata, West Bengal',
    'Chennai, Tamil Nadu', 'Ahmedabad, Gujarat', 'Pune, Maharashtra', 'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh'
  ],
  'North India': [
    'Delhi', 'Chandigarh', 'Shimla, Himachal Pradesh', 'Manali, Himachal Pradesh', 'Dharamshala, Himachal Pradesh',
    'Srinagar, Jammu & Kashmir', 'Leh-Ladakh, Ladakh', 'Amritsar, Punjab', 'Dehradun, Uttarakhand', 'Mussoorie, Uttarakhand'
  ],
  'South India': [
    'Bangalore (Bengaluru), Karnataka', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Kochi (Cochin), Kerala',
    'Mysore (Mysuru), Karnataka', 'Hampi, Karnataka', 'Ooty (Udhagamandalam), Tamil Nadu', 'Munnar, Kerala',
    'Kodaikanal, Tamil Nadu', 'Coorg (Kodagu), Karnataka', 'Tirupati, Andhra Pradesh', 'Visakhapatnam, Andhra Pradesh'
  ],
  'East India': [
    'Kolkata, West Bengal', 'Darjeeling, West Bengal', 'Gangtok, Sikkim', 'Shillong, Meghalaya',
    'Kaziranga National Park, Assam', 'Sundarbans, West Bengal', 'Puri, Odisha', 'Konark, Odisha',
    'Bodh Gaya, Bihar', 'Patna, Bihar', 'Bhubaneswar, Odisha', 'Guwahati, Assam'
  ],
  'West India': [
    'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Goa', 'Ahmedabad, Gujarat', 'Surat, Gujarat',
    'Jaipur, Rajasthan', 'Jodhpur, Rajasthan', 'Udaipur, Rajasthan', 'Jaisalmer, Rajasthan',
    'Aurangabad, Maharashtra', 'Nagpur, Maharashtra', 'Nashik, Maharashtra'
  ],
  'Central India': [
    'Bhopal, Madhya Pradesh', 'Indore, Madhya Pradesh', 'Gwalior, Madhya Pradesh', 'Jabalpur, Madhya Pradesh',
    'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh', 'Agra, Uttar Pradesh', 'Varanasi, Uttar Pradesh',
    'Khajuraho, Madhya Pradesh', 'Orchha, Madhya Pradesh', 'Pachmarhi, Madhya Pradesh'
  ],
  'Hill Stations': [
    'Shimla, Himachal Pradesh', 'Manali, Himachal Pradesh', 'Ooty (Udhagamandalam), Tamil Nadu',
    'Darjeeling, West Bengal', 'Mussoorie, Uttarakhand', 'Nainital, Uttarakhand', 'Munnar, Kerala',
    'Kodaikanal, Tamil Nadu', 'Coorg (Kodagu), Karnataka', 'Gangtok, Sikkim'
  ],
  'Beach Destinations': [
    'Goa', 'Andaman & Nicobar Islands', 'Kovalam, Kerala', 'Varkala, Kerala', 'Puri, Odisha',
    'Digha, West Bengal', 'Gokarna, Karnataka', 'Alleppey (Alappuzha), Kerala', 'Lakshadweep',
    'Mahabalipuram, Tamil Nadu', 'Pondicherry', 'Daman & Diu'
  ],
  'Heritage Sites': [
    'Agra, Uttar Pradesh', 'Jaipur, Rajasthan', 'Varanasi, Uttar Pradesh', 'Hampi, Karnataka',
    'Khajuraho, Madhya Pradesh', 'Fatehpur Sikri, Uttar Pradesh', 'Ajanta Caves, Maharashtra',
    'Ellora Caves, Maharashtra', 'Mahabalipuram, Tamil Nadu', 'Konark, Odisha'
  ],
  'National Parks': [
    'Jim Corbett National Park, Uttarakhand', 'Kaziranga National Park, Assam', 'Manas National Park, Assam',
    'Bandhavgarh National Park, Madhya Pradesh', 'Kanha National Park, Madhya Pradesh', 'Pench National Park, Madhya Pradesh',
    'Ranthambore National Park, Rajasthan', 'Sundarbans, West Bengal', 'Gir National Park, Gujarat',
    'Periyar National Park, Kerala', 'Sariska Tiger Reserve, Rajasthan'
  ]
}

export default function CreateTrip() {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [formData, setFormData] = useState({
    destination: '',
    numberOfDays: 1,
    tripType: 'vacation',
    preferences: [],
    travelGroup: 'solo',
    groupType: 'friends',
    groupSize: 1,
    budget: null,
    transportation: [],
    language: 'english',
    sustainabilityPreference: false
  })

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.toLowerCase()

    // If no search query, show categorized destinations
    if (!query) {
      return Object.entries(destinationCategories).map(([category, destinations]) => ({
        category,
        destinations: destinations.slice(0, 5) // Show first 5 from each category
      }));
    }

    // Split static results into startsWith and includes buckets for better ranking
    const startsWith = []
    const includes = []
    for (const destination of indianDestinations) {
      const d = destination.toLowerCase()
      if (d.startsWith(query)) startsWith.push(destination)
      else if (d.includes(query)) includes.push(destination)
    }
    const staticRanked = [...startsWith, ...includes]

    // Add API results if available
    if (searchResults.length > 0) {
      const apiResults = searchResults.map(result => ({
        name: result.name,
        address: result.address,
        city: result.city,
        state: result.state,
        coordinates: result.coordinates
      }))
      return [...apiResults, ...staticRanked]
    }

    return staticRanked
  }, [searchQuery, searchResults])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'travelGroup') {
      if (value === 'solo') {
        setFormData(prev => ({
          ...prev,
          travelGroup: value,
          groupSize: 1,
          groupType: 'solo'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          travelGroup: value,
          groupSize: 2, // Set default group size to 2 when switching to group
          groupType: 'couple' // Default to couple when switching to group
        }));
      }
    } else if (name === 'groupType') {
      if (value === 'couple') {
        setFormData(prev => ({
          ...prev,
          groupType: value,
          groupSize: 2
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          groupType: value
        }));
      }
    } else if (name === 'groupSize') {
      let newSize = parseInt(value);
      if (isNaN(newSize)) newSize = 2; // Default to 2 if invalid input
      
      if (formData.groupType === 'couple') {
        newSize = 2;
      } else {
        // Ensure size is between 2 and 20 for non-couple groups
        newSize = Math.min(Math.max(2, newSize), 20);
      }
      
      setFormData(prev => ({
        ...prev,
        groupSize: newSize
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDestinationChange = async (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setFormData(prev => ({
      ...prev,
      destination: value
    }))
    setIsDropdownOpen(true)

    // Search using MapMyIndia API if query is long enough
    if (value.length >= 2) {
      setIsSearching(true)
      try {
        const { locations } = await searchLocations(value)
        setSearchResults(locations || [])
      } catch (error) {
        console.error('Error searching locations:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
    }
  }

  const handleDestinationSelect = (destination) => {
    const destinationName = typeof destination === 'string' ? destination : destination.name
    setFormData(prev => ({
      ...prev,
      destination: destinationName
    }))
    setSearchQuery(destinationName)
    setIsDropdownOpen(false)
    setSearchResults([])
  }

  const handlePreferenceChange = (preference) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Here we'll add AI processing later
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Plan Your Dream Indian Adventure</h1>
            <p className="text-blue-100 mt-2">Fill in the details below to create your perfect trip itinerary</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Destination Section */}
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">📍</span>
                  Choose Your Destination
                </h2>
                <div className="space-y-4">
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleDestinationChange}
                        onFocus={() => {
                          setIsDropdownOpen(true)
                          // Show static destinations when focusing on empty input
                          if (!searchQuery) {
                            setSearchResults([])
                          }
                        }}
                        placeholder="Type or select a destination in India"
                        className="w-full p-4 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl max-h-96 overflow-auto">
                        <div className="py-2">
                          {isSearching ? (
                            <div className="px-4 py-3 flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                              <span className="text-gray-600">Searching locations...</span>
                            </div>
                          ) : filteredDestinations.length > 0 ? (
                            // Check if we have categorized results (when no search query)
                            filteredDestinations[0]?.category ? (
                              filteredDestinations.map((categoryGroup, index) => (
                                <div key={index}>
                                  <div className="px-4 py-2 bg-gray-100 text-sm font-semibold text-gray-600 border-b">
                                    {categoryGroup.category}
                                  </div>
                                  {categoryGroup.destinations.map((destination, destIndex) => (
                                    <div
                                      key={destIndex}
                                      className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex items-center space-x-2"
                                      onClick={() => handleDestinationSelect(destination)}
                                    >
                                      <span className="text-blue-500">📍</span>
                                      <span className="font-medium">{destination}</span>
                                    </div>
                                  ))}
                                </div>
                              ))
                            ) : (
                              // Regular search results
                              filteredDestinations.map((destination, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex items-center space-x-2"
                                  onClick={() => handleDestinationSelect(destination)}
                                >
                                  <span className="text-blue-500">📍</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{destination.name || destination}</div>
                                    {destination.address && (
                                      <div className="text-sm text-gray-500">{destination.address}</div>
                                    )}
                                    {destination.city && destination.state && (
                                      <div className="text-xs text-gray-400">{destination.city}, {destination.state}</div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )
                          ) : (
                            <div 
                              className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex items-center space-x-2"
                              onClick={() => handleDestinationSelect(searchQuery)}
                            >
                              <span className="text-green-500">➕</span>
                              <span>Add "<span className="font-medium">{searchQuery}</span>" as custom destination</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Details Section */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">📅</span>
                  Trip Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="number"
                      name="numberOfDays"
                      value={formData.numberOfDays}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                    <select
                      name="tripType"
                      value={formData.tripType}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="vacation">Vacation</option>
                      <option value="business">Business Trip</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Travel Group Section */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">👥</span>
                  Travel Group
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="travelGroup"
                      value={formData.travelGroup}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="solo">Solo</option>
                      <option value="group">Group</option>
                    </select>
                  </div>

                  {formData.travelGroup === 'group' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                        <select
                          name="groupType"
                          value={formData.groupType}
                          onChange={handleInputChange}
                          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="friends">Friends</option>
                          <option value="family">Family</option>
                          <option value="couple">Couple</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of People
                          {formData.groupType === 'couple' && <span className="text-gray-500 ml-1">(fixed at 2)</span>}
                          {formData.groupType !== 'couple' && <span className="text-gray-500 ml-1">(2-20 people)</span>}
                        </label>
                        <input
                          type="number"
                          name="groupSize"
                          value={formData.groupSize}
                          onChange={handleInputChange}
                          min={2}
                          max={20}
                          step={1}
                          disabled={formData.groupType === 'couple'}
                          placeholder="Number of people"
                          className={`w-full p-3 border-2 rounded-lg ${
                            formData.groupType === 'couple'
                              ? 'bg-gray-50 text-gray-500 border-gray-200'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                        />
                        {formData.groupSize > 20 && formData.groupType !== 'couple' && (
                          <p className="text-red-500 text-sm mt-1">Maximum group size is 20 people</p>
                        )}
                        {formData.groupSize < 2 && formData.travelGroup === 'group' && formData.groupType !== 'couple' && (
                          <p className="text-red-500 text-sm mt-1">Minimum group size is 2 people</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Preferences Section */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">⭐</span>
                  Travel Preferences
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {['adventure', 'nature', 'cultural', 'relaxation', 'food', 'shopping'].map(pref => (
                    <label key={pref} className="flex items-center space-x-3 p-3 border-2 border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={formData.preferences.includes(pref)}
                        onChange={() => handlePreferenceChange(pref)}
                        className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 focus:ring-blue-200"
                      />
                      <span className="capitalize text-gray-700">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget Section */}
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">💰</span>
                  Budget Planning
                </h2>
                <BudgetAllocation formData={formData} onUpdate={handleInputChange} />
              </div>

              {/* Transportation Section */}
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-blue-500 mr-2">🚗</span>
                  Transportation Options
                </h2>
                <Transportation formData={formData} onUpdate={handleInputChange} />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
              >
                Create My Trip Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 