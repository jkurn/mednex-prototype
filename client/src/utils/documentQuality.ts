import type { Claim, ClassifiedDocument, DocumentQualityAssessment, QualityLevel, DocumentType } from '@shared/schema';

// ============= GAP 1: EXTENDED DOCUMENT TYPE CLASSIFICATION =============

// Document classification patterns for 20 document types
const DOCUMENT_CLASSIFICATION_PATTERNS: Record<DocumentType, { keywords: string[]; priority: number }> = {
  // Original types
  'LEMBAR_PENGESAHAN_TPA': { 
    keywords: ['lembar pengesahan', 'tpa', 'pengesahan klaim', 'approval sheet', 'persetujuan'],
    priority: 1 
  },
  'INVOICE_DETAIL': { 
    keywords: ['invoice', 'tagihan', 'rincian biaya', 'detail biaya', 'billing', 'hospital bill', 'perincian', 'daftar biaya'],
    priority: 2 
  },
  'KUITANSI_RECEIPT': { 
    keywords: ['kuitansi', 'kwitansi', 'receipt', 'bukti pembayaran', 'tanda terima', 'cash receipt'],
    priority: 3 
  },
  'LAB_RESULTS': { 
    keywords: ['laboratorium', 'lab result', 'hasil lab', 'pemeriksaan darah', 'urine', 'hematologi', 'patologi'],
    priority: 10 
  },
  'PRESCRIPTION': { 
    keywords: ['resep', 'prescription', 'r/', 'obat', 'tablet', 'capsul', 'sirup'],
    priority: 11 
  },
  'REFERRAL_LETTER': { 
    keywords: ['rujukan', 'referral', 'surat rujukan', 'konsul'],
    priority: 12 
  },
  'RADIOLOGY_RESULTS': { 
    keywords: ['radiologi', 'x-ray', 'rontgen', 'ct scan', 'mri', 'usg', 'ultrasonografi'],
    priority: 13 
  },
  'FORM_KLAIM': { 
    keywords: ['form klaim', 'formulir klaim', 'claim form', 'pengajuan klaim'],
    priority: 14 
  },
  'KTP': { 
    keywords: ['ktp', 'kartu tanda penduduk', 'nik', 'identity card'],
    priority: 15 
  },
  'KARTU_PESERTA': { 
    keywords: ['kartu peserta', 'member card', 'kartu asuransi', 'insurance card'],
    priority: 16 
  },
  'SURAT_DOKTER': { 
    keywords: ['surat dokter', 'doctor letter', 'surat keterangan', 'medical certificate'],
    priority: 17 
  },
  
  // GAP 1: 8 new document types
  'PAYMENT_CONFIRMATION': { 
    keywords: ['bank mandiri', 'transfer notification', 'transaction', 'idr', 'rekening', 'bukti transfer', 'mutasi', 'bca', 'bni', 'bri'],
    priority: 20 
  },
  'ELIGIBILITY_CHECK_FORM': { 
    keywords: ['eligibility', 'pendaftaran pasien', 'webclaim', 'reference id', 'kelayakan', 'verifikasi peserta'],
    priority: 21 
  },
  'DISCHARGE_SUMMARY': { 
    keywords: ['resume pasien pulang', 'discharge summary', 'diagnosa utama', 'ringkasan perawatan', 'resume medis', 'pulang'],
    priority: 4 // High priority - primary source for diagnosis
  },
  'OUTPATIENT_TREATMENT_FORM': { 
    keywords: ['formulir rawat jalan', 'formulir klaim rawat jalan', 'outpatient form', 'rawat jalan'],
    priority: 22 
  },
  'BENEFIT_SCHEDULE': { 
    keywords: ['informasi benefit', 'pendaftaran pasien outpatient', 'sesuai tghn', 'jadwal manfaat', 'limit', 'plafon'],
    priority: 23 
  },
  'HOSPITAL_COVER_LETTER': { 
    keywords: ['kepada yth', 'perihal: tagihan', 'surat jalan', 'surat pengantar', 'cover letter'],
    priority: 24 
  },
  'PHARMACY_RECEIPT': { 
    keywords: ['faktur penjualan', 'hall satelit', 'apotek', 'pharmacy', 'farmasi', 'obat'],
    priority: 5 // Used for medications if no full invoice
  },
  'SERVICE_RECEIPT': { 
    keywords: ['bukti pelayanan pasien', 'service breakdown', 'kasir', 'pelayanan'],
    priority: 6 // Fallback if no proper invoice
  },
  
  'UNKNOWN': { keywords: [], priority: 100 }
};

