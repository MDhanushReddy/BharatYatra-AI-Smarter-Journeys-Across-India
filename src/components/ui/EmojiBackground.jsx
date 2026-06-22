import React, { useMemo } from 'react';

const EmojiBackground = () => {
  const emojis = [
    // Indian Monuments & Landmarks
    '🕌', '🛕', '🏛️', '🗿', '🏰', '⛩️', '🕍', '🕌', '🛕', '🏛️',
    // Travel & Tourism
    '✈️', '🗺️', '🧳', '🎒', '📷', '📸', '🎫', '🎟️', '📍', '🗺️',
    // Indian Culture & Heritage
    '🎭', '🎨', '🎪', '🎡', '🎢', '🎠', '🪔', '🕯️', '🎊', '🎉',
    // Nature & Landscapes
    '🏔️', '⛰️', '🌴', '🌳', '🌊', '🏖️', '🏝️', '🌅', '🌄', '🌆',
    // Transportation
    '🚗', '🚕', '🚙', '🚌', '🛺', '🚲', '🚢', '🚤', '🚁', '🚂',
    // Food & Culture
    '🍛', '🍜', '🍲', '🥘', '🍱', '🍕', '🍰', '☕', '🍵', '🥤',
    // Activities & Experiences
    '🏄‍♂️', '🏊‍♀️', '🚴‍♂️', '🧘‍♀️', '🎯', '🎲', '🎮', '📚', '🎬', '🎤',
    // Symbols & Icons
    '🌟', '⭐', '💫', '✨', '🌈', '🦋', '🦚', '🐘', '🦁', '🐅'
  ];

  // Generate emoji positions once using useMemo to prevent re-rendering
  const emojiLayers = useMemo(() => {
    const createEmojiLayer = (startIndex, endIndex, layerName) => {
      const layerEmojis = emojis.slice(startIndex, endIndex);
      return layerEmojis.map((emoji, index) => {
        // Use a seeded random approach for consistent positioning
        const seed = startIndex + index;
        const left = ((seed * 7.3) % 100).toFixed(2);
        const top = ((seed * 11.7) % 100).toFixed(2);
        const rotation = ((seed * 13.5) % 40) - 20; // -20 to 20 degrees
        const size = 18 + ((seed * 5.7) % 12); // 18 to 30px
        const delay = ((seed * 3.2) % 5).toFixed(1); // 0 to 5 seconds
        
        return {
          emoji,
          left: parseFloat(left),
          top: parseFloat(top),
          rotation: parseFloat(rotation.toFixed(1)),
          size: parseFloat(size.toFixed(1)),
          delay: parseFloat(delay),
          key: `${layerName}-${index}`
        };
      });
    };

    return {
      layer1: createEmojiLayer(0, 30, 'layer1'),
      layer2: createEmojiLayer(30, 60, 'layer2'),
      layer3: createEmojiLayer(60, 90, 'layer3')
    };
  }, []); // Empty dependency array - only calculate once

  return (
    <div className="emoji-background-container" aria-hidden="true">
      <div className="emoji-layer emoji-layer-1">
        {emojiLayers.layer1.map((item) => (
          <span
            key={item.key}
            className="emoji-icon layer1"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              fontSize: `${item.size}px`,
              animationDelay: `${item.delay}s`,
              '--initial-rotation': `${item.rotation}deg`
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
      <div className="emoji-layer emoji-layer-2">
        {emojiLayers.layer2.map((item) => (
          <span
            key={item.key}
            className="emoji-icon layer2"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              fontSize: `${item.size}px`,
              animationDelay: `${item.delay}s`,
              '--initial-rotation': `${item.rotation}deg`
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
      <div className="emoji-layer emoji-layer-3">
        {emojiLayers.layer3.map((item) => (
          <span
            key={item.key}
            className="emoji-icon layer3"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              fontSize: `${item.size}px`,
              animationDelay: `${item.delay}s`,
              '--initial-rotation': `${item.rotation}deg`
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EmojiBackground;

