import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { X, Save, CheckCircle, AlertTriangle, Clock, Circle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, Loader2, Undo2, RotateCcw, ArrowRight, ZoomIn, ZoomOut, Download, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Claim } from "@shared/schema";
import { useClaimsData } from "@/hooks/useClaimsData";
import { formatDateIndonesian, formatRupiah, calculateAge, parseDDMMYYYY } from "@/utils/formatters";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { GenderTag, BenefitCategoryTag, RelationshipTag, StatusTag, MemberStatusTag } from "@/components/ui/tags";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckpointPengecualianPolis } from "@/components/claim-review/CheckpointPengecualianPolis";
import { CheckpointAnalisisKlaim } from "@/components/claim-review/CheckpointAnalisisKlaim";
import { CheckpointBatasManfaat } from "@/components/claim-review/CheckpointBatasManfaat";
import { ClaimPdfViewer, PdfViewerHandle, PdfViewerState } from "@/components/claim-review/ClaimPdfViewer";
import { HeroClaimSummary, getRecommendedAmount } from "@/components/claim-review/HeroClaimSummary";
import { exportClaimReport } from "@/services/pdfExport";
import { useToast } from "@/hooks/use-toast";
import { getStatusTag, getTagColorClass } from "@/utils/checkpointHelpers";

type CheckpointStatus = 'passed' | 'failed' | 'pending' | 'in-progress';

interface CheckpointState {
  validitasPeserta: CheckpointStatus;
  kelengkapanDokumen: CheckpointStatus;
  ketepatanWaktu: CheckpointStatus;
  pengecualianPolis: CheckpointStatus;
  analisisKlaim: CheckpointStatus;
  batasManfaat: CheckpointStatus;
  keputusanAkhir: CheckpointStatus;
}

