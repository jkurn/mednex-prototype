import { useState, useMemo, useEffect, RefObject } from "react";
import { ChevronDown, ChevronUp, RotateCcw, AlertTriangle, HelpCircle, ThumbsUp, ThumbsDown, ChevronRight, FileWarning } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Claim } from "@shared/schema";
import { formatRupiah } from "@/utils/formatters";
import { getStatusTag, getTagColorClass } from "@/utils/checkpointHelpers";
import { useToast } from "@/hooks/use-toast";
import { getBenefitPlanForClaim, getDefaultBenefitPlan, BenefitPlan, BenefitType } from "@/utils/benefitPlanLookup";

interface LimitItem {
  id: number;
  itemName: string;
  approvedAmount: number;
  originalBenefitId: string;
  currentBenefitId: string;
  aiConfidence: number;
  excess: number;
  catatan: string;
  hasChanges: boolean;
}

interface CheckpointBatasManfaatProps {
  claim: Claim;
  isExpanded: boolean;
  onExpandChange: (open: boolean) => void;
  isHighlighted: boolean;
  checkpointRef: RefObject<HTMLDivElement>;
  cp5ApprovedAmounts?: Array<{ name: string; approved: number }>;
  onFinalAmountChange?: (insurerPays: number) => void;
  onSave?: (action: 'continue') => void;
}

