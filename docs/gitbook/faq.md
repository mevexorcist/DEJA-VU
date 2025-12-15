# FAQ

## General

### Apa itu DEJA-VU?

DEJA-VU adalah platform media sosial untuk komunitas cryptocurrency. Platform ini menggabungkan fitur social networking seperti X.com dengan tools khusus crypto seperti airdrop tracking dan portfolio management.

### Apakah DEJA-VU gratis?

Ya, DEJA-VU adalah open-source dan gratis untuk digunakan. Kamu bisa self-host atau menggunakan hosted version.

### Bagaimana cara berkontribusi?

Lihat [Contributing Guide](contributing.md) untuk panduan lengkap. Kamu bisa berkontribusi melalui:
- Code contributions
- Bug reports
- Feature requests
- Documentation improvements
- Translations

## Technical

### Tech stack apa yang digunakan?

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Docker, Vercel

### Apakah ada mobile app?

Belum ada. Mobile app (iOS & Android) ada di roadmap untuk Q4 2025.

### Bagaimana dengan keamanan data?

- Semua data disimpan di Supabase dengan Row Level Security (RLS)
- Passwords di-hash menggunakan bcrypt
- API keys tidak pernah di-expose ke client
- HTTPS enforced untuk semua connections

### Apakah mendukung self-hosting?

Ya! Kamu bisa self-host DEJA-VU menggunakan Docker atau deploy manual. Lihat [Deployment Guide](deployment.md).

## Features

### Bagaimana cara tracking airdrop?

1. Buka halaman Airdrops
2. Browse atau search airdrop yang tersedia
3. Klik airdrop untuk melihat detail dan tasks
4. Mark tasks sebagai completed saat selesai
5. Track progress di dashboard

### Apakah bisa connect wallet?

Wallet integration (MetaMask, WalletConnect) ada di roadmap untuk Q3 2025.

### Bagaimana cara import portfolio?

Saat ini portfolio tracking masih manual. Auto-sync dari wallet akan tersedia setelah wallet integration selesai.

### Apakah ada API untuk developers?

Ya, kamu bisa menggunakan Supabase API langsung. Lihat [API Reference](api-reference.md) untuk dokumentasi lengkap.

## Troubleshooting

### Halaman tidak loading

1. Clear browser cache (Ctrl+Shift+Delete)
2. Disable browser extensions
3. Try incognito mode
4. Check console untuk errors (F12)

### Login tidak berfungsi

1. Pastikan email dan password benar
2. Check apakah email sudah verified
3. Try reset password
4. Clear cookies dan try again

### Theme toggle tidak berfungsi

1. Refresh halaman (Ctrl+F5)
2. Clear localStorage: `localStorage.clear()`
3. Check console untuk errors

### Posts tidak muncul

1. Check internet connection
2. Refresh halaman
3. Verify Supabase connection di console
4. Check RLS policies jika self-hosting

## Community

### Dimana bisa dapat bantuan?

- **Discord**: [Join Discord](https://discord.gg/deja-vu)
- **GitHub Issues**: Untuk bug reports
- **Twitter**: [@DejaVuCrypto](https://twitter.com/DejaVuCrypto)

### Bagaimana cara report bug?

1. Buka [GitHub Issues](https://github.com/your-org/deja-vu/issues)
2. Klik "New Issue"
3. Pilih "Bug Report" template
4. Isi detail bug dengan lengkap
5. Submit issue

### Bagaimana cara request fitur?

1. Buka [GitHub Issues](https://github.com/your-org/deja-vu/issues)
2. Klik "New Issue"
3. Pilih "Feature Request" template
4. Jelaskan fitur yang diinginkan
5. Submit issue

## Legal

### Lisensi apa yang digunakan?

DEJA-VU menggunakan MIT License. Kamu bebas menggunakan, memodifikasi, dan mendistribusikan kode.

### Apakah data saya dijual?

Tidak. Kami tidak menjual data pengguna. Lihat Privacy Policy untuk detail lengkap.

### Bagaimana dengan GDPR compliance?

Kami berkomitmen untuk GDPR compliance:
- Data dapat di-export
- Data dapat di-delete
- Consent untuk data collection
- Transparent data usage
