import React from 'react';

const DetailModal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[hsla(var(--card)/0.98)] backdrop-blur-md border-b border-[hsla(var(--border)/1)] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-earth">{title}</h2>
          <button
            onClick={onClose}
            className="text-earth hover:text-[hsla(var(--destructive)/1)] transition-colors p-2 rounded-lg hover:bg-[hsla(var(--misty-foam)/0.5)]"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-[hsla(var(--card)/0.98)] backdrop-blur-md border-t border-[hsla(var(--border)/1)] p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;

