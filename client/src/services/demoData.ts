import { Claim } from "@shared/schema";
import { SeedMember, SeedPolicy } from "./realSeedData";
import { getBenefitLimitIdMappings, getPolicyCodeFromClaim } from "@/utils/benefitPlanLookup";

// Interface for member validation result
interface MemberValidationResult {
  databaseChecked: boolean;
  passed: boolean;
  message: string;
  recommendation?: string;
  memberData?: {
    memberId: string;
    fullName: string;
    memberCardNumber: string;
    policyholderName: string;
    policyNumber: string;
    status: string;
    relationship: string;
    planIP: string;
    planOP: string;
    planRB: string | null;
    planRG: string | null;
    planKM: string | null;
    planMCU: string | null;
    benefitMappings: Array<{ benefitId: string; limitId: string; benefitName: string }>;
  };
}

// Lookup member from localStorage (populated by Pemegang Polis module)
function lookupMemberByCardNumber(cardNumber: string): SeedMember | null {
  try {
    // Check localStorage for members seeded via API (stored as array)
    const storedMembers = localStorage.getItem('strator_seeded_members');
    if (storedMembers) {
      const members: SeedMember[] = JSON.parse(storedMembers);
      const found = members.find(m => m.memberCardNumber === cardNumber);
      if (found) return found;
    }
    return null;
  } catch (error) {
    console.error('Error looking up member:', error);
    return null;
  }
}

// Lookup member by name (fallback)
function lookupMemberByName(name: string): SeedMember | null {
  try {
    const storedMembers = localStorage.getItem('strator_seeded_members');
    if (storedMembers) {
      const members: SeedMember[] = JSON.parse(storedMembers);
      const nameLower = name.toLowerCase().trim();
      const found = members.find(m => m.fullName.toLowerCase().trim() === nameLower);
      if (found) return found;
    }
    return null;
  } catch (error) {
    console.error('Error looking up member by name:', error);
    return null;
  }
}

// Lookup policy from localStorage
function lookupPolicy(policyNumber: string): SeedPolicy | null {
  try {
    const storedPolicies = localStorage.getItem('strator_policies');
    if (storedPolicies) {
      const policies: SeedPolicy[] = JSON.parse(storedPolicies);
      return policies.find(p => p.policyNumber === policyNumber || p.id === policyNumber) || null;
    }
    return null;
  } catch (error) {
    console.error('Error looking up policy:', error);
    return null;
  }
}

// Generate memberValidation object based on actual database lookup
function generateMemberValidation(
  cardNumber: string, 
  patientName: string,
  policyHolderName: string,
  benefitCategory: string
): MemberValidationResult {
  // First try by card number
  let member = lookupMemberByCardNumber(cardNumber);
  
  // Fallback to name lookup
  if (!member) {
    member = lookupMemberByName(patientName);
  }
  
  if (!member) {
    return {
      databaseChecked: true,
      passed: false,
      message: `Peserta dengan nomor kartu ${cardNumber} atau nama "${patientName}" TIDAK DITEMUKAN dalam database kepesertaan.`,
      recommendation: 'Klaim harus DITOLAK karena peserta tidak terdaftar dalam sistem.'
    };
  }
  
  // Member found - check status
  const isActive = member.status === 'ACTIVE' || member.status === 'AKTIF';
  
  if (!isActive) {
    return {
      databaseChecked: true,
      passed: false,
      message: `Peserta ${member.fullName} (No. Kartu: ${member.memberCardNumber}) ditemukan tetapi status kepesertaan: ${member.status}.`,
      recommendation: 'Klaim harus DITOLAK karena kepesertaan tidak aktif.',
      memberData: {
        memberId: member.memberId,
        fullName: member.fullName,
        memberCardNumber: member.memberCardNumber,
        policyholderName: member.policyholderName,
        policyNumber: member.policyNumber,
        status: member.status,
        relationship: member.relationship,
        planIP: member.planIP,
        planOP: member.planOP,
        planRB: member.planRB,
        planRG: member.planRG,
        planKM: member.planKM,
        planMCU: member.planMCU,
        benefitMappings: []
      }
    };
  }
  
  // Generate policy code and benefit mappings
  const policyCode = policyHolderName.includes('Mitra Iswara') ? 'MIR' : 
                     policyHolderName.includes('Gold Coin') ? 'GCI' : 'STD';
  const claimType = benefitCategory?.toUpperCase().includes('INAP') ? 'RI' : 'RJ';
  const benefitMappings = getBenefitLimitIdMappings(policyCode, claimType as 'RJ' | 'RI');
  
  return {
    databaseChecked: true,
    passed: true,
    message: `Peserta ${member.fullName} (No. Kartu: ${member.memberCardNumber}) TERDAFTAR dan AKTIF dalam polis ${member.policyholderName}. Plan: ${member.planIP}/${member.planOP}.`,
    recommendation: 'Validasi kepesertaan berhasil. Lanjutkan ke pemeriksaan dokumen.',
    memberData: {
      memberId: member.memberId,
      fullName: member.fullName,
      memberCardNumber: member.memberCardNumber,
      policyholderName: member.policyholderName,
      policyNumber: member.policyNumber,
      status: member.status,
      relationship: member.relationship,
      planIP: member.planIP,
      planOP: member.planOP,
      planRB: member.planRB,
      planRG: member.planRG,
      planKM: member.planKM,
      planMCU: member.planMCU,
      benefitMappings
    }
  };
}

// Apply member validation to a claim and update relevant fields
function applyMemberValidation(claim: Claim): Claim {
  const validation = generateMemberValidation(
    claim.memberCardNumber || '',
    claim.patientName || '',
    claim.policyHolderName || '',
    claim.benefitCategory || 'RAWAT JALAN'
  );
  
  // Update claim with validation results
  const updatedClaim = { ...claim };
  
  // Add memberValidation object
  (updatedClaim as any).memberValidation = validation;
  
  // Update aiAnalysis.validitasPeserta based on actual lookup
  if (updatedClaim.aiAnalysis) {
    updatedClaim.aiAnalysis = {
      ...updatedClaim.aiAnalysis,
      validitasPeserta: validation.message
    };
  }
  
  // Update checkpointStatuses based on validation result
  if (updatedClaim.checkpointStatuses) {
    updatedClaim.checkpointStatuses = {
      ...updatedClaim.checkpointStatuses,
      validitasPeserta: validation.passed ? 'passed' : 'failed'
    };
  }
  
  // Update benefits from actual member data
  if (validation.memberData) {
    const memberBenefits: string[] = [];
    if (validation.memberData.planIP) memberBenefits.push(validation.memberData.planIP);
    if (validation.memberData.planOP) memberBenefits.push(validation.memberData.planOP);
    if (validation.memberData.planRB) memberBenefits.push(validation.memberData.planRB);
    if (validation.memberData.planRG) memberBenefits.push(validation.memberData.planRG);
    if (validation.memberData.planKM) memberBenefits.push(validation.memberData.planKM);
    if (validation.memberData.planMCU) memberBenefits.push(validation.memberData.planMCU);
    
    if (memberBenefits.length > 0) {
      updatedClaim.benefits = memberBenefits;
    }
    
    // Update member status - handle both 'ACTIVE' and 'AKTIF' as active
    const isStatusActive = validation.memberData.status === 'ACTIVE' || validation.memberData.status === 'AKTIF';
    updatedClaim.memberStatus = isStatusActive ? 'AKTIF' : 'TIDAK AKTIF';
  }
  
  // If validation failed, update adjudication result
  if (!validation.passed) {
    updatedClaim.adjudicationResult = 'Tolak';
    updatedClaim.revisedAmount = 0;
    if (updatedClaim.aiAnalysis) {
      updatedClaim.aiAnalysis.keputusanAkhir = `Klaim DITOLAK. ${validation.recommendation}`;
    }
    if (updatedClaim.checkpointStatuses) {
      updatedClaim.checkpointStatuses.keputusanAkhir = 'failed';
    }
  }
  
  return updatedClaim;
}

