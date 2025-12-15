# Design Document - DEJA-VU

## Overview

DEJA-VU adalah platform media sosial crypto yang mengadopsi fitur dasar seperti X (Twitter) dengan pembeda khusus untuk komunitas cryptocurrency. Platform ini dibangun menggunakan teknologi open source modern dengan arsitektur yang scalable dan real-time.

**Teknologi Stack (Open Source):**

- **Frontend**: Next.js 14 dengan TypeScript dan Tailwind CSS
- **Backend**: Node.js dengan Express.js atau Fastify
- **Database**: PostgreSQL dengan Supabase untuk real-time features
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime untuk live updates
- **Wallet Integration**: Web3.js/Ethers.js untuk blockchain connectivity
- **State Management**: Zustand atau Redux Toolkit
- **UI Components**: Radix UI atau Headless UI
- **Deployment**: Docker containers dengan Nginx

## Architecture

### Design Rationale

**Technology Stack Decisions:**

- **Next.js 14**: Chosen for its excellent developer experience, built-in optimization, and strong TypeScript support. The App Router provides better performance and developer experience for complex routing needs.
- **Supabase**: Selected for real-time capabilities, built-in authentication, and PostgreSQL compatibility. This eliminates the need for separate WebSocket infrastructure while providing robust real-time features essential for social media interactions.
- **PostgreSQL**: Chosen for its reliability, JSONB support for flexible data structures (airdrop requirements, user preferences), and excellent performance with proper indexing.
- **Open Source Focus**: All selected technologies are open source to ensure long-term sustainability, cost-effectiveness, and community support.

**Architectural Decisions:**

- **Microservices Approach**: Services are logically separated but can be deployed as a monolith initially for simplicity, with the ability to split into separate services as the platform scales.
- **Real-time First**: Supabase Realtime is used extensively to provide immediate feedback for social interactions, airdrop notifications, and portfolio updates.
- **Security by Design**: Row Level Security (RLS) policies ensure data isolation, API key encryption protects sensitive exchange credentials, and wallet signature verification ensures authentic ownership.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │ Exchange APIs   │
│   (Next.js)     │    │   (PWA/Web)     │    │   (External)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway/CDN       │
                    │      (Nginx/Vercel)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    Backend Services       │
                    │   (Node.js/Express)       │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   PostgreSQL    │    │  Supabase       │    │  Redis Cache    │
│   (Primary DB)  │    │  (Realtime)     │    │  (Sessions)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Microservices Architecture

1. **User Service**: Authentication, profiles, following/followers
2. **Content Service**: Posts, media uploads, hashtags
3. **Social Service**: Likes, reposts, replies, notifications
4. **Airdrop Service**: Airdrop tracking, notifications, eligibility
5. **Exchange Service**: API integrations, portfolio tracking
6. **Wallet Service**: Wallet connections, balance tracking

## Components and Interfaces

### Core Components

#### 1. User Management

```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  walletAddress?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile extends User {
  nftCollection?: NFT[];
  portfolio?: Portfolio;
  exchangeConnections?: ExchangeConnection[];
}
```

#### 2. Content System

```typescript
interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
  hashtags: string[];
  mentions: string[];
  likeCount: number;
  repostCount: number;
  replyCount: number;
  isThread: boolean;
  threadId?: string;
  parentPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Timeline {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: string;
}
```

#### 3. Airdrop System

```typescript
interface Airdrop {
  id: string;
  title: string;
  description: string;
  projectName: string;
  logoUrl: string;
  requirements: AirdropRequirement[];
  eligibilityCriteria: EligibilityCriteria;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'ended' | 'upcoming';
  estimatedReward?: string;
  blockchain: string;
}

interface AirdropRequirement {
  id: string;
  description: string;
  isCompleted: boolean;
  verificationMethod: 'wallet' | 'social' | 'manual';
}

interface UserAirdrop {
  userId: string;
  airdropId: string;
  status: 'bookmarked' | 'participating' | 'completed' | 'claimed';
  completedRequirements: string[];
  bookmarkedAt?: Date;
  completedAt?: Date;
}
```

#### 4. Exchange Integration

