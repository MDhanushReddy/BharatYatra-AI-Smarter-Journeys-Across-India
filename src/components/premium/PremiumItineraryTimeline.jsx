import React from 'react';

const PremiumItineraryTimeline = ({ itinerary, onActivityClick }) => {
  return (
    <div className="premium-itinerary-container">
      <div className="premium-itinerary-header">
        <h2>Your Itinerary</h2>
        <button className="micro-btn">Edit</button>
      </div>
      <div className="premium-timeline">
        {itinerary.map((day, dayIndex) => (
          <div key={dayIndex} className="timeline-day stagger-item">
            <div className="timeline-day-header">
              <div>
                <div className="timeline-day-number">Day {dayIndex + 1}</div>
                <div className="muted-text">{day.date}</div>
              </div>
            </div>
            {day.activities?.map((activity, actIndex) => (
              <div
                key={actIndex}
                className="timeline-activity"
                onClick={() => onActivityClick?.(activity)}
              >
                <div className="activity-time">{activity.startTime}</div>
                <div className="activity-details">
                  <h4>{activity.name}</h4>
                  <p>{activity.description || activity.location}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumItineraryTimeline;