// Documents that should NEVER be used for financial extraction
const EXCLUDED_FINANCIAL_SOURCES: DocumentType[] = [
  'LEMBAR_PENGESAHAN_TPA',   // TPA's summary, not hospital's bill
  'ELIGIBILITY_CHECK_FORM',  // Benefit limits, not charges
  'HOSPITAL_COVER_LETTER',   // Cover letter only
  'BENEFIT_SCHEDULE',        // Shows limits, not actual charges
  'PAYMENT_CONFIRMATION'     // Bank transfer confirmation, not invoice
];

// Financial document types that require special attention (extended)
const FINANCIAL_DOCUMENT_TYPES: DocumentType[] = [
  'INVOICE_DETAIL', 
  'KUITANSI_RECEIPT',
  'PHARMACY_RECEIPT',
  'SERVICE_RECEIPT'
];

// GAP 3: Required fields for claim processing
const REQUIRED_FIELDS = [
  'claim_number',
  'patient_name',
  'member_id',
  'policy_number',
  'provider_name',
  'treatment_date',
  'total_claimed_amount',
  'diagnosis',
  'line_items'
] as const;

type RequiredField = typeof REQUIRED_FIELDS[number];

// Document-to-field mapping for smart routing
const DOCUMENT_FIELD_MAPPING: Record<DocumentType, RequiredField[]> = {
  'INVOICE_DETAIL': ['line_items', 'total_claimed_amount', 'treatment_date', 'provider_name'],
  'KUITANSI_RECEIPT': ['total_claimed_amount', 'treatment_date', 'provider_name'],
  'DISCHARGE_SUMMARY': ['diagnosis', 'patient_name'],
  'OUTPATIENT_TREATMENT_FORM': ['diagnosis', 'patient_name', 'treatment_date'],
  'PRESCRIPTION': ['diagnosis'],
  'FORM_KLAIM': ['claim_number', 'patient_name', 'member_id', 'policy_number'],
  'KARTU_PESERTA': ['member_id', 'patient_name'],
  'LEMBAR_PENGESAHAN_TPA': ['claim_number', 'policy_number'],
  'LAB_RESULTS': [],
  'REFERRAL_LETTER': ['diagnosis'],
  'RADIOLOGY_RESULTS': [],
  'KTP': ['patient_name'],
  'SURAT_DOKTER': ['diagnosis'],
  'PAYMENT_CONFIRMATION': [],
  'ELIGIBILITY_CHECK_FORM': ['member_id'],
  'BENEFIT_SCHEDULE': [],
  'HOSPITAL_COVER_LETTER': ['provider_name'],
  'PHARMACY_RECEIPT': ['line_items'],
  'SERVICE_RECEIPT': ['line_items', 'total_claimed_amount'],
  'UNKNOWN': []
};

// ============= GAP 1: Document Classification Function =============

/**
 * Classify a document by analyzing its content/text
 * Uses keyword pattern matching with priority scoring
 */
export function classifyDocument(
  documentText: string, 
  fileName?: string
): { documentType: DocumentType; confidence: number; matchedKeywords: string[] } {
  const lowerText = (documentText || '').toLowerCase();
  const lowerFileName = (fileName || '').toLowerCase();
  const combinedText = `${lowerText} ${lowerFileName}`;
  
  let bestMatch: DocumentType = 'UNKNOWN';
  let bestScore = 0;
  let bestPriority = 100;
  let matchedKeywords: string[] = [];
  
  for (const [docType, config] of Object.entries(DOCUMENT_CLASSIFICATION_PATTERNS)) {
    if (docType === 'UNKNOWN') continue;
    
    const matches = config.keywords.filter(kw => combinedText.includes(kw.toLowerCase()));
    const score = matches.length;
    
    // Prioritize higher match count, then lower priority number (higher priority documents)
    if (score > bestScore || (score === bestScore && config.priority < bestPriority)) {
      bestMatch = docType as DocumentType;
      bestScore = score;
      bestPriority = config.priority;
      matchedKeywords = matches;
    }
  }
  
  // Calculate confidence based on matches
  const confidence = Math.min(0.95, 0.3 + (bestScore * 0.15));
  
  return {
    documentType: bestMatch,
    confidence: bestScore > 0 ? confidence : 0.1,
    matchedKeywords
  };
}

/**
 * Get document action/purpose based on type
 */