```typescript
interface ExchangeConnection {
  id: string;
  userId: string;
  exchangeName: string;
  apiKeyHash: string; // Encrypted
  isActive: boolean;
  permissions: string[];
  lastSyncAt: Date;
  connectionStatus: 'connected' | 'error' | 'disconnected' | 'reconnecting';
  lastError?: string;
  errorCount: number;
  createdAt: Date;
}

interface Portfolio {
  userId: string;
  totalValue: number;
  currency: 'USD' | 'BTC' | 'ETH';
  assets: Asset[];
  lastUpdatedAt: Date;
}

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  exchange?: string;
}
```

#### 5. Wallet Integration

```typescript
interface WalletConnection {
  userId: string;
  address: string;
  blockchain: 'ethereum' | 'bitcoin' | 'solana' | 'polygon';
  isVerified: boolean;
  connectedAt: Date;
}

interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  imageUrl: string;
  blockchain: string;
  collection: string;
}
```

#### 6. Direct Messaging System (Requirement 4.5)

```typescript
interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrls?: string[];
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: DirectMessage;
  lastActivity: Date;
  unreadCount: number;
  isActive: boolean; // Only active if both users follow each other
}

interface MessagePermission {
  userId: string;
  canReceiveFrom: string[]; // List of user IDs who can send DMs
  mutualFollowersOnly: boolean;
  isEnabled: boolean;
}
```

### API Interfaces

#### REST API Endpoints

```typescript
// User endpoints
GET    /api/users/profile/:username
POST   /api/users/follow/:userId
DELETE /api/users/unfollow/:userId
GET    /api/users/:userId/followers
GET    /api/users/:userId/following

// Content endpoints
GET    /api/posts/timeline
POST   /api/posts
GET    /api/posts/:postId
POST   /api/posts/:postId/like
POST   /api/posts/:postId/repost
POST   /api/posts/:postId/reply
DELETE /api/posts/:postId
GET    /api/posts/search?hashtag=:tag
GET    /api/posts/search?mention=:username

// Airdrop endpoints
GET    /api/airdrops
GET    /api/airdrops/:airdropId
POST   /api/airdrops/:airdropId/bookmark
GET    /api/users/airdrops/bookmarked
POST   /api/airdrops/:airdropId/participate
GET    /api/airdrops/recommendations/:walletAddress

// Exchange endpoints
POST   /api/exchanges/connect
GET    /api/exchanges/portfolio
DELETE /api/exchanges/:connectionId/disconnect
GET    /api/exchanges/:connectionId/status
POST   /api/exchanges/:connectionId/reconnect
GET    /api/exchanges/quick-trade/:symbol

// Wallet endpoints
POST   /api/wallets/connect
GET    /api/wallets/portfolio
POST   /api/wallets/verify
DELETE /api/wallets/disconnect
GET    /api/wallets/:address/nfts

// Notification endpoints
GET    /api/notifications
POST   /api/notifications/:notificationId/read
GET    /api/notifications/unread-count

// Direct message endpoints (for mutual followers)
GET    /api/messages/:userId
POST   /api/messages/:userId
GET    /api/messages/conversations
```

#### WebSocket Events (Supabase Realtime)

```typescript
// Real-time events
interface RealtimeEvents {
  new_post: Post;
  post_liked: { postId: string; likeCount: number };
  post_reposted: { postId: string; repostCount: number };
  new_follower: { followerId: string; followeeId: string };
  new_notification: Notification;
  airdrop_reminder: { airdropId: string; timeLeft: number };
  portfolio_update: Portfolio;
  exchange_error: { connectionId: string; error: string };
  exchange_reconnected: { connectionId: string };
}
```

#### UI Layout Components (Requirements 6.1, 6.2)

```typescript
// Responsive layout system
interface LayoutConfig {
  breakpoints: {
    mobile: number; // 768px
    tablet: number; // 1024px
    desktop: number; // 1280px
  };
  layouts: {
    mobile: MobileLayout;
    desktop: DesktopLayout;
  };
}

interface DesktopLayout {
  sidebar: {
    width: number;
    position: 'left' | 'right';
    collapsible: boolean;
  };
  mainContent: {
    maxWidth: number;
    columns: number; // Multi-column like X/Twitter
  };
  rightPanel: {
    width: number;
    widgets: string[]; // ['trending', 'portfolio', 'airdrops']
  };
}

interface MobileLayout {
  navigation: 'bottom' | 'top';
  fullWidth: boolean;
  swipeGestures: boolean;
  collapsibleSections: string[];
}

// Theme system (Requirement 6.5)
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  persistence: {
    storage: 'localStorage' | 'cookie';
    key: string;
  };
}
```

