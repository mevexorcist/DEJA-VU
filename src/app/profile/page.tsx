'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

export default function ProfilePage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
          <div className="flex items-center gap-6">
            <button className="p-2 rounded-full hover:bg-[var(--hover-bg)]">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">User</h1>
              <p className="text-[13px] text-muted-foreground">12 posts</p>
            </div>
          </div>
        </div>

        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary to-blue-600"></div>
          <div className="absolute -bottom-16 left-4">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-full border-4 border-background flex items-center justify-center text-white text-4xl font-bold">
              U
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <button className="btn-secondary font-bold">Edit profile</button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-4 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">User</h2>
          <p className="text-muted-foreground">@user</p>
          
          <p className="text-[15px] text-foreground mt-3">
            Crypto enthusiast | Airdrop hunter | Building in Web3 🚀
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-[15px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Joined December 2024</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-3">
            <span className="text-[15px]">
              <span className="font-bold text-foreground">128</span>
              <span className="text-muted-foreground"> Following</span>
            </span>
            <span className="text-[15px]">
              <span className="font-bold text-foreground">1,024</span>
              <span className="text-muted-foreground"> Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button className="tab-item active">Posts</button>
          <button className="tab-item">Replies</button>
          <button className="tab-item">Media</button>
          <button className="tab-item">Likes</button>
        </div>

        {/* Posts */}
        <div>
          <article className="post-card">
            <div className="flex gap-3">
              <div className="avatar avatar-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-bold text-[15px] text-foreground">User</span>
                  <span className="text-muted-foreground text-[15px]">@user</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground text-[15px]">1d</span>
                </div>
                <div className="text-[15px] text-foreground mt-1 leading-normal">
                  Just claimed my first airdrop! 🎉 The future of crypto is here. <span className="text-primary">#crypto</span> <span className="text-primary">#airdrop</span>
                </div>
                <div className="flex items-center justify-between max-w-md mt-3 -ml-2">
                  <button className="engagement-btn reply">
                    <div className="engagement-icon">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-[13px]">5</span>
                  </button>
                  <button className="engagement-btn repost">
                    <div className="engagement-icon">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span className="text-[13px]">2</span>
                  </button>
                  <button className="engagement-btn like">
                    <div className="engagement-icon">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-[13px]">18</span>
                  </button>
                  <button className="engagement-btn share">
                    <div className="engagement-icon">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
