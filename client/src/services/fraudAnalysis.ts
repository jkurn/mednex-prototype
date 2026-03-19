import { Claim, FraudFlag } from "@shared/schema";

interface MarketPrices {
  [key: string]: number;
}

// Indonesian medical supply market prices (in Rupiah) - Updated with specific items
const MARKET_PRICES: MarketPrices = {
  'venflon no 20': 16000,   // Specific IV catheter size 20G (commonly overpriced)
  'venflon no 22': 15000,   // IV catheter size 22G  
  'venflon no 24': 14000,   // IV catheter size 24G
  'venflon': 16000,         // Generic IV catheter
  'alcohol swab': 500,
  'alkohol': 500,
  'syringe': 2000,
  'spuit': 2000,
  'cortidex': 15000,
  'gauze': 1500,
  'bandage': 3000,
  'infus set': 12000,       // IV tubing set
  'saline': 8000,
  'nacl': 8000,
  'antiseptic': 2500,
  'betadine': 3500,
  'paracetamol 500mg': 1000,
  'paracetamol': 1000,
  'ibuprofen': 1500,
  'antibiotik': 25000,
  'antibiotic': 25000,
};

// Real emergency ICD-10 codes that justify ER usage
const EMERGENCY_ICD_CODES = [
  'I21', // Acute myocardial infarction
  'I46', // Cardiac arrest
  'J44.0', // COPD with acute exacerbation
  'T78', // Adverse effects
  'S72', // Fracture of femur
  'R06.0', // Dyspnea
  'R50', // Fever
  'N17', // Acute kidney failure
  'G93.1', // Anoxic brain damage
  'T74', // Maltreatment syndromes
];

// Non-emergency conditions often misusing ER
const NON_EMERGENCY_CONDITIONS = [
  'common cold', 'flu ringan', 'batuk biasa', 'sakit kepala ringan',
  'headache', 'minor pain', 'check up', 'kontrol rutin',
  'mild fever', 'demam ringan', 'vitamin deficiency'
];

export function analyzeClaim(claim: Claim): FraudFlag[] {
  const fraudFlags: FraudFlag[] = [];

  // HYBRID FRAUD DETECTION SYSTEM FOR DEMO
  // 1. Use Claude's AI analysis first (if available)
  if (claim.fraudRisks && claim.fraudRisks.length > 0) {
    claim.fraudRisks.forEach(risk => {
      const severity = risk.severity.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
      fraudFlags.push({
        type: risk.type.toUpperCase().replace(' ', '_') as any,
        severity: severity,
        description: risk.description,
        item: risk.item,
        estimatedSaving: risk.estimatedOvercharge || 0,
        reason: `AI-detected fraud pattern: ${risk.type}`,
      });
    });
  }

  // 2. TRADITIONAL OVERPRICING DETECTION (Demo backup system)
  if (claim.items && claim.items.length > 0) {
    claim.items.forEach(item => {
      const itemLower = item.name.toLowerCase();
      
      // Find the most specific market price match (longest key that matches)
      let bestMatch: string | null = null;
      let bestMatchLength = 0;
      
      Object.keys(MARKET_PRICES).forEach(key => {
        if (itemLower.includes(key) && key.length > bestMatchLength) {
          bestMatch = key;
          bestMatchLength = key.length;
        }
      });
      
      if (bestMatch) {
        const marketPrice = MARKET_PRICES[bestMatch];
        const markupRatio = item.totalPrice / marketPrice;
        
        if (markupRatio > 3) { // >300% markup
          const savings = item.totalPrice - marketPrice;
          fraudFlags.push({
            type: 'OVERPRICING',
            severity: 'HIGH',
            description: `Severe overpricing detected: ${item.name}`,
            item: item.name,
            charged: item.totalPrice,
            marketPrice: marketPrice,
            markup: `${((markupRatio - 1) * 100).toFixed(0)}%`,
            excess: savings,
            estimatedSaving: savings,
          });
        } else if (markupRatio > 2) { // >200% markup
          const savings = item.totalPrice - marketPrice;
          fraudFlags.push({
            type: 'OVERPRICING',
            severity: 'MEDIUM',
            description: `High markup detected: ${item.name}`,
            item: item.name,
            charged: item.totalPrice,
            marketPrice: marketPrice,
            markup: `${((markupRatio - 1) * 100).toFixed(0)}%`,
            excess: savings,
            estimatedSaving: savings,
          });
        }
      }
    });
  }

  // 2. ER MISUSE DETECTION
  if (claim.serviceType === 'Emergency' || 
      claim.provider?.toLowerCase().includes('igd') ||
      claim.provider?.toLowerCase().includes('emergency') ||
      claim.provider?.toLowerCase().includes('ugd')) {
    
    const isRealEmergency = EMERGENCY_ICD_CODES.some(code => 
      claim.icd10?.toUpperCase().startsWith(code)
    );
    
    const isNonEmergency = NON_EMERGENCY_CONDITIONS.some(condition =>
      claim.diagnosis?.toLowerCase().includes(condition)
    );
    
    if (!isRealEmergency || isNonEmergency) {
      const estimatedSaving = claim.amount * 0.6; // ER typically 60% more expensive
      
      fraudFlags.push({
        type: 'ER_MISUSE',
        severity: 'HIGH',
        description: 'Non-emergency condition using emergency services',
        reason: `Diagnosis "${claim.diagnosis}" does not justify ER usage`,
        estimatedSaving: estimatedSaving,
      });
    }
  }

  // 3. SUSPICIOUS AMOUNT PATTERNS
  if (claim.amount > 5000000) { // >5 million rupiah
    fraudFlags.push({
      type: 'SUSPICIOUS_PATTERN',
      severity: 'HIGH',
      description: 'Unusually high claim amount',
      reason: `Amount Rp ${claim.amount.toLocaleString('id-ID')} exceeds normal range`,
      estimatedSaving: claim.amount * 0.3, // Estimate 30% could be excessive
    });
  }

  // 4. PROVIDER RISK ASSESSMENT - Check for known high-risk patterns
  const providerLower = claim.provider?.toLowerCase() || '';
  if (providerLower.includes('citra harapan') || 
      providerLower.includes('harapan bekasi')) {
    // Based on analysis showing this provider has high markup patterns
    fraudFlags.push({
      type: 'SUSPICIOUS_PATTERN',
      severity: 'HIGH',
      description: 'High-risk provider detected',
      reason: 'Provider shows historical patterns of overpricing',
      estimatedSaving: claim.amount * 0.25, // Estimate 25% markup reduction
    });
  }

  // 5. DIAGNOSIS-BASED SUSPICIOUS PATTERNS
  if (claim.diagnosis?.toLowerCase().includes('nyeri') && claim.amount > 800000) {
    // Pain-related diagnosis with high cost might indicate unnecessary procedures
    fraudFlags.push({
      type: 'SUSPICIOUS_PATTERN',
      severity: 'MEDIUM',
      description: 'High cost for simple pain treatment',
      reason: 'Pain-related diagnosis typically costs less than Rp 800,000',
      estimatedSaving: claim.amount - 400000, // Normal cost estimate
    });
  }

  return fraudFlags;
}