## Data Models

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  mentions TEXT[],
  like_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_thread BOOLEAN DEFAULT FALSE,
  thread_id UUID,
  parent_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

-- Airdrops table
CREATE TABLE airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  requirements JSONB,
  eligibility_criteria JSONB,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'upcoming',
  estimated_reward VARCHAR(100),
  blockchain VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User airdrops (bookmarks and participation)
CREATE TABLE user_airdrops (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  airdrop_id UUID REFERENCES airdrops(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'bookmarked',
  completed_requirements TEXT[],
  bookmarked_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, airdrop_id)
);

-- Exchange connections
CREATE TABLE exchange_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_name VARCHAR(50) NOT NULL,
  api_key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  permissions TEXT[],
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet connections
CREATE TABLE wallet_connections (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL,
  blockchain VARCHAR(50) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, address, blockchain)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct messages and conversations (Requirement 4.5)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2) -- Ensure consistent ordering
);

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes for Performance

```sql
-- Timeline queries
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Social features
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_id);

-- Search and hashtags
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX idx_posts_mentions ON posts USING GIN(mentions);

-- Airdrop queries
CREATE INDEX idx_airdrops_status_end_date ON airdrops(status, end_date);
CREATE INDEX idx_user_airdrops_user_status ON user_airdrops(user_id, status);

-- Direct messaging queries
CREATE INDEX idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX idx_conversations_activity ON conversations(last_activity DESC);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_direct_messages_unread ON direct_messages(conversation_id, is_read) WHERE is_read = FALSE;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Acceptance Criteria Testing Prework

**1.1 WHEN pengguna membuat postingan baru THEN DEJA-VU SHALL menyimpan konten dan menampilkannya di timeline**
Thoughts: This is about the core functionality that should work for any valid post content. We can generate random posts and verify they appear in the timeline after creation.
Testable: yes - property

**1.2 WHEN pengguna menambahkan hashtag THEN DEJA-VU SHALL membuat hashtag tersebut dapat diklik dan dicari**
Thoughts: This is a universal rule about hashtag processing that should apply to all posts containing hashtags. We can test that hashtags are properly extracted and made searchable.
Testable: yes - property

**1.3 WHEN pengguna mention pengguna lain dalam postingan THEN DEJA-VU SHALL menyimpan mention dalam postingan dan memungkinkan sistem notifikasi untuk mengirim notifikasi kepada pengguna yang di-mention**
Thoughts: This is a rule that should apply to all mentions in posts. We can test that mentions are properly stored in posts and that the notification system can create notifications for mentioned users. The focus is on proper mention storage and notification capability.
Testable: yes - property

**1.4 WHEN pengguna mengunggah media THEN DEJA-VU SHALL memproses dan menampilkan gambar/video dalam postingan**
Thoughts: This is about media processing that should work for any valid media file. We can test that uploaded media is properly processed and displayed.
Testable: yes - property

**1.5 WHERE postingan melebihi batas karakter THEN DEJA-VU SHALL membuat thread otomatis**
Thoughts: This is a rule about automatic thread creation for long content. We can test that posts exceeding character limits trigger thread creation.
Testable: yes - property

**2.1 WHEN airdrop baru ditambahkan THEN DEJA-VU SHALL menampilkan di feed khusus airdrop dan mengirim notifikasi**
Thoughts: This is about airdrop feed updates that should work for any new airdrop. We can test that new airdrops appear in feeds and trigger notifications.
Testable: yes - property

**2.2 WHEN pengguna bookmark airdrop THEN DEJA-VU SHALL menyimpan ke daftar airdrop personal dengan status tracking**
Thoughts: This is about bookmark persistence that should work for any airdrop. We can test that bookmarks are saved with correct status tracking.
Testable: yes - property

**2.3 WHILE airdrop masih aktif THEN DEJA-VU SHALL menampilkan countdown timer dan checklist requirements**
Thoughts: This is about active airdrop display requirements. We can test that active airdrops show timers and checklists.
Testable: yes - property

**2.4 WHEN deadline airdrop mendekat THEN DEJA-VU SHALL mengirim reminder notification**
Thoughts: This is about reminder system for approaching deadlines. We can test that reminders are sent to participating users.
Testable: yes - property

**2.5 WHERE pengguna memenuhi kriteria wallet THEN DEJA-VU SHALL memberikan rekomendasi airdrop yang eligible**
Thoughts: This is about wallet-based recommendations. We can test that eligible airdrops are recommended based on wallet criteria.
Testable: yes - property

**3.1 WHEN pengguna menginstal exchange extension THEN DEJA-VU SHALL memverifikasi dan mengaktifkan koneksi API**
Thoughts: This is about exchange extension verification. We can test that extensions are properly verified and activated.
Testable: yes - property

**3.2 WHEN pengguna menghubungkan exchange API THEN DEJA-VU SHALL menyimpan kredensial dengan enkripsi yang aman**
Thoughts: This is about credential encryption for all exchange connections. We can test that credentials are properly encrypted.
Testable: yes - property

**3.3 WHILE extension aktif THEN DEJA-VU SHALL menampilkan widget portfolio dan balance real-time**
Thoughts: This is about real-time portfolio display for active extensions. We can test that widgets display correctly.
Testable: yes - property

**3.4 WHEN pengguna mengklik quick trade THEN DEJA-VU SHALL membuka interface trading terintegrasi**
Thoughts: This is about quick trade interface activation. We can test that the trading interface opens correctly.
Testable: yes - property

**3.5 IF koneksi exchange error THEN DEJA-VU SHALL menampilkan status error dan tombol reconnect**
Thoughts: This is about error handling and UI response to exchange connection errors. We can test that error status and reconnect options are displayed.
Testable: yes - property

**4.1 WHEN pengguna mengikuti akun lain THEN DEJA-VU SHALL menambahkan postingan akun tersebut ke timeline pengguna**
Thoughts: This is about follow action timeline integration. We can test that followed users' posts appear in timelines.
Testable: yes - property

**4.2 WHEN pengguna memberikan like, repost, atau reply THEN DEJA-VU SHALL menyimpan interaksi dan memberikan notifikasi**
Thoughts: This is about social interaction persistence and notifications. We can test that interactions are saved and notifications sent.
Testable: yes - property

**4.3 WHEN pengguna menerima notifikasi THEN DEJA-VU SHALL menampilkan badge counter dan daftar notifikasi**
Thoughts: This is about notification display system. We can test that badges and lists are updated correctly.
Testable: yes - property

**4.4 WHEN pengguna membuka profil THEN DEJA-VU SHALL menampilkan follower count, following count, dan postingan**
Thoughts: This is about profile information display. We can test that all required information is shown correctly.
Testable: yes - property

**4.5 WHERE pengguna saling follow THEN DEJA-VU SHALL mengaktifkan fitur direct message**
Thoughts: This is about mutual follow DM activation. We can test that DM features are enabled for mutual followers.
Testable: yes - property

**5.1 WHEN pengguna connect wallet THEN DEJA-VU SHALL memverifikasi ownership melalui wallet signature**
Thoughts: This is about wallet signature verification. We can test that ownership is properly verified through signatures.
Testable: yes - property

**5.2 WHEN wallet berhasil terhubung THEN DEJA-VU SHALL menampilkan alamat wallet di profil pengguna**
Thoughts: This is about wallet address profile display. We can test that connected wallets appear in profiles.
Testable: yes - property

**5.3 WHILE wallet terhubung THEN DEJA-VU SHALL menampilkan portfolio balance di sidebar atau widget**
Thoughts: This is about connected wallet balance display. We can test that balances are shown in widgets.
Testable: yes - property

**5.4 WHEN pengguna disconnect wallet THEN DEJA-VU SHALL menghapus data wallet dari session**
Thoughts: This is about wallet disconnection data cleanup. We can test that wallet data is properly removed.
Testable: yes - property

**5.5 WHERE pengguna memiliki NFT THEN DEJA-VU SHALL menampilkan NFT collection di profil**
Thoughts: This is about NFT collection profile display. We can test that NFT collections are shown in profiles.
Testable: yes - property

**6.1 WHEN pengguna mengakses via desktop browser THEN DEJA-VU SHALL menampilkan layout multi-kolom seperti X**
Thoughts: This is about desktop layout display. This is a UI design requirement that's not easily testable as a property.
Testable: no

**6.2 WHEN pengguna mengakses via mobile browser THEN DEJA-VU SHALL menampilkan interface mobile-optimized**
Thoughts: This is about mobile interface optimization. This is a UI design requirement that's not easily testable as a property.
Testable: no

**6.3 WHEN pengguna login THEN DEJA-VU SHALL menyimpan session dan preferensi pengguna**
Thoughts: This is about user session and preference persistence. We can test that sessions and preferences are saved correctly.
Testable: yes - property

**6.4 WHILE pengguna scroll timeline THEN DEJA-VU SHALL memuat konten baru secara infinite scroll dengan pagination yang konsisten dan menampilkan indikator loading saat memuat konten tambahan**
Thoughts: This is about infinite scroll content loading with consistent pagination. We can test that pagination parameters are respected and data is returned in consistent format.
Testable: yes - property

**6.5 WHEN sistem memuat konten timeline dengan pagination THEN DEJA-VU SHALL mengembalikan data dalam format yang konsisten dengan limit dan offset yang benar**
Thoughts: This is about pagination data consistency. We can test that the system respects limit and offset parameters and returns data in expected format.
Testable: yes - property

**6.6 WHEN tidak ada konten lagi untuk dimuat THEN DEJA-VU SHALL menampilkan indikator bahwa semua konten telah dimuat**
Thoughts: This is about end-of-content indication. We can test that when no more content is available, the system properly indicates this state.
Testable: yes - property

**6.7 WHEN terjadi error saat memuat konten THEN DEJA-VU SHALL menampilkan pesan error dan opsi untuk mencoba lagi**
Thoughts: This is about error handling during content loading. We can test that errors are properly handled and recovery options are provided.
Testable: yes - property

**6.8 WHERE pengguna menggunakan dark/light mode THEN DEJA-VU SHALL menyimpan preferensi theme**
Thoughts: This is about theme preference persistence. We can test that theme preferences are saved and applied.
Testable: yes - property

### Property Reflection

After reviewing all acceptance criteria, the following properties provide comprehensive coverage without redundancy:

Berdasarkan prework analysis, berikut adalah correctness properties yang dapat diuji:

**Property 1: Post creation and timeline display**
_For any_ valid post content, when a user creates a post, the post should appear in the timeline and be retrievable
**Validates: Requirements 1.1**

**Property 2: Hashtag processing and searchability**
_For any_ post containing hashtags, the hashtags should be extractable, clickable, and searchable
**Validates: Requirements 1.2**

**Property 3: Mention notification delivery**
_For any_ post containing user mentions, the mentions should be properly stored in the post and the notification system should be capable of creating notifications for all mentioned users
**Validates: Requirements 1.3**

**Property 4: Media processing and display**
_For any_ uploaded media file, the media should be processed and displayed correctly in the post
**Validates: Requirements 1.4**

**Property 5: Thread creation for long posts**
_For any_ post content exceeding 280 characters, the system should automatically mark the post as a thread (is_thread: true) and assign a unique thread_id
**Validates: Requirements 1.5**

**Property 6: Airdrop feed and notification**
_For any_ new airdrop added to the system, it should appear in the airdrop feed and trigger notifications
**Validates: Requirements 2.1**

**Property 7: Airdrop bookmark persistence**
_For any_ airdrop bookmark action, the airdrop should be saved to the user's personal list with correct status tracking
**Validates: Requirements 2.2**

**Property 8: Active airdrop display requirements**
_For any_ active airdrop, the system should display countdown timer and requirements checklist
**Validates: Requirements 2.3**

**Property 9: Airdrop deadline reminder system**
_For any_ airdrop approaching deadline, reminder notifications should be sent to participating users
**Validates: Requirements 2.4**

**Property 10: Wallet-based airdrop recommendations**
_For any_ user wallet meeting specific criteria, relevant eligible airdrops should be recommended
**Validates: Requirements 2.5**

**Property 11: Exchange extension verification**
_For any_ exchange extension installation, the system should verify and activate API connection
**Validates: Requirements 3.1**

**Property 12: Exchange API credential encryption**
_For any_ exchange API connection, credentials should be stored with proper encryption
**Validates: Requirements 3.2**

**Property 13: Real-time portfolio widget display**
_For any_ active exchange extension, portfolio widget and balance should be displayed in real-time
**Validates: Requirements 3.3**

**Property 14: Quick trade interface activation**
_For any_ quick trade action, the integrated trading interface should open correctly
**Validates: Requirements 3.4**

**Property 15: Exchange error handling and reconnection**
_For any_ exchange connection error, the system should display error status and provide reconnection options
**Validates: Requirements 3.5**

**Property 16: Follow action timeline integration**
_For any_ follow action, the followed user's posts should appear in the follower's timeline
**Validates: Requirements 4.1**

**Property 17: Social interaction persistence and notification**
_For any_ social interaction (like, repost, reply), the interaction should be saved and notifications sent
**Validates: Requirements 4.2**

**Property 18: Notification display system**
_For any_ received notification, badge counter and notification list should be updated
**Validates: Requirements 4.3**

**Property 19: Profile information display**
_For any_ profile view, follower count, following count, posts, and valid join date should be displayed correctly, with appropriate fallbacks for invalid dates
**Validates: Requirements 4.4, 4.5**

**Property 20: Mutual follow DM activation**
_For any_ pair of users with mutual following, direct message feature should be enabled
**Validates: Requirements 4.5**

**Property 21: Wallet signature verification**
_For any_ wallet connection attempt, ownership should be verified through wallet signature
**Validates: Requirements 5.1**

**Property 22: Wallet address profile display**
_For any_ successfully connected wallet, the wallet address should appear in the user profile
**Validates: Requirements 5.2**

**Property 23: Connected wallet balance display**
_For any_ connected wallet, portfolio balance should be displayed in sidebar or widget
**Validates: Requirements 5.3**

**Property 24: Wallet disconnection data cleanup**
_For any_ wallet disconnection, all wallet data should be removed from the session
**Validates: Requirements 5.4**

**Property 25: NFT collection profile display**
_For any_ user with NFT holdings, the NFT collection should be displayed in their profile
**Validates: Requirements 5.5**

**Property 26: User session and preference persistence**
_For any_ user login, session and user preferences should be saved correctly
**Validates: Requirements 6.3**

**Property 27: Infinite scroll content loading**
_For any_ timeline pagination request with valid limit and offset parameters, the system should return data in a consistent format, respect pagination boundaries, and handle empty results gracefully
**Validates: Requirements 6.4, 6.5, 6.6, 6.7**

**Property 28: Theme preference persistence**
_For any_ theme change (dark/light mode), the preference should be saved and applied consistently
**Validates: Requirements 6.8**

**Property 29: Content validation for posts**
_For any_ post content that contains only whitespace, the system should reject the post and display an error message
**Validates: Requirements 1.6**

**Property 30: Notification content validation**
_For any_ notification with whitespace-only title or message, the system should reject creation and use default values
**Validates: Requirements 4.6**

**Property 31: Input text validation**
_For any_ text input to the system, whitespace should be trimmed and empty content should be validated
**Validates: Requirements 7.1, 7.4**

**Property 32: Invalid input handling**
_For any_ invalid input received by the system, appropriate error messages should be provided to the user
**Validates: Requirements 7.3**

**Property 33: Direct message content validation**
_For any_ direct message content that contains only whitespace, the system should reject the message and display an error message
**Validates: Requirements 4.7**

**Property 34: Direct message timestamp validation**
_For any_ direct message created, the timestamp should be valid and allow chronological ordering of messages
**Validates: Requirements 4.8**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeouts
   - API rate limiting
   - Exchange API failures
   - Blockchain network issues

2. **Authentication Errors**
   - Invalid credentials
   - Expired sessions
   - Wallet signature failures
   - Exchange API key errors

3. **Validation Errors**
   - Invalid post content
   - Malformed wallet addresses
   - Unsupported file formats
   - Character limit violations

4. **Business Logic Errors**
   - Duplicate follows
   - Self-interaction attempts
   - Insufficient permissions
   - Airdrop eligibility failures

### Error Handling Strategies

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
}

// Global error handler
class ErrorHandler {
  static handle(error: Error, context: string): ErrorResponse {
    // Log error for monitoring
    logger.error(error, { context });

    // Return user-friendly error
    return {
      code: this.getErrorCode(error),
      message: this.getUserMessage(error),
      timestamp: new Date(),
      requestId: generateRequestId(),
    };
  }
}

// Exchange-specific error handling (Requirement 3.5)
interface ExchangeErrorState {
  connectionId: string;
  status: 'error' | 'reconnecting' | 'failed';
  errorMessage: string;
  lastAttempt: Date;
  retryCount: number;
  canReconnect: boolean;
}

class ExchangeErrorHandler {
  static handleConnectionError(
    connectionId: string,
    error: Error
  ): ExchangeErrorState {
    return {
      connectionId,
      status: 'error',
      errorMessage: this.getUserFriendlyMessage(error),
      lastAttempt: new Date(),
      retryCount: 0,
      canReconnect: this.isRetryableError(error),
    };
  }

  static getUserFriendlyMessage(error: Error): string {
    // Convert technical errors to user-friendly messages
    if (error.message.includes('API_KEY_INVALID')) {
      return 'API key tidak valid. Silakan periksa kembali kredensial Anda.';
    }
    if (error.message.includes('RATE_LIMIT')) {
      return 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.';
    }
    if (error.message.includes('NETWORK')) {
      return 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
    }
    return 'Terjadi kesalahan pada koneksi exchange. Silakan coba lagi.';
  }
}
```