export function getDocumentAction(docType: DocumentType): {
  action: 'EXTRACT_PRIMARY' | 'EXTRACT_FALLBACK' | 'REFERENCE_ONLY' | 'MEDICATIONS_ONLY';
  description: string;
} {
  switch (docType) {
    case 'INVOICE_DETAIL':
      return { action: 'EXTRACT_PRIMARY', description: 'Primary source for line items and financial data' };
    case 'DISCHARGE_SUMMARY':
      return { action: 'EXTRACT_PRIMARY', description: 'Primary source for diagnosis and medications' };
    case 'KUITANSI_RECEIPT':
      return { action: 'EXTRACT_FALLBACK', description: 'Fallback for total amount only' };
    case 'SERVICE_RECEIPT':
      return { action: 'EXTRACT_FALLBACK', description: 'Fallback if no proper invoice available' };
    case 'OUTPATIENT_TREATMENT_FORM':
      return { action: 'EXTRACT_FALLBACK', description: 'Use only if diagnosis missing from other sources' };
    case 'PHARMACY_RECEIPT':
      return { action: 'MEDICATIONS_ONLY', description: 'Use for medication line items if no full invoice' };
    case 'PAYMENT_CONFIRMATION':
    case 'ELIGIBILITY_CHECK_FORM':
    case 'BENEFIT_SCHEDULE':
    case 'HOSPITAL_COVER_LETTER':
    case 'LEMBAR_PENGESAHAN_TPA':
      return { action: 'REFERENCE_ONLY', description: 'Reference only - do not extract financial data' };
    default:
      return { action: 'REFERENCE_ONLY', description: 'Supporting document' };
  }
}

// Quality thresholds per PRD Section 3.2
const QUALITY_THRESHOLDS = {
  HIGH: 85,    // OCR >= 85% - Clean typed document, auto-extract
  MEDIUM: 70,  // OCR 70-84% - Slightly blurry, extract with verification
  LOW: 0       // OCR < 70% - Handwritten or poor quality, manual input required
};

/**
 * Determine quality level from OCR confidence score
 */
