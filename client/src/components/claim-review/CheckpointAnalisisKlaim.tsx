import { useState, useMemo, useRef, RefObject, Fragment, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, AlertTriangle, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Claim } from "@shared/schema";
import { formatRupiah } from "@/utils/formatters";
import { getStatusTag, getTagColorClass } from "@/utils/checkpointHelpers";
import { useToast } from "@/hooks/use-toast";
import { generateLimitId, getPolicyCodeFromClaim, getBenefitLimitIdMappings } from "@/utils/benefitPlanLookup";

type Keputusan = 'setujui' | 'sebagian' | 'tolak';
type BenefitCategory = 'konsultasi_dokter' | 'obat-obatan' | 'lab_diagnostik' | 'biaya_administrasi' | 'prosedur_tindakan' | 'kamar_rawat';

interface LineItem {
  id: number;
  name: string;
  type: 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN';
  limitId: string;
  qty: number;
  unitPrice: number;
  charged: number;
  bukuTarif: number;
  aiRecommendedAmount: number;
  currentApprovedAmount: number;
  aiDecision: Keputusan;
  currentDecision: Keputusan;
  aiConfidence: number;
  userNotes: string;
  hasUserChanges: boolean;
  benefitCategory: BenefitCategory;
  medicalAnalysis: {
    isAppropriate: boolean;
    diagnosis: string;
    item: string;
    reasoning: string;
    recommendation: string;
  };
  tarifAnalysis: {
    isWithinLimit: boolean;
    chargedAmount: number;
    agreedTarif: number;
    difference: number;
    differencePercent: number;
    reasoning: string;
    recommendation: string;
  };
  manualAdd?: boolean;
}

interface CheckpointAnalisisKlaimProps {
  claim: Claim;
  isExpanded: boolean;
  onExpandChange: (open: boolean) => void;
  isHighlighted: boolean;
  checkpointRef: RefObject<HTMLDivElement>;
  onDecisionChange?: (totalApproved: number, totalCharged: number, itemsApproved: number, itemsRejected: number, lineItemAmounts?: Array<{ name: string; approved: number }>) => void;
  onIssuesCountChange?: (count: number) => void;
  onLineItemOverrideCount?: (count: number) => void;
  onSave?: (action: 'continue') => void;
}

