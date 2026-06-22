import React from 'react';

const PremiumLayout = ({ children }) => {
  return (
    <div>
      {/* AI Quick Actions Rail - Desktop Only */}
      <div style={{ position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'none' }} className="hidden lg:flex flex-col gap-2">
        <button className="btn btn-ghost btn-sm" data-tooltip="Summarize Trip" aria-label="Summarize Trip" title="Summarize Trip">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </button>
        <button className="btn btn-ghost btn-sm" data-tooltip="Optimize Route" aria-label="Optimize Route" title="Optimize Route">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
        <button className="btn btn-ghost btn-sm" data-tooltip="Budget Analysis" aria-label="Budget Analysis" title="Budget Analysis">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Smart Suggestions Rail - Desktop Only */}
      <div style={{ position: 'fixed', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'none' }} className="hidden lg:block">
        <div className="card" style={{ width: '280px' }}>
          <div className="card-header">
            <span>✨</span>
            <span className="card-title">AI Suggestions</span>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="text-sm font-semibold text-primary mb-1">Weather Alert</div>
              <div className="text-xs text-secondary">Consider indoor activities for Day 2 due to forecasted rain.</div>
            </div>
            <div className="mb-4">
              <div className="text-sm font-semibold text-primary mb-1">Time Optimization</div>
              <div className="text-xs text-secondary">Visit Gateway of India early morning to avoid crowds.</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-primary mb-1">Budget Tip</div>
              <div className="text-xs text-secondary">Local restaurants near Marine Drive offer better value.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLayout;

