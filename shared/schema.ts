import { z } from "zod";
import { pgTable, text, serial, integer, timestamp, varchar, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// ============= DATABASE TABLES (Drizzle ORM) =============

// Members table - stores all insurance policy members
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  memberId: varchar("member_id", { length: 50 }).notNull().unique(), // System-generated: MEM-XXXXX
  policyId: varchar("policy_id", { length: 50 }).notNull(), // FK to policies
  policyNumber: varchar("policy_number", { length: 100 }), // From parent policy
  policyholderName: varchar("policyholder_name", { length: 255 }).notNull(),
  policyExpiryDate: date("policy_expiry_date"),
  memberCardNumber: varchar("member_card_number", { length: 100 }).notNull(), // Unique identifier from Excel
  fullName: varchar("full_name", { length: 255 }).notNull(),
  principalMemberId: varchar("principal_member_id", { length: 50 }), // FK, nullable for principals
  principalName: varchar("principal_name", { length: 255 }),
  relationship: varchar("relationship", { length: 50 }).notNull(), // Prinsipal/Istri/Suami/Anak
  gender: varchar("gender", { length: 20 }).notNull(), // Laki-laki/Perempuan
  dateOfBirth: date("date_of_birth").notNull(),
  enrollmentDate: date("enrollment_date").notNull(),
  terminationDate: date("termination_date"), // Nullable
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE/TERMINATED/SUSPENDED
  planIP: varchar("plan_ip", { length: 20 }), // Rawat Inap plan code (e.g., IP2000, IP1400)
  planOP: varchar("plan_op", { length: 20 }), // Rawat Jalan plan code (e.g., OP600, OP400)
  planRB: varchar("plan_rb", { length: 20 }), // Rawat Bersalin plan code
  planRG: varchar("plan_rg", { length: 20 }), // Rawat Gigi plan code
  planKM: varchar("plan_km", { length: 20 }), // Kacamata plan code
  planMCU: varchar("plan_mcu", { length: 20 }), // Medical Checkup plan code
  planLainnya: varchar("plan_lainnya", { length: 20 }), // Other benefits plan code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Drizzle insert schema and types for members
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

// ============= ZOD SCHEMAS (Frontend Validation) =============

// Document Type Classification (per PRD Section 3.1)
// Extended with 8 additional types for GAP 1
export const documentTypeEnum = z.enum([
  // Original 12 types
  'LEMBAR_PENGESAHAN_TPA',    // TPA Summary sheet - NEVER use for financial extraction
  'INVOICE_DETAIL',           // Hospital itemized bill - PRIMARY financial source
  'KUITANSI_RECEIPT',         // Receipt/Kwitansi - FALLBACK financial source
  'LAB_RESULTS',              // Laboratory results
  'PRESCRIPTION',             // Doctor's prescription (often handwritten)
  'REFERRAL_LETTER',          // Surat rujukan
  'RADIOLOGY_RESULTS',        // X-ray, CT, MRI reports
  'FORM_KLAIM',               // Claim form
  'KTP',                      // Identity card copy
  'KARTU_PESERTA',            // Member card copy
  'SURAT_DOKTER',             // Doctor's letter
  
  // GAP 1: 8 new document types
  'PAYMENT_CONFIRMATION',     // Bank transfer notification - reference only
  'ELIGIBILITY_CHECK_FORM',   // Eligibility/pendaftaran pasien form - reference only
  'DISCHARGE_SUMMARY',        // Resume pasien pulang - PRIMARY for diagnosis & medications
  'OUTPATIENT_TREATMENT_FORM',// Formulir rawat jalan - fallback for diagnosis
  'BENEFIT_SCHEDULE',         // Informasi benefit - reference only (limits, not charges)
  'HOSPITAL_COVER_LETTER',    // Surat jalan/cover letter - reference only
  'PHARMACY_RECEIPT',         // Faktur penjualan obat - medications only if no invoice
  'SERVICE_RECEIPT',          // Bukti pelayanan pasien - fallback if no proper invoice
  
  'UNKNOWN'                   // Unclassified document
]);

export type DocumentType = z.infer<typeof documentTypeEnum>;

// Document Quality Level (per PRD Section 3.2)
export const qualityLevelEnum = z.enum([
  'HIGH',    // OCR ≥ 85% - Clean typed document, auto-extract
  'MEDIUM',  // OCR 70-84% - Slightly blurry/faded, extract with verification flag
  'LOW'      // OCR < 70% - Handwritten or poor quality, manual input required
]);

export type QualityLevel = z.infer<typeof qualityLevelEnum>;

// Enhanced document schema with classification
export const classifiedDocumentSchema = z.object({
  type: z.string(),                              // Human-readable type (legacy)
  documentType: documentTypeEnum.optional(),     // Machine classification
  fileName: z.string().optional(),
  notes: z.string().optional(),
  required: z.boolean(),
  uploaded: z.boolean(),
  ocrConfidence: z.number().optional(),          // 0-100 percentage
  qualityLevel: qualityLevelEnum.optional(),     // HIGH/MEDIUM/LOW
  handwrittenDetected: z.boolean().optional(),   // True if handwritten content detected
  extractFrom: z.boolean().optional(),           // Whether to extract data from this doc
  manualInputRequired: z.boolean().optional(),   // If true, needs manual data entry
  manualInputReason: z.string().optional(),      // Reason for manual input requirement
  isFinancialDocument: z.boolean().optional(),   // True for INVOICE_DETAIL, KUITANSI_RECEIPT
  pages: z.array(z.number()).optional(),         // Page numbers in combined PDF
  classificationConfidence: z.number().optional(), // 0-1 confidence of document type classification
});

export type ClassifiedDocument = z.infer<typeof classifiedDocumentSchema>;

// Document quality assessment result
export const documentQualityAssessmentSchema = z.object({
  avgConfidence: z.number(),                     // Average OCR confidence across all docs
  overallQuality: qualityLevelEnum,              // Overall quality level
  hasHandwrittenFinancialDocs: z.boolean(),      // Critical: handwritten kuitansi/invoice
  requiresManualInput: z.boolean(),              // Should route to Input Manual tab
  manualInputReasons: z.array(z.string()),       // List of reasons for manual input
  criticalDocsReadable: z.boolean(),             // Are financial docs readable?
});

export type DocumentQualityAssessment = z.infer<typeof documentQualityAssessmentSchema>;

const fraudFlagSchema = z.object({
  type: z.enum(['OVERPRICING', 'ER_MISUSE', 'DUPLICATE', 'SUSPICIOUS_PATTERN']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string(),
  estimatedSaving: z.number().optional(),
  excess: z.number().optional(),
  markup: z.string().optional(),
  item: z.string().optional(),
  charged: z.number().optional(),
  marketPrice: z.number().optional(),
  reason: z.string().optional(),
});

export const claimSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  provider: z.string(),
  date: z.string(),
  patientId: z.string(),
  patientName: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.enum(['L', 'P']).optional(),
  patientNIK: z.string().optional(),
  patientDOB: z.string().optional(),
  patientDateOfBirth: z.string().optional(),
  principalName: z.string().optional(),
  relationshipToPrincipal: z.enum(['Prinsipal', 'Suami', 'Isteri', 'Anak']).optional(),
  benefits: z.array(z.string()).optional(),
  memberCardNumber: z.string().optional(),
  memberStatus: z.enum(['AKTIF', 'TIDAK AKTIF', 'TIDAK DITEMUKAN']).optional(),
  memberValidation: z.object({
    passed: z.boolean(),
    databaseChecked: z.boolean(),
    message: z.string(),
    recommendation: z.string().optional(),
    memberData: z.object({
      fullName: z.string(),
      memberCardNumber: z.string(),
      policyholderName: z.string(),
      enrollmentDate: z.string(),
      status: z.string(),
    }).optional(),
  }).optional(),
  policyHolderName: z.string().optional(),
  policyNumber: z.string().optional(),
  policyEffectiveDate: z.string().optional(),
  policyExpiryDate: z.string().optional(),
  treatmentDate: z.string().optional(),
  submissionDate: z.string().optional(),
  diagnosis: z.string(),
  icd10: z.string().optional(),
  icd10Codes: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })).optional(),
  amount: z.number(),
  revisedAmount: z.number().optional(),
  adjudicationResult: z.enum(['Approve', 'Approve Sebagian', 'Tolak']).optional(),
  benefitCategory: z.enum(['RAWAT JALAN', 'RAWAT INAP', 'RAWAT BERSALIN', 'RAWAT GIGI', 'KACAMATA', 'MEDICAL CHECK-UP']).optional(),
  serviceType: z.enum(['Outpatient', 'Emergency', 'Inpatient', 'Preventive']).optional(),
  benefitLimit: z.number().optional(),
  benefitUsed: z.number().optional(),
  documents: z.array(classifiedDocumentSchema).optional(),
  documentQualityAssessment: documentQualityAssessmentSchema.optional(),
  policyDocumentRequirementsReference: z.string().optional(),
  policyDocumentRequirementsText: z.string().optional(),
  policyPdfUrl: z.string().optional(),
  submissionDeadlineDate: z.string().optional(),
  policyTimelineReference: z.string().optional(),
  policyTimelineText: z.string().optional(),
  checkpointStatuses: z.object({
    validitasPeserta: z.enum(['passed', 'failed', 'pending', 'in-progress']).optional(),
    kelengkapanDokumen: z.enum(['passed', 'failed', 'pending', 'in-progress']).optional(),
    ketepatanWaktu: z.enum(['passed', 'failed', 'pending', 'in-progress']).optional(),
    pengecualianPolis: z.enum(['passed', 'failed', 'pending', 'in-progress', 'warning']).optional(),
    analisisKlaim: z.enum(['passed', 'failed', 'pending', 'in-progress']).optional(),
    batasManfaat: z.enum(['passed', 'failed', 'pending', 'in-progress']).optional(),
    keputusanAkhir: z.enum(['passed', 'failed', 'pending', 'in-progress', 'awaiting']).optional(),
    // Sub-checkpoints for Checkpoint 4: Pengecualian dan Masa Tunggu
    pengecualianPolisSubcheck: z.enum(['passed', 'failed', 'pending']).optional(),
    masaTungguSubcheck: z.enum(['passed', 'failed', 'pending', 'warning', 'n/a']).optional(),
    // Sub-checkpoints for Checkpoint 5: Analisis Klaim
    riwayatKlaimPasienSubcheck: z.enum(['passed', 'warning', 'n/a']).optional(),
    kesesuaianMedisSubcheck: z.enum(['passed', 'failed', 'pending']).optional(),
    kesesuaianTerapiSubcheck: z.enum(['passed', 'failed', 'pending']).optional(),
    verifikasiHargaSubcheck: z.enum(['passed', 'failed', 'pending']).optional(),
  }).optional(),
  aiAnalysis: z.object({
    validitasPeserta: z.string().optional(),
    kelengkapanDokumen: z.string().optional(),
    ketepatanWaktu: z.string().optional(),
    pengecualianPolis: z.string().optional(),
    analisisKlaim: z.string().optional(),
    batasManfaat: z.string().optional(),
    keputusanAkhir: z.string().optional(),
    // Sub-checkpoint AI analysis
    pengecualianPolisSubcheck: z.string().optional(),
    masaTungguSubcheck: z.string().optional(),
    riwayatKlaimPasienSubcheck: z.string().optional(),
    kesesuaianMedisSubcheck: z.string().optional(),
    kesesuaianTerapiSubcheck: z.string().optional(),
    verifikasiHargaSubcheck: z.string().optional(),
  }).optional(),
  reviewDecision: z.object({
    finalDecision: z.enum(['SETUJU', 'TOLAK', 'SETUJUI PARTIAL']).optional(),
    justification: z.string().optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().optional(),
  }).optional(),
  cp4Decision: z.object({
    aiRecommendation: z.object({
      status: z.enum(['NOT_EXCLUDED', 'EXCLUDED', 'PARTIAL_EXCLUSION']).optional(),
      confidence: z.number().optional(),
      summary: z.string().optional(),
      diagnosesAnalysis: z.array(z.object({
        icd10Code: z.string(),
        diagnosisName: z.string(),
        isPrimary: z.boolean(),
        isExcluded: z.boolean(),
        exclusionClauseId: z.number().optional(),
        exclusionClausePasal: z.string().optional(),
        exclusionClauseTitle: z.string().optional(),
        relatedToDiagnosis: z.string().optional(),
        isComplication: z.boolean(),
      })).optional(),
      recommendedAction: z.enum(['CONTINUE', 'REJECT']).optional(),
      policyReference: z.object({
        document: z.string(),
        clause: z.string(),
      }).optional(),
    }).optional(),
    analystDecision: z.enum(['LANJUT', 'TOLAK']).optional(),
    isOverride: z.boolean().optional(),
    justification: z.string().optional(),
    decidedAt: z.string().optional(),
    decidedBy: z.string().optional(),
  }).optional(),
  cp5ItemAnalysis: z.array(z.object({
    itemName: z.string(),
    itemType: z.enum(['CONS', 'DRUG', 'PROC', 'ROOM', 'LAB', 'OTHER']).optional(),
    quantity: z.number().optional(),
    chargedPrice: z.number().optional(),
    marketPrice: z.number().optional(),
    aiRecommendation: z.enum(['APPROVE', 'REJECT', 'REVIEW']).optional(),
    aiConfidence: z.number().min(0).max(100).optional(),
    clinicalAppropriateness: z.object({
      isAppropriate: z.boolean().optional(),
      reasoning: z.string().optional(),
      diagnosisMatch: z.string().optional(),
    }).optional(),
    pricingAnalysis: z.object({
      isOverpriced: z.boolean().optional(),
      priceDifference: z.number().optional(),
      marketSource: z.string().optional(),
      reasoning: z.string().optional(),
    }).optional(),
    quantityAnalysis: z.object({
      isAppropriate: z.boolean().optional(),
      reasoning: z.string().optional(),
    }).optional(),
    issues: z.array(z.string()).optional(),
    overallReasoning: z.string().optional(),
  })).optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
  })).optional(),
  fraudRisks: z.array(z.object({
    type: z.string(),
    item: z.string().optional(),
    description: z.string(),
    severity: z.string(),
    estimatedOvercharge: z.number().optional(),
  })).optional(),
  fraudFlags: z.array(fraudFlagSchema).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  analysis: z.object({
    priceAnalysis: z.array(z.object({
      item: z.string(),
      chargedPrice: z.number(),
      marketPrice: z.number(),
      flag: z.enum(['NORMAL', 'OVERPRICED', 'UNDERPRICED']),
      source: z.string(),
    })).optional(),
    riskScore: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    patterns: z.array(z.string()).optional(),
  }).optional(),
  recommendations: z.object({
    forClaims: z.array(z.object({
      action: z.string(),
      reason: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      potentialSavings: z.number().optional(),
    })).optional(),
    forUnderwriting: z.array(z.object({
      action: z.string(),
      reason: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      potentialSavings: z.number().optional(),
    })).optional(),
    forActuarial: z.array(z.object({
      action: z.string(),
      reason: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    })).optional(),
  }).optional(),
  alerts: z.array(z.object({
    type: z.enum(['CRITICAL', 'WARNING', 'INFO']),
    message: z.string(),
  })).optional(),
  totalOvercharge: z.number().optional(),
  hasIssues: z.boolean().optional(),
  status: z.enum(['processing', 'processed', 'incomplete', 'error']),
  createdAt: z.date(),
  processingErrors: z.array(z.string()).optional(),
  originalFileBase64: z.string().optional(), // Store the original file for viewing
  fileMimeType: z.string().optional(), // Store the file type
});

