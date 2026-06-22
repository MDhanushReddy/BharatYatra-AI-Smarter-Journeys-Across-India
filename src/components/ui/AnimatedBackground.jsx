import React, { useEffect, useRef, useState } from 'react';

const AnimatedBackground = () => {
  const containerRef = useRef(null);
  const cursorFollowerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Monument motifs (emoji for now, can be replaced with SVGs)
  const monuments = [
    { emoji: '🕌', name: 'taj-dome' },
    { emoji: '🛕', name: 'temple' },
    { emoji: '🗿', name: 'stupa' },
    { emoji: '🏛️', name: 'arch' },
    { emoji: '☸️', name: 'chakra' },
  ];

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Cursor follower (desktop only)
    if (!isMobile && !reducedMotion && cursorFollowerRef.current) {
      let mouseX = 0;
      let mouseY = 0;
      let followerX = 0;
      let followerY = 0;
      let isClicking = false;

      const handleMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };

      const handleMouseDown = () => {
        isClicking = true;
        if (cursorFollowerRef.current) {
          cursorFollowerRef.current.classList.add('cursor-clicking');
        }
      };

      const handleMouseUp = () => {
        isClicking = false;
        if (cursorFollowerRef.current) {
          cursorFollowerRef.current.classList.remove('cursor-clicking');
        }
      };

      const animate = () => {
        // Smooth lag effect (60-120ms delay)
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        if (cursorFollowerRef.current) {
          cursorFollowerRef.current.style.left = `${followerX}px`;
          cursorFollowerRef.current.style.top = `${followerY}px`;
        }

        requestAnimationFrame(animate);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      animate();

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile, reducedMotion]);

  // Generate random monuments (7-15 total)
  const generateMonuments = () => {
    const count = Math.floor(Math.random() * 9) + 7; // 7-15
    const elements = [];
    
    for (let i = 0; i < count; i++) {
      const monument = monuments[Math.floor(Math.random() * monuments.length)];
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 0.8 + Math.random() * 1.7; // 0.8-2.5s
      const sway = Math.random() * 20 - 10; // -10px to 10px horizontal sway
      
      elements.push({
        id: i,
        ...monument,
        left,
        top,
        delay,
        duration,
        sway,
      });
    }
    
    return elements;
  };

  const [monumentElements] = useState(generateMonuments());

  return (
    <>
      <div 
        ref={containerRef}
        className={`animated-background ${reducedMotion ? 'reduced-motion' : ''} ${isMobile ? 'mobile' : ''}`}
        aria-hidden="true"
      >
        {monumentElements.map((monument) => (
          <div
            key={monument.id}
            className="monument-motif"
            style={{
              left: `${monument.left}%`,
              top: `${monument.top}%`,
              animationDelay: `${monument.delay}s`,
              animationDuration: `${monument.duration}s`,
              '--sway': `${monument.sway}px`,
            }}
          >
            <span className="monument-emoji" aria-label={monument.name}>
              {monument.emoji}
            </span>
          </div>
        ))}
      </div>
      
      {/* Cursor follower - desktop only */}
      {!isMobile && !reducedMotion && (
        <div
          ref={cursorFollowerRef}
          className="cursor-follower"
          aria-hidden="true"
        >
          <span className="cursor-emoji">✈️</span>
        </div>
      )}
    </>
  );
};

export default AnimatedBackground;

