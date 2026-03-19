import { TariffItem, ProviderTariffBook } from "@shared/schema";

export function generateDemoTariffData(): ProviderTariffBook[] {
  const providerId = "provider-siloam-bsj-001";
  const providerCode = "SLMBSJ";
  
  const tariffItems: TariffItem[] = [
    // Admin & Room - 22 items
    { id: "item-001", providerId, tariffId: `${providerCode}-ADM-001`, category: "Admin & Room", itemName: "Biaya Administrasi", priceOPD: 42000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-002", providerId, tariffId: `${providerCode}-ADM-002`, category: "Admin & Room", itemName: "Administrasi & Observasi Obat", priceOPD: null, priceKelas3: 1030000, priceKelas2: 1030000, priceKelas1: 1030000, priceVIP: 1030000, priceVVIP: null },
    { id: "item-003", providerId, tariffId: `${providerCode}-ADM-003`, category: "Admin & Room", itemName: "Biaya Swab Darurat", priceOPD: 160000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-004", providerId, tariffId: `${providerCode}-ADM-004`, category: "Admin & Room", itemName: "Pemasangan Infus", priceOPD: null, priceKelas3: 389000, priceKelas2: 319000, priceKelas1: 319000, priceVIP: 319000, priceVVIP: 319000 },
    { id: "item-005", providerId, tariffId: `${providerCode}-ADM-005`, category: "Admin & Room", itemName: "Kartu Pasien Siloam", priceOPD: 16000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-006", providerId, tariffId: `${providerCode}-ADM-006`, category: "Admin & Room", itemName: "Surat Keterangan Hasil Tes COVID-19", priceOPD: 107000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-007", providerId, tariffId: `${providerCode}-ADM-007`, category: "Admin & Room", itemName: "Kamar Rawat Inap Umum", priceOPD: null, priceKelas3: 300000, priceKelas2: 600000, priceKelas1: 800000, priceVIP: 1300000, priceVVIP: 1400000 },
    { id: "item-008", providerId, tariffId: `${providerCode}-ADM-008`, category: "Admin & Room", itemName: "Ruang HCU (High Care Unit)", priceOPD: null, priceKelas3: null, priceKelas2: 750000, priceKelas1: null, priceVIP: 750000, priceVVIP: 750000 },
    { id: "item-009", providerId, tariffId: `${providerCode}-ADM-009`, category: "Admin & Room", itemName: "Ruang ICU (Intensive Care Unit)", priceOPD: null, priceKelas3: 850000, priceKelas2: null, priceKelas1: 950000, priceVIP: null, priceVVIP: 950000 },
    { id: "item-010", providerId, tariffId: `${providerCode}-ADM-010`, category: "Admin & Room", itemName: "Kamar Isolasi", priceOPD: null, priceKelas3: null, priceKelas2: 900000, priceKelas1: 900000, priceVIP: 900000, priceVVIP: 900000 },
    { id: "item-011", providerId, tariffId: `${providerCode}-ADM-011`, category: "Admin & Room", itemName: "Kamar Rawat Kebidanan", priceOPD: null, priceKelas3: 200000, priceKelas2: 600000, priceKelas1: 600000, priceVIP: 1100000, priceVVIP: 1400000 },
    { id: "item-012", providerId, tariffId: `${providerCode}-ADM-012`, category: "Admin & Room", itemName: "Ruang NICU", priceOPD: null, priceKelas3: 850000, priceKelas2: 850000, priceKelas1: 850000, priceVIP: 850000, priceVVIP: 850000 },
    { id: "item-013", providerId, tariffId: `${providerCode}-ADM-013`, category: "Admin & Room", itemName: "Ruang NICU Level 1", priceOPD: null, priceKelas3: 650000, priceKelas2: 650000, priceKelas1: 650000, priceVIP: 650000, priceVVIP: 650000 },
    { id: "item-014", providerId, tariffId: `${providerCode}-ADM-014`, category: "Admin & Room", itemName: "Ruang NICU Level 2", priceOPD: null, priceKelas3: 750000, priceKelas2: 750000, priceKelas1: 750000, priceVIP: 750000, priceVVIP: 750000 },
    { id: "item-015", providerId, tariffId: `${providerCode}-ADM-015`, category: "Admin & Room", itemName: "Ruang PICU", priceOPD: null, priceKelas3: 900000, priceKelas2: 900000, priceKelas1: 900000, priceVIP: 900000, priceVVIP: 900000 },
    { id: "item-016", providerId, tariffId: `${providerCode}-ADM-016`, category: "Admin & Room", itemName: "Ruang Pemulihan", priceOPD: null, priceKelas3: 250000, priceKelas2: 250000, priceKelas1: 250000, priceVIP: 250000, priceVVIP: 250000 },
    { id: "item-017", providerId, tariffId: `${providerCode}-ADM-017`, category: "Admin & Room", itemName: "Ruang Observasi", priceOPD: 150000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-018", providerId, tariffId: `${providerCode}-ADM-018`, category: "Admin & Room", itemName: "Biaya UGD", priceOPD: 185000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-019", providerId, tariffId: `${providerCode}-ADM-019`, category: "Admin & Room", itemName: "Biaya Perawatan Keperawatan", priceOPD: null, priceKelas3: 120000, priceKelas2: 150000, priceKelas1: 180000, priceVIP: 200000, priceVVIP: 250000 },
    { id: "item-020", providerId, tariffId: `${providerCode}-ADM-020`, category: "Admin & Room", itemName: "Kamar Suite", priceOPD: null, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: 2500000 },
    { id: "item-021", providerId, tariffId: `${providerCode}-ADM-021`, category: "Admin & Room", itemName: "Venflon No. 20", priceOPD: 70000, priceKelas3: 70000, priceKelas2: 70000, priceKelas1: 70000, priceVIP: 70000, priceVVIP: 70000 },
    { id: "item-022", providerId, tariffId: `${providerCode}-ADM-022`, category: "Admin & Room", itemName: "Paket Alat Medis Habis Pakai", priceOPD: 85000, priceKelas3: 85000, priceKelas2: 85000, priceKelas1: 85000, priceVIP: 85000, priceVVIP: 85000 },

    // Doctor Fee - 27 items
    { id: "item-023", providerId, tariffId: `${providerCode}-DOC-001`, category: "Doctor Fee", itemName: "Konsultasi Dokter Umum", priceOPD: 125000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-024", providerId, tariffId: `${providerCode}-DOC-002`, category: "Doctor Fee", itemName: "Konsultasi Dokter Spesialis", priceOPD: 170000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-025", providerId, tariffId: `${providerCode}-DOC-003`, category: "Doctor Fee", itemName: "Konsultasi Dokter Sub-Spesialis", priceOPD: 250000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-026", providerId, tariffId: `${providerCode}-DOC-004`, category: "Doctor Fee", itemName: "Visite Dokter Umum", priceOPD: null, priceKelas3: 100000, priceKelas2: 120000, priceKelas1: 140000, priceVIP: 160000, priceVVIP: 180000 },
    { id: "item-027", providerId, tariffId: `${providerCode}-DOC-005`, category: "Doctor Fee", itemName: "Visite Dokter Spesialis", priceOPD: null, priceKelas3: 150000, priceKelas2: 175000, priceKelas1: 200000, priceVIP: 225000, priceVVIP: 250000 },
    { id: "item-028", providerId, tariffId: `${providerCode}-DOC-006`, category: "Doctor Fee", itemName: "Visite Dokter Sub-Spesialis", priceOPD: null, priceKelas3: 200000, priceKelas2: 250000, priceKelas1: 300000, priceVIP: 350000, priceVVIP: 400000 },
    { id: "item-029", providerId, tariffId: `${providerCode}-DOC-007`, category: "Doctor Fee", itemName: "Konsultasi Dokter UGD", priceOPD: 150000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-030", providerId, tariffId: `${providerCode}-DOC-008`, category: "Doctor Fee", itemName: "Konsultasi Dokter Anak", priceOPD: 185000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-031", providerId, tariffId: `${providerCode}-DOC-009`, category: "Doctor Fee", itemName: "Konsultasi Dokter Penyakit Dalam", priceOPD: 195000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-032", providerId, tariffId: `${providerCode}-DOC-010`, category: "Doctor Fee", itemName: "Konsultasi Dokter Bedah", priceOPD: 200000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-033", providerId, tariffId: `${providerCode}-DOC-011`, category: "Doctor Fee", itemName: "Konsultasi Dokter Kandungan", priceOPD: 195000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-034", providerId, tariffId: `${providerCode}-DOC-012`, category: "Doctor Fee", itemName: "Konsultasi Dokter Ortopedi", priceOPD: 210000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-035", providerId, tariffId: `${providerCode}-DOC-013`, category: "Doctor Fee", itemName: "Konsultasi Dokter Jantung", priceOPD: 250000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-036", providerId, tariffId: `${providerCode}-DOC-014`, category: "Doctor Fee", itemName: "Konsultasi Dokter Saraf", priceOPD: 210000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-037", providerId, tariffId: `${providerCode}-DOC-015`, category: "Doctor Fee", itemName: "Konsultasi Dokter THT", priceOPD: 175000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-038", providerId, tariffId: `${providerCode}-DOC-016`, category: "Doctor Fee", itemName: "Konsultasi Dokter Mata", priceOPD: 180000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-039", providerId, tariffId: `${providerCode}-DOC-017`, category: "Doctor Fee", itemName: "Konsultasi Dokter Kulit & Kelamin", priceOPD: 175000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-040", providerId, tariffId: `${providerCode}-DOC-018`, category: "Doctor Fee", itemName: "Konsultasi Dokter Paru", priceOPD: 185000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-041", providerId, tariffId: `${providerCode}-DOC-019`, category: "Doctor Fee", itemName: "Konsultasi Dokter Urologi", priceOPD: 200000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-042", providerId, tariffId: `${providerCode}-DOC-020`, category: "Doctor Fee", itemName: "Konsultasi Dokter Gigi", priceOPD: 150000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-043", providerId, tariffId: `${providerCode}-DOC-021`, category: "Doctor Fee", itemName: "Konsultasi Dokter Psikiater", priceOPD: 225000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-044", providerId, tariffId: `${providerCode}-DOC-022`, category: "Doctor Fee", itemName: "Konsultasi Psikolog", priceOPD: 200000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-045", providerId, tariffId: `${providerCode}-DOC-023`, category: "Doctor Fee", itemName: "Konsultasi Gizi", priceOPD: 125000, priceKelas3: null, priceKelas2: null, priceKelas1: null, priceVIP: null, priceVVIP: null },
    { id: "item-046", providerId, tariffId: `${providerCode}-DOC-024`, category: "Doctor Fee", itemName: "Jasa Dokter Anestesi", priceOPD: null, priceKelas3: 1500000, priceKelas2: 1750000, priceKelas1: 2000000, priceVIP: 2250000, priceVVIP: 2500000 },
    { id: "item-047", providerId, tariffId: `${providerCode}-DOC-025`, category: "Doctor Fee", itemName: "Jasa Dokter Bedah Minor", priceOPD: 500000, priceKelas3: 500000, priceKelas2: 500000, priceKelas1: 500000, priceVIP: 500000, priceVVIP: 500000 },
    { id: "item-048", providerId, tariffId: `${providerCode}-DOC-026`, category: "Doctor Fee", itemName: "Jasa Dokter Bedah Sedang", priceOPD: null, priceKelas3: 2500000, priceKelas2: 3000000, priceKelas1: 3500000, priceVIP: 4000000, priceVVIP: 4500000 },
    { id: "item-049", providerId, tariffId: `${providerCode}-DOC-027`, category: "Doctor Fee", itemName: "Jasa Dokter Bedah Besar", priceOPD: null, priceKelas3: 5000000, priceKelas2: 6000000, priceKelas1: 7000000, priceVIP: 8000000, priceVVIP: 9000000 },

    // Laboratory - 8 items
    { id: "item-050", providerId, tariffId: `${providerCode}-LAB-001`, category: "Laboratory", itemName: "Pemeriksaan Darah Lengkap", priceOPD: 85000, priceKelas3: 85000, priceKelas2: 85000, priceKelas1: 85000, priceVIP: 85000, priceVVIP: 85000 },
    { id: "item-051", providerId, tariffId: `${providerCode}-LAB-002`, category: "Laboratory", itemName: "Pemeriksaan Urin Lengkap", priceOPD: 55000, priceKelas3: 55000, priceKelas2: 55000, priceKelas1: 55000, priceVIP: 55000, priceVVIP: 55000 },
    { id: "item-052", providerId, tariffId: `${providerCode}-LAB-003`, category: "Laboratory", itemName: "Gula Darah Sewaktu", priceOPD: 45000, priceKelas3: 45000, priceKelas2: 45000, priceKelas1: 45000, priceVIP: 45000, priceVVIP: 45000 },
    { id: "item-053", providerId, tariffId: `${providerCode}-LAB-004`, category: "Laboratory", itemName: "Pemeriksaan Fungsi Hati (SGOT/SGPT)", priceOPD: 120000, priceKelas3: 120000, priceKelas2: 120000, priceKelas1: 120000, priceVIP: 120000, priceVVIP: 120000 },
    { id: "item-054", providerId, tariffId: `${providerCode}-LAB-005`, category: "Laboratory", itemName: "Pemeriksaan Fungsi Ginjal (Ureum/Kreatinin)", priceOPD: 110000, priceKelas3: 110000, priceKelas2: 110000, priceKelas1: 110000, priceVIP: 110000, priceVVIP: 110000 },
    { id: "item-055", providerId, tariffId: `${providerCode}-LAB-006`, category: "Laboratory", itemName: "Tes PCR COVID-19", priceOPD: 275000, priceKelas3: 275000, priceKelas2: 275000, priceKelas1: 275000, priceVIP: 275000, priceVVIP: 275000 },
    { id: "item-056", providerId, tariffId: `${providerCode}-LAB-007`, category: "Laboratory", itemName: "Tes Antigen COVID-19", priceOPD: 99000, priceKelas3: 99000, priceKelas2: 99000, priceKelas1: 99000, priceVIP: 99000, priceVVIP: 99000 },
    { id: "item-057", providerId, tariffId: `${providerCode}-LAB-008`, category: "Laboratory", itemName: "Pemeriksaan Profil Lipid Lengkap", priceOPD: 185000, priceKelas3: 185000, priceKelas2: 185000, priceKelas1: 185000, priceVIP: 185000, priceVVIP: 185000 },

    // Radiology - 6 items
    { id: "item-058", providerId, tariffId: `${providerCode}-RAD-001`, category: "Radiology", itemName: "Rontgen Dada", priceOPD: 165000, priceKelas3: 165000, priceKelas2: 165000, priceKelas1: 165000, priceVIP: 165000, priceVVIP: 165000 },
    { id: "item-059", providerId, tariffId: `${providerCode}-RAD-002`, category: "Radiology", itemName: "USG Perut", priceOPD: 450000, priceKelas3: 450000, priceKelas2: 450000, priceKelas1: 450000, priceVIP: 450000, priceVVIP: 450000 },
    { id: "item-060", providerId, tariffId: `${providerCode}-RAD-003`, category: "Radiology", itemName: "CT Scan Kepala Tanpa Kontras", priceOPD: 1250000, priceKelas3: 1250000, priceKelas2: 1250000, priceKelas1: 1250000, priceVIP: 1250000, priceVVIP: 1250000 },
    { id: "item-061", providerId, tariffId: `${providerCode}-RAD-004`, category: "Radiology", itemName: "MRI Kepala Tanpa Kontras", priceOPD: 2500000, priceKelas3: 2500000, priceKelas2: 2500000, priceKelas1: 2500000, priceVIP: 2500000, priceVVIP: 2500000 },
    { id: "item-062", providerId, tariffId: `${providerCode}-RAD-005`, category: "Radiology", itemName: "Rekam Jantung (EKG)", priceOPD: 125000, priceKelas3: 125000, priceKelas2: 125000, priceKelas1: 125000, priceVIP: 125000, priceVVIP: 125000 },
    { id: "item-063", providerId, tariffId: `${providerCode}-RAD-006`, category: "Radiology", itemName: "USG Jantung (Ekokardiografi)", priceOPD: 750000, priceKelas3: 750000, priceKelas2: 750000, priceKelas1: 750000, priceVIP: 750000, priceVVIP: 750000 },

    // Procedure - 7 items
    { id: "item-064", providerId, tariffId: `${providerCode}-PRC-001`, category: "Procedure", itemName: "Terapi Nebulizer", priceOPD: 75000, priceKelas3: 75000, priceKelas2: 75000, priceKelas1: 75000, priceVIP: 75000, priceVVIP: 75000 },
    { id: "item-065", providerId, tariffId: `${providerCode}-PRC-002`, category: "Procedure", itemName: "Injeksi (IM/SC/IV)", priceOPD: 35000, priceKelas3: 35000, priceKelas2: 35000, priceKelas1: 35000, priceVIP: 35000, priceVVIP: 35000 },
    { id: "item-066", providerId, tariffId: `${providerCode}-PRC-003`, category: "Procedure", itemName: "Perawatan Luka Sedang", priceOPD: 150000, priceKelas3: 150000, priceKelas2: 150000, priceKelas1: 150000, priceVIP: 150000, priceVVIP: 150000 },
    { id: "item-067", providerId, tariffId: `${providerCode}-PRC-004`, category: "Procedure", itemName: "Jahit Luka (per jahitan)", priceOPD: 85000, priceKelas3: 85000, priceKelas2: 85000, priceKelas1: 85000, priceVIP: 85000, priceVVIP: 85000 },
    { id: "item-068", providerId, tariffId: `${providerCode}-PRC-005`, category: "Procedure", itemName: "Pemasangan Kateter Urin", priceOPD: 175000, priceKelas3: 175000, priceKelas2: 175000, priceKelas1: 175000, priceVIP: 175000, priceVVIP: 175000 },
    { id: "item-069", providerId, tariffId: `${providerCode}-PRC-006`, category: "Procedure", itemName: "Pemasangan Selang Lambung (NGT)", priceOPD: 125000, priceKelas3: 125000, priceKelas2: 125000, priceKelas1: 125000, priceVIP: 125000, priceVVIP: 125000 },
    { id: "item-070", providerId, tariffId: `${providerCode}-PRC-007`, category: "Procedure", itemName: "Fisioterapi (per sesi)", priceOPD: 200000, priceKelas3: 200000, priceKelas2: 200000, priceKelas1: 200000, priceVIP: 200000, priceVVIP: 200000 },
  ];

  const tariffBook: ProviderTariffBook = {
    id: providerId,
    providerName: "RS Siloam Bekasi Sepanjang Jaya",
    providerCode: providerCode,
    berlakuMulai: "01 Juni 2025",
    berlakuSampai: "31 Desember 2025",
    totalItems: tariffItems.length,
    totalCategories: 5,
    status: "Aktif",
    uploadDate: "14 Desember 2024",
    items: tariffItems,
    notes: `Catatan Penting Buku Tarif RS Siloam Bekasi Sepanjang Jaya:

1. Tarif yang tercantum adalah tarif maksimal yang berlaku untuk periode kontrak.
2. Tarif dapat berubah sewaktu-waktu dengan pemberitahuan tertulis 30 hari sebelumnya.
3. Tarif kamar berlaku per hari perawatan (per diem).
4. Jasa dokter tidak termasuk obat-obatan dan bahan habis pakai.
5. Untuk tindakan yang tidak tercantum, berlaku tarif umum rumah sakit dengan diskon kontrak 10%.
6. Pembayaran klaim maksimal 14 hari kerja setelah dokumen lengkap diterima.`,
  };

  return [tariffBook];
}

export function generateDemoProviderActivities() {
  const now = new Date();
  return [
    {
      id: "activity-001",
      providerName: "RS Siloam Bekasi Sepanjang Jaya",
      activityType: "Upload Buku Tarif Baru 📤",
      note: "Buku tarif periode Jun-Des 2025 berhasil diupload dan diproses oleh AI",
      user: "Kevin Aditya",
      userInitials: "KA",
      date: "14 Des 2024",
      time: "10:30",
      timestamp: now,
    },
    {
      id: "activity-002",
      providerName: "RS Siloam Bekasi Sepanjang Jaya",
      activityType: "Parsing Selesai ✓",
      note: "AI berhasil mengekstrak 70 item tarif dari 5 kategori",
      user: "System AI",
      userInitials: "AI",
      date: "14 Des 2024",
      time: "10:35",
      timestamp: now,
    },
  ];
}