### Retry Mechanisms

- **Exchange API calls**: Exponential backoff with max 3 retries
- **Blockchain queries**: Linear backoff with max 5 retries
- **Media uploads**: Immediate retry once, then user notification
- **Real-time connections**: Auto-reconnect with progressive delays

## Testing Strategy

### Dual Testing Approach

DEJA-VU akan menggunakan kombinasi unit testing dan property-based testing untuk memastikan correctness yang komprehensif:

**Unit Testing:**

- Menggunakan Jest untuk JavaScript/TypeScript testing
- Fokus pada specific examples, edge cases, dan error conditions
- Testing komponen UI dengan React Testing Library
- Integration testing untuk API endpoints
- Mock external services (exchanges, blockchain APIs)

**Property-Based Testing:**

- Menggunakan fast-check library untuk JavaScript/TypeScript
- Setiap property-based test akan menjalankan minimum 100 iterations
- Setiap test akan diberi tag dengan format: **Feature: crypto-social-platform, Property {number}: {property_text}**
- Testing universal properties yang harus berlaku untuk semua input
- Fokus pada business logic dan data consistency

**Testing Configuration:**

```typescript
// fast-check configuration
const fcConfig = {
  numRuns: 100, // minimum iterations
  verbose: true,
  seed: 42, // for reproducible tests
};

// Example property test structure
describe('Property Tests', () => {
  it('**Feature: crypto-social-platform, Property 1: Post creation and timeline display**', () => {
    fc.assert(
      fc.property(
        fc.record({
          content: fc.string({ minLength: 1, maxLength: 280 }),
          authorId: fc.uuid(),
          hashtags: fc.array(fc.string()),
        }),
        (post) => {
          const savedPost = createPost(post);
          const timeline = getTimeline(post.authorId);
          return timeline.posts.some((p) => p.id === savedPost.id);
        }
      ),
      fcConfig
    );
  });
});
```

