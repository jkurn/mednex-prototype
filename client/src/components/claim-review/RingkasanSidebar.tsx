import { Badge } from "@/components/ui/badge";
import { Claim } from "@shared/schema";
import { useMemo } from "react";
import { getStatusTag, getCheckpoint4Status, getCheckpoint5Status, getTagColorClass, computePengecualianStatus } from "@/utils/checkpointHelpers";

interface RingkasanSidebarProps {
  claim: Claim;
  cp5IssuesCount?: number | null;
  onCheckpointClick?: (checkpointId: string) => void;
}

// Calculate CP5 issues count from claim analysis data
// Must match exactly the logic in CheckpointAnalisisKlaim.tsx temuan calculation
const calculateCP5IssuesCount = (claim: Claim): number => {
  if (!claim.cp5ItemAnalysis || claim.cp5ItemAnalysis.length === 0) {
    return 0;
  }
  
  let issuesCount = 0;
  claim.cp5ItemAnalysis.forEach((aiItem: Record<string, unknown>) => {
    // Check medical appropriateness (matches: !item.medicalAnalysis.isAppropriate)
    const clinicalAppropriateness = aiItem.clinicalAppropriateness as { isAppropriate?: boolean } | undefined;
    const isAppropriate = clinicalAppropriateness?.isAppropriate ?? true;
    if (!isAppropriate) {
      issuesCount++;
    }
    
    // Check pricing/tariff compliance (matches: !item.tarifAnalysis.isWithinLimit && item.tarifAnalysis.difference > 0)
    // The accordion calculates difference as: chargedPrice - marketPrice
    const pricingAnalysis = aiItem.pricingAnalysis as { isOverpriced?: boolean } | undefined;
    const isOverpriced = pricingAnalysis?.isOverpriced ?? false;
    const chargedPrice = (aiItem.chargedPrice as number) ?? 0;
    const marketPrice = (aiItem.marketPrice as number) ?? chargedPrice;
    const difference = chargedPrice - marketPrice;
    
    // Match accordion: only count if overpriced AND difference > 0
    if (isOverpriced && difference > 0) {
      issuesCount++;
    }
  });
  
  return issuesCount;
};

export default function RingkasanSidebar({ claim, cp5IssuesCount: propCp5IssuesCount, onCheckpointClick }: RingkasanSidebarProps) {
  // Use prop if available (from accordion), otherwise fallback to calculation
  const fallbackCount = useMemo(() => calculateCP5IssuesCount(claim), [claim]);
  const cp5IssuesCount = propCp5IssuesCount ?? fallbackCount;
  // Checkpoint configurations - all always expanded
  const checkpoints = [
    {
      id: 'checkpoint1',
      key: 'validitasPeserta',
      name: 'Status Kepesertaan',
      hasSubChecks: false,
      status: claim.checkpointStatuses?.validitasPeserta,
    },
    {
      id: 'checkpoint2',
      key: 'kelengkapanDokumen',
      name: 'Kelengkapan Dokumen',
      hasSubChecks: false,
      status: claim.checkpointStatuses?.kelengkapanDokumen,
    },
    {
      id: 'checkpoint3',
      key: 'ketepatanWaktu',
      name: 'Ketepatan Waktu',
      hasSubChecks: false,
      status: claim.checkpointStatuses?.ketepatanWaktu,
    },
    {
      id: 'checkpoint4',
      key: 'pengecualianPolis',
      name: 'Pengecualian dan Masa Tunggu',
      hasSubChecks: true,
      status: getCheckpoint4Status(claim),
      subChecks: [
        {
          id: 'checkpoint4a',
          key: 'pengecualianPolisSubcheck',
          name: 'Pengecualian Polis',
          status: computePengecualianStatus(claim),
        },
        {
          id: 'checkpoint4b',
          key: 'masaTungguSubcheck',
          name: 'Masa Tunggu',
          status: claim.checkpointStatuses?.masaTungguSubcheck,
        },
      ],
    },
    {
      id: 'checkpoint5',
      key: 'analisisKlaim',
      name: 'Kesesuaian Klinis dan Harga',
      hasSubChecks: false,
      status: getCheckpoint5Status(claim),
    },
    {
      id: 'checkpoint6',
      key: 'batasManfaat',
      name: 'Batas Manfaat',
      hasSubChecks: false,
      status: claim.checkpointStatuses?.batasManfaat,
    },
    {
      id: 'checkpoint7',
      key: 'keputusanAkhir',
      name: 'Keputusan Akhir',
      hasSubChecks: false,
      status: claim.checkpointStatuses?.keputusanAkhir,
    },
  ];

  return (
    <div className="bg-white border-l border-slate-200 h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
        <h3 className="text-sm font-semibold text-slate-900 text-left">Rangkuman Analisa</h3>
      </div>

      <div className="p-3 space-y-1">
        {checkpoints.map((checkpoint) => {
          const tag = getStatusTag(checkpoint.key, checkpoint.status, claim);

          return (
            <div key={checkpoint.id}>
              {/* Main Checkpoint Row - No icons, always expanded */}
              <div
                onClick={() => onCheckpointClick?.(checkpoint.id)}
                className="flex items-start px-2 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                data-testid={`checkpoint-${checkpoint.id}`}
              >
                <span className="text-xs font-semibold text-slate-900 leading-tight flex-1 min-w-0">
                  {checkpoint.name}
                </span>
                {/* Only show tags for checkpoints without subchecks */}
                {!checkpoint.hasSubChecks && (
                  <div className="w-[130px] shrink-0 flex justify-end">
                    {/* Special handling for CP5 to match accordion header badge */}
                    {checkpoint.key === 'analisisKlaim' ? (
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 font-medium whitespace-nowrap ${cp5IssuesCount > 0 ? getTagColorClass('red') : getTagColorClass('green')}`}
                        data-testid={`tag-${checkpoint.id}`}
                      >
                        {cp5IssuesCount > 0 ? `${cp5IssuesCount} Temuan` : 'Sesuai'}
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 font-medium whitespace-nowrap ${getTagColorClass(tag.color)}`}
                        data-testid={`tag-${checkpoint.id}`}
                      >
                        {tag.text}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-checkpoints - Always visible if they exist */}
              {checkpoint.hasSubChecks && checkpoint.subChecks && checkpoint.subChecks.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {checkpoint.subChecks.map((subCheck) => {
                    const subTag = getStatusTag(subCheck.key, subCheck.status, claim);
                    
                    return (
                      <div
                        key={subCheck.id}
                        onClick={() => onCheckpointClick?.(subCheck.id)}
                        className="flex items-start px-2 py-2 pl-4 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors relative"
                        data-testid={`subcheck-${subCheck.id}`}
                      >
                        {/* Tree branch */}
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200" />
                        <div className="absolute left-1.5 top-3 w-2 h-px bg-slate-200" />
                        
                        <span className="text-xs text-slate-700 leading-tight flex-1 min-w-0">
                          {subCheck.name}
                        </span>
                        <div className="w-[130px] shrink-0 flex justify-end">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-medium whitespace-nowrap ${getTagColorClass(subTag.color)}`}
                            data-testid={`tag-${subCheck.id}`}
                          >
                            {subTag.text}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