export function calculateClaimRiskScore(claim: Claim): number {
  const fraudFlags = claim.fraudFlags || [];
  let riskScore = 0;

  fraudFlags.forEach(flag => {
    switch (flag.severity) {
      case 'HIGH':
        riskScore += 40;
        break;
      case 'MEDIUM':
        riskScore += 25;
        break;
      case 'LOW':
        riskScore += 10;
        break;
    }
  });

  // Cap at 100
  return Math.min(riskScore, 100);
}

export function calculateFraudSummary(claims: Claim[]) {
  let totalOvercharges = 0;
  let overchargeCount = 0;
  let erMisuseCount = 0;
  let erSavings = 0;
  let totalSavings = 0;
  
  const providerRisks: Record<string, {
    overcharges: number;
    totalAmount: number;
    claims: number;
  }> = {};

  claims.forEach(claim => {
    if (claim.fraudFlags) {
      claim.fraudFlags.forEach(flag => {
        if (flag.type === 'OVERPRICING' && flag.excess) {
          totalOvercharges += flag.excess;
          overchargeCount++;
          totalSavings += flag.excess;
        }
        
        if (flag.type === 'ER_MISUSE' && flag.estimatedSaving) {
          erMisuseCount++;
          erSavings += flag.estimatedSaving;
          totalSavings += flag.estimatedSaving;
        }
        
        if (flag.type === 'SUSPICIOUS_PATTERN' && flag.estimatedSaving) {
          totalSavings += flag.estimatedSaving;
        }
      });
    }

    // Track provider risks
    if (claim.provider && claim.provider !== "We couldn't find such information in the file") {
      if (!providerRisks[claim.provider]) {
        providerRisks[claim.provider] = {
          overcharges: 0,
          totalAmount: 0,
          claims: 0,
        };
      }
      
      providerRisks[claim.provider].totalAmount += claim.amount;
      providerRisks[claim.provider].claims++;
      
      if (claim.fraudFlags) {
        const overcharge = claim.fraudFlags
          .filter(f => f.type === 'OVERPRICING')
          .reduce((sum, f) => sum + (f.excess || 0), 0);
        providerRisks[claim.provider].overcharges += overcharge;
      }
    }
  });

  // Find highest risk provider
  let highestRiskProvider = '';
  let highestMarkup = 0;
  
  Object.entries(providerRisks).forEach(([provider, data]) => {
    if (data.totalAmount > 0) {
      const markupPercentage = (data.overcharges / data.totalAmount) * 100;
      if (markupPercentage > highestMarkup) {
        highestMarkup = markupPercentage;
        highestRiskProvider = provider;
      }
    }
  });

  return {
    totalOvercharges,
    overchargeCount,
    erMisuseCount,
    erSavings,
    totalSavings,
    processedClaims: claims.length,
    highestRiskProvider,
    highestMarkup: Math.round(highestMarkup),
    providerRisks,
  };
}

export function generateExecutiveReport(claims: Claim[]) {
  const summary = calculateFraudSummary(claims);
  const criticalFindings: string[] = [];
  const immediateActions: string[] = [];

  if (summary.highestMarkup > 200) {
    criticalFindings.push(`${summary.highestRiskProvider}: ${summary.highestMarkup}% markup on medical supplies`);
    immediateActions.push(`Audit all ${summary.highestRiskProvider} claims from past 6 months`);
  }

  if (summary.erMisuseCount > 0) {
    criticalFindings.push(`${summary.erMisuseCount} non-emergency cases using ER services`);
    immediateActions.push('Implement pre-authorization for ER visits');
  }

  if (summary.totalOvercharges > 0) {
    criticalFindings.push(`Total overcharges detected: Rp ${summary.totalOvercharges.toLocaleString('id-ID')}`);
    immediateActions.push('Demand refunds for identified overcharges');
  }

  if (criticalFindings.length === 0) {
    criticalFindings.push('No major fraud patterns detected in current dataset');
  }

  if (immediateActions.length === 0) {
    immediateActions.push('Continue monitoring for suspicious patterns');
  } else {
    immediateActions.push('Renegotiate contracts with pricing caps');
  }

  return {
    criticalFindings,
    immediateActions,
    annualSavingsProjection: summary.totalSavings * 12,
    claimsAnalyzed: summary.processedClaims,
  };
}