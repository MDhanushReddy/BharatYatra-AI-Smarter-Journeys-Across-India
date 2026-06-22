import React from 'react';
import { getAttractionDirections, getAttractionStreetView, getAttractionPhotos, getAttractionReviews, getAttractionOpeningHours, getAttractionPopularTimes } from '../data/attractionsData';

const AttractionDetails = ({ attraction, userLocation }) => {
  const directions = getAttractionDirections(attraction, userLocation);
  const streetView = getAttractionStreetView(attraction);
  const photos = getAttractionPhotos(attraction);
  const reviews = getAttractionReviews(attraction);
  const openingHours = getAttractionOpeningHours(attraction);
  const popularTimes = getAttractionPopularTimes(attraction);

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{attraction.name}</h1>
          <p className="text-gray-600 mb-4">{attraction.description}</p>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <div className="flex space-x-4">
              <a
                href={directions.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Get Directions
              </a>
              <a
                href={streetView.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Street View
              </a>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">Category:</span> {attraction.category}
              </div>
              <div>
                <span className="font-semibold">Price:</span> {attraction.price === 0 ? 'Free' : `₹${attraction.price}`}
              </div>
              <div>
                <span className="font-semibold">Duration:</span> {attraction.duration}
              </div>
              <div>
                <span className="font-semibold">Rating:</span> {attraction.rating}/5
              </div>
            </div>
          </div>

          {openingHours && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Opening Hours</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day}>
                    <span className="font-semibold">{day}:</span> {hours}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {photos.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Photos</h2>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`${attraction.name} photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {reviews && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Reviews</h2>
              <div className="flex items-center mb-2">
                <span className="text-2xl font-bold">{reviews.rating}</span>
                <span className="text-gray-600 ml-2">({reviews.totalReviews} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {reviews.popularTags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {popularTimes && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Popular Times</h2>
              <div className="space-y-2">
                {Object.entries(popularTimes).map(([day, times]) => (
                  <div key={day}>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{day}</span>
                      <span className="text-gray-600">
                        {Math.max(...times)}% busy
                      </span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.max(...times)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Facilities</h2>
        <div className="flex flex-wrap gap-2">
          {attraction.facilities.map((facility, index) => (
            <span
              key={index}
              className="bg-green-100 px-2 py-1 rounded-full text-sm"
            >
              {facility}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttractionDetails; 