export function getQualityLevel(ocrConfidence: number): QualityLevel {
  if (ocrConfidence >= QUALITY_THRESHOLDS.HIGH) return 'HIGH';
  if (ocrConfidence >= QUALITY_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/**
 * Check if a document is a financial document (invoice or kuitansi)
 */
export function isFinancialDocument(doc: ClassifiedDocument): boolean {
  // Check explicit flag first
  if (doc.isFinancialDocument !== undefined) {
    return doc.isFinancialDocument;
  }
  
  // Check by document type
  if (doc.documentType && FINANCIAL_DOCUMENT_TYPES.includes(doc.documentType)) {
    return true;
  }
  
  // Fallback: check by legacy type field
  const lowerType = doc.type?.toLowerCase() || '';
  return lowerType.includes('kwitansi') || 
         lowerType.includes('kuitansi') ||
         lowerType.includes('invoice') ||
         lowerType.includes('tagihan') ||
         lowerType.includes('receipt');
}

/**
 * Check if a document requires manual input
 */
export function requiresManualInput(doc: ClassifiedDocument): boolean {
  // Explicit flag takes precedence
  if (doc.manualInputRequired !== undefined) {
    return doc.manualInputRequired;
  }
  
  const ocrConfidence = doc.ocrConfidence ?? 100;
  const qualityLevel = doc.qualityLevel || getQualityLevel(ocrConfidence);
  const isHandwritten = doc.handwrittenDetected ?? false;
  const isFinancial = isFinancialDocument(doc);
  
  // Financial documents with low quality or handwriting require manual input
  if (isFinancial && (qualityLevel === 'LOW' || isHandwritten)) {
    return true;
  }
  
  // Any document with very low OCR requires manual input
  if (ocrConfidence < 50) {
    return true;
  }
  
  return false;
}

/**
 * Assess overall document quality for a claim
 * This is the main function used for tab routing decisions
 * 
 * KEY LOGIC CHANGE: Only require manual input when NO readable financial docs exist.
 * If at least ONE readable financial doc exists, AI can make decisions even if
 * other docs in the bundle are handwritten.
 */
export function assessClaimDocumentQuality(claim: Claim): DocumentQualityAssessment {
  const documents = claim.documents || [];
  
  // If claim already has assessment from AI, use it
  if (claim.documentQualityAssessment) {
    return claim.documentQualityAssessment;
  }
  
  // Calculate average confidence
  const confidences = documents
    .map(d => d.ocrConfidence)
    .filter((c): c is number => c !== undefined);
  
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 100; // Default to 100 if no confidence data
  
  // Find financial documents
  const financialDocs = documents.filter(isFinancialDocument);
  
  // KEY FIX: Check if AT LEAST ONE readable financial document exists
  // A doc is "readable" if OCR >= 70% AND not handwritten
  const readableFinancialDocs = financialDocs.filter(d => {
    const ocr = d.ocrConfidence ?? 100;
    const isHandwritten = d.handwrittenDetected ?? false;
    return ocr >= QUALITY_THRESHOLDS.MEDIUM && !isHandwritten;
  });
  
  // Also track unreadable ones for informational purposes
  const unreadableFinancialDocs = financialDocs.filter(d => {
    const ocr = d.ocrConfidence ?? 100;
    const isHandwritten = d.handwrittenDetected ?? false;
    return ocr < QUALITY_THRESHOLDS.MEDIUM || isHandwritten;
  });
  
  // Build list of reasons for manual input (informational only)
  const manualInputReasons: string[] = [];
  unreadableFinancialDocs.forEach(doc => {
    const reason = doc.manualInputReason || 
      `${doc.type || 'Dokumen'} ${doc.handwrittenDetected ? 'tulisan tangan' : ''} (OCR ${doc.ocrConfidence ?? 0}%)`;
    manualInputReasons.push(reason);
  });
  
  // Determine overall quality
  let overallQuality: QualityLevel = 'HIGH';
  if (avgConfidence < QUALITY_THRESHOLDS.MEDIUM) {
    overallQuality = 'LOW';
  } else if (avgConfidence < QUALITY_THRESHOLDS.HIGH) {
    overallQuality = 'MEDIUM';
  }
  
  // KEY FIX: Critical docs readable if AT LEAST ONE readable financial doc exists
  // (not requiring ALL to be readable)
  const hasAtLeastOneReadableFinancialDoc = readableFinancialDocs.length > 0;
  const criticalDocsReadable = hasAtLeastOneReadableFinancialDoc || financialDocs.length === 0;
  
  // KEY FIX: Only require manual input if NO readable financial docs exist
  // AND there are unreadable financial docs that might contain essential data
  const allFinancialDocsUnreadable = financialDocs.length > 0 && readableFinancialDocs.length === 0;
  
  return {
    avgConfidence,
    overallQuality,
    hasHandwrittenFinancialDocs: unreadableFinancialDocs.length > 0, // For info only
    requiresManualInput: allFinancialDocsUnreadable, // KEY FIX: only if ALL are unreadable
    manualInputReasons,
    criticalDocsReadable
  };
}

/**
 * Determine if a claim should be routed to Manual Input tab
 * GAP 3 ENHANCED: Uses smart routing based on field completeness
 * 
 * KEY LOGIC:
 * - Only route to Manual Input if AI has LOW CONFIDENCE due to:
 *   1. ALL financial docs are unreadable (handwritten or low OCR)
 *   2. Required fields are ONLY available in unreadable/handwritten docs
 * - If readable docs can provide all required fields → DON'T route to manual
 */
export function shouldRouteToManualInput(claim: Claim): boolean {
  // Check explicit assessment first (legacy compatibility)
  if (claim.documentQualityAssessment?.requiresManualInput) {
    return true;
  }
  
  // GAP 3: Use enhanced smart routing based on field completeness
  // This checks if all required fields are available from readable documents
  const fieldCompleteness = checkFieldCompletenessAndRoute(claim);
  
  // If field completeness check says we need manual input (missing fields only in handwritten docs)
  // then route to manual input
  if (fieldCompleteness.route === 'INPUT_MANUAL') {
    return true;
  }
  
  // KEY FIX: Check if at least one readable financial source exists
  const assessment = assessClaimDocumentQuality(claim);
  
  // If NO readable financial docs exist at all, route to manual
  // (AI can't extract financial data)
  if (!assessment.criticalDocsReadable) {
    return true;
  }
  
  // At least one readable financial doc exists AND all required fields available
  // → NO manual input needed (even if some handwritten docs also exist)
  return false;
}

/**
 * @deprecated Use shouldRouteToManualInput() instead.
 * This legacy function is kept for backwards compatibility but now just calls the main function.
 */
export function shouldRouteToManualInputLegacy(claim: Claim): boolean {
  return shouldRouteToManualInput(claim);
}

/**
 * Check if claim has any low OCR documents (legacy check)
 */
export function hasLowOcrDocuments(claim: Claim): boolean {
  const documents = claim.documents || [];
  return documents.some(d => d.ocrConfidence !== undefined && d.ocrConfidence < 70);
}

/**
 * Check if claim is missing essential data
 */
export function hasMissingEssentialData(claim: Claim): boolean {
  return !claim.patientName || !claim.diagnosis || !claim.amount;
}

/**
 * Get document quality badge info for UI display
 */
export function getDocumentQualityBadge(doc: ClassifiedDocument): {
  label: string;
  color: 'red' | 'orange' | 'green' | 'gray';
  icon: 'handwritten' | 'low-quality' | 'ok' | 'unknown';
} {
  const ocrConfidence = doc.ocrConfidence ?? 100;
  const isHandwritten = doc.handwrittenDetected ?? false;
  
  if (isHandwritten) {
    return {
      label: 'Tulisan Tangan',
      color: 'red',
      icon: 'handwritten'
    };
  }
  
  if (ocrConfidence < 70) {
    return {
      label: `OCR ${ocrConfidence}%`,
      color: 'red',
      icon: 'low-quality'
    };
  }
  
  if (ocrConfidence < 85) {
    return {
      label: `OCR ${ocrConfidence}%`,
      color: 'orange',
      icon: 'ok'
    };
  }
  
  return {
    label: `OCR ${ocrConfidence}%`,
    color: 'green',
    icon: 'ok'
  };
}

/**
 * Get claim quality summary for display
 * 
 * KEY LOGIC: Uses shouldRouteToManualInput() as source of truth.
 * This ensures UI badge matches actual routing decision.
 */
export function getClaimQualitySummary(claim: Claim): {
  status: 'ok' | 'warning' | 'error';
  message: string;
  requiresManualInput: boolean;
} {
  // Use the main routing function as source of truth
  const needsManualInput = shouldRouteToManualInput(claim);
  const assessment = assessClaimDocumentQuality(claim);
  
  // If manual input is needed
  if (needsManualInput) {
    if (!assessment.criticalDocsReadable) {
      return {
        status: 'error',
        message: 'Semua dokumen keuangan tidak terbaca - perlu input manual',
        requiresManualInput: true
      };
    }
    // Field completeness triggered manual input (missing data in handwritten docs)
    return {
      status: 'error',
      message: 'Data penting hanya tersedia di dokumen tulisan tangan',
      requiresManualInput: true
    };
  }
  
  // No manual input needed - check for warnings
  if (assessment.hasHandwrittenFinancialDocs) {
    return {
      status: 'warning',
      message: 'Beberapa dokumen tulisan tangan - dokumen lain dapat dibaca',
      requiresManualInput: false
    };
  }
  
  if (assessment.overallQuality === 'LOW') {
    return {
      status: 'warning',
      message: 'Kualitas dokumen rendah - perlu verifikasi',
      requiresManualInput: false
    };
  }
  
  if (assessment.overallQuality === 'MEDIUM') {
    return {
      status: 'warning',
      message: 'Beberapa dokumen perlu verifikasi',
      requiresManualInput: false
    };
  }
  
  return {
    status: 'ok',
    message: 'Semua dokumen terbaca dengan baik',
    requiresManualInput: false
  };
}

// ============= GAP 2: FINANCIAL DATA SOURCE PRIORITY =============

export interface FinancialDataSourceResult {
  primarySource: ClassifiedDocument | null;
  fallbackSources: ClassifiedDocument[];
  excludedSources: Array<{ document: ClassifiedDocument; reason: string }>;
  extractionStrategy: string;
}

/**
 * GAP 2: Determine which document to use for financial data extraction
 * PRIORITY ORDER:
 * 1. INVOICE_DETAIL (hospital itemized bill) - USE THIS for line items
 * 2. KUITANSI_RECEIPT (official receipt) - FALLBACK for total only
 * 3. PHARMACY_RECEIPT (if neither above) - MEDICATIONS ONLY
 * 
 * NEVER USE:
 * - LEMBAR_PENGESAHAN_TPA (TPA's summary)
 * - ELIGIBILITY_CHECK_FORM (benefit limits)
 * - HOSPITAL_COVER_LETTER (cover letter only)
 */
export function getFinancialDataSource(documents: ClassifiedDocument[]): FinancialDataSourceResult {
  const excluded: Array<{ document: ClassifiedDocument; reason: string }> = [];
  const fallbacks: ClassifiedDocument[] = [];
  let primary: ClassifiedDocument | null = null;
  
  // Filter and categorize documents
  for (const doc of documents) {
    const docType = doc.documentType || classifyDocument(doc.notes || doc.type || '', doc.fileName).documentType;
    
    // Check if this is an excluded source
    if (EXCLUDED_FINANCIAL_SOURCES.includes(docType)) {
      const reasons: Record<string, string> = {
        'LEMBAR_PENGESAHAN_TPA': 'TPA summary, not hospital bill - financial data unreliable',
        'ELIGIBILITY_CHECK_FORM': 'Shows benefit limits, not actual charges',
        'HOSPITAL_COVER_LETTER': 'Cover letter only, amounts in attachments',
        'BENEFIT_SCHEDULE': 'Shows benefit schedule, not actual charges',
        'PAYMENT_CONFIRMATION': 'Bank transfer confirmation, not invoice'
      };
      excluded.push({ document: doc, reason: reasons[docType] || 'Not a valid financial source' });
      continue;
    }
    
    // Priority 1: INVOICE_DETAIL
    if (docType === 'INVOICE_DETAIL' && !primary) {
      primary = doc;
      continue;
    }
    
    // Priority 2: KUITANSI_RECEIPT (fallback)
    if (docType === 'KUITANSI_RECEIPT') {
      if (!primary) {
        primary = doc;
      } else {
        fallbacks.push(doc);
      }
      continue;
    }
    
    // Priority 3: PHARMACY_RECEIPT & SERVICE_RECEIPT (fallback)
    if (docType === 'PHARMACY_RECEIPT' || docType === 'SERVICE_RECEIPT') {
      fallbacks.push(doc);
    }
  }
  
  // Determine extraction strategy
  let strategy = 'No financial documents found';
  if (primary) {
    const primaryType = primary.documentType || 'INVOICE_DETAIL';
    if (primaryType === 'INVOICE_DETAIL') {
      strategy = 'Extract line items and totals from hospital invoice (primary source)';
    } else if (primaryType === 'KUITANSI_RECEIPT') {
      strategy = 'Extract total amount from receipt (invoice not available)';
    }
    if (fallbacks.length > 0) {
      strategy += `. Cross-reference with ${fallbacks.length} fallback document(s)`;
    }
  } else if (fallbacks.length > 0) {
    strategy = `Using fallback sources: ${fallbacks.map(d => d.documentType || d.type).join(', ')}`;
  }
  
  return {
    primarySource: primary,
    fallbackSources: fallbacks,
    excludedSources: excluded,
    extractionStrategy: strategy
  };
}

export interface FinancialConsistencyResult {
  status: 'ACCEPT' | 'WARNING' | 'CRITICAL';
  variance: number;
  variancePercent: number;
  message: string;
  recommendedAmount: number;
  amounts: Array<{ source: string; amount: number }>;
}

/**
 * GAP 2: Validate financial consistency between documents
 * - <1% variance: ACCEPT (rounding), use more precise amount
 * - 1-5% variance: WARNING
 * - >5% variance: CRITICAL
 */
export function validateFinancialConsistency(
  amounts: Array<{ source: string; amount: number }>
): FinancialConsistencyResult {
  if (amounts.length === 0) {
    return {
      status: 'CRITICAL',
      variance: 0,
      variancePercent: 0,
      message: 'No financial amounts to compare',
      recommendedAmount: 0,
      amounts
    };
  }
  
  if (amounts.length === 1) {
    return {
      status: 'ACCEPT',
      variance: 0,
      variancePercent: 0,
      message: 'Single source - accepted',
      recommendedAmount: amounts[0].amount,
      amounts
    };
  }
  
  // Find min and max amounts
  const values = amounts.map(a => a.amount);
  const minAmount = Math.min(...values);
  const maxAmount = Math.max(...values);
  const variance = maxAmount - minAmount;
  const avgAmount = values.reduce((a, b) => a + b, 0) / values.length;
  const variancePercent = avgAmount > 0 ? (variance / avgAmount) * 100 : 0;
  
  // Use the most precise (highest) amount as recommended
  const recommendedAmount = maxAmount;
  
  if (variancePercent < 1) {
    return {
      status: 'ACCEPT',
      variance,
      variancePercent,
      message: `Variance ${variancePercent.toFixed(2)}% acceptable (rounding). Using Rp ${recommendedAmount.toLocaleString()}`,
      recommendedAmount,
      amounts
    };
  }
  
  if (variancePercent <= 5) {
    return {
      status: 'WARNING',
      variance,
      variancePercent,
      message: `WARNING: ${variancePercent.toFixed(2)}% variance between sources. Review recommended.`,
      recommendedAmount,
      amounts
    };
  }
  
  return {
    status: 'CRITICAL',
    variance,
    variancePercent,
    message: `CRITICAL: ${variancePercent.toFixed(2)}% variance detected. Manual verification required.`,
    recommendedAmount,
    amounts
  };
}

// ============= GAP 3: REDUNDANCY DETECTION & SMART ROUTING =============

export interface FieldSource {
  field: RequiredField;
  value: string | number | unknown;
  source: string;
  documentType: DocumentType;
  confidence: number;
}

export interface FieldCompletenessResult {
  route: 'AI_AUTO_REVIEW' | 'INPUT_MANUAL' | 'PENDING';
  routeReason: string;
  populatedFields: FieldSource[];
  missingFields: RequiredField[];
  missingFieldsInHandwritten: RequiredField[];
  prefilledCount: number;
  analystAction: string;
  canProcessCheckpoints: number[];
}

/**
 * GAP 3: Track which document each field was extracted from
 * Creates an audit trail for data provenance
 */
export function trackFieldSources(claim: Claim): FieldSource[] {
  const sources: FieldSource[] = [];
  const documents = claim.documents || [];
  
  // Map claim fields to their likely sources
  const fieldMappings: Array<{
    field: RequiredField;
    getValue: () => unknown;
    likelyDocTypes: DocumentType[];
  }> = [
    { 
      field: 'claim_number', 
      getValue: () => claim.id, 
      likelyDocTypes: ['FORM_KLAIM', 'LEMBAR_PENGESAHAN_TPA'] 
    },
    { 
      field: 'patient_name', 
      getValue: () => claim.patientName, 
      likelyDocTypes: ['FORM_KLAIM', 'DISCHARGE_SUMMARY', 'KARTU_PESERTA', 'KTP'] 
    },
    { 
      field: 'member_id', 
      getValue: () => claim.memberCardNumber || claim.patientId, 
      likelyDocTypes: ['KARTU_PESERTA', 'FORM_KLAIM', 'ELIGIBILITY_CHECK_FORM'] 
    },
    { 
      field: 'policy_number', 
      getValue: () => claim.policyNumber, 
      likelyDocTypes: ['FORM_KLAIM', 'KARTU_PESERTA', 'LEMBAR_PENGESAHAN_TPA'] 
    },
    { 
      field: 'provider_name', 
      getValue: () => claim.provider, 
      likelyDocTypes: ['INVOICE_DETAIL', 'KUITANSI_RECEIPT', 'HOSPITAL_COVER_LETTER'] 
    },
    { 
      field: 'treatment_date', 
      getValue: () => claim.treatmentDate || claim.date, 
      likelyDocTypes: ['INVOICE_DETAIL', 'KUITANSI_RECEIPT', 'DISCHARGE_SUMMARY'] 
    },
    { 
      field: 'total_claimed_amount', 
      getValue: () => claim.amount, 
      likelyDocTypes: ['INVOICE_DETAIL', 'KUITANSI_RECEIPT', 'SERVICE_RECEIPT'] 
    },
    { 
      field: 'diagnosis', 
      getValue: () => claim.diagnosis || (claim.icd10Codes && claim.icd10Codes.length > 0), 
      likelyDocTypes: ['DISCHARGE_SUMMARY', 'OUTPATIENT_TREATMENT_FORM', 'SURAT_DOKTER', 'REFERRAL_LETTER'] 
    },
    { 
      field: 'line_items', 
      getValue: () => claim.items && claim.items.length > 0, 
      likelyDocTypes: ['INVOICE_DETAIL', 'PHARMACY_RECEIPT', 'SERVICE_RECEIPT'] 
    }
  ];
  
  for (const mapping of fieldMappings) {
    const value = mapping.getValue();
    if (value) {
      // Find the most likely source document
      const sourceDoc = documents.find(d => {
        const docType = d.documentType || classifyDocument(d.notes || '', d.fileName).documentType;
        return mapping.likelyDocTypes.includes(docType);
      });
      
      sources.push({
        field: mapping.field,
        value,
        source: sourceDoc?.fileName || sourceDoc?.type || 'AI Extraction',
        documentType: sourceDoc?.documentType || 'UNKNOWN',
        confidence: sourceDoc?.ocrConfidence ? sourceDoc.ocrConfidence / 100 : 0.8
      });
    }
  }
  
  return sources;
}

/**
 * GAP 3: Check field completeness and determine routing
 * Implements smart routing based on actual data availability
 */
export function checkFieldCompletenessAndRoute(claim: Claim): FieldCompletenessResult {
  const documents = claim.documents || [];
  const fieldSources = trackFieldSources(claim);
  
  // Determine which fields are populated
  const populatedFieldNames = new Set(fieldSources.map(s => s.field));
  const missingFields: RequiredField[] = REQUIRED_FIELDS.filter(f => !populatedFieldNames.has(f));
  
  // Identify readable documents (OCR >= 70%, not handwritten)
  const readableDocs = documents.filter(d => {
    const ocrConfidence = d.ocrConfidence ?? 100;
    const isHandwritten = d.handwrittenDetected ?? false;
    return ocrConfidence >= 70 && !isHandwritten;
  });
  
  // Identify handwritten/poor-quality documents
  const handwrittenDocs = documents.filter(d => {
    const ocrConfidence = d.ocrConfidence ?? 100;
    const isHandwritten = d.handwrittenDetected ?? false;
    return ocrConfidence < 70 || isHandwritten;
  });
  
  // Check which missing fields might be in handwritten docs
  const missingFieldsInHandwritten: RequiredField[] = [];
  for (const field of missingFields) {
    for (const doc of handwrittenDocs) {
      const docType = doc.documentType || classifyDocument(doc.notes || '', doc.fileName).documentType;
      const docFields = DOCUMENT_FIELD_MAPPING[docType] || [];
      if (docFields.includes(field)) {
        missingFieldsInHandwritten.push(field);
        break;
      }
    }
  }
  
  // SCENARIO A: All required fields from readable docs
  if (missingFields.length === 0) {
    return {
      route: 'AI_AUTO_REVIEW',
      routeReason: 'All required fields extracted from readable documents. Handwritten docs contain redundant data only.',
      populatedFields: fieldSources,
      missingFields: [],
      missingFieldsInHandwritten: [],
      prefilledCount: fieldSources.length,
      analystAction: 'No manual input needed. Proceed with AI review.',
      canProcessCheckpoints: [0, 1, 2, 3, 4, 5, 6]
    };
  }
  
  // SCENARIO B: Missing fields AND handwritten docs might have them
  if (missingFieldsInHandwritten.length > 0) {
    return {
      route: 'INPUT_MANUAL',
      routeReason: `Missing ${missingFields.length} field(s) that may be in handwritten documents.`,
      populatedFields: fieldSources,
      missingFields,
      missingFieldsInHandwritten,
      prefilledCount: fieldSources.length,
      analystAction: `Pre-filled ${fieldSources.length} fields. Input the following from handwritten docs: ${missingFieldsInHandwritten.join(', ')}`,
      canProcessCheckpoints: [0, 1, 2] // Limited checkpoints until data complete
    };
  }
  
  // SCENARIO C: Missing fields, no handwritten docs that could help
  return {
    route: 'PENDING',
    routeReason: `Missing ${missingFields.length} field(s) not available in any uploaded document.`,
    populatedFields: fieldSources,
    missingFields,
    missingFieldsInHandwritten: [],
    prefilledCount: fieldSources.length,
    analystAction: `Request missing documents from TPA for: ${missingFields.join(', ')}`,
    canProcessCheckpoints: [] // Cannot process until documents received
  };
}

/**
 * Enhanced shouldRouteToManualInput that uses smart routing logic
 * This integrates GAP 3 into the existing routing system
 */
export function shouldRouteToManualInputEnhanced(claim: Claim): {
  shouldRoute: boolean;
  reason: string;
  fieldCompleteness: FieldCompletenessResult;
} {
  const fieldCompleteness = checkFieldCompletenessAndRoute(claim);
  
  // If smart routing says AI_AUTO_REVIEW, check document quality as final gate
  if (fieldCompleteness.route === 'AI_AUTO_REVIEW') {
    // Double-check: are there any critical financial docs that are unreadable?
    const financialSource = getFinancialDataSource(claim.documents || []);
    
    if (financialSource.primarySource) {
      const primaryOcr = financialSource.primarySource.ocrConfidence ?? 100;
      const primaryHandwritten = financialSource.primarySource.handwrittenDetected ?? false;
      
      // If primary financial source is unreadable, still route to manual
      if (primaryOcr < 60 || primaryHandwritten) {
        return {
          shouldRoute: true,
          reason: 'Primary financial document is unreadable or handwritten',
          fieldCompleteness
        };
      }
    }
    
    return {
      shouldRoute: false,
      reason: fieldCompleteness.routeReason,
      fieldCompleteness
    };
  }
  
  // INPUT_MANUAL or PENDING routes go to manual input
  return {
    shouldRoute: fieldCompleteness.route === 'INPUT_MANUAL',
    reason: fieldCompleteness.routeReason,
    fieldCompleteness
  };
}

/**
 * Get routing decision with full explanation for debugging
 */
export function getRoutingDecision(claim: Claim): {
  route: 'AI_AUTO_REVIEW' | 'INPUT_MANUAL' | 'PENDING';
  reason: string;
  details: {
    fieldCompleteness: FieldCompletenessResult;
    financialSource: FinancialDataSourceResult;
    documentQuality: DocumentQualityAssessment;
  };
  log: string[];
} {
  const logs: string[] = [];
  
  logs.push(`[ROUTING] Analyzing claim ${claim.id}`);
  
  // Step 1: Check field completeness
  const fieldCompleteness = checkFieldCompletenessAndRoute(claim);
  logs.push(`[FIELDS] Populated: ${fieldCompleteness.populatedFields.length}/${REQUIRED_FIELDS.length}`);
  logs.push(`[FIELDS] Missing: ${fieldCompleteness.missingFields.join(', ') || 'none'}`);
  
  // Step 2: Check financial sources
  const financialSource = getFinancialDataSource(claim.documents || []);
  logs.push(`[FINANCIAL] Primary source: ${financialSource.primarySource?.documentType || 'none'}`);
  logs.push(`[FINANCIAL] Excluded: ${financialSource.excludedSources.map(e => e.document.documentType).join(', ') || 'none'}`);
  
  // Step 3: Check document quality
  const documentQuality = assessClaimDocumentQuality(claim);
  logs.push(`[QUALITY] Average OCR: ${documentQuality.avgConfidence}%`);
  logs.push(`[QUALITY] Handwritten financial: ${documentQuality.hasHandwrittenFinancialDocs}`);
  
  // Determine final route
  let route: 'AI_AUTO_REVIEW' | 'INPUT_MANUAL' | 'PENDING' = fieldCompleteness.route;
  let reason = fieldCompleteness.routeReason;
  
  // Override if document quality is poor despite having all fields
  if (route === 'AI_AUTO_REVIEW' && !documentQuality.criticalDocsReadable) {
    route = 'INPUT_MANUAL';
    reason = 'All fields present but critical financial documents are unreadable';
    logs.push(`[OVERRIDE] Changed to INPUT_MANUAL due to unreadable financial docs`);
  }
  
  logs.push(`[DECISION] Route: ${route}`);
  logs.push(`[DECISION] Reason: ${reason}`);
  
  return {
    route,
    reason,
    details: {
      fieldCompleteness,
      financialSource,
      documentQuality
    },
    log: logs
  };
}
