# Architecture

## Overview

DEJA-VU menggunakan arsitektur modern dengan Next.js App Router dan Supabase sebagai backend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │    React    │  │    Tailwind CSS     │  │
│  │ App Router  │  │ Components  │  │   Design System     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │     Realtime        │  │
│  │  Database   │  │   Service   │  │    Subscriptions    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### App Router Structure

```
src/app/
├── page.tsx              # Home feed
├── layout.tsx            # Root layout dengan ThemeProvider
├── explore/page.tsx      # Explore/trending
├── notifications/page.tsx
├── messages/page.tsx     # Direct messages
├── airdrops/page.tsx     # Airdrop listings
├── portfolio/page.tsx    # Portfolio tracking
├── profile/page.tsx      # User profile
└── settings/page.tsx     # User settings
```

### Component Architecture

```
components/
├── layout/
│   └── Sidebar.tsx       # Main navigation sidebar
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Avatar.tsx
└── features/
    ├── posts/
    ├── airdrops/
    └── portfolio/
```

### State Management

- **React Context** untuk global state (Theme, Auth)
- **React Query** untuk server state (coming soon)
- **Local State** untuk component-specific state

## Design System

DEJA-VU menggunakan kombinasi design dari X.com dan Linear.app:

### Colors

**Light Mode:**
- Background: `#ffffff`
- Foreground: `#0f1419`
- Primary: `#8b5cf6` (Purple)
- Border: `#eff3f4`

**Dark Mode:**
- Background: `#000000`
- Foreground: `#e7e9ea`
- Primary: `#a78bfa` (Light Purple)
- Border: `#2f3336`

### Typography

- Font: Inter (dengan fallback system fonts)
- Heading: -0.02em letter-spacing
- Body: -0.011em letter-spacing

### Components

Semua komponen menggunakan CSS variables untuk theming:

```css
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT,
  likes_count INT DEFAULT 0,
  reposts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ
);

-- Direct Messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);

-- Airdrops
CREATE TABLE airdrops (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  status TEXT,
  estimated_value TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

## Security

### Row Level Security (RLS)

Semua tabel menggunakan RLS untuk keamanan:

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Users can only read their own messages
CREATE POLICY "Users can read own messages"
ON direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
```

### Authentication

- Supabase Auth dengan email/password
- OAuth providers (Google, GitHub) - coming soon
- Wallet connect (MetaMask, etc) - coming soon

## Deployment

### Docker

```bash
docker-compose up -d
```

### Production

Lihat [Deployment Guide](deployment.md) untuk instruksi lengkap.