// Timeline Visualization Component
function TimelineVisualization({ treatmentDate, submissionDate, deadlineDate, daysBetween, isOnTime }: {
  treatmentDate: Date;
  submissionDate: Date;
  deadlineDate: Date;
  daysBetween: number;
  isOnTime: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-6">
      <div className="relative pb-12 px-8">
        {/* Horizontal line */}
        <div className="absolute left-8 right-8 h-px bg-slate-300 top-16" />
        
        {/* SVG for indicator bracket lines - inside padded area */}
        <svg className="absolute pointer-events-none" style={{ left: '32px', right: '32px', top: 0, height: '170px', width: 'calc(100% - 64px)', zIndex: 0 }}>
          <line 
            x1="16.66%" y1="70" 
            x2="16.66%" y2="161" 
            stroke={isOnTime ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
            strokeWidth="2"
          />
          <line 
            x1="16.66%" y1="161" 
            x2="50%" y2="161" 
            stroke={isOnTime ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
            strokeWidth="2"
          />
          <line 
            x1="50%" y1="70" 
            x2="50%" y2="161" 
            stroke={isOnTime ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
            strokeWidth="2"
          />
        </svg>
        
        {/* Timeline points */}
        <div className="relative h-full flex justify-between">
          {/* Discharge point */}
          <div className="flex-1 relative flex flex-col items-center">
            <div className="text-sm font-medium text-slate-900 mb-1">
              {formatDateIndonesian(treatmentDate.toISOString())}
            </div>
            <div className="text-xs text-slate-600">Selesai Perawatan</div>
            <div className="w-3 h-3 bg-slate-700 rounded-full absolute z-10" style={{ top: '58px', left: '50%', transform: 'translateX(-50%)' }} />
          </div>
          
          {/* Claim submission point */}
          <div className="flex-1 relative flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full absolute z-10 ${isOnTime ? 'bg-green-500' : 'bg-red-500'}`} style={{ top: '58px', left: '50%', transform: 'translateX(-50%)' }} />
            <div className="relative z-10 bg-white px-1 text-center" style={{ marginTop: '82px' }}>
              <div className="text-xs text-slate-600 mb-1">Klaim Diajukan</div>
              <div className="text-sm font-medium text-slate-900">
                {formatDateIndonesian(submissionDate.toISOString())}
              </div>
            </div>
          </div>
          
          {/* Deadline point */}
          <div className="flex-1 relative flex flex-col items-center">
            <div className="text-sm font-medium text-slate-900 mb-1">
              {formatDateIndonesian(deadlineDate.toISOString())}
            </div>
            <div className="text-xs text-slate-600">Batas Akhir</div>
            <div className="w-3 h-3 bg-slate-700 rounded-full absolute z-10" style={{ top: '58px', left: '50%', transform: 'translateX(-50%)' }} />
          </div>
          
          {/* Duration badge */}
          <div className="absolute z-10" style={{ top: '161px', left: '33.33%', transform: 'translate(-50%, -50%)' }}>
            <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${isOnTime ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {daysBetween} hari
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClaimReview() {
  const [, params] = useRoute("/klaim/:id");
  const [, navigate] = useLocation();
  const { claims, dataLoaded } = useClaimsData();
  const [isSaving, setIsSaving] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [checkpointStatuses, setCheckpointStatuses] = useState<CheckpointState>({
    validitasPeserta: 'pending',
    kelengkapanDokumen: 'pending',
    ketepatanWaktu: 'pending',
    pengecualianPolis: 'pending',
    analisisKlaim: 'pending',
    batasManfaat: 'pending',
    keputusanAkhir: 'pending',
  });
  const [policyExclusionJustification, setPolicyExclusionJustification] = useState('');
  const [finalDecisionJustification, setFinalDecisionJustification] = useState('');
  const [revisedClaimAmount, setRevisedClaimAmount] = useState('');
  
  // CP5 issues count from accordion (single source of truth)
  const [cp5IssuesCount, setCp5IssuesCount] = useState<number | null>(null);
  
  // Export laporan state
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  // Track manual overrides (changes from AI recommendation)
  const [overrideCount, setOverrideCount] = useState(0);
  const [lineItemOverrideCount, setLineItemOverrideCount] = useState(0);
  const [initialCheckpointStatuses, setInitialCheckpointStatuses] = useState<CheckpointState | null>(null);

  // CP5 line-item totals (source of truth for charged/approved before benefit limits)
  const [cp5TotalCharged, setCp5TotalCharged] = useState<number | null>(null);
  const [cp5TotalApproved, setCp5TotalApproved] = useState<number | null>(null);
  const [cp5LineItemAmounts, setCp5LineItemAmounts] = useState<Array<{ name: string; approved: number }>>([]);
  // CP6 Batas Manfaat final insurer-pays amount (source of truth for Total Disetujui)
  const [batasManfaatFinalAmount, setBatasManfaatFinalAmount] = useState<number | null>(null);
  
  // PDF viewer ref and state
  const pdfViewerRef = useRef<PdfViewerHandle>(null);
  const [pdfState, setPdfState] = useState<PdfViewerState>({ displayScale: 1, currentPage: 1, numPages: 0, isImage: false, hasFile: false });
  
  // Resizable pane state (percentage for right/PDF pane width)
  const [pdfPanelWidthPercent, setPdfPanelWidthPercent] = useState(45);
  const isResizing = useRef(false);
  const containerRefMain = useRef<HTMLDivElement>(null);
  
  // Track which checkpoints are expanded (ALL collapsed by default)
  const [expandedCheckpoints, setExpandedCheckpoints] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
  });

  const checkpointRefs = {
    1: useRef<HTMLDivElement>(null),
    2: useRef<HTMLDivElement>(null),
    3: useRef<HTMLDivElement>(null),
    4: useRef<HTMLDivElement>(null),
    5: useRef<HTMLDivElement>(null),
    6: useRef<HTMLDivElement>(null),
    7: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (params?.id && claims.length > 0) {
      const foundClaim = claims.find(c => c.id === params.id);
      if (foundClaim) {
        setClaim(foundClaim);
        // Initialize checkpoint statuses from claim data
        if (foundClaim.checkpointStatuses) {
          const initial = foundClaim.checkpointStatuses as CheckpointState;
          setCheckpointStatuses(initial);
          if (!initialCheckpointStatuses) {
            setInitialCheckpointStatuses({ ...initial });
          }
        } else {
          // Auto-validate Checkpoint 1 if data is present
          autoValidateCheckpoint1(foundClaim);
        }
      }
    }
  }, [params?.id, claims]);

  // Redirect to claim list when data is loaded but claim is not found (stale URL)
  useEffect(() => {
    if (dataLoaded && params?.id && claims.length >= 0 && !claim) {
      const foundClaim = claims.find(c => c.id === params.id);
      if (!foundClaim) {
        navigate("/klaim");
      }
    }
  }, [dataLoaded, params?.id, claims, claim]);

  const autoValidateCheckpoint1 = (claimData: Claim) => {
    const hasValidMember = claimData.patientName && claimData.memberStatus === 'AKTIF';
    const hasPolicyInfo = claimData.policyNumber && claimData.policyEffectiveDate;
    
    const autoStatus: CheckpointState = {
      validitasPeserta: hasValidMember && hasPolicyInfo ? 'passed' : 'pending',
      kelengkapanDokumen: 'pending',
      ketepatanWaktu: 'pending',
      pengecualianPolis: 'pending',
      analisisKlaim: 'pending',
      batasManfaat: 'pending',
      keputusanAkhir: 'pending',
    };
    setCheckpointStatuses(autoStatus);
    if (!initialCheckpointStatuses) {
      setInitialCheckpointStatuses({ ...autoStatus });
    }
  };

  // Track highlighted section for 2-second highlight effect
  const [highlightedCheckpoint, setHighlightedCheckpoint] = useState<number | null>(null);

  const scrollToCheckpoint = (checkpointNumber: number) => {
    const ref = checkpointRefs[checkpointNumber as keyof typeof checkpointRefs];
    if (ref.current) {
      // Scroll to the section
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Collapse all sections and expand only the clicked one
      setExpandedCheckpoints({
        1: checkpointNumber === 1,
        2: checkpointNumber === 2,
        3: checkpointNumber === 3,
        4: checkpointNumber === 4,
        5: checkpointNumber === 5,
        6: checkpointNumber === 6,
        7: checkpointNumber === 7,
      });
      
      // Highlight the section for 2 seconds
      setHighlightedCheckpoint(checkpointNumber);
      setTimeout(() => {
        setHighlightedCheckpoint(null);
      }, 2000);
      
      setCurrentCheckpoint(checkpointNumber);
    }
  };

  const getBenefitCategoryBadge = (category?: string) => {
    const configs = {
      'RAWAT JALAN': { emoji: '🏥', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'RAWAT INAP': { emoji: '🛏️', color: 'bg-green-100 text-green-700 border-green-200' },
      'RAWAT BERSALIN': { emoji: '🤰', color: 'bg-pink-100 text-pink-700 border-pink-200' },
      'RAWAT GIGI': { emoji: '🦷', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'KACAMATA': { emoji: '👓', color: 'bg-orange-100 text-orange-700 border-orange-200' },
      'MEDICAL CHECK-UP': { emoji: '🔬', color: 'bg-teal-100 text-teal-700 border-teal-200' },
    };

    const config = category ? configs[category as keyof typeof configs] : null;
    if (!config) return null;

    return (
      <Badge variant="outline" className={`${config.color} text-xs px-2 py-1`}>
        {config.emoji} {category}
      </Badge>
    );
  };

  const getStatusIcon = (status: CheckpointStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Circle className="w-4 h-4 text-slate-300" />;
    }
  };

  const updateCheckpointStatus = (checkpoint: keyof CheckpointState, status: CheckpointStatus) => {
    setCheckpointStatuses(prev => ({
      ...prev,
      [checkpoint]: status
    }));
  };

  // Auto-save whenever checkpoint statuses or justifications change
  useEffect(() => {
    if (!claim) return;
    
    // Check if there's any meaningful progress to save (at least one field changed from default)
    const hasProgress = 
      policyExclusionJustification ||
      finalDecisionJustification ||
      revisedClaimAmount ||
      Object.values(checkpointStatuses).some(status => status !== 'pending');
    
    if (hasProgress) {
      setIsSaving(true);
      // Persist checkpoint statuses and review decisions to backend
      console.log('Auto-saving checkpoint progress...', {
        claimId: claim.id,
        checkpointStatuses,
        policyExclusionJustification,
        finalDecisionJustification,
        revisedClaimAmount,
      });
      const timer = setTimeout(() => {
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [checkpointStatuses, policyExclusionJustification, finalDecisionJustification, revisedClaimAmount, claim]);

  // Count manual overrides
  useEffect(() => {
    if (!initialCheckpointStatuses) return;
    let count = 0;
    const keys = Object.keys(checkpointStatuses) as (keyof CheckpointState)[];
    for (const key of keys) {
      if (initialCheckpointStatuses[key] !== 'pending' && checkpointStatuses[key] !== initialCheckpointStatuses[key]) {
        count++;
      }
    }
    if (revisedClaimAmount) count++;
    count += lineItemOverrideCount;
    setOverrideCount(count);
  }, [checkpointStatuses, initialCheckpointStatuses, revisedClaimAmount, lineItemOverrideCount]);

  const handleExportLaporan = async () => {
    if (isExporting || !claim) return;
    setIsExporting(true);
    try {
      const result = await exportClaimReport(claim);
      if (result.success) {
        toast({ title: "Laporan Berhasil Di-export!", description: `${result.filename} downloaded`, duration: 4000 });
      } else {
        toast({ variant: "destructive", title: "Gagal generate laporan", description: result.error || "Silakan coba lagi", duration: 5000 });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ variant: "destructive", title: "Gagal generate laporan", description: "Silakan coba lagi", duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUndo = () => {
    if (initialCheckpointStatuses) {
      setCheckpointStatuses({ ...initialCheckpointStatuses });
      setRevisedClaimAmount('');
      setFinalDecisionJustification('');
      setPolicyExclusionJustification('');
    }
  };

  const handleReset = () => {
    if (initialCheckpointStatuses) {
      setCheckpointStatuses({ ...initialCheckpointStatuses });
    } else {
      setCheckpointStatuses({
        validitasPeserta: 'pending',
        kelengkapanDokumen: 'pending',
        ketepatanWaktu: 'pending',
        pengecualianPolis: 'pending',
        analisisKlaim: 'pending',
        batasManfaat: 'pending',
        keputusanAkhir: 'pending',
      });
    }
    setRevisedClaimAmount('');
    setFinalDecisionJustification('');
    setPolicyExclusionJustification('');
  };

  // Resizer drag handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !containerRefMain.current) return;
      const containerRect = containerRefMain.current.getBoundingClientRect();
      const totalWidth = containerRect.width;
      const mouseX = moveEvent.clientX - containerRect.left;
      const pdfWidth = totalWidth - mouseX;
      const pdfPercent = (pdfWidth / totalWidth) * 100;
      const minPercent = Math.min((300 / totalWidth) * 100, 70);
      const clamped = Math.max(minPercent, Math.min(70, pdfPercent));
      setPdfPanelWidthPercent(clamped);
    };
    
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfViewerRef.current) return;
    const blob = pdfViewerRef.current.getFileBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = blob.type === 'application/pdf' ? '.pdf' : blob.type.includes('png') ? '.png' : '.jpg';
    a.download = `dokumen_klaim_${params?.id || 'unknown'}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [params?.id]);

  const getApprovedAmount = (): number => {
    if (revisedClaimAmount) {
      const parsed = parseInt(revisedClaimAmount.replace(/\D/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
    const hasManualOverrides = lineItemOverrideCount > 0;
    if (!hasManualOverrides && claim) {
      const aiRecommended = getRecommendedAmount(claim, cp5TotalCharged);
      if (aiRecommended === 0) return 0;
    }
    if (batasManfaatFinalAmount !== null) return batasManfaatFinalAmount;
    if (cp5TotalApproved !== null) return cp5TotalApproved;
    if (claim) return getRecommendedAmount(claim, cp5TotalCharged);
    return 0;
  };

  const getAiRecommendedAmount = (): number => {
    if (claim) return getRecommendedAmount(claim, cp5TotalCharged);
    return 0;
  };

  const hasEdits = overrideCount > 0;

  const getRejectedItemsNote = (): string => {
    const charged = cp5TotalCharged ?? claim?.amount ?? 0;
    const diff = charged - getApprovedAmount();
    if (diff > 0) {
      return `Potongan -${formatRupiah(diff)}`;
    }
    return '';
  };

  if (!claim) {
    return null;
  }

  const patientDisplayName = claim.patientName || 'Nama Pasien Tidak Tersedia';
  // Calculate age from DOB if age is not available
  const patientAge = claim.patientAge || (claim.patientDOB ? calculateAge(claim.patientDOB) : null) || 0;
  const patientGender = claim.patientGender || 'L';
  const claimId = claim.id;

  // Calculate age display (XX Thn, YY bln)
  const getAgeDisplay = (age: number) => {
    const years = Math.floor(age);
    const months = Math.round((age - years) * 12);
    if (years === 0) {
      return `${months} bln`;
    }
    if (months === 0) {
      return `${years} Thn`;
    }
    return `${years} Thn, ${months} bln`;
  };

  const handleClose = () => {
    navigate("/klaim");
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="w-[96%] max-w-[2400px] h-[96vh] p-2 gap-0 rounded-lg" aria-describedby="dialog-description">
        <DialogTitle className="sr-only">Review Klaim {claim ? `#${claim.id}` : ''}</DialogTitle>
        <DialogDescription id="dialog-description" className="sr-only">
          Halaman review komprehensif untuk klaim medis dengan 7 checkpoint validasi
        </DialogDescription>
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden rounded-lg">
          {/* Header - Fixed */}
          <header className="bg-white border-b border-slate-200 flex-shrink-0 z-40">
            <div className="px-6 py-4">
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-slate-900" data-testid="text-patient-name">
                  {patientDisplayName}
                </h1>
                <BenefitCategoryTag category={claim.benefitCategory || 'RAWAT JALAN'} />
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-700">{getAgeDisplay(patientAge)}</span>
                <GenderTag gender={patientGender} />
              </div>
              
              <p className="text-xs text-slate-500" data-testid="text-claim-id">
                Claim #{claimId}
              </p>
            </div>
            {(() => {
              const hasDecision = checkpointStatuses.keputusanAkhir === 'passed' || checkpointStatuses.keputusanAkhir === 'failed' ||
                claim.checkpointStatuses?.keputusanAkhir === 'passed' || claim.checkpointStatuses?.keputusanAkhir === 'failed';
              const isDisabled = !hasDecision || isExporting;
              return (
                <Button
                  variant="outline"
                  onClick={handleExportLaporan}
                  disabled={isDisabled}
                  className={`text-sm px-4 py-2 h-auto mr-8 ${hasDecision ? 'border-blue-500 text-blue-600 hover:bg-blue-50' : 'border-slate-300 text-slate-400 opacity-40'}`}
                  data-testid="button-export-laporan"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-1.5" />
                      Download Laporan
                    </>
                  )}
                </Button>
              );
            })()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" ref={containerRefMain}>
        {/* Main Content - Scrollable - Left panel */}
        <main className="overflow-y-auto overflow-x-hidden relative" style={{ width: `${100 - pdfPanelWidthPercent}%` }}>
          <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
            <h3 className="text-sm font-semibold text-slate-900 text-left">Analisa Klaim</h3>
          </div>
          <div className="space-y-6 p-6 pb-40">
            
            {/* Hero Claim Summary Card */}
            <HeroClaimSummary claim={claim} originalTotalCharged={cp5TotalCharged} />
            
            {/* Checkpoint 1: Validitas Peserta */}
            <Collapsible 
              open={expandedCheckpoints[1]} 
              onOpenChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 1: open }))}
            >
              <Card ref={checkpointRefs[1]} className={`overflow-hidden transition-all duration-500 ${highlightedCheckpoint === 1 ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} data-testid="checkpoint-1">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold text-slate-900 text-left">Status Peserta</h2>
                      {(() => {
                        const tag = getStatusTag('validitasPeserta', claim.checkpointStatuses?.validitasPeserta, claim);
                        return (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-medium ${getTagColorClass(tag.color)}`}
                          >
                            {tag.text}
                          </Badge>
                        );
                      })()}
                    </div>
                    {expandedCheckpoints[1] ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
                    {/* Status Kepesertaan */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">Status Kepesertaan</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Status Kepesertaan</div>
                          {(() => {
                            const cpStatus = claim.checkpointStatuses?.validitasPeserta;
                            const displayStatus =
                              cpStatus === 'passed' ? 'Aktif' :
                              claim.memberStatus === 'TIDAK DITEMUKAN' ? 'Tidak Ditemukan' :
                              'Tidak Aktif';
                            return <MemberStatusTag status={displayStatus} />;
                          })()}
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nomor ID Peserta</div>
                          <div className="font-medium text-slate-900">{claim.memberCardNumber || <span className="text-slate-400">-</span>}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Tanggal Mulai Kepesertaan</div>
                          <div className="font-medium text-slate-900">
                            {claim.policyEffectiveDate ? formatDateIndonesian(claim.policyEffectiveDate) : <span className="text-slate-400">-</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Endorsemen Ke</div>
                          <div className="font-medium text-slate-900">
                            <span className="text-slate-400">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Identitas Peserta */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Identitas Peserta</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nama Peserta</div>
                          <div className="font-medium text-slate-900">{claim.patientName || <span className="text-slate-400">-</span>}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Jenis Kelamin</div>
                          {claim.patientGender ? (
                            <GenderTag gender={claim.patientGender} />
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Tanggal Lahir</div>
                          <div className="font-medium text-slate-900">
                            {claim.patientDateOfBirth ? claim.patientDateOfBirth : (claim.patientDOB ? formatDateIndonesian(claim.patientDOB) : <span className="text-slate-400">-</span>)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Umur</div>
                          <div className="font-medium text-slate-900">
                            {claim.patientAge || (claim.patientDOB && calculateAge(claim.patientDOB)) ? getAgeDisplay(claim.patientAge || calculateAge(claim.patientDOB!) || 0) : <span className="text-slate-400">-</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Hubungan dengan Prinsipal</div>
                          {claim.relationshipToPrincipal ? (
                            <RelationshipTag relationship={claim.relationshipToPrincipal as any} />
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nama Prinsipal</div>
                          <div className="font-medium text-slate-900">{claim.principalName || <span className="text-slate-400">-</span>}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informasi Polis */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Informasi Polis</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nama Pemegang Polis</div>
                          <div className="font-medium text-slate-900">{claim.policyHolderName || <span className="text-slate-400">-</span>}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nomor Polis</div>
                          <div className="font-medium text-slate-900">{claim.policyNumber || <span className="text-slate-400">-</span>}</div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="text-xs text-slate-500 mb-1">Manfaat</div>
                          <div className="font-medium text-slate-900 space-y-1">
                            {claim.benefits && claim.benefits.length > 0 ? (
                              claim.benefits.map((benefit: string, idx: number) => (
                                <div key={idx}>[{benefit}]</div>
                              ))
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Checkpoint 2: Kelengkapan Dokumen */}
            <Collapsible 
              open={expandedCheckpoints[2]} 
              onOpenChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 2: open }))}
            >
              <Card ref={checkpointRefs[2]} className={`overflow-hidden transition-all duration-500 ${highlightedCheckpoint === 2 ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} data-testid="checkpoint-2">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold text-slate-900 text-left">
                        Kelengkapan Dokumen
                      </h2>
                      {(() => {
                        const tag = getStatusTag('kelengkapanDokumen', claim.checkpointStatuses?.kelengkapanDokumen, claim);
                        return (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-medium ${getTagColorClass(tag.color)}`}
                          >
                            {tag.text}
                          </Badge>
                        );
                      })()}
                    </div>
                    {expandedCheckpoints[2] ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
                    {/* Documents Table */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Dokumen yang Disubmit</h3>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700 w-16">No.</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipe Dokumen</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700">Nama File</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700">Catatan AI</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700 w-24">Lihat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {claim.documents && claim.documents.length > 0 ? (
                              claim.documents.map((doc, idx) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                                  <td className="px-4 py-3 font-medium text-slate-900">{doc.type}</td>
                                  <td className="px-4 py-3 text-slate-700">{doc.fileName || '-'}</td>
                                  <td className="px-4 py-3 text-slate-600 text-xs">{doc.notes || '-'}</td>
                                  <td className="px-4 py-3">
                                    <Button
                                      variant="link"
                                      className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs font-medium"
                                      data-testid={`button-view-document-${idx}`}
                                    >
                                      Lihat
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                                  Tidak ada dokumen
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Policy Requirements Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Syarat-syarat Dokumen Pendukung Klaim berdasarkan Polis</h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 mb-2">
                            {claim.policyDocumentRequirementsReference || '-'}
                          </p>
                          {claim.policyDocumentRequirementsText ? (
                            <div className="text-slate-700 italic whitespace-pre-line">
                              {claim.policyDocumentRequirementsText}
                            </div>
                          ) : (
                            <p className="text-slate-500">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Checkpoint 3: Ketepatan Waktu */}
            <Collapsible 
              open={expandedCheckpoints[3]} 
              onOpenChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 3: open }))}
            >
              <Card ref={checkpointRefs[3]} className={`overflow-hidden transition-all duration-500 ${highlightedCheckpoint === 3 ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} data-testid="checkpoint-3">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const tag = getStatusTag('ketepatanWaktu', claim.checkpointStatuses?.ketepatanWaktu, claim);
                        
                        return (
                          <>
                            <h2 className="text-xs font-semibold text-slate-900 text-left">
                              Ketepatan Waktu Klaim
                            </h2>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 font-medium ${getTagColorClass(tag.color)}`}
                            >
                              {tag.text}
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                    {expandedCheckpoints[3] ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
                    {/* Timeline Visualization */}
                    <TimelineVisualization 
                      treatmentDate={parseDDMMYYYY(claim.treatmentDate || claim.date)}
                      submissionDate={parseDDMMYYYY(claim.submissionDate || claim.date)}
                      deadlineDate={claim.submissionDeadlineDate ? parseDDMMYYYY(claim.submissionDeadlineDate) : new Date(parseDDMMYYYY(claim.treatmentDate || claim.date).getTime() + 90 * 24 * 60 * 60 * 1000)}
                      daysBetween={Math.floor((parseDDMMYYYY(claim.submissionDate || claim.date).getTime() - parseDDMMYYYY(claim.treatmentDate || claim.date).getTime()) / (1000 * 60 * 60 * 24))}
                      isOnTime={parseDDMMYYYY(claim.submissionDate || claim.date) <= (claim.submissionDeadlineDate ? parseDDMMYYYY(claim.submissionDeadlineDate) : new Date(parseDDMMYYYY(claim.treatmentDate || claim.date).getTime() + 90 * 24 * 60 * 60 * 1000))}
                    />

                    {/* Policy Reference Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Batas Waktu Pengajuan Klaim</h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 mb-2">
                            {claim.policyTimelineReference || '-'}
                          </p>
                          {claim.policyTimelineText ? (
                            <div className="text-slate-700 italic whitespace-pre-line">
                              {claim.policyTimelineText}
                            </div>
                          ) : (
                            <p className="text-slate-500">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Checkpoint 4: Pengecualian Polis */}
            <CheckpointPengecualianPolis
              claim={claim}
              isExpanded={expandedCheckpoints[4]}
              onExpandChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 4: open }))}
              isHighlighted={highlightedCheckpoint === 4}
              checkpointRef={checkpointRefs[4]}
              onDecisionChange={(decision, isOverride, justification) => {
                if (decision === 'LANJUT') {
                  updateCheckpointStatus('pengecualianPolis', 'passed');
                } else if (decision === 'TOLAK') {
                  updateCheckpointStatus('pengecualianPolis', 'failed');
                }
                setPolicyExclusionJustification(justification);
              }}
              onSave={(action) => {
                if (action === 'continue') {
                  updateCheckpointStatus('pengecualianPolis', 'passed');
                } else {
                  updateCheckpointStatus('pengecualianPolis', 'failed');
                }
              }}
            />

            {/* Checkpoint 5: Analisis Klaim (Line-by-line Analysis) */}
            <CheckpointAnalisisKlaim
              claim={claim}
              isExpanded={expandedCheckpoints[5]}
              onExpandChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 5: open }))}
              isHighlighted={highlightedCheckpoint === 5}
              checkpointRef={checkpointRefs[5]}
              onIssuesCountChange={setCp5IssuesCount}
              onLineItemOverrideCount={setLineItemOverrideCount}
              onDecisionChange={(totalApproved, totalCharged, _itemsApproved, _itemsRejected, lineItemAmounts) => {
                setCp5TotalCharged(totalCharged);
                setCp5TotalApproved(totalApproved);
                if (lineItemAmounts) setCp5LineItemAmounts(lineItemAmounts);
              }}
              onSave={(action) => {
                if (action === 'continue') {
                  updateCheckpointStatus('analisisKlaim', 'passed');
                  scrollToCheckpoint(6);
                }
              }}
            />

            {/* Checkpoint 6: Batas Manfaat */}
            <CheckpointBatasManfaat
              claim={claim}
              isExpanded={expandedCheckpoints[6]}
              onExpandChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 6: open }))}
              isHighlighted={highlightedCheckpoint === 6}
              checkpointRef={checkpointRefs[6]}
              cp5ApprovedAmounts={cp5LineItemAmounts}
              onFinalAmountChange={setBatasManfaatFinalAmount}
              onSave={(action) => {
                if (action === 'continue') {
                  updateCheckpointStatus('batasManfaat', 'passed');
                  scrollToCheckpoint(7);
                }
              }}
            />

            {/* Checkpoint 7: Keputusan Akhir */}
            <Collapsible 
              open={expandedCheckpoints[7]} 
              onOpenChange={(open) => setExpandedCheckpoints(prev => ({ ...prev, 7: open }))}
            >
              <Card ref={checkpointRefs[7]} className={`overflow-hidden transition-all duration-500 ${highlightedCheckpoint === 7 ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} data-testid="checkpoint-7">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold text-slate-900 text-left">
                        Keputusan Akhir
                      </h2>
                      {(() => {
                        const tag = getStatusTag('keputusanAkhir', claim.checkpointStatuses?.keputusanAkhir, claim);
                        return (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-medium ${getTagColorClass(tag.color)}`}
                          >
                            {tag.text}
                          </Badge>
                        );
                      })()}
                    </div>
                    {expandedCheckpoints[7] ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">💡 Pilih Keputusan Anda:</h3>
                  <RadioGroup 
                    className="space-y-4"
                    onValueChange={(value) => {
                      updateCheckpointStatus('keputusanAkhir', 'in-progress');
                    }}
                  >
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="setuju" id="decision-approve" />
                        <div className="flex-1">
                          <Label htmlFor="decision-approve" className="text-sm font-medium cursor-pointer">
                            SETUJU - Approve Penuh
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">Total dibayar: {formatRupiah(claim.amount)}</p>
                          <Textarea 
                            placeholder="Justifikasi keputusan..."
                            className="mt-2 text-xs"
                            rows={2}
                            value={finalDecisionJustification}
                            onChange={(e) => setFinalDecisionJustification(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="tolak" id="decision-reject" />
                        <div className="flex-1">
                          <Label htmlFor="decision-reject" className="text-sm font-medium cursor-pointer">
                            TOLAK - Reject Claim
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">Member membayar penuh</p>
                          <Textarea 
                            placeholder="Alasan penolakan..."
                            className="mt-2 text-xs"
                            rows={2}
                            value={finalDecisionJustification}
                            onChange={(e) => setFinalDecisionJustification(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="partial" id="decision-partial" />
                        <div className="flex-1">
                          <Label htmlFor="decision-partial" className="text-sm font-medium cursor-pointer">
                            SETUJUI PARTIAL - Approve dengan Koreksi Harga
                          </Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-600">Nominal disetujui:</span>
                              <input 
                                type="text" 
                                className="border rounded px-2 py-1 w-32"
                                placeholder={formatRupiah(claim.revisedAmount || claim.amount * 0.7)}
                                value={revisedClaimAmount}
                                onChange={(e) => setRevisedClaimAmount(e.target.value)}
                              />
                            </div>
                            <Textarea 
                              placeholder="Justifikasi koreksi harga..."
                              className="text-xs"
                              rows={2}
                              value={finalDecisionJustification}
                              onChange={(e) => setFinalDecisionJustification(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/klaim")}
                    data-testid="button-cancel-review"
                  >
                    Batal
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      // Final submission - persist everything
                      console.log('Submitting review with:', {
                        checkpointStatuses,
                        policyExclusionJustification,
                        finalDecisionJustification,
                        revisedClaimAmount,
                      });
                      navigate("/klaim");
                    }}
                    data-testid="button-submit-review"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan & Submit Review
                  </Button>
                </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          </div>
        </main>

        {/* Resizable Divider */}
        <div
          className="w-2 flex-shrink-0 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize relative group"
          onMouseDown={handleResizeMouseDown}
          data-testid="panel-resizer"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right Pane - PDF Viewer */}
        <aside className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: `${pdfPanelWidthPercent}%`, minWidth: '300px' }}>
          <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 text-left flex-shrink-0">Dokumen Klaim</h3>
            <div className="flex items-center gap-1">
              {/* Zoom controls */}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => pdfViewerRef.current?.zoomOut()} disabled={pdfState.displayScale <= 0.5}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-medium text-slate-600 min-w-[36px] text-center">{Math.round(pdfState.displayScale * 100)}%</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => pdfViewerRef.current?.zoomIn()} disabled={pdfState.displayScale >= 3.0}>
                <Plus className="w-3.5 h-3.5" />
              </Button>

              {/* Page nav */}
              {!pdfState.isImage && pdfState.numPages > 1 && (
                <>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => pdfViewerRef.current?.goToPage(pdfState.currentPage - 1)} disabled={pdfState.currentPage <= 1}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[11px] font-medium text-slate-600 min-w-[32px] text-center">{pdfState.currentPage}/{pdfState.numPages}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => pdfViewerRef.current?.goToPage(pdfState.currentPage + 1)} disabled={pdfState.currentPage >= pdfState.numPages}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {/* Download */}
              {pdfState.hasFile && (
                <>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ClaimPdfViewer 
              ref={pdfViewerRef}
              fileBase64={claim.originalFileBase64}
              fileMimeType={claim.fileMimeType}
              claimId={claimId}
              onStateChange={setPdfState}
            />
          </div>
        </aside>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-slate-200 flex-shrink-0 z-40">
        <div className="flex items-center px-6 py-3 gap-4">
          {/* Total Diajukan */}
          <div className="flex-shrink-0">
            <div className="text-[10px] text-slate-500 leading-tight">Total Diajukan</div>
            <div className="text-sm font-bold text-slate-700">{formatRupiah(cp5TotalCharged ?? claim.amount)}</div>
            {getRejectedItemsNote() && (
              <div className="text-[10px] text-slate-400 leading-tight">{getRejectedItemsNote()}</div>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

          {/* Total Disetujui */}
          <div className="flex-shrink-0">
            <div className="text-[10px] text-slate-500 leading-tight">Total Disetujui</div>
            <div className="text-sm font-bold text-green-600">{formatRupiah(getApprovedAmount())}</div>
          </div>

          <div className="w-px h-10 bg-slate-200 flex-shrink-0 mx-2" />

          {/* Edit info section */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-xs px-3 py-0.5 font-medium text-slate-600 border-slate-300">
              {overrideCount} perubahanmu
            </Badge>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUndo}
                className={`text-xs flex items-center gap-1 transition-colors ${hasEdits ? 'text-slate-600 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'}`}
                disabled={!hasEdits}
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className={`text-xs flex items-center gap-1 transition-colors ${hasEdits ? 'text-slate-600 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'}`}
                    disabled={!hasEdits}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset semua perubahan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin mereset semua perubahan? Ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Decision buttons - far right */}
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            {/* Tolak Klaim */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="h-[78px] min-w-[160px] px-6 rounded-[10px] border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 hover:border-red-400 transition-colors"
                  data-testid="button-tolak-klaim"
                  aria-label="Tolak klaim, approve Rp0"
                >
                  Tolak Klaim
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tolak klaim ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menolak klaim ini? Total yang disetujui akan menjadi Rp0.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      updateCheckpointStatus('keputusanAkhir', 'failed');
                      navigate("/klaim");
                    }}
                  >
                    Tolak Klaim
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Approve */}
            <button
              className="h-[78px] min-w-[220px] px-6 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-center flex flex-col items-center justify-center"
              data-testid="button-approve"
              aria-label={hasEdits
                ? `Approve ${formatRupiah(getApprovedAmount())}, sesuai ${overrideCount} perubahan Anda`
                : `Approve ${formatRupiah(getAiRecommendedAmount())}, sesuai rekomendasi AI`
              }
              onClick={() => {
                updateCheckpointStatus('keputusanAkhir', 'passed');
                const amount = getApprovedAmount();
                console.log('Submitting review - Approve:', {
                  checkpointStatuses: { ...checkpointStatuses, keputusanAkhir: 'passed' },
                  decision_type: hasEdits ? 'approved_with_manual_adjustments' : 'approved_ai_recommendation',
                  approved_amount: amount,
                  ai_recommendation: getAiRecommendedAmount(),
                  edit_count: overrideCount,
                });
                navigate("/klaim");
              }}
            >
              <span className="text-sm font-semibold">Approve</span>
              <span className="text-xl font-bold mt-0.5">
                {formatRupiah(hasEdits ? getApprovedAmount() : getAiRecommendedAmount())}
              </span>
              <span className="text-xs opacity-85">
                {hasEdits ? 'Sesuai perubahanmu' : 'Sesuai rekomendasi AI'}
              </span>
            </button>
          </div>
        </div>
      </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