export function CheckpointBatasManfaat({
  claim,
  isExpanded,
  onExpandChange,
  isHighlighted,
  checkpointRef,
  cp5ApprovedAmounts,
  onFinalAmountChange,
  onSave,
}: CheckpointBatasManfaatProps) {
  const { toast } = useToast();
  const [aiSummaryOpen, setAiSummaryOpen] = useState(true);
  const [summaryFeedback, setSummaryFeedback] = useState<'positive' | 'negative' | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [itemFeedback, setItemFeedback] = useState<Record<number, 'positive' | 'negative' | null>>({});

  const { benefitPlan, hasBenefitData } = useMemo(() => {
    const policyPlan = getBenefitPlanForClaim(claim);
    if (policyPlan) {
      return { benefitPlan: policyPlan, hasBenefitData: true };
    }
    return { benefitPlan: getDefaultBenefitPlan(claim), hasBenefitData: false };
  }, [claim]);

  const mapItemToBenefit = (itemName: string): { benefitId: string; confidence: number } => {
    const nameLower = itemName.toLowerCase();
    
    if (nameLower.includes('konsultasi') || nameLower.includes('pemeriksaan')) {
      if (nameLower.includes('spesialis')) {
        return { benefitId: 'konsultasi_spesialis', confidence: 92 };
      }
      return { benefitId: 'konsultasi_umum', confidence: 94 };
    }
    if (nameLower.includes('obat') || nameLower.includes('cap') || nameLower.includes('tab') || 
        nameLower.includes('syrup') || nameLower.includes('inj') || nameLower.includes('cream') ||
        nameLower.includes('mg') || nameLower.includes('ml')) {
      return { benefitId: 'obat', confidence: 91 };
    }
    if (nameLower.includes('lab') || nameLower.includes('darah') || nameLower.includes('urine') || 
        nameLower.includes('rontgen') || nameLower.includes('usg')) {
      return { benefitId: 'lab', confidence: 88 };
    }
    if (nameLower.includes('tindakan') || nameLower.includes('prosedur') || nameLower.includes('injeksi')) {
      return { benefitId: 'tindakan', confidence: 85 };
    }
    if (nameLower.includes('admin') || nameLower.includes('registrasi') || nameLower.includes('materai')) {
      return { benefitId: 'admin', confidence: 90 };
    }
    
    return { benefitId: 'obat', confidence: 65 };
  };

  const generateLimitItems = useMemo((): LimitItem[] => {
    const items: LimitItem[] = [];
    
    if (claim.cp5ItemAnalysis && claim.cp5ItemAnalysis.length > 0) {
      claim.cp5ItemAnalysis.forEach((aiItem, idx) => {
        const chargedPrice = aiItem.chargedPrice ?? 0;
        const marketPrice = aiItem.marketPrice ?? chargedPrice;
        const isOverpriced = aiItem.pricingAnalysis?.isOverpriced ?? false;
        let approvedAmount = isOverpriced ? marketPrice : chargedPrice;
        
        if (cp5ApprovedAmounts && cp5ApprovedAmounts.length > 0) {
          const cp5Match = cp5ApprovedAmounts.find(a => a.name === aiItem.itemName) ?? cp5ApprovedAmounts[idx];
          if (cp5Match !== undefined) {
            approvedAmount = cp5Match.approved;
          }
        }
        
        const mapping = mapItemToBenefit(aiItem.itemName);
        const benefit = benefitPlan.benefits.find(b => b.id === mapping.benefitId);
        const excess = benefit ? Math.max(0, approvedAmount - benefit.limit) : 0;
        
        items.push({
          id: idx + 1,
          itemName: aiItem.itemName,
          approvedAmount,
          originalBenefitId: mapping.benefitId,
          currentBenefitId: mapping.benefitId,
          aiConfidence: mapping.confidence,
          excess,
          catatan: '',
          hasChanges: false,
        });
      });
      return items;
    }
    
    if (claim.items && claim.items.length > 0) {
      claim.items.forEach((item, idx) => {
        let approvedAmount = item.totalPrice;
        
        if (cp5ApprovedAmounts && cp5ApprovedAmounts.length > 0) {
          const cp5Match = cp5ApprovedAmounts.find(a => a.name === item.name) ?? cp5ApprovedAmounts[idx];
          if (cp5Match !== undefined) {
            approvedAmount = cp5Match.approved;
          }
        }
        
        const mapping = mapItemToBenefit(item.name);
        const benefit = benefitPlan.benefits.find(b => b.id === mapping.benefitId);
        const excess = benefit ? Math.max(0, approvedAmount - benefit.limit) : 0;
        
        items.push({
          id: idx + 1,
          itemName: item.name,
          approvedAmount,
          originalBenefitId: mapping.benefitId,
          currentBenefitId: mapping.benefitId,
          aiConfidence: mapping.confidence,
          excess,
          catatan: '',
          hasChanges: false,
        });
      });
    }
    
    return items;
  }, [claim, benefitPlan, cp5ApprovedAmounts]);

  const [limitItems, setLimitItems] = useState<LimitItem[]>([]);
  
  useEffect(() => {
    setLimitItems(generateLimitItems);
  }, [generateLimitItems]);

  const hasAnyChanges = useMemo(() => {
    return limitItems.some(item => item.hasChanges);
  }, [limitItems]);

  const hasExcessItems = useMemo(() => {
    return limitItems.some(item => item.excess > 0);
  }, [limitItems]);

  const calculations = useMemo(() => {
    const totalApproved = limitItems.reduce((sum, item) => sum + item.approvedAmount, 0);
    const totalExcess = limitItems.reduce((sum, item) => sum + item.excess, 0);
    const subtotalAfterLimit = totalApproved - totalExcess;
    const insurerPays = Math.round(subtotalAfterLimit * (benefitPlan.coInsuranceInsurer / 100));
    const memberCoins = Math.round(subtotalAfterLimit * (benefitPlan.coInsuranceMember / 100));
    const memberTotal = totalExcess + memberCoins;
    
    return {
      totalApproved,
      totalExcess,
      subtotalAfterLimit,
      insurerPays,
      memberCoins,
      memberTotal,
    };
  }, [limitItems, benefitPlan]);

  useEffect(() => {
    onFinalAmountChange?.(calculations.insurerPays);
  }, [calculations.insurerPays, onFinalAmountChange]);

  const handleBenefitChange = (itemId: number, newBenefitId: string) => {
    setLimitItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const benefit = benefitPlan.benefits.find(b => b.id === newBenefitId);
      const newExcess = benefit ? Math.max(0, item.approvedAmount - benefit.limit) : 0;
      const hasChanges = newBenefitId !== item.originalBenefitId;
      
      return {
        ...item,
        currentBenefitId: newBenefitId,
        excess: newExcess,
        hasChanges,
        catatan: hasChanges ? item.catatan : '',
      };
    }));
  };

  const handleCatatanChange = (itemId: number, catatan: string) => {
    setLimitItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, catatan };
    }));
  };

  const handleRevertItem = (itemId: number) => {
    setLimitItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const benefit = benefitPlan.benefits.find(b => b.id === item.originalBenefitId);
      const originalExcess = benefit ? Math.max(0, item.approvedAmount - benefit.limit) : 0;
      
      return {
        ...item,
        currentBenefitId: item.originalBenefitId,
        excess: originalExcess,
        hasChanges: false,
        catatan: '',
      };
    }));
    
    toast({
      title: "Item dikembalikan",
      description: "Item telah dikembalikan ke klasifikasi AI",
    });
  };

  const handleRevertAll = () => {
    setLimitItems(prev => prev.map(item => {
      const benefit = benefitPlan.benefits.find(b => b.id === item.originalBenefitId);
      const originalExcess = benefit ? Math.max(0, item.approvedAmount - benefit.limit) : 0;
      
      return {
        ...item,
        currentBenefitId: item.originalBenefitId,
        excess: originalExcess,
        hasChanges: false,
        catatan: '',
      };
    }));
    
    toast({
      title: "Semua perubahan dikembalikan",
      description: "Semua item telah dikembalikan ke nilai awal",
    });
  };

  const handleSave = () => {
    const itemsMissingNotes = limitItems.filter(item => item.hasChanges && item.catatan.length < 20);
    
    if (itemsMissingNotes.length > 0) {
      toast({
        variant: "destructive",
        title: "Catatan diperlukan",
        description: "Mohon isi catatan untuk item yang diubah (min. 20 karakter)",
      });
      return;
    }
    
    toast({
      title: "Data disimpan!",
      description: "Melanjutkan ke checkpoint berikutnya...",
    });
    
    onSave?.('continue');
  };

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    setFeedbackType(type);
    setFeedbackText('');
    setFeedbackModalOpen(true);
  };

  const submitFeedback = () => {
    setSummaryFeedback(feedbackType);
    setFeedbackModalOpen(false);
    toast({
      title: "Terima kasih!",
      description: "Feedback Anda membantu meningkatkan akurasi AI",
    });
  };

  const handleItemFeedback = (itemId: number, type: 'positive' | 'negative') => {
    setItemFeedback(prev => ({
      ...prev,
      [itemId]: prev[itemId] === type ? null : type,
    }));
  };

  const getConfidenceBadgeStyle = (confidence: number) => {
    if (confidence >= 85) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (confidence >= 60) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const aiSummary = useMemo(() => {
    const exceededItems = limitItems.filter(item => item.excess > 0);
    if (exceededItems.length === 0) {
      return "Semua item klaim berada dalam batas limit manfaat peserta. Tidak ada excess yang perlu ditanggung peserta.";
    }
    return `Terdeteksi ${exceededItems.length} item melebihi batas limit manfaat. Total excess sebesar ${formatRupiah(calculations.totalExcess)} akan menjadi tanggungan peserta.`;
  }, [limitItems, calculations]);

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={onExpandChange}>
        <Card 
          ref={checkpointRef}
          className={`overflow-hidden transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
          data-testid="checkpoint-6"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900 text-left">
                  Batas Manfaat
                </h2>
                {(() => {
                  const tag = getStatusTag('batasManfaat', claim.checkpointStatuses?.batasManfaat, claim);
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
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-slate-200">
              
              {/* Warning when no benefit data from policy */}
              {!hasBenefitData && (
                <div className="px-4 pt-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <FileWarning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-amber-800">Data Manfaat Tidak Ditemukan</div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        Tidak ada data manfaat peserta dari modul Pemegang Polis yang sesuai dengan klaim ini. 
                        Menggunakan limit manfaat standar. Silakan upload data polis peserta melalui modul Pemegang Polis untuk hasil yang lebih akurat.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1: Informasi Manfaat Peserta */}
              <div className="px-4 pt-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 font-semibold">
                          {benefitPlan.planCode}
                        </Badge>
                        <span className="text-xs text-slate-600">
                          Periode Polis: {formatDate(benefitPlan.policyStart)} - {formatDate(benefitPlan.policyEnd)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-amber-600">
                        Co-Insurance: {benefitPlan.coInsuranceInsurer}% Asuransi / {benefitPlan.coInsuranceMember}% Peserta
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-12">No.</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-24">
                            <div className="flex items-center gap-1">
                              Limit ID
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Kode unik untuk identifikasi limit manfaat pada sistem</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Manfaat</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 w-24">Batasan</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 w-28">Limit</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 w-28">
                            <div className="flex items-center justify-end gap-1">
                              Terpakai
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Jumlah limit yang sudah digunakan peserta dalam tahun polis berjalan untuk manfaat Per Tahun.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 w-32">Sisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benefitPlan.benefits.map((benefit, idx) => {
                          const isYearly = benefit.batasan === 'Per Tahun';
                          const isLow = isYearly && benefit.sisa !== null && benefit.sisa > 0 && benefit.sisa <= benefit.limit * 0.2;
                          const isExhausted = isYearly && benefit.sisa === 0;
                          const rowClass = isExhausted ? 'bg-red-50/50' : isLow ? 'bg-amber-50/50' : '';
                          
                          return (
                            <tr key={benefit.id} className={`border-b border-slate-100 hover:bg-slate-50 ${rowClass}`}>
                              <td className="px-3 py-2 text-xs text-slate-600">{idx + 1}</td>
                              <td className="px-3 py-2 text-xs font-mono text-slate-500">{benefit.limitId || '-'}</td>
                              <td className="px-3 py-2 text-xs text-slate-800">{benefit.name}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant="outline" className="text-[10px] font-medium">
                                  {benefit.batasan}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-slate-800">
                                {formatRupiah(benefit.limit)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">
                                {isYearly && benefit.terpakai !== null ? formatRupiah(benefit.terpakai) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isYearly && benefit.sisa !== null ? (
                                    <>
                                      <span className={`font-mono text-xs ${
                                        isExhausted ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                                      }`}>
                                        {formatRupiah(benefit.sisa)}
                                      </span>
                                      {isExhausted && (
                                        <Badge className="bg-red-100/80 text-red-700 text-[10px] px-1.5 py-0.5 font-medium">
                                          Habis
                                        </Badge>
                                      )}
                                      {isLow && !isExhausted && (
                                        <Badge className="bg-amber-100/80 text-amber-700 text-[10px] px-1.5 py-0.5 font-medium">
                                          Tidak Mencukupi
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-slate-700">
                            Batasan Klaim Pertahun
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className="text-[10px] font-medium">
                              Per Tahun
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-slate-800">
                            {formatRupiah(benefitPlan.yearlyLimit)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 2: Rincian Penerapan Limit Manfaat */}
              <div className="px-4 pt-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">Rincian Penerapan Limit Manfaat</h3>
                    <button
                      onClick={handleRevertAll}
                      disabled={!hasAnyChanges}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-all ${
                        hasAnyChanges
                          ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer'
                          : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                      data-testid="revert-all-btn"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Kembalikan Seperti Semula
                    </button>
                  </div>

                  {/* Consolidated Alert Box */}
                  {(() => {
                    const dailyExcessItems = limitItems.filter(i => {
                      const benefit = benefitPlan.benefits.find(b => b.id === i.currentBenefitId);
                      return i.excess > 0 && benefit?.batasan === 'Per Hari';
                    });
                    const yearlyLowItems = benefitPlan.benefits.filter(b => 
                      b.batasan === 'Per Tahun' && b.sisa !== null && b.sisa > 0 && b.sisa <= b.limit * 0.2
                    );
                    const yearlyExhaustedItems = benefitPlan.benefits.filter(b => 
                      b.batasan === 'Per Tahun' && b.sisa === 0
                    );
                    
                    const hasIssues = dailyExcessItems.length > 0 || yearlyLowItems.length > 0 || yearlyExhaustedItems.length > 0;
                    
                    if (!hasIssues) return null;
                    
                    return (
                      <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <div className="text-xs font-semibold text-amber-800">Perhatian: Limit Manfaat</div>
                            
                            {dailyExcessItems.length > 0 && (
                              <div className="text-xs text-amber-700">
                                <span className="font-medium">Inner limit terlampaui:</span> {dailyExcessItems.length} item melebihi batas harian
                              </div>
                            )}
                            
                            {yearlyLowItems.map(benefit => (
                              <div key={benefit.id} className="text-xs text-amber-700">
                                <span className="font-medium">{benefit.name}</span> (sisa {formatRupiah(benefit.sisa!)})
                              </div>
                            ))}
                            
                            {yearlyExhaustedItems.map(benefit => (
                              <div key={benefit.id} className="text-xs text-red-700">
                                <span className="font-medium">{benefit.name}</span> <span className="text-red-600">(habis)</span>
                              </div>
                            ))}
                            
                            {calculations.totalExcess > 0 && (
                              <div className="text-xs text-amber-800 font-medium pt-1 border-t border-amber-200">
                                Total excess: {formatRupiah(calculations.totalExcess)} menjadi tanggungan peserta
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-2.5 py-2 text-left text-xs font-semibold text-slate-600 w-10">No.</th>
                          <th className="px-2.5 py-2 text-left text-xs font-semibold text-slate-600 w-40">Item</th>
                          <th className="px-2.5 py-2 text-left text-xs font-semibold text-slate-600 w-48">
                            <div className="flex items-center gap-1">
                              Tipe benefit
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Kategori manfaat ditentukan oleh AI Strator berdasarkan jenis layanan. Kamu dapat mengubah jika diperlukan.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2.5 py-2 text-right text-xs font-semibold text-slate-600 w-28">
                            <div className="flex items-center justify-end gap-1">
                              Tagihan disetujui
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Jumlah ini adalah jumlah yang telah terverifikasi pada tahap analisa Kesesuaian Klinis dan Harga.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2.5 py-2 text-center text-xs font-semibold text-slate-600 w-20">Batasan</th>
                          <th className="px-2.5 py-2 text-right text-xs font-semibold text-slate-600 w-28">
                            <div className="flex items-center justify-end gap-1">
                              Limit / Sisa limit
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Untuk manfaat Per Hari: menampilkan limit harian. Untuk manfaat Per Tahun: menampilkan sisa limit tahunan.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2.5 py-2 text-right text-xs font-semibold text-slate-600 w-24">Jumlah excess</th>
                          <th className="px-2.5 py-2 text-left text-xs font-semibold text-slate-600 w-40">Catatan</th>
                          <th className="px-2.5 py-2 w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {limitItems.map((item, idx) => {
                          const currentBenefit = benefitPlan.benefits.find(b => b.id === item.currentBenefitId);
                          
                          return (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-2.5 py-2 text-xs text-slate-600">{idx + 1}</td>
                              <td className="px-2.5 py-2 text-xs text-slate-800 font-medium">{item.itemName}</td>
                              <td className="px-2.5 py-2">
                                <div className="space-y-1">
                                  <Select
                                    value={item.currentBenefitId}
                                    onValueChange={(value) => handleBenefitChange(item.id, value)}
                                  >
                                    <SelectTrigger className={`h-7 text-[11px] ${item.hasChanges ? 'border-amber-400 bg-amber-50' : ''}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {benefitPlan.benefits.map(benefit => (
                                        <SelectItem key={benefit.id} value={benefit.id} className="text-xs">
                                          {benefit.limitId ? `[${benefit.limitId}] ` : ''}{benefit.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[9px] px-1.5 py-0 font-medium ${getConfidenceBadgeStyle(item.aiConfidence)}`}
                                      >
                                        {item.aiConfidence}% Confidence
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">Semakin tinggi persentase, semakin yakin Strator dengan pengklasifikasian item ini dengan tipe manfaat yang tersedia untuk plan Peserta ini.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-800">
                                {formatRupiah(item.approvedAmount)}
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <Badge variant="outline" className="text-[10px] font-medium">
                                  {currentBenefit?.batasan || '-'}
                                </Badge>
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                {currentBenefit ? (
                                  currentBenefit.batasan === 'Per Tahun' && currentBenefit.sisa !== null ? (
                                    <span className={`font-mono text-xs ${
                                      currentBenefit.sisa === 0 ? 'text-red-600' : 
                                      currentBenefit.sisa <= currentBenefit.limit * 0.2 ? 'text-amber-600' : 
                                      'text-emerald-600'
                                    }`}>
                                      {formatRupiah(currentBenefit.sisa)}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-xs text-slate-800">
                                      {formatRupiah(currentBenefit.limit)}
                                    </span>
                                  )
                                ) : '-'}
                              </td>
                              <td className={`px-2.5 py-2 text-right font-mono text-xs font-medium ${item.excess > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                {formatRupiah(item.excess)}
                              </td>
                              <td className="px-2.5 py-2">
                                <Input
                                  value={item.catatan}
                                  onChange={(e) => handleCatatanChange(item.id, e.target.value)}
                                  disabled={!item.hasChanges}
                                  placeholder={item.hasChanges ? "Wajib isi catatan..." : "Tambah catatan..."}
                                  className={`h-7 text-[11px] ${
                                    !item.hasChanges 
                                      ? 'bg-slate-50 text-slate-400' 
                                      : item.catatan.length < 20
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-amber-300 bg-amber-50'
                                  }`}
                                />
                              </td>
                              <td className="px-2.5 py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleRevertItem(item.id)}
                                    disabled={!item.hasChanges}
                                    className={`w-6 h-6 inline-flex items-center justify-center rounded border transition-all ${
                                      item.hasChanges
                                        ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                        : 'border-slate-200 bg-white text-slate-300 opacity-50'
                                    }`}
                                    title="Kembalikan ke nilai AI"
                                    data-testid={`revert-btn-${item.id}`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleItemFeedback(item.id, 'positive')}
                                    className={`w-6 h-6 inline-flex items-center justify-center rounded border transition-all ${
                                      itemFeedback[item.id] === 'positive'
                                        ? 'border-emerald-400 bg-emerald-100 text-emerald-600'
                                        : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                    title="AI benar"
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleItemFeedback(item.id, 'negative')}
                                    className={`w-6 h-6 inline-flex items-center justify-center rounded border transition-all ${
                                      itemFeedback[item.id] === 'negative'
                                        ? 'border-amber-400 bg-amber-100 text-amber-600'
                                        : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:bg-amber-50'
                                    }`}
                                    title="AI perlu diperbaiki"
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-2.5 py-2 text-xs font-semibold text-slate-700">
                            Total: {limitItems.length} Item
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono text-xs font-semibold text-slate-800">
                            {formatRupiah(calculations.totalApproved)}
                          </td>
                          <td colSpan={2}></td>
                          <td className="px-2.5 py-2 text-right font-mono text-xs font-semibold text-red-600">
                            {formatRupiah(calculations.totalExcess)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 3: Ringkasan Pembayaran */}
              <div className="px-4 pt-4 pb-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-800">Ringkasan Pembayaran</h3>
                  </div>
                  
                  <div className="p-4 space-y-6">
                    {/* Kalkulasi */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kalkulasi</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span>Tagihan disetujui</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Jumlah ini adalah jumlah yang telah terverifikasi pada tahap analisa Kesesuaian Klinis dan Harga.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="font-mono text-slate-800">{formatRupiah(calculations.totalApproved)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span>Excess (melebihi limit)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Jumlah yang melebihi batas manfaat harian/tahunan. Menjadi tanggungan peserta.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="font-mono text-red-600">− {formatRupiah(calculations.totalExcess)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="font-semibold text-slate-800">Subtotal setelah limit</span>
                          <span className="font-mono font-semibold text-slate-800">{formatRupiah(calculations.subtotalAfterLimit)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Perhitungan Co-Insurance */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Perhitungan Co-Insurance</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span>Dibayar Asuransi ({benefitPlan.coInsuranceInsurer}%)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Bagian yang ditanggung asuransi berdasarkan persentase co-insurance.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="font-mono text-emerald-600">{formatRupiah(calculations.insurerPays)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span>Dibayar Peserta (Co-Ins {benefitPlan.coInsuranceMember}%)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Bagian co-insurance yang menjadi tanggungan peserta.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="font-mono text-slate-800">{formatRupiah(calculations.memberCoins)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-800">Total tanggungan Peserta</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Excess ({formatRupiah(calculations.totalExcess)}) + Co-Insurance ({formatRupiah(calculations.memberCoins)}) = Total yang harus dibayar peserta.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="font-mono font-semibold text-slate-800">{formatRupiah(calculations.memberTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="save-continue-btn"
                  >
                    Simpan & Lanjutkan
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackType === 'positive' ? (
                <>
                  <ThumbsUp className="w-5 h-5 text-emerald-500" />
                  <span>Analisa AI Benar</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-5 h-5 text-amber-500" />
                  <span>Perlu Diperbaiki</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {feedbackType === 'positive' 
                ? "Terima kasih! Feedback Anda membantu kami meningkatkan akurasi AI."
                : "Mohon jelaskan apa yang perlu diperbaiki:"
              }
            </p>
            {feedbackType === 'negative' && (
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Jelaskan masalah yang Anda temukan..."
                className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitFeedback} className="bg-blue-600 hover:bg-blue-700">
              Kirim Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
