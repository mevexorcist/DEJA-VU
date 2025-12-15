'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

const airdrops = [
  { name: 'LayerZero', symbol: 'ZRO', status: 'Active', endsIn: '5 days', color: 'from-purple-500 to-pink-500' },
  { name: 'Arbitrum', symbol: 'ARB', status: 'Active', endsIn: '12 days', color: 'from-blue-500 to-indigo-500' },
  { name: 'zkSync', symbol: 'ZK', status: 'Upcoming', endsIn: 'TBA', color: 'from-violet-500 to-purple-500' },
  { name: 'Starknet', symbol: 'STRK', status: 'Active', endsIn: '3 days', color: 'from-orange-500 to-red-500' },
  { name: 'Scroll', symbol: 'SCR', status: 'Upcoming', endsIn: 'TBA', color: 'from-amber-500 to-orange-500' },
];

export default function AirdropsPage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Airdrops</h1>
          </div>
          <div className="flex">
            <button className="tab-item active">All</button>
            <button className="tab-item">Active</button>
            <button className="tab-item">Upcoming</button>
            <button className="tab-item">Completed</button>
          </div>
        </div>

        {/* Airdrops List */}
        <div>
          {airdrops.map((airdrop) => (
            <div key={airdrop.name} className="post-card">
              <div className="flex gap-4">
                <div className={`avatar avatar-lg bg-gradient-to-br ${airdrop.color} flex items-center justify-center text-white font-bold`}>
                  {airdrop.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[17px] text-foreground">{airdrop.name}</span>
                      <span className="text-muted-foreground text-[15px]">${airdrop.symbol}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      airdrop.status === 'Active' 
                        ? 'bg-green-500 bg-opacity-20 text-green-500' 
                        : 'bg-yellow-500 bg-opacity-20 text-yellow-500'
                    }`}>
                      {airdrop.status}
                    </span>
                  </div>
                  <p className="text-[15px] text-muted-foreground mt-1">
                    {airdrop.status === 'Active' ? `Ends in ${airdrop.endsIn}` : 'Coming soon'}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button className="btn-primary text-[13px] px-4 py-1.5">
                      {airdrop.status === 'Active' ? 'Participate' : 'Notify Me'}
                    </button>
                    <button className="btn-secondary text-[13px] px-4 py-1.5">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