export type FraudFlag = z.infer<typeof fraudFlagSchema>;

export const insertClaimSchema = claimSchema.omit({ id: true, createdAt: true });

export type Claim = z.infer<typeof claimSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.omit({ id: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const processingStatsSchema = z.object({
  totalClaims: z.number(),
  totalAmount: z.number(),
  successRate: z.number(),
  highValueAlerts: z.number(),
  todayProcessed: z.number(),
  averageAmount: z.number(),
  topProviders: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
});

export type ProcessingStats = z.infer<typeof processingStatsSchema>;

export const providerBukuTarifSchema = z.object({
  id: z.string(),
  provider_name: z.string(),
  tgl_upload_pertama: z.date(),
  tgl_update_terakhir: z.date(),
  berlaku_sampai_tgl: z.date(),
  status: z.enum(['Berlaku', 'Lewat Masa Berlaku', 'Terminasi']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertProviderBukuTarifSchema = providerBukuTarifSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type ProviderBukuTarif = z.infer<typeof providerBukuTarifSchema>;
export type InsertProviderBukuTarif = z.infer<typeof insertProviderBukuTarifSchema>;

export const policyActivitySchema = z.object({
  id: z.string(),
  policyholder: z.string(),
  activityType: z.string(),
  note: z.string(),
  user: z.string(),
  userInitials: z.string(),
  date: z.string(),
  time: z.string(),
  timestamp: z.date(),
});

export const insertPolicyActivitySchema = policyActivitySchema.omit({ 
  id: true
});

export type PolicyActivity = z.infer<typeof policyActivitySchema>;
export type InsertPolicyActivity = z.infer<typeof insertPolicyActivitySchema>;

export const policyMetricsSchema = z.object({
  currentValue: z.number(),
  trendData: z.array(z.number()),
  trendChange: z.number(),
  trendPeriod: z.string(),
});

export type PolicyMetrics = z.infer<typeof policyMetricsSchema>;

export const memberMetricsSchema = z.object({
  currentValue: z.number(),
  trendData: z.array(z.number()),
  trendChange: z.number(),
  trendPeriod: z.string(),
});

export type MemberMetrics = z.infer<typeof memberMetricsSchema>;

export const claimActivitySchema = z.object({
  id: z.string(),
  claimId: z.string(),
  peserta: z.string(),
  policyHolderName: z.string(),
  activityType: z.string(),
  note: z.string(),
  user: z.string(),
  userInitials: z.string(),
  date: z.string(),
  time: z.string(),
  timestamp: z.date(),
});

export const insertClaimActivitySchema = claimActivitySchema.omit({ 
  id: true
});

export type ClaimActivity = z.infer<typeof claimActivitySchema>;
export type InsertClaimActivity = z.infer<typeof insertClaimActivitySchema>;

export const providerActivitySchema = z.object({
  id: z.string(),
  providerName: z.string(),
  activityType: z.string(),
  note: z.string(),
  user: z.string(),
  userInitials: z.string(),
  date: z.string(),
  time: z.string(),
  timestamp: z.date(),
});

export const insertProviderActivitySchema = providerActivitySchema.omit({ 
  id: true
});

export type ProviderActivity = z.infer<typeof providerActivitySchema>;
export type InsertProviderActivity = z.infer<typeof insertProviderActivitySchema>;

export const tariffItemSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  tariffId: z.string(),
  category: z.enum(['Admin & Room', 'Doctor Fee', 'Laboratory', 'Radiology', 'Procedure', 'Equipment', 'Other']),
  itemName: z.string(),
  priceOPD: z.number().nullable(),
  priceKelas3: z.number().nullable(),
  priceKelas2: z.number().nullable(),
  priceKelas1: z.number().nullable(),
  priceVIP: z.number().nullable(),
  priceVVIP: z.number().nullable(),
});

export const insertTariffItemSchema = tariffItemSchema.omit({ id: true });

export type TariffItem = z.infer<typeof tariffItemSchema>;
export type InsertTariffItem = z.infer<typeof insertTariffItemSchema>;

export const providerTariffBookSchema = z.object({
  id: z.string(),
  providerName: z.string(),
  providerCode: z.string(),
  berlakuMulai: z.string(),
  berlakuSampai: z.string(),
  totalItems: z.number(),
  totalCategories: z.number(),
  status: z.enum(['Aktif', 'Kadaluarsa']),
  uploadDate: z.string(),
  items: z.array(tariffItemSchema),
  notes: z.string().optional(),
});

export type ProviderTariffBook = z.infer<typeof providerTariffBookSchema>;
