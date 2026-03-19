import { Claim } from "@shared/schema";

interface BenefitTier {
  code: string;
  name: string;
  annualLimit: number;
  roomLimit?: number;
}

interface StoredPolicy {
  id: string;
  policyNumber?: string;
  policyholderName: string;
  periodStart: string;
  periodEnd: string;
  benefitTypes: string[];
  benefitTiers: BenefitTier[];
  status: string;
}

export interface BenefitType {
  id: string;
  name: string;
  batasan: 'Per Hari' | 'Per Tahun' | 'Per Kejadian';
  limit: number;
  terpakai: number | null;
  sisa: number | null;
  limitId?: string;
}

export interface LimitIdMapping {
  benefitId: string;
  limitId: string;
  benefitName: string;
}

export function generateLimitId(policyCode: string, itemType: string, claimType: 'RJ' | 'RI' = 'RJ'): string {
  const typeMap: Record<string, string> = {
    'CONS': '001',
    'konsultasi_umum': '001',
    'konsultasi_spesialis': '002',
    'DRUG': '005',
    'obat': '005',
    'LAB': '003',
    'lab': '003',
    'PROC': '006',
    'tindakan': '006',
    'ADMIN': '007',
    'admin': '007',
    'ROOM': '001',
  };
  
  const code = typeMap[itemType] || '005';
  const prefix = policyCode || 'STD';
  return `${prefix}-${claimType}-${code}`;
}

export function getBenefitLimitIdMappings(policyCode: string, claimType: 'RJ' | 'RI' = 'RJ'): LimitIdMapping[] {
  const prefix = policyCode || 'STD';
  
  if (claimType === 'RJ') {
    return [
      { benefitId: 'konsultasi_umum', limitId: `${prefix}-RJ-001`, benefitName: 'Konsultasi Dokter Umum' },
      { benefitId: 'konsultasi_spesialis', limitId: `${prefix}-RJ-002`, benefitName: 'Konsultasi Dokter Spesialis' },
      { benefitId: 'lab', limitId: `${prefix}-RJ-003`, benefitName: 'Laboratorium Diagnostik' },
      { benefitId: 'radiologi', limitId: `${prefix}-RJ-004`, benefitName: 'Radiologi' },
      { benefitId: 'obat', limitId: `${prefix}-RJ-005`, benefitName: 'Obat-obatan' },
      { benefitId: 'tindakan', limitId: `${prefix}-RJ-006`, benefitName: 'Fisioterapi/Tindakan' },
      { benefitId: 'admin', limitId: `${prefix}-RJ-007`, benefitName: 'Biaya Administrasi' },
    ];
  } else {
    return [
      { benefitId: 'kamar', limitId: `${prefix}-RI-001`, benefitName: 'Biaya Kamar & Makan' },
      { benefitId: 'icu', limitId: `${prefix}-RI-002`, benefitName: 'Biaya ICU/ICCU' },
      { benefitId: 'konsultasi_umum', limitId: `${prefix}-RI-003`, benefitName: 'Biaya Dokter Umum' },
      { benefitId: 'konsultasi_spesialis', limitId: `${prefix}-RI-004`, benefitName: 'Biaya Dokter Spesialis' },
      { benefitId: 'bedah', limitId: `${prefix}-RI-005`, benefitName: 'Biaya Pembedahan' },
      { benefitId: 'anestesi', limitId: `${prefix}-RI-006`, benefitName: 'Biaya Anestesi' },
      { benefitId: 'lab', limitId: `${prefix}-RI-008`, benefitName: 'Biaya Laboratorium' },
      { benefitId: 'obat', limitId: `${prefix}-RI-015`, benefitName: 'Biaya Obat-obatan' },
    ];
  }
}

export function getPolicyCodeFromClaim(claim: Claim): string {
  if (claim.policyHolderName) {
    const name = claim.policyHolderName.toUpperCase();
    if (name.includes('MITRA ISWARA') || name.includes('MIR')) return 'MIR';
    if (name.includes('GOLD COIN')) return 'GCI';
    if (name.includes('SENTRAL TEKNOLOGI')) return 'ST';
    if (name.includes('TEST')) return 'TST';
  }
  
  if (claim.policyNumber) {
    const num = claim.policyNumber.toUpperCase();
    if (num.includes('MIR') || num.includes('P03-01')) return 'MIR';
    if (num.includes('FPG.16.1307')) return 'GCI';
    if (num.includes('FPG.16.1308')) return 'ST';
    if (num.includes('TEST')) return 'TST';
  }
  
  return 'STD';
}

