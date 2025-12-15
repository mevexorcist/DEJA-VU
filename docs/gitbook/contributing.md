# Contributing Guide

Terima kasih sudah tertarik untuk berkontribusi ke DEJA-VU! 🎉

## Code of Conduct

Kami berkomitmen untuk menyediakan lingkungan yang ramah dan inklusif. Harap baca [Code of Conduct](code-of-conduct.md) sebelum berkontribusi.

## How to Contribute

### 1. Fork Repository

Fork repository ini ke akun GitHub kamu.

### 2. Clone Fork

```bash
git clone https://github.com/YOUR_USERNAME/deja-vu.git
cd deja-vu
```

### 3. Create Branch

Buat branch baru untuk fitur atau fix kamu:

```bash
git checkout -b feature/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 4. Make Changes

Lakukan perubahan yang diperlukan. Pastikan untuk:

- Mengikuti coding standards
- Menulis tests jika diperlukan
- Update dokumentasi jika ada perubahan API

### 5. Commit Changes

Gunakan conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug issue"
git commit -m "docs: update documentation"
git commit -m "style: format code"
git commit -m "refactor: restructure code"
git commit -m "test: add tests"
```

### 6. Push & Create PR

```bash
git push origin feature/nama-fitur
```

Buat Pull Request di GitHub dengan deskripsi yang jelas.

## Development Guidelines

### Code Style

- Gunakan TypeScript untuk semua file
- Ikuti ESLint dan Prettier configuration
- Gunakan functional components dengan hooks
- Prefer named exports over default exports

### File Naming

```
components/
├── Button.tsx          # PascalCase untuk components
├── use-theme.ts        # kebab-case untuk hooks
└── utils.ts            # lowercase untuk utilities
```

### Component Structure

```tsx
'use client'; // jika client component

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
}) => {
  return (
    <button
      className={`btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Commit Guidelines

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

## Areas to Contribute

### Good First Issues

Cari issues dengan label `good first issue` untuk memulai.

### Feature Requests

- Wallet integration (MetaMask, WalletConnect)
- NFT display di profile
- Token price feeds
- Advanced portfolio analytics
- Mobile app (React Native)

### Bug Fixes

Cek issues dengan label `bug` untuk bug yang perlu diperbaiki.

### Documentation

- Improve existing docs
- Add code examples
- Translate to other languages

## Getting Help

- **Discord**: [Join our Discord](https://discord.gg/deja-vu)
- **GitHub Issues**: Buat issue untuk pertanyaan
- **Twitter**: [@DejaVuCrypto](https://twitter.com/DejaVuCrypto)

## Recognition

Semua kontributor akan ditampilkan di:
- README.md
- Contributors page di website
- Special NFT badge (coming soon)

Terima kasih sudah berkontribusi! 🚀
