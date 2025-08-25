import React, { useState } from 'react';
import Logo from '../assets/logos/AD_logo.png';

interface PublicNavProps {
  onAffiliateClick?: () => void;
}

export function PublicNav({ onAffiliateClick }: PublicNavProps) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="relative px-4 sm:px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a href="/" title="Go Home">
            <img src={Logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25" />
          </a>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a 
            href="/affiliate"
            onClick={(e) => {
              if (onAffiliateClick) {
                e.preventDefault();
                onAffiliateClick();
              }
            }}
            className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
          >
            Become an Affiliate
          </a>
          <a href="/#pricing-section" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Pricing
          </a>
          <a href="#community" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Community
          </a>
          <a href="/privacy" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Privacy
          </a>
          <a href="/terms" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Terms
          </a>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="md:hidden p-2 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-800/50 hover:border-purple-500/50 transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span className="sr-only">Menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            {open ? (
              <path fillRule="evenodd" d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M3.75 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 6a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 6a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden mt-3 border border-gray-700/50 rounded-xl bg-gray-900/90 backdrop-blur-sm p-3 animate-fade-in">
          <div className="grid gap-2">
            <a 
              href="/affiliate"
              onClick={(e) => {
                if (onAffiliateClick) {
                  e.preventDefault();
                  onAffiliateClick();
                }
                setOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              Become an Affiliate
            </a>
            <a href="/#pricing-section" className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors" onClick={() => setOpen(false)}>Pricing</a>
            <a href="#community" className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors" onClick={() => setOpen(false)}>Community</a>
            <a href="/privacy" className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors" onClick={() => setOpen(false)}>Privacy</a>
            <a href="/terms" className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors" onClick={() => setOpen(false)}>Terms</a>
          </div>
        </div>
      )}
    </nav>
  );
}