**Test Coverage Requirements:**

- Unit tests: 80% code coverage minimum
- Property tests: All 28 correctness properties must be implemented
- Integration tests: All API endpoints and real-time features
- E2E tests: Critical user journeys (posting, following, airdrop participation)

**Testing Infrastructure:**

- CI/CD pipeline dengan GitHub Actions
- Automated testing pada setiap pull request
- Performance testing untuk real-time features
- Security testing untuk wallet dan exchange integrations
- Cross-browser testing untuk web compatibility

### Test Data Management

```typescript
// Test data generators
const generators = {
  user: () => ({
    username: fc.string({ minLength: 3, maxLength: 50 }),
    email: fc.emailAddress(),
    bio: fc.option(fc.string({ maxLength: 160 })),
  }),

  post: () => ({
    content: fc.string({ minLength: 1, maxLength: 280 }),
    hashtags: fc.array(fc.string().map((s) => `#${s}`)),
    mentions: fc.array(fc.string().map((s) => `@${s}`)),
  }),

  airdrop: () => ({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    endDate: fc.date({ min: new Date() }),
    blockchain: fc.constantFrom('ethereum', 'solana', 'polygon'),
  }),
};
```

## Performance Considerations

### Scalability Targets

- **Concurrent Users**: 100,000+ simultaneous connections
- **Posts per Second**: 10,000+ new posts
- **Real-time Latency**: <100ms for notifications
- **API Response Time**: <200ms for 95th percentile
- **Database Queries**: <50ms average response time

### Optimization Strategies

1. **Database Optimization**
   - Connection pooling dengan PgBouncer
   - Read replicas untuk timeline queries
   - Partitioning untuk posts table berdasarkan tanggal
   - Materialized views untuk trending hashtags

2. **Caching Strategy**
   - Redis untuk session management
   - CDN untuk media files
   - Application-level caching untuk user profiles
   - Real-time data caching untuk portfolio updates

3. **Real-time Optimization**
   - Supabase Realtime untuk WebSocket connections
   - Channel-based subscriptions untuk targeted updates
   - Message batching untuk high-frequency updates
   - Connection pooling untuk exchange APIs

### Monitoring and Observability

```typescript
// Performance monitoring
const metrics = {
  apiLatency: histogram('api_request_duration_seconds'),
  realtimeConnections: gauge('realtime_connections_total'),
  postCreationRate: counter('posts_created_total'),
  exchangeApiErrors: counter('exchange_api_errors_total'),
};

