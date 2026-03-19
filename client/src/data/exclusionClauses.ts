export interface ExclusionClause {
  id: number;
  pasal: string;
  title: string;
  description: string;
  keywords: string[];
  includesComplications: boolean;
  isFromPolicy?: boolean;
}

export const STANDARD_EXCLUSION_CLAUSES: ExclusionClause[] = [
  {
    id: 1,
    pasal: "Pasal 1",
    title: "Kondisi Pre-existing",
    description: "Penyakit atau kondisi yang sudah ada sebelum tanggal efektif kepesertaan, termasuk gejala yang sudah muncul sebelumnya.",
    keywords: ["pre-existing", "kondisi sebelumnya", "penyakit sebelum"],
    includesComplications: true,
  },
  {
    id: 2,
    pasal: "Pasal 2",
    title: "Penyakit Auto-imun",
    description: "Penyakit yang disebabkan oleh sistem kekebalan tubuh yang menyerang sel tubuh sendiri, seperti Lupus (SLE), Rheumatoid Arthritis, Multiple Sclerosis, serta komplikasi yang ditimbulkan.",
    keywords: ["lupus", "SLE", "rheumatoid", "auto-imun", "autoimmune", "multiple sclerosis"],
    includesComplications: true,
  },
  {
    id: 3,
    pasal: "Pasal 3",
    title: "HIV/AIDS",
    description: "Infeksi HIV dan penyakit AIDS, termasuk semua kondisi terkait dan komplikasi yang ditimbulkan.",
    keywords: ["HIV", "AIDS", "immunodeficiency"],
    includesComplications: true,
  },
  {
    id: 4,
    pasal: "Pasal 4",
    title: "Hemodialisis / Cuci Darah",
    description: "Prosedur hemodialisis atau cuci darah untuk gagal ginjal kronis, kecuali ditambahkan melalui endorsement khusus.",
    keywords: ["hemodialisis", "cuci darah", "dialysis", "gagal ginjal"],
    includesComplications: false,
  },
  {
    id: 5,
    pasal: "Pasal 5",
    title: "Transplantasi Organ",
    description: "Prosedur transplantasi organ apapun, termasuk persiapan dan perawatan pasca transplantasi.",
    keywords: ["transplantasi", "transplant", "cangkok organ"],
    includesComplications: true,
  },
  {
    id: 6,
    pasal: "Pasal 6",
    title: "Perawatan Kejiwaan",
    description: "Perawatan untuk gangguan mental, kejiwaan, atau psikiatri, termasuk rawat inap di fasilitas kejiwaan.",
    keywords: ["jiwa", "psikiatri", "mental", "psychiatric", "depresi", "anxiety", "schizophrenia"],
    includesComplications: false,
  },
  {
    id: 7,
    pasal: "Pasal 7",
    title: "Rehabilitasi Narkoba dan Alkohol",
    description: "Perawatan rehabilitasi untuk ketergantungan narkotika, obat-obatan terlarang, atau alkohol.",
    keywords: ["narkoba", "alkohol", "rehabilitasi", "ketergantungan", "addiction"],
    includesComplications: false,
  },
  {
    id: 8,
    pasal: "Pasal 8",
    title: "Perawatan Kesuburan",
    description: "Prosedur terkait kesuburan termasuk IVF, inseminasi buatan, dan pengobatan infertilitas.",
    keywords: ["kesuburan", "fertility", "IVF", "inseminasi", "infertilitas", "bayi tabung"],
    includesComplications: false,
  },
  {
    id: 9,
    pasal: "Pasal 9",
    title: "Kontrasepsi",
    description: "Prosedur kontrasepsi termasuk sterilisasi (vasektomi, tubektomi) dan alat kontrasepsi.",
    keywords: ["kontrasepsi", "vasektomi", "tubektomi", "sterilisasi", "KB"],
    includesComplications: false,
  },
  {
    id: 10,
    pasal: "Pasal 10",
    title: "Aborsi Elektif",
    description: "Pengguguran kandungan yang tidak atas indikasi medis yang mengancam jiwa ibu.",
    keywords: ["aborsi", "abortion", "gugur kandungan"],
    includesComplications: false,
  },
  {
    id: 11,
    pasal: "Pasal 11",
    title: "Disfungsi Seksual",
    description: "Pengobatan untuk disfungsi seksual termasuk impotensi dan frigiditas.",
    keywords: ["disfungsi seksual", "impotensi", "erectile dysfunction"],
    includesComplications: false,
  },
  {
    id: 12,
    pasal: "Pasal 12",
    title: "Perubahan Jenis Kelamin",
    description: "Prosedur perubahan atau penegasan jenis kelamin dan semua perawatan terkait.",
    keywords: ["ganti kelamin", "gender", "transgender"],
    includesComplications: false,
  },
  {
    id: 13,
    pasal: "Pasal 13",
    title: "Kelainan Kongenital",
    description: "Kelainan bawaan lahir atau kondisi kongenital yang sudah ada sejak lahir.",
    keywords: ["kongenital", "bawaan lahir", "congenital", "birth defect"],
    includesComplications: true,
  },
  {
    id: 14,
    pasal: "Pasal 14",
    title: "Bedah Kosmetik",
    description: "Prosedur bedah kosmetik atau estetika yang tidak atas indikasi medis, termasuk rhinoplasty, liposuction, facelift.",
    keywords: ["kosmetik", "cosmetic", "estetika", "rhinoplasty", "liposuction", "facelift", "botox"],
    includesComplications: false,
  },
  {
    id: 15,
    pasal: "Pasal 15",
    title: "Perawatan Gigi Kosmetik",
    description: "Perawatan gigi kosmetik seperti veneer, bleaching, dan kawat gigi untuk estetika.",
    keywords: ["veneer", "bleaching gigi", "kawat gigi estetika", "orthodontic cosmetic"],
    includesComplications: false,
  },
  {
    id: 16,
    pasal: "Pasal 16",
    title: "Perawatan Mata Refraktif",
    description: "Operasi mata refraktif seperti LASIK untuk koreksi penglihatan.",
    keywords: ["LASIK", "lasik", "refraktif", "koreksi penglihatan"],
    includesComplications: false,
  },
  {
    id: 17,
    pasal: "Pasal 17",
    title: "Cedera Akibat Olahraga Ekstrem",
    description: "Cedera yang diakibatkan oleh olahraga ekstrem atau berbahaya seperti terjun payung, bungee jumping, balap motor.",
    keywords: ["olahraga ekstrem", "extreme sport", "terjun payung", "bungee", "balap"],
    includesComplications: false,
  },
  {
    id: 18,
    pasal: "Pasal 18",
    title: "Cedera Akibat Tindakan Kriminal",
    description: "Cedera yang diakibatkan oleh keterlibatan dalam tindakan kriminal atau melawan hukum.",
    keywords: ["kriminal", "criminal", "melawan hukum", "illegal"],
    includesComplications: false,
  },
  {
    id: 19,
    pasal: "Pasal 19",
    title: "Percobaan Bunuh Diri",
    description: "Cedera atau kondisi yang diakibatkan oleh percobaan bunuh diri atau menyakiti diri sendiri.",
    keywords: ["bunuh diri", "suicide", "self-harm", "menyakiti diri"],
    includesComplications: false,
  },
  {
    id: 20,
    pasal: "Pasal 20",
    title: "Perang dan Kerusuhan",
    description: "Cedera atau kondisi yang diakibatkan oleh perang, kerusuhan, atau aksi terorisme.",
    keywords: ["perang", "war", "kerusuhan", "riot", "terorisme", "terrorism"],
    includesComplications: false,
  },
  {
    id: 21,
    pasal: "Pasal 21",
    title: "Bencana Nuklir",
    description: "Cedera atau kondisi yang diakibatkan oleh radiasi nuklir atau bencana nuklir.",
    keywords: ["nuklir", "nuclear", "radiasi", "radiation"],
    includesComplications: false,
  },
  {
    id: 22,
    pasal: "Pasal 22",
    title: "Vitamin dan Suplemen",
    description: "Vitamin, suplemen makanan, atau produk kesehatan yang dijual bebas tanpa resep dokter.",
    keywords: ["vitamin", "suplemen", "supplement", "food supplement"],
    includesComplications: false,
  },
  {
    id: 23,
    pasal: "Pasal 23",
    title: "Perawatan Eksperimental",
    description: "Prosedur atau pengobatan eksperimental yang belum diakui secara medis.",
    keywords: ["eksperimental", "experimental", "tidak diakui", "unproven"],
    includesComplications: false,
  },
  {
    id: 24,
    pasal: "Pasal 24",
    title: "Pengobatan Alternatif",
    description: "Pengobatan alternatif atau tradisional yang tidak dilakukan oleh tenaga medis berlisensi.",
    keywords: ["alternatif", "alternative", "tradisional", "traditional medicine", "akupuntur non-medis"],
    includesComplications: false,
  },
  {
    id: 25,
    pasal: "Pasal 25",
    title: "Medical Check-up Rutin",
    description: "Pemeriksaan kesehatan rutin tanpa indikasi medis, kecuali termasuk dalam manfaat polis.",
    keywords: ["check-up", "medical checkup", "pemeriksaan rutin", "screening tanpa indikasi"],
    includesComplications: false,
  },
  {
    id: 26,
    pasal: "Pasal 26",
    title: "Vaksinasi Non-esensial",
    description: "Vaksinasi yang tidak esensial atau tidak diwajibkan oleh pemerintah.",
    keywords: ["vaksinasi", "vaccination", "imunisasi non-esensial"],
    includesComplications: false,
  },
  {
    id: 27,
    pasal: "Pasal 27",
    title: "Perawatan di Luar Negeri Tanpa Persetujuan",
    description: "Perawatan medis di luar negeri tanpa persetujuan tertulis dari penanggung.",
    keywords: ["luar negeri", "overseas", "abroad", "tanpa persetujuan"],
    includesComplications: false,
  },
  {
    id: 28,
    pasal: "Pasal 28",
    title: "Perawatan oleh Keluarga",
    description: "Perawatan yang dilakukan oleh anggota keluarga atau bukan tenaga medis berlisensi.",
    keywords: ["keluarga", "family treatment", "non-licensed"],
    includesComplications: false,
  },
];

export type ExclusionRecommendation = 
  | 'NOT_EXCLUDED' 
  | 'EXCLUDED' 
  | 'PARTIAL_EXCLUSION';

export interface DiagnosisExclusionAnalysis {
  icd10Code: string;
  diagnosisName: string;
  isPrimary: boolean;
  isExcluded: boolean;
  exclusionClause: ExclusionClause | null;
  relatedToDiagnosis?: string;
  isComplication: boolean;
}

export interface CP4AIRecommendation {
  status: ExclusionRecommendation;
  confidence: number;
  summary: string;
  diagnosesAnalysis: DiagnosisExclusionAnalysis[];
  recommendedAction: 'CONTINUE' | 'REJECT';
  policyReference: {
    document: string;
    clause: string;
  };
  hasPolicySpecificExclusions?: boolean;
}