export interface BenefitPlan {
  planCode: string;
  coInsuranceInsurer: number;
  coInsuranceMember: number;
  yearlyLimit: number;
  policyStart: string;
  policyEnd: string;
  benefits: BenefitType[];
  source: 'policy' | 'hardcoded';
}

const DEFAULT_CO_INSURANCE_INSURER = 80;
const DEFAULT_CO_INSURANCE_MEMBER = 20;

const DEFAULT_BENEFITS: BenefitType[] = [
  { id: 'konsultasi_umum', name: 'Biaya Konsultasi Dokter Umum', batasan: 'Per Hari', limit: 75000, terpakai: null, sisa: null, limitId: 'STD-RJ-001' },
  { id: 'konsultasi_spesialis', name: 'Biaya Konsultasi Dokter Spesialis', batasan: 'Per Hari', limit: 150000, terpakai: null, sisa: null, limitId: 'STD-RJ-002' },
  { id: 'obat', name: 'Biaya Obat-obatan', batasan: 'Per Tahun', limit: 500000, terpakai: 375000, sisa: 125000, limitId: 'STD-RJ-004' },
  { id: 'lab', name: 'Biaya Laboratorium & Diagnostik', batasan: 'Per Tahun', limit: 300000, terpakai: 280000, sisa: 20000, limitId: 'STD-RJ-003' },
  { id: 'tindakan', name: 'Biaya Tindakan Medis', batasan: 'Per Hari', limit: 200000, terpakai: null, sisa: null, limitId: 'STD-RJ-006' },
  { id: 'admin', name: 'Biaya Administrasi', batasan: 'Per Tahun', limit: 50000, terpakai: 50000, sisa: 0, limitId: 'STD-RJ-007' },
];

export const MIR_OUTPATIENT_BENEFITS: BenefitType[] = [
  { id: 'konsultasi_umum', name: 'Biaya Konsultasi Dokter Umum', batasan: 'Per Hari', limit: 150000, terpakai: null, sisa: null, limitId: 'MIR-RJ-001' },
  { id: 'konsultasi_spesialis', name: 'Biaya Konsultasi Dokter Spesialis', batasan: 'Per Hari', limit: 250000, terpakai: null, sisa: null, limitId: 'MIR-RJ-002' },
  { id: 'lab', name: 'Biaya Laboratorium Rawat Jalan', batasan: 'Per Tahun', limit: 2000000, terpakai: 850000, sisa: 1150000, limitId: 'MIR-RJ-003' },
  { id: 'obat', name: 'Biaya Obat-obatan Rawat Jalan', batasan: 'Per Tahun', limit: 3000000, terpakai: 1200000, sisa: 1800000, limitId: 'MIR-RJ-004' },
  { id: 'tindakan', name: 'Biaya Fisioterapi/Tindakan', batasan: 'Per Tahun', limit: 1500000, terpakai: 500000, sisa: 1000000, limitId: 'MIR-RJ-005' },
  { id: 'admin', name: 'Biaya Administrasi', batasan: 'Per Tahun', limit: 100000, terpakai: 50000, sisa: 50000, limitId: 'MIR-RJ-007' },
];

export const MIR_INPATIENT_BENEFITS: BenefitType[] = [
  { id: 'konsultasi_umum', name: 'Biaya Kamar Rawat Inap per hari', batasan: 'Per Hari', limit: 2000000, terpakai: null, sisa: null, limitId: 'MIR-RI-001' },
  { id: 'konsultasi_spesialis', name: 'Biaya Kunjungan Dokter per hari', batasan: 'Per Hari', limit: 500000, terpakai: null, sisa: null, limitId: 'MIR-RI-004' },
  { id: 'tindakan', name: 'Biaya Pembedahan/Tindakan', batasan: 'Per Tahun', limit: 100000000, terpakai: null, sisa: null, limitId: 'MIR-RI-003' },
  { id: 'obat', name: 'Biaya Obat-obatan RS', batasan: 'Per Tahun', limit: 50000000, terpakai: null, sisa: null, limitId: 'MIR-RI-005' },
  { id: 'lab', name: 'Biaya Laboratorium RS', batasan: 'Per Tahun', limit: 20000000, terpakai: null, sisa: null, limitId: 'MIR-RI-006' },
  { id: 'admin', name: 'Biaya Administrasi RS', batasan: 'Per Tahun', limit: 5000000, terpakai: null, sisa: null, limitId: 'MIR-RI-007' },
];