// Health checks
const healthChecks = {
  database: () => checkDatabaseConnection(),
  redis: () => checkRedisConnection(),
  supabase: () => checkSupabaseRealtime(),
  exchanges: () => checkExchangeAPIs(),
};
```

## Security Considerations

### Authentication & Authorization

- **JWT-based authentication** dengan Supabase Auth
- **Row Level Security (RLS)** untuk data access control
- **API rate limiting** untuk mencegah abuse
- **CORS configuration** untuk cross-origin requests

### Data Protection

- **Encryption at rest** untuk sensitive data (API keys, personal info)
- **TLS/SSL** untuk all communications
- **Input validation** dan sanitization
- **SQL injection prevention** dengan parameterized queries

### Wallet Security

```typescript
// Wallet signature verification
async function verifyWalletOwnership(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.error('Wallet verification failed', { address, error });
    return false;
  }
}

// API key encryption
const encryptApiKey = (apiKey: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
```

### Exchange Integration Security

- **API key encryption** dengan AES-256
- **Scope limitation** untuk exchange permissions
- **Regular key rotation** recommendations
- **Audit logging** untuk all exchange interactions

## Deployment Architecture

### Infrastructure Components

```yaml
# Docker Compose untuk development
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dejavu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

### Production Deployment

- **Container orchestration** dengan Docker Swarm atau Kubernetes
- **Load balancing** dengan Nginx atau HAProxy
- **Auto-scaling** berdasarkan CPU dan memory usage
- **Blue-green deployment** untuk zero-downtime updates
- **Database migrations** dengan automated rollback capability

### Monitoring Stack

- **Application monitoring**: Sentry untuk error tracking
- **Infrastructure monitoring**: Prometheus + Grafana
- **Log aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime monitoring**: External service monitoring
- **Performance monitoring**: New Relic atau DataDog alternative (open source)

## Technology Recommendations

### Recommended Open Source Stack

**Frontend:**

- Next.js 14 dengan App Router
- TypeScript untuk type safety
- Tailwind CSS untuk styling
- Radix UI untuk accessible components
- Zustand untuk state management
- React Query untuk server state

**Backend:**

- Node.js dengan Fastify (lebih performant dari Express)
- TypeScript
- Prisma ORM untuk database operations
- Zod untuk runtime validation
- Winston untuk logging

**Database & Infrastructure:**

- PostgreSQL 15+ sebagai primary database
- Redis untuk caching dan sessions
- Supabase untuk real-time features dan auth
- MinIO untuk object storage (S3-compatible)
- Docker untuk containerization

**Development Tools:**

- ESLint + Prettier untuk code formatting
- Husky untuk git hooks
- Jest + React Testing Library untuk testing
- fast-check untuk property-based testing
- GitHub Actions untuk CI/CD

**Monitoring & Observability:**

- Prometheus untuk metrics collection
- Grafana untuk visualization
- Loki untuk log aggregation
- Jaeger untuk distributed tracing
- Sentry (open source) untuk error tracking

Semua teknologi yang direkomendasikan adalah open source dan memiliki komunitas yang aktif, memastikan sustainability dan cost-effectiveness untuk jangka panjang.
