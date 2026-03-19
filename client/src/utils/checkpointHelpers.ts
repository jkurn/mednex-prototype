import { Claim } from "@shared/schema";
import { STANDARD_EXCLUSION_CLAUSES } from "@/data/exclusionClauses";

export type CheckpointStatus = 'passed' | 'failed' | 'pending' | 'in-progress' | 'warning' | 'awaiting' | 'n/a';

// Compute pengecualian status dynamically from claim's diagnosis data
// This mirrors the same logic used in CheckpointPengecualianPolis.tsx
// Returns whether any exclusions are DETECTED
export const computePengecualianStatus = (claim: Claim): CheckpointStatus => {
  // Priority 1: Use stored diagnosesAnalysis if available (from CP4 component)
  // This ensures we match exactly what the CP4 panel displays
  const diagnosesAnalysis = claim.cp4Decision?.aiRecommendation?.diagnosesAnalysis;
  if (diagnosesAnalysis && diagnosesAnalysis.length > 0) {
    const hasExclusion = diagnosesAnalysis.some(d => d.isExcluded);
    return hasExclusion ? 'failed' : 'passed';
  }
  
  // Priority 2: Recompute from ICD-10 codes using keyword matching
  // This is the same logic used in CheckpointPengecualianPolis.tsx
  const icd10Codes = claim.icd10Codes || [];
  
  if (icd10Codes.length === 0) {
    // No ICD-10 codes to check - default to passed (not excluded)
    return 'passed';
  }
  
  // Check if any diagnosis matches an exclusion clause keyword
  const hasExclusion = icd10Codes.some(icd => {
    return STANDARD_EXCLUSION_CLAUSES.some(clause => 
      clause.keywords.some(keyword => 
        icd.name.toLowerCase().includes(keyword.toLowerCase()) ||
        icd.code.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  });
  
  return hasExclusion ? 'failed' : 'passed';
};

export interface CheckpointTag {
  text: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'blue';
}

// Map checkpoint statuses to display tags according to PRD
export const getStatusTag = (checkpointId: string, status: CheckpointStatus | undefined, claim?: Claim): CheckpointTag => {
  // Checkpoint 1: Status Kepesertaan
  if (checkpointId === 'validitasPeserta') {
    if (status === 'passed') {
      return { text: 'Aktif', color: 'green' };
    }
    // Check if member was not found in database
    if (claim?.memberStatus === 'TIDAK DITEMUKAN') {
      return { text: 'Tidak Ditemukan', color: 'red' };
    }
    return { text: 'Tidak Aktif', color: 'red' };
  }
  
  // Checkpoint 2: Kelengkapan Dokumen
  if (checkpointId === 'kelengkapanDokumen') {
    return status === 'passed'
      ? { text: 'Lengkap', color: 'green' }
      : { text: 'Tidak Lengkap', color: 'red' };
  }
  
  // Checkpoint 3: Ketepatan Waktu
  if (checkpointId === 'ketepatanWaktu') {
    return status === 'passed'
      ? { text: 'Tepat Waktu', color: 'green' }
      : { text: 'Terlambat', color: 'red' };
  }
  
  // Checkpoint 4: Pengecualian dan Masa Tunggu (aggregated)
  if (checkpointId === 'pengecualianPolis') {
    if (status === 'failed') return { text: 'Terdeteksi Pengecualian', color: 'red' };
    if (status === 'warning') return { text: 'Masih Masa Tunggu', color: 'orange' };
    return { text: 'Dapat Dijamin', color: 'green' };
  }
  
  // Checkpoint 4A: Pengecualian Polis (sub-check)
  if (checkpointId === 'pengecualianPolisSubcheck') {
    if (status === 'passed') return { text: 'Tidak Dikecualikan', color: 'green' };
    if (status === 'failed') return { text: 'Dikecualikan', color: 'red' };
    return { text: 'Pending', color: 'gray' };
  }
  
  // Checkpoint 4B: Masa Tunggu (sub-check)
  if (checkpointId === 'masaTungguSubcheck') {
    if (status === 'n/a') return { text: 'Tidak Ada Masa Tunggu', color: 'green' };
    if (status === 'passed') return { text: 'Masa Tunggu Terpenuhi', color: 'green' };
    if (status === 'warning') return { text: 'Masa Tunggu Belum Terpenuhi', color: 'orange' };
    return { text: 'Masa Tunggu Dikecualikan', color: 'green' };
  }
  
  // Checkpoint 5: Analisis Klaim (aggregated)
  if (checkpointId === 'analisisKlaim') {
    return status === 'failed'
      ? { text: 'Issues Detected', color: 'red' }
      : { text: 'Tidak Ada Issues', color: 'green' };
  }
  
  // Checkpoint 5A: Riwayat Klaim Pasien (sub-check)
  if (checkpointId === 'riwayatKlaimPasienSubcheck') {
    if (status === 'n/a') return { text: 'N/A', color: 'gray' };
    if (status === 'warning') return { text: 'Pola Terdeteksi', color: 'orange' };
    return { text: 'Tidak Ada Pola', color: 'green' };
  }
  
  // Checkpoint 5B: Kesesuaian Medis (sub-check)
  if (checkpointId === 'kesesuaianMedisSubcheck') {
    return status === 'passed'
      ? { text: 'Sesuai', color: 'green' }
      : { text: 'Tidak Sesuai', color: 'red' };
  }
  
  // Checkpoint 5C: Kesesuaian Terapi (sub-check)
  if (checkpointId === 'kesesuaianTerapiSubcheck') {
    return status === 'passed'
      ? { text: 'Sesuai', color: 'green' }
      : { text: 'Tidak Sesuai', color: 'red' };
  }
  
  // Checkpoint 5D: Verifikasi Harga (sub-check)
  if (checkpointId === 'verifikasiHargaSubcheck') {
    return status === 'passed'
      ? { text: 'Sesuai Tarif', color: 'green' }
      : { text: 'Overpricing', color: 'red' };
  }
  
  // Checkpoint 6: Batas Manfaat
  if (checkpointId === 'batasManfaat') {
    return status === 'passed'
      ? { text: 'Dalam Batas', color: 'green' }
      : { text: 'Melebihi Batas', color: 'red' };
  }
  
  // Checkpoint 7: Keputusan Akhir
  if (checkpointId === 'keputusanAkhir') {
    if (status === 'passed') return { text: 'Disetujui', color: 'green' };
    if (status === 'warning') return { text: 'Disetujui Sebagian', color: 'yellow' };
    if (status === 'failed') return { text: 'Ditolak', color: 'red' };
    return { text: 'Butuh Keputusan', color: 'blue' };
  }
  
  // Default
  return { text: 'Pending', color: 'gray' };
};

// Calculate aggregated status for Checkpoint 4 based on sub-checkpoints
export const getCheckpoint4Status = (claim: Claim): CheckpointStatus => {
  // Use computed pengecualian status (single source of truth)
  const pengecualianStatus = computePengecualianStatus(claim);
  const masaTungguStatus = claim.checkpointStatuses?.masaTungguSubcheck;
  
  // IF (4A = Dikecualikan): Main tag = "Terdeteksi Pengecualian" (Red)
  if (pengecualianStatus === 'failed') {
    return 'failed';
  }
  
  // ELSE IF (4B = Masa Tunggu Belum Terpenuhi): Main tag = "Masih Masa Tunggu" (Orange)
  if (masaTungguStatus === 'warning') {
    return 'warning';
  }
  
  // ELSE: Main tag = "Dapat Dijamin" (Green)
  return 'passed';
};

// Calculate aggregated status for Checkpoint 5 based on sub-checkpoints
export const getCheckpoint5Status = (claim: Claim): CheckpointStatus => {
  const riwayatStatus = claim.checkpointStatuses?.riwayatKlaimPasienSubcheck;
  const medisStatus = claim.checkpointStatuses?.kesesuaianMedisSubcheck;
  const terapiStatus = claim.checkpointStatuses?.kesesuaianTerapiSubcheck;
  const hargaStatus = claim.checkpointStatuses?.verifikasiHargaSubcheck;
  
  // IF (any sub-check = Tidak Sesuai OR Overpricing): Main tag = "Issues Detected" (Red)
  if (medisStatus === 'failed' || terapiStatus === 'failed' || hargaStatus === 'failed') {
    return 'failed';
  }
  
  // ELSE IF (any sub-check = Pola Terdeteksi): Main tag = "Issues Detected" (Red)
  if (riwayatStatus === 'warning') {
    return 'failed';
  }
  
  // ELSE: Main tag = "Tidak Ada Issues" (Green)
  return 'passed';
};

// Get color class for status tag
export const getTagColorClass = (color: string): string => {
  switch (color) {
    case 'green':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'yellow':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'orange':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'red':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'gray':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};