export function CheckpointAnalisisKlaim({
  claim,
  isExpanded,
  onExpandChange,
  isHighlighted,
  checkpointRef,
  onDecisionChange,
  onIssuesCountChange,
  onLineItemOverrideCount,
  onSave,
}: CheckpointAnalisisKlaimProps) {
  const { toast } = useToast();
  
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesModalItemId, setNotesModalItemId] = useState<number | null>(null);
  const [notesModalText, setNotesModalText] = useState('');
  const [notesModalError, setNotesModalError] = useState(false);
  
  const [revertAllModalOpen, setRevertAllModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // AI Feedback states (Summary level)
  const [aiFeedbackModalOpen, setAiFeedbackModalOpen] = useState(false);
  const [aiFeedbackType, setAiFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [aiFeedbackText, setAiFeedbackText] = useState('');
  const [summaryFeedbackGiven, setSummaryFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  
  // Per-item feedback states
  const [itemFeedback, setItemFeedback] = useState<Record<number, 'positive' | 'negative' | null>>({});
  const [feedbackItemId, setFeedbackItemId] = useState<number | null>(null); // null means summary-level feedback
  
  const [addFormData, setAddFormData] = useState({
    name: '',
    type: '' as 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN' | '',
    qty: 0,
    unitPrice: 0,
    amount: 0,
    benefitCategory: 'obat-obatan' as BenefitCategory,
  });

  const policyCode = useMemo(() => getPolicyCodeFromClaim(claim), [claim]);
  const claimType: 'RJ' | 'RI' = claim.claimType?.toLowerCase().includes('inap') ? 'RI' : 'RJ';
  
  const generateLineItems = useMemo((): LineItem[] => {
    const items: LineItem[] = [];
    
    if (claim.cp5ItemAnalysis && claim.cp5ItemAnalysis.length > 0) {
      claim.cp5ItemAnalysis.forEach((aiItem, idx) => {
        const chargedPrice = aiItem.chargedPrice ?? 0;
        const marketPrice = aiItem.marketPrice ?? chargedPrice;
        const quantity = aiItem.quantity ?? 1;
        const confidence = aiItem.aiConfidence ?? 85;
        const isAppropriate = aiItem.clinicalAppropriateness?.isAppropriate ?? true;
        const isOverpriced = aiItem.pricingAnalysis?.isOverpriced ?? false;
        
        let itemType: 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN' = 'DRUG';
        if (aiItem.itemType && aiItem.itemType !== 'OTHER') {
          itemType = aiItem.itemType as 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN';
        } else {
          const nameLower = aiItem.itemName.toLowerCase();
          if (nameLower.includes('konsultasi') || nameLower.includes('dokter') || nameLower.includes('pemeriksaan')) {
            itemType = 'CONS';
          } else if (nameLower.includes('prosedur') || nameLower.includes('tindakan') || nameLower.includes('injeksi')) {
            itemType = 'PROC';
          } else if (nameLower.includes('kamar') || nameLower.includes('room') || nameLower.includes('rawat inap')) {
            itemType = 'ROOM';
          } else if (nameLower.includes('lab') || nameLower.includes('darah') || nameLower.includes('urine')) {
            itemType = 'LAB';
          } else if (nameLower.includes('admin') || nameLower.includes('materai') || nameLower.includes('registrasi')) {
            itemType = 'ADMIN';
          }
        }

        const recommendation = aiItem.aiRecommendation ?? 'APPROVE';
        let aiDecision: Keputusan = 'setujui';
        let aiRecommendedAmount = chargedPrice;
        
        if (recommendation === 'REJECT' || !isAppropriate) {
          aiDecision = 'tolak';
          aiRecommendedAmount = 0;
        } else if (isOverpriced && marketPrice < chargedPrice) {
          aiDecision = 'sebagian';
          aiRecommendedAmount = marketPrice;
        }

        const difference = chargedPrice - marketPrice;
        const differencePercent = marketPrice > 0 ? (difference / marketPrice) * 100 : 0;

        const benefitMap: Record<string, BenefitCategory> = {
          'CONS': 'konsultasi_dokter',
          'DRUG': 'obat-obatan',
          'LAB': 'lab_diagnostik',
          'ADMIN': 'biaya_administrasi',
          'PROC': 'prosedur_tindakan',
          'ROOM': 'kamar_rawat',
        };

        items.push({
          id: idx + 1,
          name: aiItem.itemName,
          type: itemType,
          limitId: generateLimitId(policyCode, itemType, claimType),
          qty: quantity,
          unitPrice: quantity > 0 ? Math.round(chargedPrice / quantity) : chargedPrice,
          charged: chargedPrice,
          bukuTarif: marketPrice,
          aiRecommendedAmount,
          currentApprovedAmount: aiRecommendedAmount,
          aiDecision,
          currentDecision: aiDecision,
          aiConfidence: confidence,
          userNotes: aiDecision !== 'setujui' ? 'Disesuaikan dengan rekomendasi AI' : '',
          hasUserChanges: false,
          benefitCategory: benefitMap[itemType] || 'obat-obatan',
          medicalAnalysis: {
            isAppropriate,
            diagnosis: claim.icd10 || claim.diagnosis || 'N/A',
            item: aiItem.itemName,
            reasoning: aiItem.clinicalAppropriateness?.reasoning || 'Sesuai dengan diagnosa pasien',
            recommendation: isAppropriate ? 'Setujui sesuai tagihan' : 'Tolak - tidak sesuai indikasi medis',
          },
          tarifAnalysis: {
            isWithinLimit: !isOverpriced,
            chargedAmount: chargedPrice,
            agreedTarif: marketPrice,
            difference,
            differencePercent,
            reasoning: aiItem.pricingAnalysis?.reasoning || (isOverpriced ? `Harga melebihi tarif kesepakatan` : 'Harga sesuai atau di bawah buku tarif'),
            recommendation: isOverpriced ? `Approve ${formatRupiah(marketPrice)} sesuai buku tarif` : 'Setujui sesuai tagihan',
          },
        });
      });
      return items;
    }
    
    if (claim.items && claim.items.length > 0) {
      claim.items.forEach((item, idx) => {
        const priceInfo = claim.analysis?.priceAnalysis?.find(p => 
          p.item.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]) ||
          item.name.toLowerCase().includes(p.item.toLowerCase().split(' ')[0])
        );
        
        const isOverpriced = priceInfo?.flag === 'OVERPRICED';
        const bukuTarif = priceInfo?.marketPrice || item.totalPrice;
        const charged = priceInfo?.chargedPrice || item.totalPrice;
        
        let itemType: 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN' = 'DRUG';
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('konsultasi') || nameLower.includes('dokter') || nameLower.includes('pemeriksaan')) {
          itemType = 'CONS';
        } else if (nameLower.includes('prosedur') || nameLower.includes('tindakan') || nameLower.includes('injeksi')) {
          itemType = 'PROC';
        } else if (nameLower.includes('kamar') || nameLower.includes('room') || nameLower.includes('rawat inap')) {
          itemType = 'ROOM';
        } else if (nameLower.includes('lab') || nameLower.includes('darah') || nameLower.includes('urine')) {
          itemType = 'LAB';
        } else if (nameLower.includes('admin') || nameLower.includes('materai') || nameLower.includes('registrasi')) {
          itemType = 'ADMIN';
        }

        const aiDecision: Keputusan = isOverpriced ? 'sebagian' : 'setujui';
        const aiRecommendedAmount = isOverpriced ? bukuTarif : charged;
        const difference = charged - bukuTarif;
        const differencePercent = bukuTarif > 0 ? (difference / bukuTarif) * 100 : 0;

        const benefitMap: Record<string, BenefitCategory> = {
          'CONS': 'konsultasi_dokter',
          'DRUG': 'obat-obatan',
          'LAB': 'lab_diagnostik',
          'ADMIN': 'biaya_administrasi',
          'PROC': 'prosedur_tindakan',
          'ROOM': 'kamar_rawat',
        };

        items.push({
          id: idx + 1,
          name: item.name,
          type: itemType,
          limitId: generateLimitId(policyCode, itemType, claimType),
          qty: item.quantity,
          unitPrice: item.quantity > 0 ? Math.round(charged / item.quantity) : charged,
          charged,
          bukuTarif,
          aiRecommendedAmount,
          currentApprovedAmount: aiRecommendedAmount,
          aiDecision,
          currentDecision: aiDecision,
          aiConfidence: 85,
          userNotes: aiDecision !== 'setujui' ? 'Disesuaikan dengan buku tarif' : '',
          hasUserChanges: false,
          benefitCategory: benefitMap[itemType] || 'obat-obatan',
          medicalAnalysis: {
            isAppropriate: true,
            diagnosis: claim.icd10 || claim.diagnosis || 'N/A',
            item: item.name,
            reasoning: 'Sesuai dengan diagnosa pasien',
            recommendation: 'Setujui secara medis',
          },
          tarifAnalysis: {
            isWithinLimit: !isOverpriced,
            chargedAmount: charged,
            agreedTarif: bukuTarif,
            difference,
            differencePercent,
            reasoning: isOverpriced ? `Harga melebihi tarif kesepakatan sebesar ${formatRupiah(difference)}` : 'Harga sesuai atau di bawah buku tarif',
            recommendation: isOverpriced ? `Approve ${formatRupiah(bukuTarif)} sesuai buku tarif` : 'Setujui sesuai tagihan',
          },
        });
      });
    }

    const isClaimTolak = claim.adjudicationResult === 'Tolak' || 
      claim.checkpointStatuses?.keputusanAkhir === 'failed';
    if (isClaimTolak) {
      items.forEach(item => {
        item.aiRecommendedAmount = 0;
        item.currentApprovedAmount = 0;
        item.aiDecision = 'tolak';
        item.currentDecision = 'tolak';
      });
    }
    
    return items;
  }, [claim, policyCode, claimType]);

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  useEffect(() => {
    setLineItems(generateLineItems);
  }, [generateLineItems]);

  const summary = useMemo(() => {
    let totalCharged = 0;
    let totalApproved = 0;
    let totalRejectedMedis = 0;
    let totalSelisihTarif = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let partialCount = 0;

    lineItems.forEach(item => {
      totalCharged += item.charged;
      totalApproved += item.currentApprovedAmount;
      
      if (item.currentDecision === 'setujui') {
        approvedCount++;
      } else if (item.currentDecision === 'tolak') {
        rejectedCount++;
        if (!item.medicalAnalysis.isAppropriate) {
          totalRejectedMedis += item.charged;
        }
      } else if (item.currentDecision === 'sebagian') {
        partialCount++;
        if (!item.tarifAnalysis.isWithinLimit) {
          totalSelisihTarif += item.tarifAnalysis.difference;
        }
      }
    });

    return { 
      totalCharged, 
      totalApproved, 
      totalRejectedMedis,
      totalSelisihTarif,
      approvedCount, 
      rejectedCount, 
      partialCount,
      total: lineItems.length 
    };
  }, [lineItems]);

  const temuan = useMemo(() => {
    const issues: Array<{ type: 'tarif' | 'medis'; text: string }> = [];
    
    lineItems.forEach(item => {
      if (!item.tarifAnalysis.isWithinLimit && item.tarifAnalysis.difference > 0) {
        issues.push({
          type: 'tarif',
          text: `Selisih buku tarif: ${item.name} ditagih ${formatRupiah(item.charged)}, tarif kesepakatan ${formatRupiah(item.bukuTarif)} (selisih ${formatRupiah(item.tarifAnalysis.difference)} / +${item.tarifAnalysis.differencePercent.toFixed(1)}%)`
        });
      }
      if (!item.medicalAnalysis.isAppropriate) {
        issues.push({
          type: 'medis',
          text: `Tidak sesuai medis: ${item.name} tidak terindikasi untuk ${claim.diagnosis || claim.icd10 || 'diagnosa'}. Rekomendasi: ditolak (${formatRupiah(item.charged)})`
        });
      }
    });
    
    return issues;
  }, [lineItems, claim]);

  const issuesCount = temuan.length;

  // Report issues count to parent for sidebar sync
  useEffect(() => {
    onIssuesCountChange?.(issuesCount);
  }, [issuesCount, onIssuesCountChange]);

  useEffect(() => {
    const count = lineItems.filter(item => item.currentApprovedAmount !== item.aiRecommendedAmount).length;
    onLineItemOverrideCount?.(count);
  }, [lineItems, onLineItemOverrideCount]);

  useEffect(() => {
    const lineItemAmounts = lineItems.map(item => ({ name: item.name, approved: item.currentApprovedAmount }));
    onDecisionChange?.(summary.totalApproved, summary.totalCharged, summary.approvedCount, summary.rejectedCount, lineItemAmounts);
  }, [summary.totalApproved, summary.totalCharged, summary.approvedCount, summary.rejectedCount, lineItems]);

  const overallDecision = useMemo((): 'disetujui' | 'ditolak' | 'setujui_sebagian' => {
    if (summary.rejectedCount === summary.total && summary.total > 0) {
      return 'ditolak';
    }
    if (summary.approvedCount === summary.total && summary.partialCount === 0) {
      return 'disetujui';
    }
    return 'setujui_sebagian';
  }, [summary]);

  const handleKeputusanChange = (itemId: number, newKeputusan: Keputusan) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      let newAmount = item.currentApprovedAmount;
      let needsNotes = false;
      
      if (newKeputusan === 'setujui') {
        newAmount = item.charged;
        needsNotes = false;
      } else if (newKeputusan === 'tolak') {
        newAmount = 0;
        needsNotes = true;
      } else if (newKeputusan === 'sebagian') {
        newAmount = item.aiRecommendedAmount < item.charged ? item.aiRecommendedAmount : Math.round(item.charged * 0.8);
        needsNotes = true;
      }
      
      const hasChanges = newKeputusan !== item.aiDecision || newAmount !== item.aiRecommendedAmount;
      
      return {
        ...item,
        currentDecision: newKeputusan,
        currentApprovedAmount: newAmount,
        hasUserChanges: hasChanges,
        userNotes: needsNotes && !item.userNotes ? '' : item.userNotes,
      };
    }));
  };

  const handleAmountChange = (itemId: number, newAmount: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      let newKeputusan: Keputusan = item.currentDecision;
      
      if (newAmount === 0) {
        newKeputusan = 'tolak';
      } else if (newAmount >= item.charged) {
        newKeputusan = 'setujui';
      } else {
        newKeputusan = 'sebagian';
      }
      
      const hasChanges = newKeputusan !== item.aiDecision || newAmount !== item.aiRecommendedAmount;
      const needsNotes = newKeputusan !== 'setujui';
      
      return {
        ...item,
        currentApprovedAmount: newAmount,
        currentDecision: newKeputusan,
        hasUserChanges: hasChanges,
        userNotes: needsNotes && !item.userNotes ? '' : item.userNotes,
      };
    }));
  };

  const handleRevertItem = (itemId: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      return {
        ...item,
        currentApprovedAmount: item.aiRecommendedAmount,
        currentDecision: item.aiDecision,
        hasUserChanges: false,
        userNotes: item.aiDecision !== 'setujui' ? 'Disesuaikan dengan rekomendasi AI' : '',
      };
    }));
    
    toast({
      title: "Item dikembalikan",
      description: "Item telah dikembalikan ke rekomendasi AI",
    });
  };

  const handleRevertAll = () => {
    // Reset to AI baseline and remove manually added items
    setLineItems(prev => {
      // Filter out manually added items
      const aiItems = prev.filter(item => !item.manualAdd);
      
      // Reset AI items to their original recommendations
      return aiItems.map(item => ({
        ...item,
        currentApprovedAmount: item.aiRecommendedAmount,
        currentDecision: item.aiDecision,
        hasUserChanges: false,
        userNotes: item.aiDecision !== 'setujui' ? 'Disesuaikan dengan rekomendasi AI' : '',
        // Reset benefit category based on item type
        benefitCategory: (() => {
          const benefitMap: Record<string, BenefitCategory> = {
            'CONS': 'konsultasi_dokter',
            'DRUG': 'obat-obatan',
            'LAB': 'lab_diagnostik',
            'ADMIN': 'biaya_administrasi',
            'PROC': 'prosedur_tindakan',
            'ROOM': 'kamar_rawat',
          };
          return benefitMap[item.type] || item.benefitCategory;
        })(),
      }));
    });
    
    setRevertAllModalOpen(false);
    toast({
      title: "Semua dikembalikan",
      description: "Semua item telah dikembalikan ke rekomendasi AI. Item manual telah dihapus.",
    });
  };

  const openNotesModal = (itemId: number) => {
    const item = lineItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.currentDecision === 'setujui' && !item.hasUserChanges) {
      return;
    }
    
    setNotesModalItemId(itemId);
    setNotesModalText(item.userNotes);
    setNotesModalError(false);
    setNotesModalOpen(true);
  };

  const saveNotes = () => {
    if (notesModalText.length < 10) {
      setNotesModalError(true);
      return;
    }
    
    setLineItems(prev => prev.map(item => {
      if (item.id !== notesModalItemId) return item;
      return { ...item, userNotes: notesModalText };
    }));
    
    setNotesModalOpen(false);
    toast({
      title: "Catatan disimpan",
      description: "Catatan perubahan telah disimpan",
    });
  };

  const getNotesButtonState = (item: LineItem): 'disabled' | 'needs-input' | 'has-notes' => {
    if (item.currentDecision === 'setujui' && !item.hasUserChanges) {
      return 'disabled';
    }
    if (!item.userNotes || item.userNotes.length < 10) {
      return 'needs-input';
    }
    return 'has-notes';
  };

  const handleSave = () => {
    const itemsNeedingNotes = lineItems.filter(item => {
      const state = getNotesButtonState(item);
      return state === 'needs-input';
    });
    
    if (itemsNeedingNotes.length > 0) {
      toast({
        variant: "destructive",
        title: "Catatan diperlukan",
        description: `${itemsNeedingNotes.length} item memerlukan catatan perubahan sebelum dapat disimpan.`,
      });
      return;
    }
    
    onDecisionChange?.(summary.totalApproved, summary.totalCharged, summary.approvedCount, summary.rejectedCount);
    onSave?.('continue');
  };

  const saveNewItem = () => {
    if (!addFormData.name || !addFormData.type || !addFormData.qty || !addFormData.amount) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang diperlukan",
      });
      return;
    }

    const itemType = addFormData.type as 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN';
    const newItem: LineItem = {
      id: lineItems.length + 1,
      name: addFormData.name,
      type: itemType,
      limitId: generateLimitId(policyCode, itemType, claimType),
      qty: addFormData.qty,
      unitPrice: addFormData.unitPrice,
      charged: addFormData.amount,
      bukuTarif: addFormData.amount,
      aiRecommendedAmount: addFormData.amount,
      currentApprovedAmount: addFormData.amount,
      aiDecision: 'setujui',
      currentDecision: 'setujui',
      aiConfidence: 0,
      userNotes: 'Item ditambahkan secara manual',
      hasUserChanges: true,
      benefitCategory: addFormData.benefitCategory,
      manualAdd: true,
      medicalAnalysis: {
        isAppropriate: true,
        diagnosis: claim.icd10 || claim.diagnosis || 'N/A',
        item: addFormData.name,
        reasoning: 'Ditambahkan manual oleh analis',
        recommendation: 'Review manual diperlukan',
      },
      tarifAnalysis: {
        isWithinLimit: true,
        chargedAmount: addFormData.amount,
        agreedTarif: addFormData.amount,
        difference: 0,
        differencePercent: 0,
        reasoning: 'Ditambahkan manual',
        recommendation: 'Setujui sesuai input',
      },
    };

    setLineItems(prev => [...prev, newItem]);
    setAddModalOpen(false);
    setAddFormData({
      name: '',
      type: '',
      qty: 0,
      unitPrice: 0,
      amount: 0,
      benefitCategory: 'obat-obatan',
    });

    toast({
      title: "Item ditambahkan",
      description: `${addFormData.name} telah ditambahkan ke daftar`,
    });
  };

  const getTypeBadgeInfo = (type: string) => {
    const typeMap: Record<string, { label: string; class: string }> = {
      'CONS': { label: 'Konsultasi', class: 'bg-blue-50 text-blue-700' },
      'DRUG': { label: 'Obat', class: 'bg-green-50 text-green-700' },
      'PROC': { label: 'Prosedur', class: 'bg-purple-50 text-purple-700' },
      'ROOM': { label: 'Kamar', class: 'bg-orange-50 text-orange-700' },
      'LAB': { label: 'Lab', class: 'bg-pink-50 text-pink-700' },
      'ADMIN': { label: 'Admin', class: 'bg-slate-50 text-slate-700' },
    };
    return typeMap[type] || { label: type, class: 'bg-slate-50 text-slate-700' };
  };

  // Helper function to get confidence badge styling
  const getConfidenceBadgeStyle = (confidence: number) => {
    if (confidence >= 85) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    } else if (confidence >= 60) {
      return 'bg-amber-100 text-amber-700 border-amber-300';
    } else {
      return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  // Handle opening AI feedback modal (for summary level)
  const handleOpenFeedbackModal = (type: 'positive' | 'negative') => {
    setFeedbackItemId(null); // null = summary-level feedback
    setAiFeedbackType(type);
    setAiFeedbackText('');
    setAiFeedbackModalOpen(true);
  };

  // Handle opening AI feedback modal (for per-item level)
  const handleItemFeedback = (itemId: number, feedback: 'positive' | 'negative') => {
    setFeedbackItemId(itemId);
    setAiFeedbackType(feedback);
    setAiFeedbackText('');
    setAiFeedbackModalOpen(true);
  };

  // Handle submitting AI feedback (both summary and per-item)
  const handleSubmitFeedback = () => {
    if (feedbackItemId === null) {
      // Summary-level feedback
      setSummaryFeedbackGiven(aiFeedbackType);
    } else {
      // Per-item feedback
      setItemFeedback(prev => ({
        ...prev,
        [feedbackItemId]: aiFeedbackType
      }));
    }
    setAiFeedbackModalOpen(false);
    toast({
      title: aiFeedbackType === 'positive' ? "Terima kasih!" : "Feedback diterima",
      description: aiFeedbackType === 'positive' 
        ? "Feedback positif Anda membantu meningkatkan akurasi AI." 
        : "Kami akan menggunakan feedback ini untuk memperbaiki analisa AI.",
    });
  };

  const tag = getStatusTag('analisisKlaim', claim.checkpointStatuses?.analisisKlaim, claim);

  const aiConfidenceAvg = useMemo(() => {
    if (lineItems.length === 0) return 85;
    return Math.round(lineItems.reduce((sum, item) => sum + item.aiConfidence, 0) / lineItems.length);
  }, [lineItems]);

  const diagnoses = useMemo(() => {
    const primary = {
      code: claim.icd10 || 'N/A',
      name: claim.diagnosis || 'Tidak tersedia',
    };
    
    // Use secondary diagnoses from cp5ItemAnalysis if available
    const analysisData = claim.analysis as Record<string, unknown> | undefined;
    const diagnosesData = analysisData?.diagnoses as Array<{ icd10?: string; name?: string }> | undefined;
    
    const secondary = diagnosesData?.filter((_: unknown, idx: number) => idx > 0).map((d: { icd10?: string; name?: string }) => ({
      code: d.icd10 || 'N/A',
      name: d.name || d.icd10 || 'N/A',
    })) || [];
    
    return { primary, secondary };
  }, [claim]);

  return (
    <Fragment>
      <Collapsible open={isExpanded} onOpenChange={onExpandChange}>
        <Card 
          ref={checkpointRef} 
          className={`overflow-hidden transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} 
          data-testid="checkpoint-5"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900 text-left">Kesesuaian Klinis & Harga</h2>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 font-medium ${issuesCount > 0 ? getTagColorClass('red') : getTagColorClass('green')}`}
                >
                  {issuesCount > 0 ? `${issuesCount} Temuan` : 'Sesuai'}
                </Badge>
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
              
              {/* Diagnosa Section */}
              <div className="mx-4 mb-4 p-4 bg-white border border-slate-200 rounded-md">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Diagnosa</h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 p-2.5 bg-blue-50/50 border border-blue-200/50 rounded">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white uppercase">Utama</span>
                    <code className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono font-semibold">{diagnoses.primary.code}</code>
                    <span className="text-sm text-slate-700">{diagnoses.primary.name}</span>
                  </div>
                  
                  {diagnoses.secondary.map((diag, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-400 text-white uppercase">Sekunder</span>
                      <code className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono font-semibold">{diag.code}</code>
                      <span className="text-sm text-slate-700">{diag.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-slate-200">
                  <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Anamnesa</h5>
                  <div className="space-y-1.5 text-[13px]">
                    {(() => {
                      const analysisData = claim.analysis as Record<string, unknown> | undefined;
                      const clinicalHistory = analysisData?.clinicalHistory as { chiefComplaint?: string; medicalHistory?: string; physicalExam?: string } | undefined;
                      return (
                        <>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-medium w-32 shrink-0">Keluhan utama:</span>
                            <span className="text-slate-700">{clinicalHistory?.chiefComplaint || 'Tidak tersedia'}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-medium w-32 shrink-0">Riwayat penyakit:</span>
                            <span className="text-slate-700">{clinicalHistory?.medicalHistory || 'Tidak tersedia'}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-medium w-32 shrink-0">Pemeriksaan fisik:</span>
                            <span className="text-slate-700">{clinicalHistory?.physicalExam || 'Tidak tersedia'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Ringkasan Analisa */}
              <div className="mx-4 mb-4 p-4 bg-white border border-slate-200 rounded-md">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Ringkasan Analisa</h4>
                
                {temuan.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50/50 border border-red-200 border-l-4 border-l-red-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Temuan yang Memerlukan Perhatian</span>
                    </div>
                    <ul className="space-y-2">
                      {temuan.map((t, idx) => (
                        <li key={idx} className="flex gap-2 text-[13px] text-slate-700">
                          <span className="text-red-500 font-bold">●</span>
                          <span><strong>{t.type === 'tarif' ? 'Selisih buku tarif:' : 'Tidak sesuai medis:'}</strong> {t.text.split(':').slice(1).join(':')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[13px] text-slate-600 flex items-center gap-1">
                      Total Ditagih
                      <div className="group/ditagih relative inline-block">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        {/* Bridge element for hover stability */}
                        <div className="absolute left-0 top-full w-56 h-2 bg-transparent hidden group-hover/ditagih:block pointer-events-auto" />
                        <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/ditagih:block pointer-events-auto">
                          <div className="w-56 bg-slate-800 text-white text-[11px] p-2 rounded shadow-lg">
                            Total biaya perawatan/pengobatan Peserta
                          </div>
                        </div>
                      </div>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatRupiah(summary.totalCharged)}</span>
                  </div>
                  {summary.totalRejectedMedis > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-[13px] text-slate-600 flex items-center gap-1">
                        Total Ditolak
                        <div className="group/ditolak relative inline-block">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                          {/* Bridge element for hover stability */}
                          <div className="absolute left-0 top-full w-64 h-2 bg-transparent hidden group-hover/ditolak:block pointer-events-auto" />
                          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/ditolak:block pointer-events-auto">
                            <div className="w-64 bg-slate-800 text-white text-[11px] p-2 rounded shadow-lg">
                              Total biaya perawatan/pengobatan yang tidak sesuai dengan Diagnosa/Polis
                            </div>
                          </div>
                        </div>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-red-600">− {formatRupiah(summary.totalRejectedMedis)}</span>
                    </div>
                  )}
                  {summary.totalSelisihTarif > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-[13px] text-slate-600 flex items-center gap-1">
                        Selisih Buku Tarif
                        <div className="group/selisih relative inline-block">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                          {/* Bridge element for hover stability */}
                          <div className="absolute left-0 top-full w-64 h-2 bg-transparent hidden group-hover/selisih:block pointer-events-auto" />
                          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/selisih:block pointer-events-auto">
                            <div className="w-64 bg-slate-800 text-white text-[11px] p-2 rounded shadow-lg">
                              Selisih perbedaan harga antara perawatan/pengobatan Peserta dengan Buku Tarif
                            </div>
                          </div>
                        </div>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-amber-600">− {formatRupiah(summary.totalSelisihTarif)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-slate-900">
                    <span className="text-sm font-semibold text-slate-900">Total di-approve</span>
                    <span className="text-lg font-bold tabular-nums text-emerald-600">{formatRupiah(summary.totalApproved)}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Analisa Tagihan Table */}
              <div className="mx-4 mb-4 bg-white border border-slate-200 rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900">Rincian Analisa Tagihan</h4>
                  <button 
                    onClick={() => setRevertAllModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    data-testid="revert-all-btn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Kembalikan seperti semula
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[1100px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 text-left text-[11px] font-semibold text-slate-500 w-10">No.</th>
                        <th className="p-2.5 text-left text-[11px] font-semibold text-slate-500 w-36">Nama</th>
                        <th className="p-2.5 text-left text-[11px] font-semibold text-slate-500 w-24">Limit ID</th>
                        <th className="p-2.5 text-center text-[11px] font-semibold text-slate-500 w-14">Jumlah</th>
                        <th className="p-2.5 text-right text-[11px] font-semibold text-slate-500 w-20">Harga</th>
                        <th className="p-2.5 text-right text-[11px] font-semibold text-slate-500 w-24">Total ditagih</th>
                        <th className="p-2.5 text-left text-[11px] font-semibold text-slate-500 w-28">Kesesuaian Medis</th>
                        <th className="p-2.5 text-left text-[11px] font-semibold text-slate-500 w-28">Kesesuaian Tarif</th>
                        <th className="p-2.5 text-right text-[11px] font-semibold text-slate-500 w-28">Total di-approve</th>
                        <th className="p-2.5 text-center text-[11px] font-semibold text-slate-500 w-14">Catatan</th>
                        <th className="p-2.5 text-center text-[11px] font-semibold text-slate-500 w-24">Keputusan</th>
                        <th className="p-2.5 text-center text-[11px] font-semibold text-slate-500 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => {
                        const typeInfo = getTypeBadgeInfo(item.type);
                        const notesState = getNotesButtonState(item);
                        
                        return (
                          <tr 
                            key={item.id} 
                            className={`border-b border-slate-100 hover:bg-slate-50/50 ${item.manualAdd ? 'bg-blue-50/30' : ''}`}
                            data-testid={`line-item-${item.id}`}
                          >
                            <td className="p-2.5 text-slate-400 font-medium">{item.id}</td>
                            <td className="p-2.5">
                              <div className="font-medium text-slate-900 mb-0.5">{item.name}</div>
                              {/* Confidence Badge with tooltip - replaces type label for AI rows */}
                              {!item.manualAdd ? (
                                <div className="group/conf relative inline-block">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-default ${getConfidenceBadgeStyle(item.aiConfidence)}`}>
                                    {item.aiConfidence}% Confidence
                                  </span>
                                  {/* Bridge element for hover stability */}
                                  <div className="absolute left-0 top-full w-56 h-2 bg-transparent hidden group-hover/conf:block pointer-events-auto" />
                                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/conf:block pointer-events-auto">
                                    <div className="w-56 bg-slate-800 text-white text-[11px] p-2 rounded shadow-lg">
                                      Semakin tinggi persentase, semakin yakin Strator terhadap hasil ekstraksi dan analisa item ini.
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${typeInfo.class}`}>
                                  {typeInfo.label}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {item.limitId}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-slate-700">{item.qty}</td>
                            <td className="p-2.5 text-right font-mono text-slate-700">{formatRupiah(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-mono font-medium text-slate-900">{formatRupiah(item.charged)}</td>
                            {/* Kesesuaian Medis with Tooltip - hover bridge pattern */}
                            <td className="p-2.5">
                              <div className="group/medis relative">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border cursor-default ${
                                  item.medicalAnalysis.isAppropriate 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {item.medicalAnalysis.isAppropriate ? '✅' : '❌'}
                                  <span>{item.medicalAnalysis.isAppropriate ? 'Sesuai' : 'Tidak sesuai'}</span>
                                </div>
                                
                                {/* Bridge element spans full gap to maintain hover */}
                                <div className="absolute left-0 top-full w-72 h-3 bg-transparent hidden group-hover/medis:block pointer-events-auto" />
                                
                                {/* Tooltip positioned within bridge coverage */}
                                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/medis:block pointer-events-auto">
                                  <div className="w-72 bg-white border border-slate-200 rounded-md shadow-lg p-3">
                                    <div className="text-xs font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">Kesesuaian Medis</div>
                                    <div className="space-y-1.5 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Diagnosa:</span>
                                        <span className="text-slate-700 font-medium">{item.medicalAnalysis.diagnosis}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Item:</span>
                                        <span className="text-slate-700 font-medium">{item.medicalAnalysis.item}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                      <p className="text-[11px] text-slate-600 leading-relaxed">
                                        <strong>Analisa:</strong> {item.medicalAnalysis.reasoning}
                                      </p>
                                    </div>
                                    <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded-r text-[11px] text-slate-700">
                                      <strong>Rekomendasi:</strong> {item.medicalAnalysis.recommendation}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Kesesuaian Tarif with Tooltip - hover bridge pattern */}
                            <td className="p-2.5">
                              <div className="group/tarif relative">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border cursor-default ${
                                  item.tarifAnalysis.isWithinLimit 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {item.tarifAnalysis.isWithinLimit ? '✅' : '❌'}
                                  <span>{item.tarifAnalysis.isWithinLimit ? 'Sesuai' : 'Melebihi'}</span>
                                </div>
                                
                                {/* Bridge element spans full gap to maintain hover */}
                                <div className="absolute left-0 top-full w-72 h-3 bg-transparent hidden group-hover/tarif:block pointer-events-auto" />
                                
                                {/* Tooltip positioned within bridge coverage */}
                                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/tarif:block pointer-events-auto">
                                  <div className="w-72 bg-white border border-slate-200 rounded-md shadow-lg p-3">
                                    <div className="text-xs font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">Kesesuaian Tarif</div>
                                    <div className="space-y-1.5 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Tarif ditagih:</span>
                                        <span className="text-slate-700 font-medium">{formatRupiah(item.tarifAnalysis.chargedAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Tarif kesepakatan:</span>
                                        <span className="text-slate-700 font-medium">{formatRupiah(item.tarifAnalysis.agreedTarif)}</span>
                                      </div>
                                      {item.tarifAnalysis.difference > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Selisih:</span>
                                          <span className="text-red-600 font-medium">+{formatRupiah(item.tarifAnalysis.difference)} ({item.tarifAnalysis.differencePercent.toFixed(1)}%)</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                      <p className="text-[11px] text-slate-600">
                                        <strong>Status:</strong> {item.tarifAnalysis.reasoning}
                                      </p>
                                    </div>
                                    <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded-r text-[11px] text-slate-700">
                                      <strong>Rekomendasi:</strong> {item.tarifAnalysis.recommendation}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Total di-approve (editable) */}
                            <td className="p-2.5 text-right">
                              <Input
                                type="text"
                                value={formatRupiah(item.currentApprovedAmount)}
                                onChange={(e) => {
                                  const numValue = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                  handleAmountChange(item.id, numValue);
                                }}
                                className={`h-8 w-24 text-right text-xs font-mono ${
                                  item.hasUserChanges ? 'border-amber-400 bg-amber-50' : ''
                                }`}
                                data-testid={`amount-input-${item.id}`}
                              />
                            </td>
                            {/* Catatan button */}
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => openNotesModal(item.id)}
                                disabled={notesState === 'disabled'}
                                className={`w-8 h-8 inline-flex items-center justify-center rounded border text-base transition-all ${
                                  notesState === 'disabled' 
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 bg-white' 
                                    : notesState === 'needs-input'
                                    ? 'border-red-300 bg-red-50 animate-pulse cursor-pointer hover:bg-red-100'
                                    : 'border-emerald-300 bg-emerald-50 cursor-pointer hover:bg-emerald-100'
                                }`}
                                data-testid={`notes-btn-${item.id}`}
                              >
                                {notesState === 'disabled' ? '📝' : notesState === 'needs-input' ? '⚠️' : '✅'}
                              </button>
                            </td>
                            {/* Keputusan dropdown */}
                            <td className="p-2.5 text-center">
                              <Select 
                                value={item.currentDecision} 
                                onValueChange={(value: Keputusan) => handleKeputusanChange(item.id, value)}
                              >
                                <SelectTrigger className={`h-8 text-[11px] font-medium ${
                                  item.currentDecision === 'setujui' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                    : item.currentDecision === 'sebagian'
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-red-50 text-red-700 border-red-300'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="setujui">Setujui</SelectItem>
                                  <SelectItem value="sebagian">Sebagian</SelectItem>
                                  <SelectItem value="tolak">Tolak</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            {/* Revert button + Per-item Feedback buttons */}
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Revert button */}
                                <button
                                  onClick={() => handleRevertItem(item.id)}
                                  className={`w-7 h-7 inline-flex items-center justify-center rounded border transition-all ${
                                    item.hasUserChanges 
                                      ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer' 
                                      : 'border-slate-200 bg-white text-slate-300 opacity-50'
                                  }`}
                                  title="Revert ke rekomendasi AI"
                                  data-testid={`revert-btn-${item.id}`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Per-item feedback buttons - only for AI rows, not manual adds */}
                                {!item.manualAdd && (
                                  <>
                                    <button
                                      onClick={() => handleItemFeedback(item.id, 'positive')}
                                      className={`w-7 h-7 inline-flex items-center justify-center rounded border transition-all ${
                                        itemFeedback[item.id] === 'positive'
                                          ? 'border-emerald-400 bg-emerald-100 text-emerald-600'
                                          : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500'
                                      }`}
                                      title="AI benar untuk item ini"
                                      data-testid={`item-feedback-positive-${item.id}`}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleItemFeedback(item.id, 'negative')}
                                      className={`w-7 h-7 inline-flex items-center justify-center rounded border transition-all ${
                                        itemFeedback[item.id] === 'negative'
                                          ? 'border-amber-400 bg-amber-100 text-amber-600'
                                          : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500'
                                      }`}
                                      title="AI perlu diperbaiki untuk item ini"
                                      data-testid={`item-feedback-negative-${item.id}`}
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-sm font-semibold text-slate-700">
                          Total: {lineItems.length} Item
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(summary.totalCharged)}
                        </td>
                        <td colSpan={2}></td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {formatRupiah(summary.totalApproved)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Add Item Button */}
                <div className="p-3 bg-slate-50 border-t border-dashed border-slate-200">
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 bg-white border border-dashed border-slate-300 rounded hover:border-slate-400 hover:text-slate-800 transition-colors"
                    data-testid="add-item-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah item
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mx-4 mb-4 p-4 bg-white border border-slate-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">Keputusan Akhir Klaim:</span>
                  <span className={`px-3 py-1.5 rounded text-sm font-semibold ${
                    overallDecision === 'disetujui' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : overallDecision === 'ditolak'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {overallDecision === 'disetujui' ? 'Disetujui' : overallDecision === 'ditolak' ? 'Ditolak' : 'Setujui Sebagian'}
                  </span>
                </div>
                <Button 
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="save-btn"
                >
                  Simpan
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={(open) => {
        if (!open) {
          setNotesModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catatan Perubahan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {notesModalItemId && (
              <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                {lineItems.find(i => i.id === notesModalItemId)?.name}
              </div>
            )}
            
            <div>
              <Label className="text-sm">Alasan perubahan dari rekomendasi AI:</Label>
              <Textarea 
                value={notesModalText}
                onChange={(e) => {
                  setNotesModalText(e.target.value);
                  setNotesModalError(false);
                }}
                placeholder="Jelaskan alasan perubahan keputusan atau jumlah..."
                className={`mt-2 min-h-[100px] ${notesModalError ? 'border-red-500' : ''}`}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 karakter</p>
              {notesModalError && (
                <p className="text-xs text-red-600 mt-1">Catatan harus minimal 10 karakter</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveNotes} className="bg-blue-600 hover:bg-blue-700">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Revert All Modal */}
      <Dialog open={revertAllModalOpen} onOpenChange={setRevertAllModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center py-4">
            <div className="text-5xl mb-4">↺</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Kembalikan Seperti Semula?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Kamu yakin ingin mengembalikan semua perubahan menjadi seperti semula? Semua perubahan manual akan hilang.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRevertAllModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleRevertAll} className="bg-amber-600 hover:bg-amber-700">
                Ya, Kembalikan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add Item Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Item Baru
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-800">
                ⚠️ Item tidak terdeteksi oleh OCR
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Masukkan data secara manual. Pastikan item ini benar-benar ada di invoice.
              </div>
            </div>

            <div>
              <Label className="text-xs">Nama Item *</Label>
              <Input 
                value={addFormData.name}
                onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., PARACETAMOL 500MG"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Tipe *</Label>
              <Select 
                value={addFormData.type} 
                onValueChange={(value: 'CONS' | 'DRUG' | 'PROC' | 'ROOM' | 'LAB' | 'ADMIN') => 
                  setAddFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="-- Pilih Tipe --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONS">Konsultasi</SelectItem>
                  <SelectItem value="DRUG">Obat</SelectItem>
                  <SelectItem value="PROC">Prosedur</SelectItem>
                  <SelectItem value="ROOM">Kamar</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="ADMIN">Administrasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Jumlah *</Label>
                <Input 
                  type="number"
                  value={addFormData.qty || ''}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 10"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Satuan (Rp)</Label>
                <Input 
                  type="number"
                  value={addFormData.unitPrice || ''}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, unitPrice: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 5000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Total (Rp) *</Label>
              <Input 
                type="number"
                value={addFormData.amount || ''}
                onChange={(e) => setAddFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 50000"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Kategori Benefit</Label>
              <Select 
                value={addFormData.benefitCategory} 
                onValueChange={(value: BenefitCategory) => 
                  setAddFormData(prev => ({ ...prev, benefitCategory: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="konsultasi_dokter">Konsultasi Dokter</SelectItem>
                  <SelectItem value="obat-obatan">Obat-obatan</SelectItem>
                  <SelectItem value="lab_diagnostik">Lab & Diagnostik</SelectItem>
                  <SelectItem value="biaya_administrasi">Biaya Administrasi</SelectItem>
                  <SelectItem value="prosedur_tindakan">Prosedur/Tindakan</SelectItem>
                  <SelectItem value="kamar_rawat">Kamar Rawat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveNewItem} className="bg-green-600 hover:bg-green-700">
              💾 Tambah Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* AI Feedback Modal - handles both summary and per-item feedback */}
      <Dialog open={aiFeedbackModalOpen} onOpenChange={setAiFeedbackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {aiFeedbackType === 'positive' ? (
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
            {/* Show item context for per-item feedback */}
            {feedbackItemId !== null && (
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Item:</span>
                <p className="text-sm font-medium text-slate-800">
                  {lineItems.find(item => item.id === feedbackItemId)?.name || 'Item tidak ditemukan'}
                </p>
              </div>
            )}
            
            <p className="text-sm text-slate-600">
              {aiFeedbackType === 'positive' 
                ? "Terima kasih! Feedback Anda membantu kami meningkatkan akurasi AI."
                : "Kami menghargai feedback Anda. Tolong jelaskan bagian mana yang perlu diperbaiki."
              }
            </p>
            
            <div>
              <Label className="text-sm">Detail feedback (opsional):</Label>
              <Textarea 
                value={aiFeedbackText}
                onChange={(e) => setAiFeedbackText(e.target.value)}
                placeholder={aiFeedbackType === 'positive' 
                  ? "Bagian mana yang paling membantu? (opsional)"
                  : "Jelaskan bagian yang salah atau perlu diperbaiki..."
                }
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAiFeedbackModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitFeedback} 
              className={aiFeedbackType === 'positive' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              Kirim Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