// Generate realistic Indonesian medical claims with fraud scenarios for demo
export function generateDemoClaimsData(): Claim[] {
  const baseDate = new Date('2025-01-15');
  const testDate = new Date('2025-12-10'); // Current period for chart testing
  
  // Generate raw claims first
  const rawClaims: Claim[] = [
    // TEST CLAIM 1: OVERCHARGE (Rp100k claim, Rp50k temuan) - PT. Mitra Iswara member
    {
      id: 'test-claim-overcharge-001',
      fileName: 'test_overcharge_001.pdf',
      provider: 'RS Test Jakarta',
      date: '10/12/2025',
      patientId: '***001',
      patientName: 'YUSTINUS SALEH',
      patientNIK: '3201***********001',
      patientDOB: '1961-05-12',
      patientDateOfBirth: '12 Mei 1961',
      patientAge: 64,
      patientGender: 'L' as const,
      principalName: 'YUSTINUS SALEH',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: 'P03.20.0001.0001A',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
      policyNumber: 'P03-01-10-2020-0000001',
      policyEffectiveDate: '2025-01-01',
      policyExpiryDate: '2025-12-31',
      benefits: ['IP2000', 'OP600'],
      treatmentDate: '10/12/2025',
      submissionDate: '10/12/2025',
      submissionDeadlineDate: '10/03/2026',
      aiAnalysis: {
        validitasPeserta: 'Peserta YUSTINUS SALEH (No. Kartu: P03.20.0001.0001A) terdaftar aktif dalam polis PT. Mitra Iswara & Rorimpandey Ltd. Plan: IP2000/OP600.',
        kelengkapanDokumen: 'Dokumen lengkap.',
        ketepatanWaktu: 'Tepat waktu.',
        pengecualianPolis: 'Tidak ada pengecualian.',
        analisisKlaim: 'Terdeteksi overcharge Rp50.000.',
        batasManfaat: 'Dalam batas.',
        keputusanAkhir: 'Klaim dengan overcharge.'
      },
      documents: [],
      diagnosis: 'Common Cold',
      icd10: 'J00',
      icd10Codes: [{ code: 'J00', name: 'Common Cold' }],
      amount: 100000,
      revisedAmount: 50000,
      adjudicationResult: 'Approve Sebagian' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Outpatient' as const,
      items: [{ name: 'Konsultasi Dokter', quantity: 1, unitPrice: 100000, totalPrice: 100000 }],
      totalOvercharge: 50000,
      hasIssues: true,
      riskScore: 50,
      status: 'processed' as const,
      createdAt: testDate,
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'passed' as const,
        analisisKlaim: 'failed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'failed' as const,
      },
      fraudFlags: [{ type: 'OVERPRICING' as const, severity: 'MEDIUM' as const, description: 'Overcharge Rp50.000' }],
    },
    // TEST CLAIM 2: FRAUD (Rp100k claim, Rp50k temuan) - PT. Mitra Iswara member
    {
      id: 'test-claim-fraud-002',
      fileName: 'test_fraud_002.pdf',
      provider: 'RS Test Bandung',
      date: '11/12/2025',
      patientId: '***002',
      patientName: 'HANAWATI TANUSAPUTRA',
      patientNIK: '3202***********002',
      patientDOB: '1956-05-28',
      patientDateOfBirth: '28 Mei 1956',
      patientAge: 69,
      patientGender: 'P' as const,
      principalName: 'HANAWATI TANUSAPUTRA',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: 'P03.20.0001.0004A',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
      policyNumber: 'P03-01-10-2020-0000001',
      policyEffectiveDate: '2025-01-01',
      policyExpiryDate: '2025-12-31',
      benefits: ['IP2000', 'OP600'],
      treatmentDate: '11/12/2025',
      submissionDate: '11/12/2025',
      submissionDeadlineDate: '11/03/2026',
      aiAnalysis: {
        validitasPeserta: 'Peserta HANAWATI TANUSAPUTRA (No. Kartu: P03.20.0001.0004A) terdaftar aktif dalam polis PT. Mitra Iswara & Rorimpandey Ltd. Plan: IP2000/OP600.',
        kelengkapanDokumen: 'Dokumen lengkap.',
        ketepatanWaktu: 'Tepat waktu.',
        pengecualianPolis: 'Tidak ada pengecualian.',
        analisisKlaim: 'Terdeteksi phantom billing Rp50.000.',
        batasManfaat: 'Dalam batas.',
        keputusanAkhir: 'Klaim dengan fraud.'
      },
      documents: [],
      diagnosis: 'Headache',
      icd10: 'R51',
      icd10Codes: [{ code: 'R51', name: 'Headache' }],
      amount: 100000,
      revisedAmount: 0,
      adjudicationResult: 'Tolak' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Outpatient' as const,
      items: [{ name: 'Konsultasi Dokter', quantity: 1, unitPrice: 100000, totalPrice: 100000 }],
      totalOvercharge: 50000,
      hasIssues: true,
      riskScore: 80,
      status: 'processed' as const,
      createdAt: testDate,
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'passed' as const,
        analisisKlaim: 'failed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'failed' as const,
      },
      fraudFlags: [{ type: 'SUSPICIOUS_PATTERN' as const, severity: 'HIGH' as const, description: 'Phantom billing Rp50.000' }],
    },
    // TEST CLAIM 3: POLICY VIOLATION (Rp100k claim, Rp50k temuan) - PT. Mitra Iswara member
    {
      id: 'test-claim-policy-003',
      fileName: 'test_policy_003.pdf',
      provider: 'RS Test Surabaya',
      date: '12/12/2025',
      patientId: '***003',
      patientName: 'DJOKO GAZALI',
      patientNIK: '3203***********003',
      patientDOB: '1961-06-23',
      patientDateOfBirth: '23 Juni 1961',
      patientAge: 64,
      patientGender: 'L' as const,
      principalName: 'DJOKO GAZALI',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: 'P03.20.0001.0002A',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
      policyNumber: 'P03-01-10-2020-0000001',
      policyEffectiveDate: '2025-01-01',
      policyExpiryDate: '2025-12-31',
      benefits: ['IP2000', 'OP600'],
      treatmentDate: '12/12/2025',
      submissionDate: '12/12/2025',
      submissionDeadlineDate: '12/03/2026',
      aiAnalysis: {
        validitasPeserta: 'Peserta DJOKO GAZALI (No. Kartu: P03.20.0001.0002A) terdaftar aktif dalam polis PT. Mitra Iswara & Rorimpandey Ltd. Plan: IP2000/OP600.',
        kelengkapanDokumen: 'Dokumen lengkap.',
        ketepatanWaktu: 'Tepat waktu.',
        pengecualianPolis: 'Terdeteksi pengecualian polis.',
        analisisKlaim: 'Klaim melanggar ketentuan polis.',
        batasManfaat: 'Dalam batas.',
        keputusanAkhir: 'Klaim dengan pelanggaran polis.'
      },
      documents: [],
      diagnosis: 'Pre-existing condition',
      icd10: 'Z86',
      icd10Codes: [{ code: 'Z86', name: 'Pre-existing condition' }],
      amount: 100000,
      revisedAmount: 0,
      adjudicationResult: 'Tolak' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Outpatient' as const,
      items: [{ name: 'Konsultasi Dokter', quantity: 1, unitPrice: 100000, totalPrice: 100000 }],
      totalOvercharge: 50000,
      hasIssues: true,
      riskScore: 70,
      status: 'processed' as const,
      createdAt: testDate,
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'failed' as const,
        analisisKlaim: 'passed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'failed' as const,
      },
      fraudFlags: [],
    },
    // TN ROKIB - Complete claim with all member/policy data
    {
      id: 'demo-claim-rokib-24091000583219',
      fileName: '29082024 RJ TN ROKIB 001.pdf',
      provider: 'RS Ananda Bekasi',
      date: '29/08/2024',
      patientId: '***008',
      patientName: 'TN ROKIB',
      patientNIK: '3206***********008',
      patientDOB: '1973-01-20',
      patientDateOfBirth: '20 Januari 1973',
      patientAge: 51,
      patientGender: 'L' as const,
      principalName: 'TN ROKIB',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: '1613070110001002',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT Gold Coin Indonesia',
      policyNumber: 'FPG.16.1307.24.00011',
      policyEffectiveDate: '2024-07-01',
      policyExpiryDate: '2025-06-30',
      benefits: ['IP1111', 'OP2222', 'RB3333', 'RG4444', 'KM5555', 'MCU6666'],
      treatmentDate: '29/08/2024',
      submissionDate: '29/08/2024',
      submissionDeadlineDate: '27/11/2024',
      policyDocumentRequirementsReference: 'Pasal 6, Ayat 2, Polis No. FPG.16.1307.24.00011, halaman 24',
      policyDocumentRequirementsText: `"Untuk pengajuan klaim, Tertanggung wajib menyerahkan dokumen-dokumen berikut:

• Formulir klaim yang telah diisi lengkap dan ditandatangani
• Kwitansi/invoice asli dari Rumah Sakit atau provider
• Surat keterangan dokter/hasil pemeriksaan medis
• Resep dokter (untuk klaim obat-obatan)
• Fotokopi kartu identitas (KTP/Paspor)
• Fotokopi kartu peserta asuransi

Untuk klaim rawat inap, tambahan dokumen: resume medis, hasil laboratorium (jika ada), dan surat rujukan (jika ada)."`,
      policyTimelineReference: 'Pasal 12, Ayat 1, Polis No. FPG.16.1307.24.00011, halaman 35',
      policyTimelineText: `"Pengajuan klaim harus dilakukan paling lambat 90 (sembilan puluh) hari kalender sejak tanggal perawatan atau pemeriksaan medis terakhir. Klaim yang diajukan melampaui batas waktu tersebut tidak akan diproses."`,
      aiAnalysis: {
        validitasPeserta: 'Peserta TN ROKIB (ID: 1613070110001002) terdaftar aktif dalam polis PT Gold Coin Indonesia. Kepesertaannya masih berlaku pada tanggal perawatan 29 Agustus 2024, jadi dari sisi status kepesertaan tidak ada masalah.',
        kelengkapanDokumen: 'Kabar baik—semua 6 dokumen yang diperlukan sudah lengkap tersubmit. Kualitas scan-nya juga sangat baik dengan OCR confidence 92-100%, jadi tidak ada dokumen yang hilang atau sulit dibaca.',
        ketepatanWaktu: 'Klaim ini disubmit pada hari yang sama dengan tanggal perawatan (29 Agustus 2024). Masih jauh dari batas waktu maksimal 90 hari yang tercantum di Master Policy Pasal 12.1, jadi dari segi ketepatan waktu sudah sesuai ketentuan.',
        pengecualianPolis: 'Ada yang perlu diperhatikan di sini—pasien datang ke UGD untuk diagnosis R11 (Nausea & Vomiting). Berdasarkan Master Policy Pasal 8.2.c, kondisi ini kemungkinan tidak memenuhi kriteria emergency, sehingga bisa masuk kategori pengecualian polis.',
        analisisKlaim: 'Terdeteksi ada masalah di pricing—item Venflon No. 20 ditagih Rp 268.000, padahal tarif kontrak hanya Rp 70.000 (mark-up hampir 283%). Ditambah lagi diagnosisnya mengarah ke non-emergency, ada indikasi penyalahgunaan fasilitas UGD untuk kondisi yang sebenarnya bisa ditangani di klinik biasa.',
        batasManfaat: 'Dari sisi utilisasi manfaat, masih aman. Penggunaan manfaat rawat jalan baru 28% dari total limit (Rp 2.8 juta dari Rp 10 juta). Klaim ini senilai Rp 562.000 masih masuk dalam batas yang diperbolehkan.',
        keputusanAkhir: 'Berdasarkan analisis menyeluruh, saya merekomendasikan untuk menolak klaim ini. Alasannya ada dua: (1) Kunjungan UGD untuk kondisi non-emergency yang melanggar ketentuan polis, dan (2) Overpricing ekstrem 283% pada medical supplies. Dengan menolak klaim ini, perusahaan bisa menghemat Rp 562.000.'
      },
      documents: [
        {
          type: 'Formulir Klaim',
          fileName: '29082024_FormulirKlaim_ROKIB.pdf',
          notes: 'Formulir lengkap dan ditandatangani. Semua field terisi dengan jelas. OCR confidence 98%.',
          required: true,
          uploaded: true,
          ocrConfidence: 98
        },
        {
          type: 'Kwitansi/Invoice',
          fileName: '29082024_Invoice_RSAnanda.pdf',
          notes: 'Dokumen asli dengan stempel resmi RS Ananda Bekasi. Kualitas scan sangat baik, semua item terbaca jelas. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Surat Keterangan Dokter',
          fileName: '29082024_SuratDokter_ROKIB.pdf',
          notes: 'Dokumen lengkap dengan kop surat, tanda tangan dokter, dan stempel rumah sakit. Beberapa tulisan tangan dokter kurang jelas. OCR confidence 95%.',
          required: true,
          uploaded: true,
          ocrConfidence: 95
        },
        {
          type: 'Resep Dokter',
          fileName: '29082024_Resep_ROKIB.pdf',
          notes: 'Resep asli dengan tanda tangan dokter. Beberapa nama obat tulisan tangan sulit dibaca. OCR confidence 92%.',
          required: true,
          uploaded: true,
          ocrConfidence: 92
        },
        {
          type: 'Fotokopi KTP',
          fileName: 'KTP_ROKIB_3206008.pdf',
          notes: 'Fotokopi KTP jelas dan mudah dibaca. Semua informasi identitas terlihat dengan baik. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Fotokopi Kartu Peserta',
          fileName: 'KartuPeserta_1613070110001002.pdf',
          notes: 'Fotokopi kartu peserta dalam kondisi baik. Nomor peserta dan masa berlaku terbaca dengan jelas. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        }
      ],
      diagnosis: 'Nausea and Vomiting',
      icd10: 'R11',
      icd10Codes: [
        { code: 'R11', name: 'Nausea and Vomiting' }
      ],
      amount: 562000,
      revisedAmount: 0,
      adjudicationResult: 'Tolak' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Emergency' as const,
      items: [
        {
          name: 'Konsultasi Dokter UGD',
          quantity: 1,
          unitPrice: 250000,
          totalPrice: 250000
        },
        {
          name: 'Venflon No. 20',
          quantity: 1,
          unitPrice: 268000,
          totalPrice: 268000
        },
        {
          name: 'Obat-obatan',
          quantity: 1,
          unitPrice: 44000,
          totalPrice: 44000
        }
      ],
      fraudRisks: [
        {
          type: 'OVERPRICING',
          item: 'Venflon No. 20',
          description: 'Charged Rp 268,000 vs contract rate Rp 70,000 (283% markup)',
          severity: 'HIGH',
          estimatedOvercharge: 198000
        }
      ],
      analysis: {
        priceAnalysis: [
          {
            item: 'Venflon No. 20',
            chargedPrice: 268000,
            marketPrice: 70000,
            flag: 'OVERPRICED' as const,
            source: 'RS Ananda Bekasi Contract v2.1'
          },
          {
            item: 'Konsultasi Dokter UGD',
            chargedPrice: 250000,
            marketPrice: 150000,
            flag: 'NORMAL' as const,
            source: 'Contract rate comparison'
          }
        ],
        riskScore: 'HIGH' as const,
        patterns: ['ER misuse for non-emergency condition', 'Overpricing on medical supplies']
      },
      recommendations: {
        forClaims: [
          {
            action: 'Reject claim - Non-emergency ER visit',
            reason: 'Diagnosis R11 does not meet emergency criteria per Master Policy Section I Article 1.15',
            priority: 'HIGH' as const,
            potentialSavings: 562000
          }
        ],
        forUnderwriting: [
          {
            action: 'Review member education on ER usage',
            reason: 'Pattern of non-emergency ER visits detected (3x in 2024)',
            priority: 'MEDIUM' as const,
            potentialSavings: 0
          }
        ],
        forActuarial: [
          {
            action: 'Monitor ER utilization patterns',
            reason: 'High rate of non-emergency ER visits affecting costs',
            priority: 'MEDIUM' as const
          }
        ]
      },
      alerts: [
        {
          type: 'CRITICAL' as const,
          message: 'Non-emergency condition treated at ER - does not meet policy criteria'
        }
      ],
      totalOvercharge: 198000,
      hasIssues: true,
      riskScore: 75,
      status: 'processed' as const,
      createdAt: baseDate,
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'failed' as const,
        analisisKlaim: 'failed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'failed' as const,
        // Sub-checkpoints for Checkpoint 4: Pengecualian dan Masa Tunggu
        pengecualianPolisSubcheck: 'failed' as const,
        masaTungguSubcheck: 'passed' as const,
        // Sub-checkpoints for Checkpoint 5: Analisis Klaim
        riwayatKlaimPasienSubcheck: 'n/a' as const,
        kesesuaianMedisSubcheck: 'failed' as const,
        kesesuaianTerapiSubcheck: 'passed' as const,
        verifikasiHargaSubcheck: 'failed' as const,
      }
    },
    {
      id: 'demo-claim-limih-501',
      fileName: '31072024 RJ Limih 501.pdf',
      provider: 'RS Limih Medika Jakarta',
      date: '31/07/2024',
      patientId: '***2847',
      patientName: 'Sari Limih',
      patientNIK: '3174***********847',
      patientDOB: '2025-01-15',
      patientDateOfBirth: '15 Januari 2025',
      patientAge: 0,
      patientGender: 'P' as const,
      principalName: 'Sari Limih',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: '1613070110002847',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT Sentral Teknologi',
      policyNumber: 'FPG.16.1308.24.00015',
      policyEffectiveDate: '2024-06-01',
      policyExpiryDate: '2025-05-31',
      benefits: ['IP1111', 'OP2222', 'RB3333', 'RG4444', 'KM5555', 'MCU6666'],
      treatmentDate: '31/07/2024',
      submissionDate: '31/07/2024',
      submissionDeadlineDate: '29/10/2024',
      policyDocumentRequirementsReference: 'Pasal 6, Ayat 2, Polis No. FPG.16.1308.24.00015, halaman 24',
      policyDocumentRequirementsText: `"Untuk pengajuan klaim, Tertanggung wajib menyerahkan dokumen-dokumen berikut: Formulir klaim lengkap, Kwitansi asli, Surat keterangan dokter, Resep dokter, Fotokopi KTP, Fotokopi kartu peserta. Untuk klaim rawat inap: resume medis, hasil laboratorium, surat rujukan."`,
      policyTimelineReference: 'Pasal 12, Ayat 1, Polis No. FPG.16.1308.24.00015, halaman 35',
      policyTimelineText: `"Pengajuan klaim harus dilakukan paling lambat 90 (sembilan puluh) hari kalender sejak tanggal perawatan atau pemeriksaan medis terakhir. Klaim yang diajukan melampaui batas waktu tersebut tidak akan diproses."`,
      aiAnalysis: {
        validitasPeserta: 'Peserta Sari Limih (ID: 1613070110002847) terdaftar aktif dalam polis PT Sentral Teknologi. Status kepesertaan masih berlaku pada tanggal perawatan 31 Juli 2024, sehingga dari aspek validitas kepesertaan sudah memenuhi syarat.',
        kelengkapanDokumen: 'Semua dokumen yang diperlukan untuk klaim emergency cardiac sudah tersedia lengkap. Kualitas dokumentasi baik dengan OCR confidence tinggi, memudahkan verifikasi data medis dan billing.',
        ketepatanWaktu: 'Klaim disubmit pada hari yang sama dengan tanggal perawatan (31 Juli 2024), masih sangat jauh dari batas waktu 90 hari sesuai ketentuan polis. Tidak ada issue dengan ketepatan waktu submission.',
        pengecualianPolis: 'Acute Coronary Syndrome adalah kondisi emergency medis yang covered dalam polis. Cardiac catheterization merupakan prosedur life-saving yang termasuk dalam benefit plan, sehingga tidak ada pengecualian polis yang berlaku.',
        analisisKlaim: 'Terdapat masalah serius di pricing—Cardiac Catheter Boston Scientific 6F ditagih Rp 8.5 juta padahal harga pasar hanya Rp 3.2 juta (mark-up 165%). Ada pola systematic overpricing di multiple items: Venflon mark-up 200%, ECG Monitoring mark-up 167%. Total overcharge mencapai Rp 6.11 juta dari total klaim Rp 12.5 juta.',
        batasManfaat: 'Utilisasi benefit rawat jalan untuk tahun berjalan masih dalam batas wajar. Meskipun nilai klaim cukup tinggi (Rp 12.5 juta), limit tahunan masih mencukupi untuk menanggung prosedur cardiac emergency ini.',
        keputusanAkhir: 'Rekomendasi saya: Approve Sebagian dengan revisi harga. Approve prosedur medisnya karena ini emergency yang legitimate, tapi reject overcharging. Adjust harga cardiac catheter ke market rate Rp 3.2 juta, dan item lain juga disesuaikan. Total approved: Rp 6.39 juta (reject Rp 6.11 juta overcharge). Dengan ini kita tetap membayar tindakan medis yang diperlukan tapi mencegah overpricing.'
      },
      documents: [
        {
          type: 'Formulir Klaim',
          fileName: '31072024_FormulirKlaim_LIMIH.pdf',
          notes: 'Formulir lengkap, ditandatangani pasien dan provider. OCR confidence 97%.',
          required: true,
          uploaded: true,
          ocrConfidence: 97
        },
        {
          type: 'Kwitansi/Invoice',
          fileName: '31072024_Invoice_RSLimih.pdf',
          notes: 'Invoice asli dengan stempel RS. Detail itemisasi jelas. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Surat Keterangan Dokter',
          fileName: '31072024_SuratDokter_LIMIH.pdf',
          notes: 'Dokumen lengkap dengan diagnosis dan rekomendasi cardiac cath. OCR confidence 94%.',
          required: true,
          uploaded: true,
          ocrConfidence: 94
        },
        {
          type: 'Resume Medis',
          fileName: '31072024_ResumeMedis_LIMIH.pdf',
          notes: 'Resume lengkap dari cardiology department. OCR confidence 96%.',
          required: true,
          uploaded: true,
          ocrConfidence: 96
        },
        {
          type: 'Fotokopi KTP',
          fileName: 'KTP_LIMIH_3174847.pdf',
          notes: 'Fotokopi KTP jelas dan terbaca baik. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Fotokopi Kartu Peserta',
          fileName: 'KartuPeserta_1613070110002847.pdf',
          notes: 'Kartu peserta valid, masa berlaku aktif. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        }
      ],
      diagnosis: 'Acute Coronary Syndrome requiring catheterization',
      icd10: 'I20.0',
      icd10Codes: [
        { code: 'I20.0', name: 'Unstable angina' }
      ],
      amount: 12500000,
      revisedAmount: 6390000,
      adjudicationResult: 'Approve Sebagian' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Emergency' as const,
      items: [
        {
          name: 'Cardiac Catheter Boston Scientific 6F',
          quantity: 1,
          unitPrice: 8500000,
          totalPrice: 8500000
        },
        {
          name: 'Contrast Agent Omnipaque 350ml',
          quantity: 2,
          unitPrice: 450000,
          totalPrice: 900000
        },
        {
          name: 'Venflon No 20',
          quantity: 2,
          unitPrice: 45000,
          totalPrice: 90000
        },
        {
          name: 'ECG Monitoring 24h',
          quantity: 1,
          unitPrice: 1200000,
          totalPrice: 1200000
        }
      ],
      fraudRisks: [
        {
          type: 'OVERPRICING',
          item: 'Cardiac Catheter Boston Scientific 6F',
          description: 'Charged Rp 8,500,000 vs market price Rp 3,200,000 (165% markup)',
          severity: 'HIGH',
          estimatedOvercharge: 5300000
        },
        {
          type: 'OVERPRICING',
          item: 'Venflon No 20',
          description: 'Charged Rp 45,000 vs market price Rp 15,000 (200% markup)',
          severity: 'HIGH',
          estimatedOvercharge: 60000
        },
        {
          type: 'OVERPRICING',
          item: 'ECG Monitoring 24h',
          description: 'Charged Rp 1,200,000 vs market price Rp 450,000 (167% markup)',
          severity: 'MEDIUM',
          estimatedOvercharge: 750000
        }
      ],
      analysis: {
        priceAnalysis: [
          {
            item: 'Cardiac Catheter Boston Scientific 6F',
            chargedPrice: 8500000,
            marketPrice: 3200000,
            flag: 'OVERPRICED' as const,
            source: 'Farmaplus/Guardian comparison'
          },
          {
            item: 'Venflon No 20',
            chargedPrice: 45000,
            marketPrice: 15000,
            flag: 'OVERPRICED' as const,
            source: 'Halodoc/Farmaplus comparison'
          },
          {
            item: 'Contrast Agent Omnipaque 350ml',
            chargedPrice: 450000,
            marketPrice: 420000,
            flag: 'NORMAL' as const,
            source: 'Market rate comparison'
          },
          {
            item: 'ECG Monitoring 24h',
            chargedPrice: 1200000,
            marketPrice: 450000,
            flag: 'OVERPRICED' as const,
            source: 'Standard hospital rates'
          }
        ],
        riskScore: 'HIGH' as const,
        patterns: ['Consistent overpricing on cardiac supplies', 'Emergency department billing irregularities']
      },
      recommendations: {
        forClaims: [
          {
            action: 'Reject cardiac catheter overcharge',
            reason: 'Item priced 165% above market rate - negotiate to Rp 3,200,000',
            priority: 'HIGH' as const,
            potentialSavings: 5300000
          },
          {
            action: 'Review Venflon pricing policy',
            reason: 'Basic IV catheter overpriced by 200% vs pharmacy rates',
            priority: 'HIGH' as const,
            potentialSavings: 60000
          }
        ],
        forUnderwriting: [
          {
            action: 'Review RS Limih Medika contract terms',
            reason: 'Systematic overpricing pattern detected across multiple items',
            priority: 'HIGH' as const,
            potentialSavings: 6110000
          },
          {
            action: 'Implement pre-authorization for cardiac procedures',
            reason: 'High-value cardiac items require pricing validation',
            priority: 'MEDIUM' as const,
            potentialSavings: 2000000
          }
        ],
        forActuarial: [
          {
            action: 'Update risk premium for RS Limih Medika',
            reason: 'High fraud risk score indicates elevated claims cost trend',
            priority: 'HIGH' as const
          },
          {
            action: 'Analyze cardiac procedure cost patterns',
            reason: 'Emergency cardiac procedures showing consistent markup patterns',
            priority: 'MEDIUM' as const
          }
        ]
      },
      alerts: [
        {
          type: 'CRITICAL' as const,
          message: 'Cardiac catheter overpriced by 165% - immediate negotiation required'
        },
        {
          type: 'WARNING' as const,
          message: 'Multiple medical supplies overpriced - review provider pricing standards'
        }
      ],
      totalOvercharge: 6110000,
      hasIssues: true,
      riskScore: 89,
      status: 'processed' as const,
      createdAt: baseDate,
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'passed' as const,
        analisisKlaim: 'failed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'awaiting' as const,
        // Sub-checkpoints for Checkpoint 4: Pengecualian dan Masa Tunggu
        pengecualianPolisSubcheck: 'passed' as const,
        masaTungguSubcheck: 'passed' as const,
        // Sub-checkpoints for Checkpoint 5: Analisis Klaim
        riwayatKlaimPasienSubcheck: 'n/a' as const,
        kesesuaianMedisSubcheck: 'passed' as const,
        kesesuaianTerapiSubcheck: 'passed' as const,
        verifikasiHargaSubcheck: 'failed' as const,
      }
    },
    {
      id: 'demo-claim-sudarto-501',
      fileName: '31082024 RJ Sudarto Subur 501.pdf',
      provider: 'RS Sudarto Subur Bekasi',
      date: '31/08/2024',
      patientId: '***7392',
      patientName: 'Budi Sudarto',
      patientNIK: '3275***********392',
      patientDOB: '1968-03-15',
      patientDateOfBirth: '15 Maret 1968',
      patientAge: 56,
      patientGender: 'L' as const,
      principalName: 'Budi Sudarto',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: '1613070110007392',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT Makmur Sejahtera',
      policyNumber: 'FPG.16.1309.24.00018',
      policyEffectiveDate: '2024-05-01',
      policyExpiryDate: '2025-04-30',
      benefits: ['IP1111', 'OP2222', 'RB3333', 'RG4444', 'KM5555', 'MCU6666'],
      treatmentDate: '31/08/2024',
      submissionDate: '31/08/2024',
      submissionDeadlineDate: '29/11/2024',
      policyDocumentRequirementsReference: 'Pasal 6, Ayat 2, Polis No. FPG.16.1309.24.00018, halaman 24',
      policyDocumentRequirementsText: `"Untuk pengajuan klaim, Tertanggung wajib menyerahkan dokumen-dokumen berikut: Formulir klaim lengkap, Kwitansi asli, Surat keterangan dokter, Resep dokter, Fotokopi KTP, Fotokopi kartu peserta. Untuk obat chronic: surat rujukan dokter spesialis."`,
      policyTimelineReference: 'Pasal 12, Ayat 1, Polis No. FPG.16.1309.24.00018, halaman 35',
      policyTimelineText: `"Pengajuan klaim harus dilakukan paling lambat 90 (sembilan puluh) hari kalender sejak tanggal perawatan atau pemeriksaan medis terakhir. Klaim yang diajukan melampaui batas waktu tersebut tidak akan diproses."`,
      aiAnalysis: {
        validitasPeserta: 'Peserta Budi Sudarto (ID: 1613070110007392) terdaftar aktif dalam polis PT Makmur Sejahtera. Kepesertaan valid pada tanggal perawatan 31 Agustus 2024, sehingga memenuhi persyaratan validitas.',
        kelengkapanDokumen: 'Dokumentasi untuk klaim diabetes chronic medication sudah lengkap. Semua 6 dokumen required tersedia dengan kualitas scan yang baik, termasuk resep dari dokter spesialis endokrin.',
        ketepatanWaktu: 'Klaim disubmit pada hari yang sama dengan tanggal pembelian obat (31 Agustus 2024). Masih sangat jauh dari deadline 90 hari, jadi aspek ketepatan waktu tidak ada masalah.',
        pengecualianPolis: 'Obat-obatan diabetes (insulin dan metformin) termasuk dalam coverage benefit rawat jalan. Tidak ada pengecualian polis yang berlaku untuk kondisi diabetes tipe 2 yang sudah diagnosed.',
        analisisKlaim: 'Ada moderate overpricing di beberapa item. Insulin Lantus SoloStar ditagih Rp 320rb vs harga pasar Rp 245rb (mark-up 31%). Metformin generic mark-up hampir 100% (Rp 85rb vs pasar Rp 42rb). Total overcharge sekitar Rp 225rb dari klaim Rp 3.2 juta.',
        batasManfaat: 'Utilisasi manfaat rawat jalan masih dalam batas normal. Penggunaan benefit untuk chronic medication diabetes tidak melebihi limit tahunan yang ditetapkan.',
        keputusanAkhir: 'Rekomendasi: Approve Sebagian. Approve semua items medically necessary (insulin, test strips, metformin) karena ini essential untuk diabetes management, tapi adjust harga ke market rate. Total approved: Rp 2.975 juta (koreksi Rp 225rb overcharge). Pasien tetap mendapat obat yang dibutuhkan, perusahaan menghemat dari price adjustment.'
      },
      documents: [
        {
          type: 'Formulir Klaim',
          fileName: '31082024_FormulirKlaim_SUDARTO.pdf',
          notes: 'Formulir lengkap untuk chronic medication claim. OCR confidence 98%.',
          required: true,
          uploaded: true,
          ocrConfidence: 98
        },
        {
          type: 'Kwitansi/Invoice',
          fileName: '31082024_Invoice_RSSudarto.pdf',
          notes: 'Invoice asli dari RS pharmacy. Itemisasi jelas. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Resep Dokter',
          fileName: '31082024_Resep_SUDARTO.pdf',
          notes: 'Resep dari dokter spesialis endokrin dengan tanda tangan. OCR confidence 95%.',
          required: true,
          uploaded: true,
          ocrConfidence: 95
        },
        {
          type: 'Surat Rujukan',
          fileName: '31082024_SuratRujukan_SUDARTO.pdf',
          notes: 'Surat rujukan dokter spesialis untuk chronic medication. OCR confidence 96%.',
          required: true,
          uploaded: true,
          ocrConfidence: 96
        },
        {
          type: 'Fotokopi KTP',
          fileName: 'KTP_SUDARTO_3275392.pdf',
          notes: 'Fotokopi KTP jelas dan terbaca. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Fotokopi Kartu Peserta',
          fileName: 'KartuPeserta_1613070110007392.pdf',
          notes: 'Kartu peserta valid dan aktif. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        }
      ],
      diagnosis: 'Type 2 Diabetes with complications',
      icd10: 'E11.9',
      icd10Codes: [
        { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' }
      ],
      amount: 3200000,
      revisedAmount: 2975000,
      adjudicationResult: 'Approve Sebagian' as const,
      benefitCategory: 'RAWAT JALAN' as const,
      serviceType: 'Outpatient' as const,
      items: [
        {
          name: 'Insulin Lantus SoloStar 100IU',
          quantity: 3,
          unitPrice: 320000,
          totalPrice: 960000
        },
        {
          name: 'Blood Glucose Test Strips',
          quantity: 2,
          unitPrice: 180000,
          totalPrice: 360000
        },
        {
          name: 'Metformin 500mg x30',
          quantity: 2,
          unitPrice: 85000,
          totalPrice: 170000
        }
      ],
      fraudRisks: [
        {
          type: 'OVERPRICING',
          item: 'Insulin Lantus SoloStar 100IU',
          description: 'Charged Rp 320,000 vs market price Rp 245,000 (31% markup)',
          severity: 'MEDIUM',
          estimatedOvercharge: 225000
        }
      ],
      analysis: {
        priceAnalysis: [
          {
            item: 'Insulin Lantus SoloStar 100IU',
            chargedPrice: 320000,
            marketPrice: 245000,
            flag: 'OVERPRICED' as const,
            source: 'Halodoc/Farmaplus comparison'
          },
          {
            item: 'Blood Glucose Test Strips',
            chargedPrice: 180000,
            marketPrice: 165000,
            flag: 'NORMAL' as const,
            source: 'Pharmacy chain rates'
          },
          {
            item: 'Metformin 500mg x30',
            chargedPrice: 85000,
            marketPrice: 42000,
            flag: 'OVERPRICED' as const,
            source: 'Generic drug pricing'
          }
        ],
        riskScore: 'MEDIUM' as const,
        patterns: ['Moderate overpricing on diabetes medications']
      },
      recommendations: {
        forClaims: [
          {
            action: 'Negotiate insulin pricing',
            reason: 'Insulin overpriced by 31% vs pharmacy chains',
            priority: 'MEDIUM' as const,
            potentialSavings: 225000
          }
        ],
        forUnderwriting: [
          {
            action: 'Review diabetes medication formulary',
            reason: 'Consistent moderate overpricing on chronic medications',
            priority: 'LOW' as const,
            potentialSavings: 500000
          }
        ],
        forActuarial: [
          {
            action: 'Analyze chronic care cost trends',
            reason: 'Diabetes medication costs trending above market',
            priority: 'LOW' as const
          }
        ]
      },
      alerts: [],
      totalOvercharge: 225000,
      hasIssues: true,
      riskScore: 45,
      status: 'processed' as const,
      createdAt: new Date(baseDate.getTime() + 86400000),
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'passed' as const,
        analisisKlaim: 'failed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'awaiting' as const,
        // Sub-checkpoints for Checkpoint 4: Pengecualian dan Masa Tunggu
        pengecualianPolisSubcheck: 'passed' as const,
        masaTungguSubcheck: 'passed' as const,
        // Sub-checkpoints for Checkpoint 5: Analisis Klaim
        riwayatKlaimPasienSubcheck: 'n/a' as const,
        kesesuaianMedisSubcheck: 'passed' as const,
        kesesuaianTerapiSubcheck: 'passed' as const,
        verifikasiHargaSubcheck: 'failed' as const,
      }
    },
    {
      id: 'demo-claim-widiarny-403',
      fileName: '30092024 RJ Della Widiarny 403.pdf',
      provider: 'RSUD Dr. Soetomo Surabaya',
      date: '30/09/2024',
      patientId: '***5618',
      patientName: 'Della Widiarny',
      patientNIK: '3578***********618',
      patientDOB: '1992-05-08',
      patientDateOfBirth: '8 Mei 1992',
      patientAge: 32,
      patientGender: 'P' as const,
      principalName: 'Della Widiarny',
      relationshipToPrincipal: 'Prinsipal' as const,
      memberCardNumber: '1613070110005618',
      memberStatus: 'AKTIF' as const,
      policyHolderName: 'PT Berkah Sejahtera',
      policyNumber: 'FPG.16.1310.24.00020',
      policyEffectiveDate: '2024-04-01',
      policyExpiryDate: '2025-03-31',
      benefits: ['IP1111', 'OP2222', 'RB3333', 'RG4444', 'KM5555', 'MCU6666'],
      treatmentDate: '30/09/2024',
      submissionDate: '30/09/2024',
      submissionDeadlineDate: '29/12/2024',
      policyDocumentRequirementsReference: 'Pasal 6, Ayat 2, Polis No. FPG.16.1310.24.00020, halaman 24',
      policyDocumentRequirementsText: `"Untuk pengajuan klaim, Tertanggung wajib menyerahkan dokumen-dokumen berikut: Formulir klaim lengkap, Kwitansi asli, Surat keterangan dokter, Resep dokter (jika ada), Fotokopi KTP, Fotokopi kartu peserta. Untuk klaim maternity: hasil USG dan pemeriksaan lab."`,
      policyTimelineReference: 'Pasal 12, Ayat 1, Polis No. FPG.16.1310.24.00020, halaman 35',
      policyTimelineText: `"Pengajuan klaim harus dilakukan paling lambat 90 (sembilan puluh) hari kalender sejak tanggal perawatan atau pemeriksaan medis terakhir. Klaim yang diajukan melampaui batas waktu tersebut tidak akan diproses."`,
      aiAnalysis: {
        validitasPeserta: 'Peserta Della Widiarny (ID: 1613070110005618) terdaftar aktif dalam polis PT Berkah Sejahtera. Status kepesertaan masih valid pada tanggal pemeriksaan prenatal 30 September 2024, sehingga memenuhi persyaratan dari sisi validitas.',
        kelengkapanDokumen: 'Dokumentasi prenatal care sudah lengkap. Semua 6 dokumen yang diperlukan tersedia dengan kualitas scan yang baik, termasuk hasil USG 4D dan comprehensive blood test panel.',
        ketepatanWaktu: 'Klaim disubmit pada hari yang sama dengan tanggal pemeriksaan (30 September 2024). Masih sangat jauh dari batas waktu 90 hari sesuai ketentuan polis. Tidak ada issue dengan timing submission.',
        pengecualianPolis: 'Normal pregnancy checkup dan prenatal care termasuk dalam benefit plan maternity. Semua item (prenatal vitamin, USG 4D, blood test) adalah bagian dari routine prenatal care yang covered dalam polis, sehingga tidak ada pengecualian yang berlaku.',
        analisisKlaim: 'Pricing untuk semua items dalam range normal market rate. Prenatal vitamin complex, USG 4D scan, dan blood test panel semuanya ditagih pada harga yang wajar dan sesuai dengan standard hospital rates. Tidak terdeteksi overpricing atau irregularities.',
        batasManfaat: 'Utilisasi benefit maternity masih sangat rendah untuk tahun berjalan. Klaim senilai Rp 850rb masih jauh di bawah limit benefit rawat bersalin tahunan. Tidak ada issue dengan utilisasi benefit.',
        keputusanAkhir: 'Rekomendasi: Approve penuh. Ini adalah klaim prenatal care yang legitimate dengan pricing yang fair. Semua items medically necessary untuk pregnancy care, tidak ada red flags, dan masih dalam budget benefit maternity. Total approved: Rp 850.000 (no deduction needed).'
      },
      documents: [
        {
          type: 'Formulir Klaim',
          fileName: '30092024_FormulirKlaim_WIDIARNY.pdf',
          notes: 'Formulir prenatal care claim lengkap dan ditandatangani. OCR confidence 98%.',
          required: true,
          uploaded: true,
          ocrConfidence: 98
        },
        {
          type: 'Kwitansi/Invoice',
          fileName: '30092024_Invoice_RSSoetomo.pdf',
          notes: 'Invoice asli dari RSUD Dr. Soetomo. Itemisasi jelas untuk prenatal services. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Surat Keterangan Dokter',
          fileName: '30092024_SuratDokter_WIDIARNY.pdf',
          notes: 'Surat dari dokter kandungan dengan diagnosis dan rekomendasi prenatal care. OCR confidence 96%.',
          required: true,
          uploaded: true,
          ocrConfidence: 96
        },
        {
          type: 'Hasil USG',
          fileName: '30092024_USG4D_WIDIARNY.pdf',
          notes: 'Hasil USG 4D scan dengan images. OCR confidence 94%.',
          required: true,
          uploaded: true,
          ocrConfidence: 94
        },
        {
          type: 'Fotokopi KTP',
          fileName: 'KTP_WIDIARNY_3578618.pdf',
          notes: 'Fotokopi KTP jelas dan terbaca. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        },
        {
          type: 'Fotokopi Kartu Peserta',
          fileName: 'KartuPeserta_1613070110005618.pdf',
          notes: 'Kartu peserta valid dan aktif. OCR confidence 100%.',
          required: true,
          uploaded: true,
          ocrConfidence: 100
        }
      ],
      diagnosis: 'Normal pregnancy checkup - routine prenatal care',
      icd10: 'Z34.9',
      icd10Codes: [
        { code: 'Z34.9', name: 'Encounter for supervision of normal pregnancy, unspecified trimester' }
      ],
      amount: 850000,
      revisedAmount: 850000,
      adjudicationResult: 'Approve' as const,
      benefitCategory: 'RAWAT BERSALIN' as const,
      serviceType: 'Preventive' as const,
      items: [
        {
          name: 'Prenatal vitamin complex',
          quantity: 1,
          unitPrice: 120000,
          totalPrice: 120000
        },
        {
          name: 'Ultrasound 4D scan',
          quantity: 1,
          unitPrice: 450000,
          totalPrice: 450000
        },
        {
          name: 'Blood test comprehensive panel',
          quantity: 1,
          unitPrice: 280000,
          totalPrice: 280000
        }
      ],
      fraudRisks: [],
      analysis: {
        priceAnalysis: [
          {
            item: 'Prenatal vitamin complex',
            chargedPrice: 120000,
            marketPrice: 95000,
            flag: 'NORMAL' as const,
            source: 'Pharmacy comparison'
          },
          {
            item: 'Ultrasound 4D scan',
            chargedPrice: 450000,
            marketPrice: 420000,
            flag: 'NORMAL' as const,
            source: 'Hospital standard rates'
          },
          {
            item: 'Blood test comprehensive panel',
            chargedPrice: 280000,
            marketPrice: 250000,
            flag: 'NORMAL' as const,
            source: 'Lab standard pricing'
          }
        ],
        riskScore: 'LOW' as const,
        patterns: []
      },
      recommendations: {
        forClaims: [],
        forUnderwriting: [],
        forActuarial: []
      },
      alerts: [],
      totalOvercharge: 0,
      hasIssues: false,
      riskScore: 15,
      status: 'processed' as const,
      createdAt: new Date(baseDate.getTime() + 172800000),
      originalFileBase64: '',
      fileMimeType: 'application/pdf',
      checkpointStatuses: {
        validitasPeserta: 'passed' as const,
        kelengkapanDokumen: 'passed' as const,
        ketepatanWaktu: 'passed' as const,
        pengecualianPolis: 'passed' as const,
        analisisKlaim: 'passed' as const,
        batasManfaat: 'passed' as const,
        keputusanAkhir: 'passed' as const,
        // Sub-checkpoints for Checkpoint 4: Pengecualian dan Masa Tunggu
        pengecualianPolisSubcheck: 'passed' as const,
        masaTungguSubcheck: 'passed' as const,
        // Sub-checkpoints for Checkpoint 5: Analisis Klaim
        riwayatKlaimPasienSubcheck: 'n/a' as const,
        kesesuaianMedisSubcheck: 'passed' as const,
        kesesuaianTerapiSubcheck: 'passed' as const,
        verifikasiHargaSubcheck: 'passed' as const,
      }
    }
  ];
  
  // Apply member validation to each claim using actual database lookups
  return rawClaims.map(claim => applyMemberValidation(claim));
}