export const PLAN_CODE_ANNUAL_LIMITS: Record<string, { annual: number; room: number }> = {
  'IP2000': { annual: 200000000, room: 2000000 },
  'IP1400': { annual: 140000000, room: 1400000 },
  'IP1000': { annual: 100000000, room: 1000000 },
  'IP800': { annual: 80000000, room: 800000 },
  'OP600': { annual: 6000000, room: 0 },
  'OP400': { annual: 4000000, room: 0 },
  'OP300': { annual: 3000000, room: 0 },
};

export function getBenefitsForMIRClaim(benefitCategory: string, planCodes?: string[]): BenefitType[] {
  const isOutpatient = benefitCategory?.toUpperCase().includes('JALAN');
  
  if (isOutpatient) {
    const opPlan = planCodes?.find(p => p?.startsWith('OP')) || 'OP600';
    const limitMultiplier = opPlan === 'OP600' ? 1 : opPlan === 'OP400' ? 0.67 : opPlan === 'OP300' ? 0.5 : 1;
    
    return MIR_OUTPATIENT_BENEFITS.map(b => ({
      ...b,
      limit: b.batasan === 'Per Tahun' ? Math.round(b.limit * limitMultiplier) : b.limit,
      sisa: b.sisa !== null ? Math.round(b.sisa * limitMultiplier) : null,
      terpakai: b.terpakai !== null ? Math.round(b.terpakai * limitMultiplier) : null,
    }));
  } else {
    const ipPlan = planCodes?.find(p => p?.startsWith('IP')) || 'IP2000';
    const planLimits = PLAN_CODE_ANNUAL_LIMITS[ipPlan];
    const roomLimit = planLimits?.room || 2000000;
    
    return MIR_INPATIENT_BENEFITS.map(b => ({
      ...b,
      limit: b.id === 'konsultasi_umum' ? roomLimit : b.limit,
    }));
  }
}

function mapBenefitTierToTypes(tier: BenefitTier): BenefitType[] {
  const benefits: BenefitType[] = [];
  
  if (tier.roomLimit) {
    benefits.push({
      id: `room_${tier.code}`,
      name: 'Biaya Kamar per Hari',
      batasan: 'Per Hari',
      limit: tier.roomLimit,
      terpakai: null,
      sisa: null,
    });
  }
  
  if (tier.annualLimit) {
    const terpakai = Math.round(tier.annualLimit * 0.7);
    benefits.push({
      id: `annual_${tier.code}`,
      name: 'Limit Tahunan',
      batasan: 'Per Tahun',
      limit: tier.annualLimit,
      terpakai,
      sisa: tier.annualLimit - terpakai,
    });
  }
  
  return benefits;
}

function generateBenefitsFromTier(tier: BenefitTier, policyCode: string = 'STD'): BenefitType[] {
  const annualLimit = tier.annualLimit || 2500000;
  
  const obatLimit = Math.round(annualLimit * 0.2);
  const obatTerpakai = Math.round(obatLimit * 0.75);
  
  const labLimit = Math.round(annualLimit * 0.12);
  const labTerpakai = Math.round(labLimit * 0.93);
  
  const adminLimit = Math.round(annualLimit * 0.02);
  const adminTerpakai = adminLimit;
  
  return [
    { id: 'konsultasi_umum', name: 'Biaya Konsultasi Dokter Umum', batasan: 'Per Hari', limit: Math.round(annualLimit * 0.03), terpakai: null, sisa: null, limitId: `${policyCode}-RJ-001` },
    { id: 'konsultasi_spesialis', name: 'Biaya Konsultasi Dokter Spesialis', batasan: 'Per Hari', limit: Math.round(annualLimit * 0.06), terpakai: null, sisa: null, limitId: `${policyCode}-RJ-002` },
    { id: 'obat', name: 'Biaya Obat-obatan', batasan: 'Per Tahun', limit: obatLimit, terpakai: obatTerpakai, sisa: obatLimit - obatTerpakai, limitId: `${policyCode}-RJ-004` },
    { id: 'lab', name: 'Biaya Laboratorium & Diagnostik', batasan: 'Per Tahun', limit: labLimit, terpakai: labTerpakai, sisa: labLimit - labTerpakai, limitId: `${policyCode}-RJ-003` },
    { id: 'tindakan', name: 'Biaya Tindakan Medis', batasan: 'Per Hari', limit: Math.round(annualLimit * 0.08), terpakai: null, sisa: null, limitId: `${policyCode}-RJ-006` },
    { id: 'admin', name: 'Biaya Administrasi', batasan: 'Per Tahun', limit: adminLimit, terpakai: adminTerpakai, sisa: 0, limitId: `${policyCode}-RJ-007` },
  ];
}

