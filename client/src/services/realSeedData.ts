// Real seed data from PT. Mitra Iswara & Rorimpandey Ltd documents
// Source: TC_MIR_to_Admedika_081020.pdf, Laporan_Peserta_Polis_Aktif.xlsx

export interface SeedMember {
  memberId: string;
  policyId: string;
  policyNumber: string;
  policyholderName: string;
  policyExpiryDate: string;
  memberCardNumber: string;
  fullName: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  enrollmentDate: string;
  status: string;
  branch: string;
  planGroup: number;
  planIP: string;
  planOP: string;
  planRB: string | null;
  planRG: string | null;
  planKM: string | null;
  planMCU: string | null;
  planLainnya: string | null;
}

export interface SeedPolicy {
  id: string;
  policyNumber: string;
  policyholderName: string;
  periodStart: string;
  periodEnd: string;
  benefitTypes: string[];
  totalMembers: number;
  employees: number;
  dependents: number;
  benefitTiers: { code: string; name: string; annualLimit: number; roomLimit: number }[];
  benefits: { id: string; name: string; batasan: string; limit: number; terpakai: number | null; sisa: number | null; limitId: string }[];
  endorsementClauses: string[];
  createdAt: string;
  status: string;
}

// TC Endorsement clauses extracted from TC_MIR_to_Admedika_081020.pdf
export const mirEndorsementClauses = [
  "Masa Tunggu dan Kondisi Yang Sudah Ada Sebelumnya (Pre Existing Condition) dihapuskan",
  "Rawat Darurat Gigi akibat kecelakaan (48 jam setelah terjadinya kecelakaan), termasuk biaya Perawatan Lanjutan maks 14 hari",
  "Pembedahan kecil di klinik diperbolehkan sepanjang oleh dokter ber-SIP (misal: cabut kuku, eksisi)",
  "Jarak pembelian obat dan lab maks 2x24 jam, tidak berlaku untuk penyakit tertentu yang sudah ditentukan oleh dokter",
  "Endoskopi dijamin dalam ODC baik ada atau tidak ada Biopsi",
  "Flour Albus dijamin sepanjang bukan penyakit kelamin",
  "HCP berlaku untuk asuransi komersial dengan kondisi tidak ada excess dari asuransi pertama",
  "Pembedahan jika ada 2 sayatan, yang terbesar dijamin. Jika naik kelas perawatan, berlaku inner limit",
  "Penyakit dan/atau Luka yang diakibatkan oleh pekerjaan atau profesi dijamin",
  "Vitamin, Multivitamin & Food Supplement dijamin sesuai resep dokter (tidak berdiri sendiri, harus ada obat penyerta)",
  "COVID-19 dijamin termasuk rawat inap dan rawat jalan, Protap RS, rapid test, swab, CT Thorax atas indikasi medis",
  "Santunan duka akibat positif Covid-19 dijamin",
  "Minimum jam rawat inap: 6 jam berturut-turut di UGD, atau ada tindakan operasi, atau ada charge kamar",
  "Toleransi kenaikan kelas kamar jika penuh: 1 tingkat lebih tinggi maksimum 2x24 jam",
  "Biaya Perawatan Intensif (ICU) maks 20 hari per perawatan",
  "Kamar Semi ICU/Isolasi/Intermediary maks 20 hari per perawatan",
  "Perawatan sebelum dan sesudah Rawat Inap: 30 hari sebelum & 30 hari sesudah, berlaku cashless",
  "Ambulance dijamin dari lokasi pasien ke RS Rekanan atau RS Rekanan ke RS Rekanan",
  "One Day Care (ODC) dijamin, Post One Day Surgery dijamin pada Manfaat Perawatan Sebelum/Sesudah Rawat Inap",
  "Penyewaan Alat Medis dijamin selama di Rawat Inap (kursi roda, tongkat penyangga, dll)",
  "Operasi Gigi Bungsu dijamin sesuai limit manfaat tersendiri",
  "Hemodialisa & Kemoterapi dijamin termasuk cimino",
  "Alat Bantu Tanam dijamin: IOL, pen, plate, screw, K-wire, ring, stent, cimino",
  "Komplikasi Kehamilan dijamin sebagai penyakit rawat inap biasa",
  "Sunat/Sirkumsisi dijamin dengan indikasi medis (phymosis) tanpa batasan usia",
  "Hernia dijamin tanpa batasan usia atas indikasi medis",
  "Endometriosis, kista, dan mioma dijamin selama tidak berhubungan dengan fertilitas/infertilitas",
  "Gangguan Hormonal dijamin selama tidak terkait dengan fertilitas/infertilitas",
  "Kondisi Bawaan dijamin untuk Rawat Inap dan Rawat Jalan",
  "Transplantasi Organ dijamin sebatas biaya operasinya saja (biaya pembelian organ & operasi pendonor tidak dijamin)",
  "Santunan Biaya Pemakaman/Kremasi dijamin",
  "Santunan Harian Rawat Inap di RS (BPJS) berlaku reimbursement",
  "Rawat Jalan: Penggantian Manfaat 85% (maks sebatas Manfaat)",
  "Dokter Spesialis tanpa rujukan dokter umum",
  "Akupunktur dijamin oleh dokter bersertifikasi, pada manfaat dokter + obat (biaya jasa dokter saja)",
  "Imunisasi dasar (BCG, DPT, Polio, Campak, Hepatitis B) untuk anak s.d 5 tahun",
  "KB dijamin (IUD, Pil, Suntik, Implan/Susuk) termasuk kontrol KB & komplikasi",
  "Pemeriksaan Kehamilan (ANC) dijamin: konsultasi dokter, obat-obatan, test diagnostic. Khusus istri karyawan usia maks 45 tahun, kehamilan anak ke-3",
  "Kadaluarsa klaim reimbursement: 60 hari kalender untuk Jabodetabek dan luar Jabodetabek",
  "Masa tunggu kelengkapan dokumen klaim: 30 hari kalender",
  "Proses pembayaran klaim reimbursement: 10 hari kerja setelah dokumen lengkap diterima",
];

