'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

const holdings = [
  { name: 'Bitcoin', symbol: 'BTC', amount: '0.5', value: '$21,500', change: '+2.4%', positive: true },
  { name: 'Ethereum', symbol: 'ETH', amount: '4.2', value: '$8,400', change: '+1.8%', positive: true },
  { name: 'Solana', symbol: 'SOL', amount: '50', value: '$5,000', change: '-0.5%', positive: false },
  { name: 'Arbitrum', symbol: 'ARB', amount: '1,000', value: '$1,200', change: '+5.2%', positive: true },
];

export default function PortfolioPage() {
  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
          <h1 className="text-xl font-bold">Portfolio</h1>
        </div>

        {/* Portfolio Summary */}
        <div className="p-4 border-b border-border">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold mt-1">$36,100.00</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm font-medium">
                +$845.20 (2.4%)
              </span>
              <span className="text-sm opacity-80">24h</span>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div>
          <h3 className="px-4 py-3 text-[17px] font-bold text-foreground">Holdings</h3>
          
          {holdings.map((holding) => (
            <div key={holding.symbol} className="post-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-foreground">
                    {holding.symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold text-[15px] text-foreground">{holding.name}</div>
                    <div className="text-[13px] text-muted-foreground">{holding.amount} {holding.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[15px] text-foreground">{holding.value}</div>
                  <div className={`text-[13px] ${holding.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Airdrop Rewards */}
        <div className="border-t border-border">
          <h3 className="px-4 py-3 text-[17px] font-bold text-foreground">Airdrop Rewards</h3>
          
          <div className="post-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  L
                </div>
                <div>
                  <div className="font-bold text-[15px] text-foreground">LayerZero</div>
                  <div className="text-[13px] text-muted-foreground">Pending claim</div>
                </div>
              </div>
              <button className="btn-primary text-[13px] px-4 py-1.5">Claim</button>
            </div>
          </div>

          <div className="post-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="font-bold text-[15px] text-foreground">Arbitrum</div>
                  <div className="text-[13px] text-green-500">Claimed · 1,000 ARB</div>
                </div>
              </div>
              <span className="text-[13px] text-muted-foreground">Mar 2024</span>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
