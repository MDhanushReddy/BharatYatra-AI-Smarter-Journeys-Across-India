import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';

const IntroductionPage = () => {
  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="section">
        <div className="container">
          <div className="gradient-hero">
            <div className="gradient-hero-content">
              <div className="hero-logo-wrap">
                <BrandLogo size={220} variant="full" className="hero-brand-logo" />
              </div>
              <p>
                Plan smarter trips across India with AI-powered recommendations, real-time weather,
                budget tools, and curated destinations from Kashmir to Kanyakumari.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link to="/plan" className="btn btn-cta btn-lg">
                  Start Planning Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/dashboard" className="btn btn-outline btn-lg">
                  Explore the Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2>Powerful Features for Carefree Planning</h2>
            <p className="text-secondary max-w-3xl mx-auto">
              Every detail is lovingly designed to simplify decisions and add warmth to your exploration.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="card">
              <div className="mb-4" style={{ color: 'var(--accent-primary)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="card-title">Destination Discovery</h3>
              <p className="card-body">
                Explore 50+ handpicked destinations across India with lovingly curated local insights and highlights.
              </p>
            </div>
            <div className="card">
              <div className="mb-4" style={{ color: 'var(--accent-secondary)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="card-title">Smart Budgeting</h3>
              <p className="card-body">
                Relax into your journey with clarity on costs for accommodations, activities, dining, and travel essentials.
              </p>
            </div>
            <div className="card">
              <div className="mb-4" style={{ color: 'var(--highlight-cta)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="card-title">Attraction Selection</h3>
              <p className="card-body">
                Browse thousands of experiences tailored to your vibe, complete with curated recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2>Experience Thoughtful Guidance</h2>
            <p className="text-secondary max-w-3xl mx-auto">
              We keep things calm and collected while making sure your plans stay flexible and weather-smart.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="card">
              <h3 className="card-title">Intelligent Itinerary Generation</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="badge badge-primary">1</span>
                  <p className="text-secondary">Select your destination and travel dates.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="badge badge-primary">2</span>
                  <p className="text-secondary">Share your interests, pace, and must-dos.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="badge badge-primary">3</span>
                  <p className="text-secondary">Receive balanced, AI-curated days with room to breathe.</p>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="card-title">Smart Weather Integration</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="badge badge-secondary">✓</span>
                  <p className="text-secondary">Enjoy weather-ready attraction suggestions for every scenario.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="badge badge-secondary">✓</span>
                  <p className="text-secondary">See sunrise, golden hour, and off-peak timing at a glance.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="badge badge-secondary">✓</span>
                  <p className="text-secondary">Access cozy alternatives when the forecast shifts last minute.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2>How It Works</h2>
            <p className="text-secondary max-w-2xl mx-auto">
              A guided path that keeps every step simple, supported, and stress-free.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-8">
            {[
              { title: 'Enter Details', description: 'Share your travel preferences and companions.' },
              { title: 'Select Attractions', description: 'Handpick experiences from AI-curated lists.' },
              { title: 'Review Budget', description: 'Understand costs before you commit.' },
              { title: 'Plan Complete', description: 'Receive a ready-to-go itinerary with backups.' },
            ].map((item, index) => (
              <div key={item.title} className="card text-center">
                <div className="badge badge-primary mb-4" style={{ fontSize: '1.5rem', width: '3rem', height: '3rem', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {index + 1}
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-body">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Feedback Section */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2>What Travelers Are Saying</h2>
            <p className="text-secondary max-w-3xl mx-auto">
              Real stories from journeys made smoother, safer, and sweeter.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                quote: 'The AI recommendations were spot-on! Saved me hours of research and planning.',
                author: 'Rahul M., Delhi Escape',
              },
              {
                quote: 'Budget planning helped me savor every moment of my Rajasthan tour without overspending.',
                author: 'Sarah K., Desert Adventure',
              },
              {
                quote: 'Weather-smart tips kept our Kerala getaway flexible yet fully packed with memories.',
                author: 'John D., Monsoon Wanderer',
              },
            ].map((testimonial) => (
              <div key={testimonial.author} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg" style={{ color: 'var(--highlight-secondary)' }}>★★★★★</span>
                  <span className="text-secondary">5.0</span>
                </div>
                <p className="text-secondary italic mb-4">"{testimonial.quote}"</p>
                <p className="text-muted text-sm">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section">
        <div className="container">
          <div className="gradient-hero">
            <div className="gradient-hero-content">
              <h2>Ready to Start Your Journey?</h2>
              <p>
                Join thousands of happy travelers embracing kinder, smarter trip planning with AI at their side.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/plan" className="btn btn-cta btn-lg">
                  Start Planning Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/register" className="btn btn-outline btn-lg">
                  Create an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntroductionPage; 