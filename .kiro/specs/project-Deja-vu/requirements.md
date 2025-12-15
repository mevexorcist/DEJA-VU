# Requirements Document

## Introduction

DEJA-VU adalah platform media sosial yang mengadopsi fitur dasar seperti X (Twitter) dengan pembeda khusus untuk komunitas cryptocurrency. Platform ini menyediakan fitur posting, following, timeline, dan interaksi sosial standar, ditambah dengan fitur khusus untuk airdrop farming, integrasi exchange, dan konten crypto.

## Glossary

- **DEJA-VU**: Sistem platform media sosial dengan fokus pada komunitas cryptocurrency
- **Timeline**: Feed utama yang menampilkan postingan dari akun yang diikuti, mirip dengan X
- **Postingan**: Konten berupa teks, gambar, atau video yang dibagikan pengguna (seperti tweet)
- **Airdrop Farmer**: Pengguna yang aktif mencari dan berpartisipasi dalam airdrop cryptocurrency
- **Exchange Extension**: Plugin atau integrasi yang memungkinkan koneksi dengan exchange crypto
- **Crypto Wallet**: Dompet digital untuk menyimpan cryptocurrency yang dapat dihubungkan ke profil
- **Yapping**: Istilah untuk berbagi konten atau diskusi tentang cryptocurrency

## Requirements

### Requirement 1

**User Story:** Sebagai pengguna, saya ingin membuat dan berbagi postingan seperti di X (Twitter), sehingga saya dapat berkomunikasi dengan komunitas.

#### Acceptance Criteria

1. WHEN pengguna membuat postingan baru THEN DEJA-VU SHALL menyimpan konten dan menampilkannya di timeline
2. WHEN pengguna menambahkan hashtag THEN DEJA-VU SHALL membuat hashtag tersebut dapat diklik dan dicari
3. WHEN pengguna mention pengguna lain dalam postingan THEN DEJA-VU SHALL menyimpan mention dalam postingan dan memungkinkan sistem notifikasi untuk mengirim notifikasi kepada pengguna yang di-mention
4. WHEN pengguna mengunggah media THEN DEJA-VU SHALL memproses dan menampilkan gambar/video dalam postingan
5. WHEN postingan melebihi 280 karakter THEN DEJA-VU SHALL secara otomatis menandai postingan sebagai thread dan memberikan thread_id yang unik
6. WHEN konten postingan hanya berisi whitespace THEN DEJA-VU SHALL menolak postingan dan menampilkan pesan error

### Requirement 2

**User Story:** Sebagai airdrop farmer, saya ingin melacak dan mengelola berbagai airdrop opportunity di DEJA-VU, sehingga saya tidak melewatkan kesempatan earning.

#### Acceptance Criteria

1. WHEN airdrop baru ditambahkan THEN DEJA-VU SHALL menampilkan di feed khusus airdrop dan mengirim notifikasi
2. WHEN pengguna bookmark airdrop THEN DEJA-VU SHALL menyimpan ke daftar airdrop personal dengan status tracking
3. WHILE airdrop masih aktif THEN DEJA-VU SHALL menampilkan countdown timer dan checklist requirements
4. WHEN deadline airdrop mendekat THEN DEJA-VU SHALL mengirim reminder notification
5. WHERE pengguna memenuhi kriteria wallet THEN DEJA-VU SHALL memberikan rekomendasi airdrop yang eligible

### Requirement 3

**User Story:** Sebagai trader crypto, saya ingin mengintegrasikan akun exchange saya melalui extension, sehingga saya dapat melihat portfolio dan melakukan trading dari DEJA-VU.

#### Acceptance Criteria

1. WHEN pengguna menginstal exchange extension THEN DEJA-VU SHALL memverifikasi dan mengaktifkan koneksi API
2. WHEN pengguna menghubungkan exchange API THEN DEJA-VU SHALL menyimpan kredensial dengan enkripsi yang aman
3. WHILE extension aktif THEN DEJA-VU SHALL menampilkan widget portfolio dan balance real-time
4. WHEN pengguna mengklik quick trade THEN DEJA-VU SHALL membuka interface trading terintegrasi
5. IF koneksi exchange error THEN DEJA-VU SHALL menampilkan status error dan tombol reconnect

### Requirement 4

**User Story:** Sebagai pengguna, saya ingin mengikuti dan berinteraksi dengan pengguna lain seperti di X, sehingga saya dapat membangun network dan melihat konten yang relevan.

