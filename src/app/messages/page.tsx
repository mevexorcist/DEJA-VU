'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';

export default function MessagesPage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <button className="p-2 rounded-full hover:bg-[var(--hover-bg)]">
              <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 5.333 8-5.333V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 5.334-8-5.334V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search Direct Messages"
              className="input-field pl-12 py-3 text-[15px]"
            />
          </div>
        </div>

        {/* Messages List */}
        <div>
          {/* Message item */}
          <div className="post-card">
            <div className="flex gap-3">
              <div className="avatar avatar-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                L
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px] text-foreground">LayerZero</span>
                    <svg className="w-[18px] h-[18px] text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                    </svg>
                    <span className="text-muted-foreground text-[15px]">@layerzero_labs</span>
                  </div>
                  <span className="text-muted-foreground text-[13px]">2h</span>
                </div>
                <p className="text-[15px] text-muted-foreground truncate mt-1">
                  Thanks for participating in our airdrop! 🎉
                </p>
              </div>
            </div>
          </div>

          {/* Message item 2 */}
          <div className="post-card">
            <div className="flex gap-3">
              <div className="avatar avatar-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px] text-foreground">Arbitrum</span>
                    <svg className="w-[18px] h-[18px] text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                    </svg>
                    <span className="text-muted-foreground text-[15px]">@arbitrum</span>
                  </div>
                  <span className="text-muted-foreground text-[13px]">1d</span>
                </div>
                <p className="text-[15px] text-muted-foreground truncate mt-1">
                  Welcome to the Arbitrum ecosystem!
                </p>
              </div>
            </div>
          </div>

          {/* Empty state */}
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-[15px]">Select a message to view</p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