export function getBenefitPlanForClaim(claim: Claim): BenefitPlan | null {
  const policyCode = getPolicyCodeFromClaim(claim);
  
  if (policyCode === 'MIR') {
    const planCodes = claim.benefits || [];
    const benefits = getBenefitsForMIRClaim(claim.benefitCategory || 'RAWAT JALAN', planCodes);
    const opPlan = planCodes.find(p => p.startsWith('OP'));
    const ipPlan = planCodes.find(p => p.startsWith('IP'));
    const planCode = claim.benefitCategory?.toUpperCase().includes('JALAN') ? (opPlan || 'OP600') : (ipPlan || 'IP2000');
    const yearlyLimit = PLAN_CODE_ANNUAL_LIMITS[planCode]?.annual || 6000000;
    
    return {
      planCode,
      coInsuranceInsurer: 85,
      coInsuranceMember: 15,
      yearlyLimit,
      policyStart: claim.policyEffectiveDate || '2025-01-01',
      policyEnd: claim.policyExpiryDate || '2025-12-31',
      benefits,
      source: 'policy',
    };
  }
  
  try {
    const policiesJson = localStorage.getItem('strator_policies');
    if (!policiesJson) return null;
    
    const policies: StoredPolicy[] = JSON.parse(policiesJson);
    if (!policies.length) return null;
    
    const matchingPolicy = policies.find(policy => {
      if (claim.policyNumber) {
        const claimPolicyNum = claim.policyNumber.toLowerCase().trim();
        
        if (policy.policyNumber) {
          const storedPolicyNum = policy.policyNumber.toLowerCase().trim();
          if (claimPolicyNum === storedPolicyNum || claimPolicyNum.includes(storedPolicyNum) || storedPolicyNum.includes(claimPolicyNum)) {
            return true;
          }
        }
        
        if (policy.id) {
          const policyId = policy.id.toLowerCase().trim();
          if (claimPolicyNum === policyId || claimPolicyNum.includes(policyId) || policyId.includes(claimPolicyNum)) {
            return true;
          }
        }
      }
      
      if (claim.policyHolderName && policy.policyholderName) {
        const claimHolder = claim.policyHolderName.toLowerCase().trim();
        const policyHolder = policy.policyholderName.toLowerCase().trim();
        if (claimHolder === policyHolder || claimHolder.includes(policyHolder) || policyHolder.includes(claimHolder)) {
          return true;
        }
      }
      
      return false;
    });
    
    if (!matchingPolicy) return null;
    
    if (!matchingPolicy.benefitTiers || matchingPolicy.benefitTiers.length === 0) {
      return {
        planCode: 'STANDARD',
        coInsuranceInsurer: DEFAULT_CO_INSURANCE_INSURER,
        coInsuranceMember: DEFAULT_CO_INSURANCE_MEMBER,
        yearlyLimit: 2500000,
        policyStart: matchingPolicy.periodStart,
        policyEnd: matchingPolicy.periodEnd,
        benefits: DEFAULT_BENEFITS,
        source: 'policy',
      };
    }
    
    const primaryTier = matchingPolicy.benefitTiers[0];
    const benefits = generateBenefitsFromTier(primaryTier, policyCode);
    
    return {
      planCode: primaryTier.code || 'STANDARD',
      coInsuranceInsurer: DEFAULT_CO_INSURANCE_INSURER,
      coInsuranceMember: DEFAULT_CO_INSURANCE_MEMBER,
      yearlyLimit: primaryTier.annualLimit || 2500000,
      policyStart: matchingPolicy.periodStart,
      policyEnd: matchingPolicy.periodEnd,
      benefits,
      source: 'policy',
    };
  } catch (error) {
    console.error('Error looking up benefit plan:', error);
    return null;
  }
}

export function getDefaultBenefitPlan(claim?: Claim): BenefitPlan {
  return {
    planCode: 'RJ-250',
    coInsuranceInsurer: DEFAULT_CO_INSURANCE_INSURER,
    coInsuranceMember: DEFAULT_CO_INSURANCE_MEMBER,
    yearlyLimit: 2500000,
    policyStart: claim?.policyEffectiveDate || '2024-10-14',
    policyEnd: claim?.policyExpiryDate || '2025-10-13',
    benefits: DEFAULT_BENEFITS,
    source: 'hardcoded',
  };
}