#### Acceptance Criteria

1. WHEN pengguna mengikuti akun lain THEN DEJA-VU SHALL menambahkan postingan akun tersebut ke timeline pengguna
2. WHEN pengguna memberikan like, repost, atau reply THEN DEJA-VU SHALL menyimpan interaksi dan memberikan notifikasi
3. WHEN pengguna menerima notifikasi THEN DEJA-VU SHALL menampilkan badge counter dan daftar notifikasi
4. WHEN pengguna membuka profil THEN DEJA-VU SHALL menampilkan follower count, following count, postingan, dan tanggal bergabung yang valid
5. WHEN profil memiliki tanggal bergabung yang tidak valid THEN DEJA-VU SHALL menampilkan placeholder atau menyembunyikan informasi tanggal
6. WHERE pengguna saling follow THEN DEJA-VU SHALL mengaktifkan fitur direct message
7. WHEN notifikasi dibuat dengan konten kosong atau hanya whitespace THEN DEJA-VU SHALL menolak pembuatan notifikasi dan menggunakan pesan default
8. WHEN pengguna mengirim direct message THEN DEJA-VU SHALL memvalidasi bahwa konten pesan tidak hanya berisi whitespace
9. WHEN direct message dibuat THEN DEJA-VU SHALL memastikan timestamp pesan valid dan dapat diurutkan secara kronologis

### Requirement 5

**User Story:** Sebagai pengguna crypto, saya ingin menghubungkan wallet saya ke DEJA-VU, sehingga saya dapat menampilkan portfolio dan memverifikasi kepemilikan aset.

#### Acceptance Criteria

1. WHEN pengguna connect wallet THEN DEJA-VU SHALL memverifikasi ownership melalui wallet signature
2. WHEN wallet berhasil terhubung THEN DEJA-VU SHALL menampilkan alamat wallet di profil pengguna
3. WHILE wallet terhubung THEN DEJA-VU SHALL menampilkan portfolio balance di sidebar atau widget
4. WHEN pengguna disconnect wallet THEN DEJA-VU SHALL menghapus data wallet dari session
5. WHERE pengguna memiliki NFT THEN DEJA-VU SHALL menampilkan NFT collection di profil

### Requirement 6

**User Story:** Sebagai pengguna, saya ingin mengakses DEJA-VU melalui web browser dengan interface yang responsive, sehingga saya dapat menggunakan platform di berbagai device.

#### Acceptance Criteria

1. WHEN pengguna mengakses via desktop browser THEN DEJA-VU SHALL menampilkan layout multi-kolom seperti X
2. WHEN pengguna mengakses via mobile browser THEN DEJA-VU SHALL menampilkan interface mobile-optimized
3. WHEN pengguna login THEN DEJA-VU SHALL menyimpan session dan preferensi pengguna
4. WHILE pengguna scroll timeline THEN DEJA-VU SHALL memuat konten baru secara infinite scroll dengan pagination yang konsisten dan menampilkan indikator loading saat memuat konten tambahan
5. WHEN sistem memuat konten timeline dengan pagination THEN DEJA-VU SHALL mengembalikan data dalam format yang konsisten dengan limit dan offset yang benar
6. WHEN tidak ada konten lagi untuk dimuat THEN DEJA-VU SHALL menampilkan indikator bahwa semua konten telah dimuat
7. WHEN terjadi error saat memuat konten THEN DEJA-VU SHALL menampilkan pesan error dan opsi untuk mencoba lagi
8. WHERE pengguna menggunakan dark/light mode THEN DEJA-VU SHALL menyimpan preferensi theme

### Requirement 7

**User Story:** Sebagai sistem administrator, saya ingin memastikan semua konten yang dimasukkan pengguna valid dan aman, sehingga platform dapat berjalan dengan stabil dan aman.

#### Acceptance Criteria

1. WHEN sistem menerima input teks THEN DEJA-VU SHALL memvalidasi bahwa konten tidak hanya berisi whitespace
2. WHEN sistem membuat notifikasi THEN DEJA-VU SHALL memastikan title dan message memiliki konten yang valid
3. WHEN input tidak valid diterima THEN DEJA-VU SHALL menolak input dan memberikan pesan error yang jelas
4. WHEN sistem memproses konten THEN DEJA-VU SHALL menghapus whitespace berlebih di awal dan akhir teks
5. WHERE konten kosong atau tidak valid THEN DEJA-VU SHALL menggunakan nilai default yang sesuai
