// Remove claude api import and use backend API instead

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

interface ProcessingResult {
  provider?: string;
  date?: string;
  patientId?: string;
  patientName?: string;
  diagnosis?: string;
  icd10?: string;
  amount?: number;
  serviceType?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  fraudRisks?: Array<{
    type: string;
    item?: string;
    description: string;
    severity: string;
    estimatedOvercharge?: number;
  }>;
  errors?: string[];
  originalFileBase64?: string;
  fileMimeType?: string;
  // New comprehensive analysis fields
  analysis?: {
    priceAnalysis?: Array<{
      item: string;
      chargedPrice: number;
      marketPrice: number;
      flag: 'NORMAL' | 'OVERPRICED' | 'UNDERPRICED';
      source: string;
    }>;
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
    patterns?: string[];
  };
  recommendations?: {
    forClaims?: Array<{
      action: string;
      reason: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      potentialSavings?: number;
    }>;
    forUnderwriting?: Array<{
      action: string;
      reason: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      potentialSavings?: number;
    }>;
    forActuarial?: Array<{
      action: string;
      reason: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  alerts?: Array<{
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
  }>;
  totalOvercharge?: number;
  hasIssues?: boolean;
}

// Process Claude's comprehensive response
const processClaudeResponse = (claudeResponse: any) => {
  console.log('🔍 FRONTEND PROCESSING - Raw backend response:', claudeResponse);
  console.log('🔍 FRONTEND PROCESSING - Recommendations field:', claudeResponse.recommendations);
  console.log('🔍 FRONTEND PROCESSING - checkpointStatuses:', claudeResponse.checkpointStatuses);
  console.log('🔍 FRONTEND PROCESSING - memberStatus:', claudeResponse.memberStatus);
  console.log('🔍 FRONTEND PROCESSING - submissionDate:', claudeResponse.submissionDate);
  
  // Backend now returns fields directly (no extractedData wrapper)
  return {
    ...claudeResponse,
    // Ensure recommendations are properly passed through
    recommendations: claudeResponse.recommendations || {},
    analysis: claudeResponse.analysis || {},
    alerts: claudeResponse.alerts || [],
    riskScore: claudeResponse.analysis?.riskScore,
    hasIssues: claudeResponse.analysis?.riskScore !== 'LOW'
  };
};

export async function processFile(file: File): Promise<ProcessingResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate file type
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type. Please upload PDF, JPG, or JPEG files only.`);
  }

  // Convert file to base64
  const base64Data = await fileToBase64(file);

  // Send to backend API
  const response = await fetch('/api/process-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data: base64Data,
      mimeType: file.type,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();
  const processedResult = processClaudeResponse(result);
  
  return {
    ...processedResult,
    originalFileBase64: result.originalFileBase64,
    fileMimeType: file.type,
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!result) {
        reject(new Error('FileReader returned empty result'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to extract base64 from file'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function convertPdfToImage(file: File): Promise<string> {
  // For now, send PDF directly to backend and let Claude handle it
  // This bypasses client-side PDF.js issues
  const base64 = await fileToBase64(file);
  return base64;
}

export function validateFileType(file: File): boolean {
  return ACCEPTED_MIME_TYPES.includes(file.type);
}

export const ACCEPTED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg'];
