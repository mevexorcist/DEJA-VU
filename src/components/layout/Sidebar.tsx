'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';

  return (
    <nav className={`w-[275px] h-screen sticky top-0 flex flex-col px-2 py-3 ${className}`}>
      {/* Logo */}
      <a href="/" className="p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors w-fit mb-1">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#2DD4BF"/>
          <path d="M8 10 L8 22 Q8 24 10 24 L14 24" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 8 L26 24" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 8 L22 16 L26 8" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1 mt-1">
        <a href="/" className="nav-item active">
          <svg className="w-[26px] h-[26px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"/>
          </svg>
          <span className="text-xl">Home</span>
        </a>

        <a href="/explore" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xl">Explore</span>
        </a>

        <a href="/notifications" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-xl">Notifications</span>
        </a>

        <a href="/messages" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xl">Messages</span>
        </a>

        <a href="/airdrops" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xl">Airdrops</span>
        </a>

        <a href="/portfolio" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xl">Portfolio</span>
        </a>

        <a href="/profile" className="nav-item">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xl">Profile</span>
        </a>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="nav-item">
          {isDark ? (
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span className="text-xl">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Post Button */}
      <button className="btn-primary w-full py-3.5 mt-4 text-[17px] font-bold">
        Post
      </button>

      {/* User Profile at bottom with dropdown */}
      <div className="mt-auto pt-3 relative" ref={menuRef}>
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-2xl shadow-lg overflow-hidden z-50">
            <a href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[15px] font-bold text-foreground">View Profile</span>
            </a>
            <a href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[15px] font-bold text-foreground">Settings</span>
            </a>
            <button 
              onClick={() => {
                toggleTheme();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="text-[15px] font-bold text-foreground">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
            <div className="border-t border-border"></div>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[15px] font-bold">Log out</span>
            </button>
          </div>
        )}

        {/* Profile Button */}
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center gap-3 p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
        >
          <div className="avatar avatar-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold">
            U
          </div>
          <div className="flex-1 text-left hidden xl:block">
            <div className="font-bold text-[15px] text-foreground">User</div>
            <div className="text-muted-foreground text-[15px]">@user</div>
          </div>
          <svg className="w-5 h-5 text-foreground hidden xl:block" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
          </svg>
        </button>
      </div>
    </nav>
  );
};
