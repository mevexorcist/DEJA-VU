'use client';

import React from 'react';

interface RightPanelProps {
  className?: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ className = '' }) => {
  return (
    <div className={`w-[350px] h-screen sticky top-0 py-3 ${className}`}>
      {/* Search Bar - X.com style */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="input-field pl-12 py-3 text-[15px]"
          />
        </div>
      </div>

      {/* Trending Section - X.com style */}
      <div className="bg-secondary rounded-2xl overflow-hidden mb-4">
        <h3 className="text-xl font-bold px-4 py-3 text-foreground">
          Trends for you
        </h3>
        
        <div className="trending-item">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Trending in Crypto</span>
            <button className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-muted-foreground">
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
              </svg>
            </button>
          </div>
          <div className="font-bold text-[15px] text-foreground">#Bitcoin</div>
          <div className="text-[13px] text-muted-foreground">125K posts</div>
        </div>

        <div className="trending-item">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Trending in DeFi</span>
            <button className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-muted-foreground">
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
              </svg>
            </button>
          </div>
          <div className="font-bold text-[15px] text-foreground">#Ethereum</div>
          <div className="text-[13px] text-muted-foreground">89K posts</div>
        </div>

        <div className="trending-item">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Trending</span>
            <button className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-muted-foreground">
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
              </svg>
            </button>
          </div>
          <div className="font-bold text-[15px] text-foreground">#Airdrop</div>
          <div className="text-[13px] text-muted-foreground">45K posts</div>
        </div>

        <a href="/explore" className="block px-4 py-4 text-primary text-[15px] hover:bg-[var(--hover-bg)] transition-colors">
          Show more
        </a>
      </div>

      {/* Who to follow - X.com style */}
      <div className="bg-secondary rounded-2xl overflow-hidden mb-4">
        <h3 className="text-xl font-bold px-4 py-3 text-foreground">
          Who to follow
        </h3>
        
        <div className="follow-suggestion">
          <div className="flex items-center gap-3">
            <div className="avatar avatar-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              V
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px] text-foreground hover:underline cursor-pointer">Vitalik.eth</span>
                <svg className="w-[18px] h-[18px] text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                </svg>
              </div>
              <span className="text-muted-foreground text-[15px]">@VitalikButerin</span>
            </div>
          </div>
          <button className="btn-secondary text-[13px] px-4 py-1.5 font-bold">
            Follow
          </button>
        </div>

        <div className="follow-suggestion">
          <div className="flex items-center gap-3">
            <div className="avatar avatar-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px] text-foreground hover:underline cursor-pointer">CZ 🔶 BNB</span>
                <svg className="w-[18px] h-[18px] text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                </svg>
              </div>
              <span className="text-muted-foreground text-[15px]">@caboringz</span>
            </div>
          </div>
          <button className="btn-secondary text-[13px] px-4 py-1.5 font-bold">
            Follow
          </button>
        </div>

        <a href="/explore" className="block px-4 py-4 text-primary text-[15px] hover:bg-[var(--hover-bg)] transition-colors">
          Show more
        </a>
      </div>

      {/* Active Airdrops - Linear.app card style */}
      <div className="bg-secondary rounded-2xl overflow-hidden">
        <h3 className="text-xl font-bold px-4 py-3 text-foreground">
          Active Airdrops
        </h3>
        
        <div className="follow-suggestion">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <div>
              <div className="font-bold text-[15px] text-foreground">LayerZero</div>
              <span className="text-muted-foreground text-[13px]">Ends in 5 days</span>
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>

        <div className="follow-suggestion">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <div className="font-bold text-[15px] text-foreground">Arbitrum</div>
              <span className="text-muted-foreground text-[13px]">Ends in 12 days</span>
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>

        <a href="/airdrops" className="block px-4 py-4 text-primary text-[15px] hover:bg-[var(--hover-bg)] transition-colors">
          View all airdrops
        </a>
      </div>

      {/* Footer Links */}
      <div className="px-4 py-3 text-[13px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Cookie Policy</a>
          <a href="#" className="hover:underline">Accessibility</a>
        </div>
        <div className="mt-1">© 2024 DEJA-VU</div>
      </div>
    </div>
  );
};
