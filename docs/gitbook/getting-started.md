# Getting Started

## Prerequisites

Sebelum memulai, pastikan kamu sudah menginstall:

- **Node.js** v18.0.0 atau lebih baru
- **npm** v9.0.0 atau lebih baru
- **Git** untuk version control
- **Docker** (opsional, untuk deployment)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/deja-vu.git
cd deja-vu
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan konfigurasi kamu:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Supabase

Lihat [Supabase Setup Guide](supabase-setup.md) untuk instruksi lengkap setup database.

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Project Structure

```
deja-vu/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── layout/       # Layout components (Sidebar, etc)
│   │   ├── ui/           # Reusable UI components
│   │   └── monitoring/   # Monitoring components
│   ├── contexts/         # React contexts (Theme, Auth)
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
├── public/               # Static assets
└── docker/               # Docker configurations
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Next Steps

- [Architecture Overview](architecture.md)
- [Contributing Guide](contributing.md)
- [API Reference](api-reference.md)
