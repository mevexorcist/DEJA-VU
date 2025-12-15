'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

const trendingTopics = [
  { name: 'Bitcoin', posts: '125K' },
  { name: 'Ethereum', posts: '89K' },
  { name: 'Solana', posts: '67K' },
  { name: 'Airdrop', posts: '45K' },
  { name: 'DeFi', posts: '38K' },
  { name: 'NFT', posts: '32K' },
  { name: 'LayerZero', posts: '28K' },
  { name: 'Arbitrum', posts: '24K' },
];

export default function ExplorePage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
          <h1 className="text-xl font-bold">Explore</h1>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
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

        {/* Trending Topics */}
        <div>
          <h2 className="px-4 py-3 text-xl font-bold">Trending in Crypto</h2>
          
          {trendingTopics.map((topic, i) => (
            <div key={topic.name} className="trending-item">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">{i + 1} · Trending</span>
                <button className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-muted-foreground">
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                  </svg>
                </button>
              </div>
              <div className="font-bold text-[15px] text-foreground">#{topic.name}</div>
              <div className="text-[13px] text-muted-foreground">{topic.posts} posts</div>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