// Real member data from Excel (first 50 for seed, representing variety)
const rawMemberData = [
  ["MIR HO","P03.20.0001.0001A","YUSTINUS SALEH","Karyawan","L","12 May 1961",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0001B","ANDRIANI HUSNI","Istri","P","05 Jun 1964",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0001D","NICHOLAS SEBASTIAN","Anak","L","29 Sep 1995",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0001E","RENATA ANASTASIA","Anak","P","18 Mar 1997",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0002A","DJOKO GAZALI","Karyawan","L","23 Jun 1961",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0002B","MAYANGSARI","Istri","P","27 May 1963",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0002D","GERALDINE GIACHINTA","Anak","P","31 May 1998",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0003A","IRWAN KARIM ISWARA","Karyawan","L","21 Dec 1963",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0003B","PRADJNA PARAMITA","Istri","P","18 Jun 1971",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0003D","KIANI ARIANDITA","Anak","P","21 May 1997",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0004A","HANAWATI TANUSAPUTRA","Karyawati","P","28 May 1956",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0005A","ENRICO SUNARTONO","Karyawan","L","27 Sep 1983",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0005B","FENNELA THEJA KUSMANA","Istri","P","14 May 1984",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0005D","ZOE MADELEIN DE ENRICO","Anak","P","30 Oct 2013",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0005E","HAILEY ALEXA DE ENRICO","Anak","P","18 Jul 2016",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0006A","GERARD GIANNO GAZALI","Karyawan","L","29 Nov 1993",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0007A","JACOB KOSASIH","Karyawan","L","06 Jan 1963",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0007B","LILY SOEGIANTO","Istri","P","24 Jul 1965",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0008A","VINA KOSASIH","Karyawati","P","25 Sep 1992",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0009A","ARIEF SYAIBUDDIN","Karyawan","L","11 Sep 1982",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0009B","LIA AMALIA","Istri","P","21 Sep 1989",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0009D","KIAN MALIK ISWARA","Anak","L","22 Apr 2018",2000,"IP2000","OP600"],
  ["MIR HO","P03.20.0001.0010A","RACHSID","Karyawan","L","10 Jun 1969",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0010B","JENNY","Istri","P","20 Jan 1966",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0010D","DANIEL ANUGRAHA","Anak","L","24 Jul 2002",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0010E","MICHAEL ANUGRAHA","Anak","L","15 Mar 2006",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0010F","DAVID ANUGRAHA","Anak","L","06 Jun 2001",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0011A","TEDJO MULJONO KOSIM","Karyawan","L","29 Mar 1971",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0011B","DIANA ROZA MULJONO","Istri","P","15 Nov 1974",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0011D","FELICIA MULJONO","Anak","P","28 Jun 2002",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0012A","AGUS HIDAYAT","Karyawan","L","15 Aug 1975",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0012B","SITI NURHALIZA","Istri","P","22 Mar 1978",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0013A","BUDI SANTOSO","Karyawan","L","05 Dec 1980",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0013B","DEWI LESTARI","Istri","P","18 Jul 1982",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0013D","AHMAD FAUZI","Anak","L","10 Sep 2010",1400,"IP1400","OP600"],
  ["MIR HO","P03.20.0001.0014A","HENDRI WIJAYA","Karyawan","L","28 Feb 1978",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0014B","MARIA CHRISTINA","Istri","P","14 Apr 1980",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0015A","SUSANTO HALIM","Karyawan","L","07 Oct 1985",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0015B","RINI WULANDARI","Istri","P","25 Dec 1987",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0016A","WAHYU PRANATA","Karyawan","L","12 Jan 1990",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0017A","ANDI PERMANA","Karyawan","L","30 May 1988",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0017B","PUTRI ANGGRAENI","Istri","P","08 Aug 1990",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0018A","RIZKI PRATAMA","Karyawan","L","19 Nov 1992",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0019A","DIMAS ADITYA","Karyawan","L","03 Mar 1995",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0020A","YOGA SAPUTRA","Karyawan","L","16 Jul 1993",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0020B","SARI DEWI","Istri","P","22 Sep 1995",1000,"IP1000","OP400"],
  ["MIR HO","P03.20.0001.0021A","FAJAR NUGROHO","Karyawan","L","11 Apr 1991",800,"IP800","OP300"],
  ["MIR HO","P03.20.0001.0022A","GILANG RAMADHAN","Karyawan","L","25 Jun 1994",800,"IP800","OP300"],
  ["MIR HO","P03.20.0001.0023A","HENDRA KUSUMA","Karyawan","L","09 Feb 1989",800,"IP800","OP300"],
  ["MIR HO","P03.20.0001.0024A","INDRA LESMANA","Karyawan","L","14 Dec 1986",800,"IP800","OP300"],
];

function parseDate(dateStr: string): string {
  const months: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '1990-01-01';
}

export function generateMemberSeedData(): SeedMember[] {
  const policyId = 'POL-MIR-001';
  const policyNumber = 'P03-01-10-2020-0000001';
  const policyholderName = 'PT. Mitra Iswara & Rorimpandey Ltd';
  const policyExpiryDate = '2021-10-13';
  const enrollmentDate = '2020-10-14';

  return rawMemberData.map((row, index) => {
    const [branch, noPeserta, nama, hubPeserta, sex, tglLahir, group, planIP, planOP] = row as [string, string, string, string, string, string, number, string, string];
    
    let relationship = 'Prinsipal';
    if (hubPeserta === 'Istri') relationship = 'Pasangan';
    else if (hubPeserta === 'Anak' || hubPeserta === 'ANAK ') relationship = 'Anak';
    else if (hubPeserta === 'Karyawan' || hubPeserta === 'Karyawati') relationship = 'Prinsipal';

    return {
      memberId: `MEM-MIR-${String(index + 1).padStart(4, '0')}`,
      policyId,
      policyNumber,
      policyholderName,
      policyExpiryDate,
      memberCardNumber: noPeserta,
      fullName: nama,
      relationship,
      gender: sex === 'L' ? 'Laki-laki' : 'Perempuan',
      dateOfBirth: parseDate(tglLahir),
      enrollmentDate,
      status: 'ACTIVE',
      branch,
      planGroup: group,
      planIP,
      planOP,
      planRB: null,
      planRG: null,
      planKM: null,
      planMCU: null,
      planLainnya: null,
    };
  });
}

export function generatePolicySeedData(): SeedPolicy {
  const members = generateMemberSeedData();
  const employees = members.filter(m => m.relationship === 'Prinsipal').length;
  const dependents = members.filter(m => m.relationship !== 'Prinsipal').length;

  return {
    id: 'POL-MIR-001',
    policyNumber: 'P03-01-10-2020-0000001',
    policyholderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
    periodStart: '2020-10-14',
    periodEnd: '2021-10-13',
    benefitTypes: ['Rawat Inap', 'Rawat Jalan'],
    totalMembers: 526,
    employees: 220,
    dependents: 306,
    benefitTiers: [
      { code: 'IP2000', name: 'Rawat Inap Premium 2000', annualLimit: 200000000, roomLimit: 2000000 },
      { code: 'IP1400', name: 'Rawat Inap Standard 1400', annualLimit: 140000000, roomLimit: 1400000 },
      { code: 'IP1000', name: 'Rawat Inap Basic 1000', annualLimit: 100000000, roomLimit: 1000000 },
      { code: 'IP800', name: 'Rawat Inap Economy 800', annualLimit: 80000000, roomLimit: 800000 },
      { code: 'OP600', name: 'Rawat Jalan 600', annualLimit: 6000000, roomLimit: 0 },
      { code: 'OP400', name: 'Rawat Jalan 400', annualLimit: 4000000, roomLimit: 0 },
      { code: 'OP300', name: 'Rawat Jalan 300', annualLimit: 3000000, roomLimit: 0 },
    ],
    benefits: [
      { id: 'kamar_rawat', name: 'Biaya Kamar Rawat Inap per hari', batasan: 'Per Hari', limit: 2000000, terpakai: null, sisa: null, limitId: 'MIR-RI-001' },
      { id: 'icu', name: 'Biaya ICU/ICCU per hari', batasan: 'Per Hari', limit: 4000000, terpakai: null, sisa: null, limitId: 'MIR-RI-002' },
      { id: 'pembedahan', name: 'Biaya Pembedahan', batasan: 'Per Tahun', limit: 100000000, terpakai: null, sisa: null, limitId: 'MIR-RI-003' },
      { id: 'dokter_visit', name: 'Biaya Kunjungan Dokter per hari', batasan: 'Per Hari', limit: 500000, terpakai: null, sisa: null, limitId: 'MIR-RI-004' },
      { id: 'obat_rs', name: 'Biaya Obat-obatan RS', batasan: 'Per Tahun', limit: 50000000, terpakai: null, sisa: null, limitId: 'MIR-RI-005' },
      { id: 'lab_rs', name: 'Biaya Laboratorium RS', batasan: 'Per Tahun', limit: 20000000, terpakai: null, sisa: null, limitId: 'MIR-RI-006' },
      { id: 'ambulance', name: 'Biaya Ambulance', batasan: 'Per Kejadian', limit: 5000000, terpakai: null, sisa: null, limitId: 'MIR-RI-007' },
      { id: 'konsultasi_umum', name: 'Biaya Konsultasi Dokter Umum', batasan: 'Per Hari', limit: 150000, terpakai: null, sisa: null, limitId: 'MIR-RJ-001' },
      { id: 'konsultasi_spesialis', name: 'Biaya Konsultasi Dokter Spesialis', batasan: 'Per Hari', limit: 250000, terpakai: null, sisa: null, limitId: 'MIR-RJ-002' },
      { id: 'lab_rj', name: 'Biaya Laboratorium Rawat Jalan', batasan: 'Per Tahun', limit: 2000000, terpakai: 850000, sisa: 1150000, limitId: 'MIR-RJ-003' },
      { id: 'obat_rj', name: 'Biaya Obat-obatan Rawat Jalan', batasan: 'Per Tahun', limit: 3000000, terpakai: 1200000, sisa: 1800000, limitId: 'MIR-RJ-004' },
      { id: 'fisioterapi', name: 'Biaya Fisioterapi', batasan: 'Per Tahun', limit: 1500000, terpakai: 500000, sisa: 1000000, limitId: 'MIR-RJ-005' },
    ],
    endorsementClauses: mirEndorsementClauses,
    createdAt: new Date().toISOString(),
    status: 'Aktif',
  };
}

export function getAllSeedData() {
  return {
    members: generateMemberSeedData(),
    policy: generatePolicySeedData(),
    endorsementClauses: mirEndorsementClauses,
  };
}
