# Supabase Setup Guide for DEJA-VU

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Install Supabase CLI: `npm install -g supabase`

## Setup Steps

### 1. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `deja-vu`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users

### 2. Get Project Credentials

1. Go to Project Settings > API
2. Copy the following values to your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

### 3. Initialize Local Supabase (Optional for Development)

```bash
# Initialize Supabase in your project
supabase init

# Start local Supabase stack
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (local dashboard)
# - Edge Functions runtime
# - Realtime server
```

### 4. Database Schema Setup

The database schema will be created in task 2 of the implementation plan. The schema includes:

- Users table with authentication
- Posts table for content
- Follows table for social connections
- Airdrops table for airdrop tracking
- Exchange connections for trading integration
- Wallet connections for crypto integration
- Notifications for real-time updates
- Direct messages for mutual followers

### 5. Row Level Security (RLS)

RLS policies will be implemented to ensure:

- Users can only see their own private data
- Posts are visible based on follow relationships
- Direct messages are only accessible to participants
- Airdrop data is properly scoped to users

### 6. Real-time Subscriptions

Supabase Realtime will be configured for:

- Live timeline updates
- Real-time notifications
- Live follower counts
- Airdrop deadline reminders
- Portfolio balance updates

### 7. Authentication Setup

Configure authentication providers:

- Email/Password (default)
- Google OAuth
- GitHub OAuth
- Twitter OAuth (for crypto community)

### 8. Storage Setup

Configure Supabase Storage for:

- User avatars
- Post media (images/videos)
- NFT metadata caching

## Environment Variables

Update your `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Verification

After setup, verify the connection by running:

```bash
npm run test
```

The tests should pass and connect to Supabase successfully.
