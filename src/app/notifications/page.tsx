'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

export default function NotificationsPage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          <div className="flex">
            <button className="tab-item active">All</button>
            <button className="tab-item">Mentions</button>
          </div>
        </div>

        {/* Notifications List */}
        <div>
          {/* Like notification */}
          <div className="post-card">
            <div className="flex gap-3">
              <div className="w-8 flex justify-center">
                <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.45-4.55-.284-6.14 1.254-1.72 3.806-2.3 5.84-1.35l.368.17.369-.17c2.034-.95 4.586-.37 5.84 1.35 1.166 1.59 1.076 3.64-.284 6.14z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="avatar w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">V</div>
                </div>
                <p className="text-[15px] text-foreground">
                  <span className="font-bold">Vitalik.eth</span> liked your post
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Just discovered a new #airdrop opportunity!
                </p>
              </div>
            </div>
          </div>

          {/* Repost notification */}
          <div className="post-card">
            <div className="flex gap-3">
              <div className="w-8 flex justify-center">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="avatar w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xs">C</div>
                </div>
                <p className="text-[15px] text-foreground">
                  <span className="font-bold">CZ</span> reposted your post
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  LayerZero Airdrop is LIVE!
                </p>
              </div>
            </div>
          </div>

          {/* Follow notification */}
          <div className="post-card">
            <div className="flex gap-3">
              <div className="w-8 flex justify-center">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="avatar w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">L</div>
                  </div>
                  <button className="btn-secondary text-[13px] px-4 py-1.5 font-bold">Follow</button>
                </div>
                <p className="text-[15px] text-foreground mt-2">
                  <span className="font-bold">LayerZero</span> followed you
                </p>
              </div>
            </div>
          </div>

          {/* Empty state hint */}
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-[15px]">You&apos;re all caught up!</p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
