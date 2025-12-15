'use client';

import { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);

  return (
    <ResponsiveLayout sidebar={<Sidebar />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
          <div className="flex items-center gap-6">
            <a href="/" className="p-2 rounded-full hover:bg-[var(--hover-bg)]">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Settings List */}
        <div>
          {/* Account Section */}
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Account</h2>
          </div>

          <a href="/profile" className="flex items-center justify-between px-4 py-4 hover:bg-[var(--hover-bg)] transition-colors border-b border-border">
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[15px] text-foreground">Your account</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <button 
            onClick={() => setPrivateAccount(!privateAccount)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-[var(--hover-bg)] transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-left">
                <span className="text-[15px] text-foreground block">Private account</span>
                <span className="text-[13px] text-muted-foreground">Only approved followers can see your posts</span>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors ${privateAccount ? 'bg-primary' : 'bg-muted-foreground'} relative`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${privateAccount ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </button>

          {/* Appearance Section */}
          <div className="px-4 py-3 border-b border-border mt-4">
            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Appearance</h2>
          </div>

          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-4 mb-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-[15px] text-foreground">Theme</span>
            </div>
            <div className="flex gap-3 ml-9">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${resolvedTheme === 'light' ? 'border-primary bg-primary bg-opacity-10' : 'border-border'}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-[13px] font-medium text-foreground">Light</span>
                </div>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${resolvedTheme === 'dark' ? 'border-primary bg-primary bg-opacity-10' : 'border-border'}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-[13px] font-medium text-foreground">Dark</span>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="px-4 py-3 border-b border-border mt-4">
            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Notifications</h2>
          </div>

          <button 
            onClick={() => setNotifications(!notifications)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-[var(--hover-bg)] transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="text-left">
                <span className="text-[15px] text-foreground block">Push notifications</span>
                <span className="text-[13px] text-muted-foreground">Get notified about new activity</span>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-muted-foreground'} relative`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </button>

          <button 
            onClick={() => setEmailNotifications(!emailNotifications)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-[var(--hover-bg)] transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <span className="text-[15px] text-foreground block">Email notifications</span>
                <span className="text-[13px] text-muted-foreground">Receive updates via email</span>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors ${emailNotifications ? 'bg-primary' : 'bg-muted-foreground'} relative`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </button>

          {/* Danger Zone */}
          <div className="px-4 py-3 border-b border-border mt-4">
            <h2 className="text-[13px] font-bold text-red-500 uppercase tracking-wide">Danger Zone</h2>
          </div>

          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-red-500 hover:bg-opacity-10 transition-colors border-b border-border text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[15px] font-bold">Log out</span>
          </button>

          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-red-500 hover:bg-opacity-10 transition-colors text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-[15px] font-bold">Delete account</span>
          </button>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
