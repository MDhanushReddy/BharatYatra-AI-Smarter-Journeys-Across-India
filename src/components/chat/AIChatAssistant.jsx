import React, { useState, useRef, useEffect } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';
import AITravelAssistant from '../../services/aiChatbotService';
import BrandLogo from '../ui/BrandLogo';
import { BRAND_NAME } from '../../lib/brand';

const AIChatAssistant = () => {
  const { tripDetails } = useTripPlanning();
  const [aiAssistant] = useState(new AITravelAssistant());
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hello! I\'m your AI travel assistant. I can help you plan your trip, suggest destinations, manage your budget, and provide cultural insights. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Use the enhanced AI assistant
      const context = {
        currentLocation: tripDetails.destination,
        destination: tripDetails.destination,
        budget: tripDetails.budget,
        groupSize: tripDetails.groupSize,
        interests: tripDetails.interests,
        dietaryPreferences: tripDetails.preferences?.foodPreference ? [tripDetails.preferences.foodPreference] : [],
        travelDates: tripDetails.startDate && tripDetails.endDate ? {
          start: tripDetails.startDate,
          end: tripDetails.endDate
        } : null
      };

      const aiResponse = await aiAssistant.processQuery(input, context);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: aiResponse.response,
        timestamp: new Date()
      }]);
      
      setSuggestions(aiResponse.suggestions || []);
      setIsTyping(false);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="travel-chatbox overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="cta-gradient px-6 py-4 flex items-center gap-3">
        <BrandLogo size={56} variant="full" className="chat-brand-logo" />
        <div>
          <h2 className="text-xl font-semibold text-[hsla(var(--sand-beige)/0.98)]">{BRAND_NAME}</h2>
          <p className="text-[hsla(var(--sand-beige)/0.85)] text-sm">Ask anything—routes, culture, budgets, weather.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[hsla(var(--card)/0.85)]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 travel-body-text text-sm ${
                message.type === 'user'
                  ? 'travel-chat-message-user'
                  : 'travel-chat-message-ai'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs travel-subtle-text mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="travel-chat-message-ai px-4 py-3">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-[hsla(var(--earth-brown)/0.55)] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[hsla(var(--earth-brown)/0.55)] animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-[hsla(var(--earth-brown)/0.55)] animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-[hsla(var(--border)/0.6)] px-4 py-3 bg-[hsla(var(--card)/0.9)]">
          <div className="text-sm travel-subtle-text mb-2">Quick suggestions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="travel-pill text-sm hover:opacity-85 transition-opacity duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[hsla(var(--border)/0.6)] px-4 py-4 bg-[hsla(var(--card)/0.94)]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your trip..."
            className="travel-input flex-1 px-4 py-3"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="travel-button px-8 py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isTyping ? '...' : 'Send'}
          </button>
        </div>
        <div className="mt-2 text-xs travel-subtle-text">
          Press Enter to send your message
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-[hsla(var(--border)/0.6)] px-4 py-4 bg-[hsla(var(--card)/0.92)]">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setInput('Show emergency contacts')}
            className="travel-pill text-sm hover:opacity-90 transition-opacity duration-200"
          >
            Emergency Contacts
          </button>
          <button
            onClick={() => setInput('Check weather')}
            className="travel-pill text-sm hover:opacity-90 transition-opacity duration-200"
          >
            Weather Updates
          </button>
          <button
            onClick={() => setInput('Find transportation')}
            className="travel-pill text-sm hover:opacity-90 transition-opacity duration-200"
          >
            Transportation
          </button>
          <button
            onClick={() => setInput('Restaurant recommendations')}
            className="travel-pill text-sm hover:opacity-90 transition-opacity duration-200"
          >
            Food & Dining
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatAssistant; 