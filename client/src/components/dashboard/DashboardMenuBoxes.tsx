import { useMemo } from "react";
import { Link } from "wouter";
import { Claim } from "@shared/schema";
import { Zap, Clock, FileEdit, ArrowRight, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to derive final status from reviewDecision.finalDecision (source of truth)
const getFinalStatus = (claim: Claim): 'Approve' | 'Approve Sebagian' | 'Tolak' | null => {
  // PRIMARY SOURCE: reviewDecision.finalDecision - this is what analysts see/edit
  const finalDecision = claim.reviewDecision?.finalDecision;
  if (finalDecision) {
    if (finalDecision === 'TOLAK') return 'Tolak';
    if (finalDecision === 'SETUJUI PARTIAL') return 'Approve Sebagian';
    if (finalDecision === 'SETUJU') return 'Approve';
  }
  
  // SECONDARY: Check member validation failures
  if (claim.memberStatus === 'TIDAK DITEMUKAN' || claim.memberStatus === 'TIDAK AKTIF') {
    return 'Tolak';
  }
  
  // TERTIARY: Check checkpoint status failures
  if (claim.checkpointStatuses?.validitasPeserta === 'failed') {
    return 'Tolak';
  }
  if (claim.checkpointStatuses?.keputusanAkhir === 'failed') {
    return 'Tolak';
  }
  
  // FALLBACK: adjudicationResult (legacy)
  return claim.adjudicationResult || null;
};

// Helper: Check if claim needs manual input (matches needs-attention.tsx logic)
const shouldRouteToManualInput = (c: Claim): boolean => {
  // Clear rejection cases go to AI Auto-Review, not Manual Input
  const isClearRejection = 
    c.memberStatus === 'TIDAK DITEMUKAN' || 
    (c as any).memberValidation?.autoReject === true ||
    (c.adjudicationResult === 'Tolak' && (c as any).memberValidation?.passed === false);
  
  if (isClearRejection) return false;
  
  // Check document quality assessment
  if ((c as any).documentQualityAssessment?.requiresManualInput) return true;
  
  const hasLowOcr = c.documents?.some(d => d.ocrConfidence && d.ocrConfidence < 70);
  const hasMissingData = !c.patientName || !c.diagnosis || !c.amount;
  return hasLowOcr || hasMissingData;
};

// Calculate metrics for the 3 action cards
const calculateMetrics = (processedClaims: Claim[]) => {
  const totalClaimsCount = processedClaims.length;
  
  // Input Manual FIRST (priority routing) - matches needs-attention.tsx
  const manualInputClaims = processedClaims.filter(c => shouldRouteToManualInput(c));
  const manualInputIds = new Set(manualInputClaims.map(c => c.id));
  
  // AI Auto-Review: Claims with AI analysis that are NOT in manual input
  // This MUST match the needs-attention.tsx logic exactly
  const aiAutoReviewClaims = processedClaims.filter(c => {
    // Must have AI analysis completed
    const hasAnalysis = c.analysis && c.checkpointStatuses;
    // Must NOT need manual input
    const needsManualInput = manualInputIds.has(c.id);
    return hasAnalysis && !needsManualInput;
  });
  
  // Breakdown for AI Auto-Review - use derived status from checkpoints
  const approvedClaims = aiAutoReviewClaims.filter(c => 
    getFinalStatus(c) === 'Approve'
  ).length;
  const partialApprovedClaims = aiAutoReviewClaims.filter(c => 
    getFinalStatus(c) === 'Approve Sebagian'
  ).length;
  const rejectedClaims = aiAutoReviewClaims.filter(c => 
    getFinalStatus(c) === 'Tolak'
  ).length;
  
  // Pending: Claims that have been pending for >2 days or SLA critical
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const pendingClaims = processedClaims.filter(c => {
    const claimDate = new Date(c.date);
    const isPendingLong = claimDate < twoDaysAgo && !c.adjudicationResult;
    const isHighValue = (c.amount || 0) > 5000000;
    return isPendingLong || (isHighValue && !c.adjudicationResult);
  });
  
  // Breakdown for Pending
  const highValuePending = pendingClaims.filter(c => (c.amount || 0) > 5000000).length;
  const slaCritical = pendingClaims.filter(c => {
    const claimDate = new Date(c.date);
    const hoursSinceSubmission = (Date.now() - claimDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceSubmission > 44; // Less than 4 hours to SLA (assuming 48h SLA)
  }).length;
  
  return {
    totalClaimsCount,
    aiAutoReview: {
      count: aiAutoReviewClaims.length,
      approved: approvedClaims,
      partialApproved: partialApprovedClaims,
      rejected: rejectedClaims,
    },
    pending: {
      count: pendingClaims.length,
      highValue: highValuePending,
      slaCritical: slaCritical,
    },
    manualInput: {
      count: manualInputClaims.length,
    },
  };
};

interface DashboardMenuBoxesProps {
  processedClaims: Claim[];
}

export default function DashboardMenuBoxes({ processedClaims }: DashboardMenuBoxesProps) {
  const metrics = useMemo(() => calculateMetrics(processedClaims), [processedClaims]);

  const saveScrollPosition = () => {
    sessionStorage.setItem('dashboardScrollPosition', window.scrollY.toString());
  };

  return (
    <Card className="shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Perlu Perhatianmu</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: AI Auto-Review */}
        <TooltipProvider delayDuration={0}>
          <Card className="border border-slate-200 h-full">
            <div className="p-5 flex flex-col h-full">
              {/* Icon */}
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-slate-600" />
              </div>
              
              {/* Title with Tooltip */}
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">AI Auto-Review</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Klaim-klaim ini sudah di-review secara otomatis oleh AI. Silahkan kamu buka untuk verifikasi manual atau revisi hasil reviewnya.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Subtitle */}
              <p className="text-xs text-slate-500 mb-3">Hasil review otomatis Strator AI</p>
              
              {/* Count */}
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {metrics.aiAutoReview.count} <span className="text-lg font-medium">Klaim</span>
              </div>
              
              {/* Details */}
              <div className="space-y-1.5 mb-4 flex-grow">
                {metrics.aiAutoReview.approved > 0 && (
                  <p className="text-xs text-slate-600">• {metrics.aiAutoReview.approved} Klaim di Approve</p>
                )}
                {metrics.aiAutoReview.partialApproved > 0 && (
                  <p className="text-xs text-slate-600">• {metrics.aiAutoReview.partialApproved} Klaim di Approve sebagian</p>
                )}
                {metrics.aiAutoReview.rejected > 0 && (
                  <p className="text-xs text-slate-600">• {metrics.aiAutoReview.rejected} Klaim Ditolak</p>
                )}
              </div>
              
              {/* CTA Button */}
              <Link 
                href="/needs-attention?tab=ai_auto_review"
                onClick={saveScrollPosition}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="button-view-ai-auto-review"
              >
                Lihat <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </TooltipProvider>

        {/* Card 2: Pending */}
        <TooltipProvider delayDuration={0}>
          <Card className="border border-slate-200 h-full">
            <div className="p-5 flex flex-col h-full">
              {/* Icon */}
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              
              {/* Title with Tooltip */}
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">Pending</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Klaim-klaim mendesak yang belum terproses lebih dari 2 hari atau mendekati batas SLA. Pastikan segera kamu review agar tidak melebihi SLA.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Subtitle */}
              <p className="text-xs text-slate-500 mb-3">Sudah &gt;2 hari pending</p>
              
              {/* Count */}
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {metrics.pending.count} <span className="text-lg font-medium">Klaim</span>
              </div>
              
              {/* Details */}
              <div className="space-y-1.5 mb-4 flex-grow">
                {metrics.pending.highValue > 0 && (
                  <p className="text-xs text-slate-600">• {metrics.pending.highValue} Klaim yang lebih dari Rp5jt</p>
                )}
                {metrics.pending.slaCritical > 0 && (
                  <p className="text-xs text-slate-600">• {metrics.pending.slaCritical} Klaim SLA &lt; 4 jam tersisa</p>
                )}
              </div>
              
              {/* CTA Button */}
              <Link 
                href="/needs-attention?tab=pending"
                onClick={saveScrollPosition}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="button-view-pending"
              >
                Lihat <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </TooltipProvider>

        {/* Card 3: Input Manual */}
        <TooltipProvider delayDuration={0}>
          <Card className="border border-slate-200 h-full">
            <div className="p-5 flex flex-col h-full">
              {/* Icon */}
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <FileEdit className="w-5 h-5 text-slate-600" />
              </div>
              
              {/* Title with Tooltip */}
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">Input Manual</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Klaim-klaim ini memerlukan input manualmu karena dokumen klaim tidak terbaca dengan jelas. Bantu lengkapi data sekarang agar dapat segera di proses oleh Strator.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Subtitle */}
              <p className="text-xs text-slate-500 mb-3">Memerlukan validasi manual</p>
              
              {/* Count */}
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {metrics.manualInput.count} <span className="text-lg font-medium">Klaim</span>
              </div>
              
              {/* Empty space for consistency */}
              <div className="flex-grow"></div>
              
              {/* CTA Button */}
              <Link 
                href="/needs-attention?tab=manual_input"
                onClick={saveScrollPosition}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="button-view-manual-input"
              >
                Lihat <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </TooltipProvider>
      </div>
    </Card>
  );
}
