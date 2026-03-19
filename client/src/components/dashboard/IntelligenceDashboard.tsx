import { useMemo } from "react";
import { Claim } from "@shared/schema";
import { formatRupiah } from "@/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";

// Calculate simplified dashboard metrics
const calculateDashboardMetrics = (processedClaims: Claim[]) => {
  const totalClaimsCount = processedClaims.length;
  const totalClaimsAmount = processedClaims.reduce((sum, c) => sum + c.amount, 0);
  
  // 1. Perlu Perhatianmu - Count claims that need attention/manual validation
  const claimsNeedingAttention = processedClaims.filter(c => {
    // Has fraud risks
    const hasFraudRisks = c.fraudRisks && c.fraudRisks.length > 0;
    
    // Has overpricing
    const hasOverpricing = c.analysis?.priceAnalysis?.some(p => p.flag === 'OVERPRICED');
    
    // Has high risk score
    const hasHighRisk = c.riskScore && c.riskScore >= 50;
    
    // Has recommendations for claims
    const hasRecommendations = c.recommendations?.forClaims && c.recommendations.forClaims.length > 0;
    
    return hasFraudRisks || hasOverpricing || hasHighRisk || hasRecommendations;
  }).length;
  
  // 2. Total Revisi Klaim - Total amount revised/avoided
  const overpricingAmount = processedClaims.reduce((sum, c) => {
    if (c.analysis?.priceAnalysis) {
      return sum + c.analysis.priceAnalysis
        .filter(p => p.flag === 'OVERPRICED')
        .reduce((s, p) => s + (p.chargedPrice - p.marketPrice), 0);
    }
    return sum;
  }, 0);
  
  const fraudAmount = processedClaims.reduce((sum, c) => {
    const fraudRiskAmount = c.fraudRisks?.reduce((riskSum, risk) => 
      riskSum + (risk.estimatedOvercharge || 0), 0
    ) || 0;
    
    return sum + fraudRiskAmount;
  }, 0);
  
  const unnecessaryAmount = processedClaims.reduce((sum, c) => {
    const unnecessaryRecommendations = c.recommendations?.forClaims?.filter(rec => 
      rec.action.toLowerCase().includes('unnecessary') ||
      rec.action.toLowerCase().includes('reduce') ||
      rec.reason.toLowerCase().includes('unnecessary') ||
      rec.reason.toLowerCase().includes('excessive')
    ) || [];
    
    const unnecessarySavings = unnecessaryRecommendations.reduce((total, rec) => 
      total + (rec.potentialSavings || 0), 0
    );
    
    const unnecessaryFraudRisks = c.fraudRisks?.filter(risk =>
      risk.type.toLowerCase().includes('unnecessary') ||
      risk.description.toLowerCase().includes('unnecessary') ||
      risk.description.toLowerCase().includes('excessive')
    ) || [];
    
    const unnecessaryFraudAmount = unnecessaryFraudRisks.reduce((total, risk) => 
      total + (risk.estimatedOvercharge || 0), 0
    );
    
    return sum + unnecessarySavings + unnecessaryFraudAmount;
  }, 0);

  const totalRevisiKlaim = overpricingAmount + fraudAmount + unnecessaryAmount;
  
  // Calculate percentages
  const attentionPercentage = totalClaimsCount > 0 
    ? Math.round((claimsNeedingAttention / totalClaimsCount) * 100) 
    : 0;
  
  const revisionPercentage = totalClaimsAmount > 0 
    ? Math.round((totalRevisiKlaim / totalClaimsAmount) * 100) 
    : 0;
  
  return {
    totalClaimsCount,
    totalClaimsAmount,
    claimsNeedingAttention,
    totalRevisiKlaim,
    attentionPercentage,
    revisionPercentage
  };
};

interface IntelligenceDashboardProps {
  processedClaims: Claim[];
}

export default function IntelligenceDashboard({ processedClaims }: IntelligenceDashboardProps) {
  const metrics = useMemo(() => calculateDashboardMetrics(processedClaims), [processedClaims]);

  return (
    <Card className="shadow-sm border border-slate-200 mb-6">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          <i className="fas fa-chart-line mr-2 text-primary"></i>
          Ringkasan Klaim
        </h3>
        
        {/* Key Metrics - 2 Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* 1. Klaim Memerlukan Perhatian */}
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <div className="text-xs font-medium text-gray-600 mb-2">
              Klaim Memerlukan Perhatian
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-orange-600" data-testid="text-claims-attention">
                {metrics.claimsNeedingAttention}
              </div>
              <div className="text-lg font-semibold text-orange-500">
                ({metrics.attentionPercentage}%)
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              vs. {metrics.totalClaimsCount} total kasus klaim
            </div>
          </div>

          {/* 2. Total Klaim Terindikasi */}
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="text-xs font-medium text-gray-600 mb-2">
              Total Klaim Terindikasi
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-green-600" data-testid="text-claims-revision">
                {formatRupiah(metrics.totalRevisiKlaim)}
              </div>
              <div className="text-lg font-semibold text-green-500">
                ({metrics.revisionPercentage}%)
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              vs. {formatRupiah(metrics.totalClaimsAmount)} total keseluruhan klaim
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
