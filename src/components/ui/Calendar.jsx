import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Calendar = ({ 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  placeholder = "Select date",
  label,
  error,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Parse value to Date object with validation
  const selectedDate = (() => {
    if (!value) return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  })();

  // Set initial month to selected date or today
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      const today = new Date();
      if (!isNaN(today.getTime())) {
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      }
    }
  }, [value]);

  // Calculate position when opening (using viewport coordinates for fixed positioning)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      setPosition({
        top: rect.bottom + 8, // Viewport-relative for fixed positioning
        left: rect.left
      });
    }
  }, [isOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date) => {
    if (!date || isNaN(date.getTime())) return true;
    if (minDate) {
      try {
        const min = new Date(minDate);
        if (!isNaN(min.getTime())) {
          min.setHours(0, 0, 0, 0);
          if (date < min) return true;
        }
      } catch (error) {
        // Invalid minDate, ignore
      }
    }
    if (maxDate) {
      try {
        const max = new Date(maxDate);
        if (!isNaN(max.getTime())) {
          max.setHours(23, 59, 59, 999);
          if (date > max) return true;
        }
      } catch (error) {
        // Invalid maxDate, ignore
      }
    }
    return false;
  };

  const isDateSelected = (date) => {
    if (!selectedDate || !date) return false;
    try {
      const normalizedDate = new Date(date);
      if (isNaN(normalizedDate.getTime())) return false;
      normalizedDate.setHours(0, 0, 0, 0);
      const normalizedSelected = new Date(selectedDate);
      if (isNaN(normalizedSelected.getTime())) return false;
      normalizedSelected.setHours(0, 0, 0, 0);
      return normalizedDate.getTime() === normalizedSelected.getTime();
    } catch (error) {
      return false;
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    try {
      const today = new Date();
      if (isNaN(today.getTime())) return false;
      today.setHours(0, 0, 0, 0);
      const normalizedDate = new Date(date);
      if (isNaN(normalizedDate.getTime())) return false;
      normalizedDate.setHours(0, 0, 0, 0);
      return normalizedDate.getTime() === today.getTime();
    } catch (error) {
      return false;
    }
  };

  const handleDateSelect = (day) => {
    try {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (isNaN(newDate.getTime())) return;
      newDate.setHours(0, 0, 0, 0); // Normalize time to avoid timezone issues
      if (!isDateDisabled(newDate)) {
        const dateString = newDate.toISOString().split('T')[0];
        onChange(dateString);
        setIsOpen(false);
      }
    } catch (error) {
      // Invalid date, do nothing
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      try {
        const newDate = new Date(prev);
        if (isNaN(newDate.getTime())) {
          return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        }
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
        return newDate;
      } catch (error) {
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      }
    });
  };


  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = (() => {
    try {
      if (isNaN(currentMonth.getTime())) {
        const today = new Date();
        return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (error) {
      const today = new Date();
      return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  })();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="form-label mb-2 block">{label}</label>
      )}
      
      {/* Date Input Button */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`form-input form-input-with-icon w-full text-left cursor-pointer ${
            error ? 'border-red-500' : ''
          } ${!value ? 'text-gray-400' : ''}`}
        >
          <span className="block truncate">{value ? formatDate(value) : placeholder}</span>
        </button>
        
        {/* Calendar Icon - Right side, clickable */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Open calendar"
        >
          <svg 
            className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        
        {/* Left Calendar Icon (decorative) */}
        <div className="input-icon-wrapper input-icon-date pointer-events-none">
          <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Calendar Dropdown - Using Portal to render outside DOM hierarchy */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={calendarRef}
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-80 max-w-[90vw] z-[99999]"
          style={{ 
            position: 'fixed',
            top: position.top > 0 ? `${Math.max(8, Math.min(position.top, window.innerHeight - 400))}px` : 'auto',
            left: position.left > 0 ? `${Math.max(8, Math.min(position.left, window.innerWidth - 340))}px` : 'auto',
            zIndex: 99999,
            maxHeight: position.top > 0 ? `${Math.min(400, window.innerHeight - Math.max(8, position.top) - 20)}px` : '400px',
            overflowY: 'auto'
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-base font-semibold text-gray-800">{monthName}</h3>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              let date;
              try {
                date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                if (isNaN(date.getTime())) {
                  return <div key={`invalid-${index}`} className="aspect-square" />;
                }
              } catch (error) {
                return <div key={`error-${index}`} className="aspect-square" />;
              }
              
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded text-sm font-medium transition-colors
                    ${disabled 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : selected
                        ? 'bg-blue-600 text-white'
                        : today
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {error && (
        <p className="form-error mt-1">{error}</p>
      )}
    </div>
  );
};

export default Calendar;

