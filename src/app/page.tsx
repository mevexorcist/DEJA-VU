'use client';

import { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

interface Post {
  id: number;
  author: string;
  handle: string;
  avatar: string;
  avatarType: 'image' | 'gradient';
  gradientColors?: string;
  verified: boolean;
  time: string;
  content: string;
  replies: number;
  reposts: number;
  likes: number;
  liked: boolean;
  reposted: boolean;
  airdropCard?: {
    title: string;
    description: string;
    status: string;
    endsIn: string;
  };
}

const initialPosts: Post[] = [
  {
    id: 1,
    author: 'Alex Chen',
    handle: '@alexchen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face',
    avatarType: 'image',
    verified: false,
    time: '2h',
    content: 'Just discovered a new #airdrop opportunity! 🎯 LayerZero is launching their token soon. Don\'t miss out on this one! #crypto #DeFi',
    replies: 12,
    reposts: 8,
    likes: 24,
    liked: false,
    reposted: false,
  },
  {
    id: 2,
    author: 'LayerZero',
    handle: '@layerzero_labs',
    avatar: 'L',
    avatarType: 'gradient',
    gradientColors: 'from-purple-500 to-pink-600',
    verified: true,
    time: '4h',
    content: '🚀 LayerZero Airdrop is LIVE! Complete cross-chain transactions to be eligible for the upcoming token distribution.\n\n✅ Bridge assets across chains\n✅ Use LayerZero protocols\n✅ Hold for snapshot\n\nDon\'t miss out! 🎯',
    replies: 156,
    reposts: 89,
    likes: 342,
    liked: false,
    reposted: false,
    airdropCard: {
      title: 'LayerZero Airdrop',
      description: 'Cross-chain interoperability protocol',
      status: 'Active',
      endsIn: '5 days',
    },
  },
  {
    id: 3,
    author: 'Bitcoin Magazine',
    handle: '@BitcoinMagazine',
    avatar: 'B',
    avatarType: 'gradient',
    gradientColors: 'from-orange-500 to-yellow-500',
    verified: true,
    time: '6h',
    content: 'BREAKING: #Bitcoin just hit a new all-time high! 🚀\n\nThe world\'s largest cryptocurrency continues its bull run as institutional adoption accelerates.',
    replies: 1200,
    reposts: 892,
    likes: 5400,
    liked: false,
    reposted: false,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState('');

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleRepost = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reposted: !post.reposted,
          reposts: post.reposted ? post.reposts - 1 : post.reposts + 1,
        };
      }
      return post;
    }));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    const post: Post = {
      id: Date.now(),
      author: 'User',
      handle: '@user',
      avatar: 'U',
      avatarType: 'gradient',
      gradientColors: 'from-primary to-violet-600',
      verified: false,
      time: 'now',
      content: newPost,
      replies: 0,
      reposts: 0,
      likes: 0,
      liked: false,
      reposted: false,
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(' ').map((word, j) => {
          if (word.startsWith('#')) {
            return <span key={j} className="text-primary hover:underline cursor-pointer">{word} </span>;
          }
          return word + ' ';
        })}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <ResponsiveLayout sidebar={<Sidebar />} rightPanel={<RightPanel />}>
      <div className="w-full">
        {/* Header Tabs */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
          <div className="flex">
            <button 
              className={`tab-item ${activeTab === 'foryou' ? 'active' : ''}`}
              onClick={() => setActiveTab('foryou')}
            >
              <span>For you</span>
            </button>
            <button 
              className={`tab-item ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              <span>Following</span>
            </button>
          </div>
        </div>

        {/* Post Composer */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex gap-3">
            <div className="avatar avatar-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold text-lg">
              U
            </div>
            <div className="flex-1">
              <textarea
                placeholder="What is happening?!"
                className="w-full bg-transparent text-xl placeholder-muted-foreground resize-none border-none outline-none py-3"
                rows={2}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-primary">
                  <button className="p-2 rounded-full hover:bg-primary hover:bg-opacity-10 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13z"/>
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary hover:bg-opacity-10 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 9.5C8 8.119 8.672 7 9.5 7S11 8.119 11 9.5 10.328 12 9.5 12 8 10.881 8 9.5zm6.5 2.5c.828 0 1.5-1.119 1.5-2.5S15.328 7 14.5 7 13 8.119 13 9.5s.672 2.5 1.5 2.5zM12 16c-2.224 0-3.021-2.227-3.051-2.316l-1.897.633c.05.15 1.271 3.684 4.949 3.684s4.898-3.533 4.949-3.684l-1.896-.638c-.033.095-.83 2.322-3.053 2.322z"/>
                    </svg>
                  </button>
                </div>
                <button 
                  className={`btn-primary px-5 py-1.5 text-[15px] ${!newPost.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="flex gap-3">
                {post.avatarType === 'image' ? (
                  <img src={post.avatar} alt={post.author} className="avatar avatar-lg" />
                ) : (
                  <div className={`avatar avatar-lg bg-gradient-to-br ${post.gradientColors} flex items-center justify-center text-white font-bold`}>
                    {post.avatar}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-[15px] text-foreground hover:underline cursor-pointer">{post.author}</span>
                    {post.verified && (
                      <svg className="w-[18px] h-[18px] text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                      </svg>
                    )}
                    <span className="text-muted-foreground text-[15px]">{post.handle}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground text-[15px] hover:underline cursor-pointer">{post.time}</span>
                  </div>
                  <div className="text-[15px] text-foreground mt-1 leading-normal whitespace-pre-wrap">
                    {renderContent(post.content)}
                  </div>
                  
                  {post.airdropCard && (
                    <div className="mt-3 border border-border rounded-2xl overflow-hidden">
                      <div className={`bg-gradient-to-r ${post.gradientColors} h-24`}></div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground">{post.airdropCard.title}</span>
                          <span className="bg-green-500 bg-opacity-20 text-green-500 text-xs font-bold px-2 py-1 rounded-full">
                            {post.airdropCard.status}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground mb-3">{post.airdropCard.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] text-muted-foreground">Ends in {post.airdropCard.endsIn}</span>
                          <button className="btn-primary text-[13px] px-4 py-1.5">Participate</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between max-w-md mt-3 -ml-2">
                    <button className="engagement-btn reply">
                      <div className="engagement-icon">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-[13px]">{formatNumber(post.replies)}</span>
                    </button>
                    <button 
                      className={`engagement-btn repost ${post.reposted ? 'text-green-500' : ''}`}
                      onClick={() => handleRepost(post.id)}
                    >
                      <div className="engagement-icon">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <span className="text-[13px]">{formatNumber(post.reposts)}</span>
                    </button>
                    <button 
                      className={`engagement-btn like ${post.liked ? 'text-pink-500' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <div className="engagement-icon">
                        <svg className="w-[18px] h-[18px]" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-[13px]">{formatNumber(post.likes)}</span>
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
          ))}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
