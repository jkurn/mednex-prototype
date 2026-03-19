/**
 * Category mapping for Issue Terdeteksi Chart
 * Maps checkpoints to 4 main issue categories
 */

export type IssueCategory = 
  | 'pelanggaranPolis'
  | 'kelebihanTagihan'
  | 'ketidaksesuaianMedis'
  | 'penipuan';

export interface CategoryConfig {
  id: IssueCategory;
  label: string;
  color: string;
  checkpoints: string[];
}

/**
 * 4 Issue Categories with their checkpoint mappings
 */
export const ISSUE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'pelanggaranPolis',
    label: 'Pelanggaran Polis',
    color: 'rgba(239, 68, 68, 0.8)', // Red
    checkpoints: [
      'validitasPeserta',      // CP1: Member Validation
      'kelengkapanDokumen',    // CP2: Document Completeness
      'ketepatanWaktu',        // CP3: Claim Timeliness
      'pengecualianPolis',     // CP4: Policy Exclusions
      'batasManfaat',          // CP6: Benefit Limits
    ],
  },
  {
    id: 'kelebihanTagihan',
    label: 'Kelebihan Tagihan',
    color: 'rgba(249, 115, 22, 0.8)', // Orange
    checkpoints: [
      // CP5B: Pricing Verification - detected via overpricing fraud flags
    ],
  },
  {
    id: 'ketidaksesuaianMedis',
    label: 'Ketidaksesuaian Medis',
    color: 'rgba(245, 158, 11, 0.8)', // Amber
    checkpoints: [
      // CP5A: Medical Appropriateness - detected via analisisKlaim failures
    ],
  },
  {
    id: 'penipuan',
    label: 'Penipuan',
    color: 'rgba(139, 92, 246, 0.8)', // Purple
    checkpoints: [
      // Pattern-based fraud detection via fraudFlags
    ],
  },
];

/**
 * Map checkpoint name to category
 */
export function getCheckpointCategory(checkpoint: string): IssueCategory | null {
  for (const category of ISSUE_CATEGORIES) {
    if (category.checkpoints.includes(checkpoint)) {
      return category.id;
    }
  }
  return null;
}

/**
 * Get category configuration by ID
 */
export function getCategoryConfig(categoryId: IssueCategory): CategoryConfig | undefined {
  return ISSUE_CATEGORIES.find(cat => cat.id === categoryId);
}
