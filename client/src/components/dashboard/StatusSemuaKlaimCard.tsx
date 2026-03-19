import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { z } from "zod";
import { claimSchema } from "@shared/schema";
import { formatRupiah } from "@/utils/formatters";

type Claim = z.infer<typeof claimSchema>;

interface StatusSemuaKlaimCardProps {
  claims: Claim[];
}

export default function StatusSemuaKlaimCard({ claims }: StatusSemuaKlaimCardProps) {
  const stats = useMemo(() => {
    const totalCount = claims.length;
    const totalAmount = claims.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Helper to check if claim has any checkpoint failures
    // Aligned with aggregation logic: count failed, warning, in-progress, awaiting, and pending as issues
    const hasCheckpointFailures = (claim: Claim) => {
      if (!claim.checkpointStatuses) return false;
      const statuses = Object.values(claim.checkpointStatuses);
      return statuses.some(s => s === 'failed' || s === 'warning' || s === 'in-progress' || s === 'awaiting' || s === 'pending');
    };
    
    // Helper to check if claim is rejected (keputusanAkhir failed)
    const isRejected = (claim: Claim) => {
      return claim.checkpointStatuses?.keputusanAkhir === 'failed' || 
             claim.adjudicationResult === 'Tolak';
    };
    
    // Categorize claims based on checkpoint outcomes
    // Bersih: All checkpoints passed
    // Ditandai: At least one checkpoint failed/in-progress but not rejected
    // Ditolak: Final decision (keputusanAkhir) failed OR adjudication is Tolak
    const bersihClaims = claims.filter(c => !hasCheckpointFailures(c) && !isRejected(c));
    const ditolakClaims = claims.filter(c => isRejected(c));
    const ditandaiClaims = claims.filter(c => hasCheckpointFailures(c) && !isRejected(c));
    
    const bersihCount = bersihClaims.length;
    const ditandaiCount = ditandaiClaims.length;
    const ditolakCount = ditolakClaims.length;
    
    // Calculate amounts by status
    const bersihAmount = bersihClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const ditandaiAmount = ditandaiClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const ditolakAmount = ditolakClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Calculate percentages
    const bersihPct = totalAmount > 0 ? Math.round((bersihAmount / totalAmount) * 100) : 0;
    const ditandaiPct = totalAmount > 0 ? Math.round((ditandaiAmount / totalAmount) * 100) : 0;
    const ditolakPct = totalAmount > 0 ? Math.round((ditolakAmount / totalAmount) * 100) : 0;
    
    return {
      totalCount,
      totalAmount,
      bersih: { count: bersihCount, amount: bersihAmount, percentage: bersihPct },
      ditandai: { count: ditandaiCount, amount: ditandaiAmount, percentage: ditandaiPct },
      ditolak: { count: ditolakCount, amount: ditolakAmount, percentage: ditolakPct },
    };
  }, [claims]);

  // Determine period display (example: "Tgl 1-16" based on current date)
  const getCurrentPeriod = () => {
    const today = new Date();
    const day = today.getDate();
    
    if (day <= 7) return 'Tgl 1-16';
    if (day <= 14) return 'Tgl 1-16';
    if (day <= 21) return 'Tgl 1-16';
    if (day <= 28) return 'Tgl 1-16';
    return 'Tgl 1-16';
  };

  return (
    <Card className="shadow-sm border border-slate-200 h-full">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-medium text-slate-900">Status Semua Klaim</h3>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-slate-900" data-testid="total-claims">
                {stats.totalCount}
              </div>
              <p className="text-xs text-slate-500">
                Total Diproses ({formatRupiah(stats.totalAmount)}) - {getCurrentPeriod()}
              </p>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          {/* Bersih - Green */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-700">Bersih</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-green-600" data-testid="status-bersih-count">
                {stats.bersih.count}
              </span>
              <span className="text-xs text-slate-500">
                {stats.bersih.percentage}% • {formatRupiah(stats.bersih.amount)}
              </span>
            </div>
          </div>

          {/* Ditandai - Yellow/Orange */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-700">Ditandai</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-yellow-600" data-testid="status-ditandai-count">
                {stats.ditandai.count}
              </span>
              <span className="text-xs text-slate-500">
                {stats.ditandai.percentage}% • {formatRupiah(stats.ditandai.amount)}
              </span>
            </div>
          </div>

          {/* Ditolak - Red */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-slate-700">Ditolak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-red-600" data-testid="status-ditolak-count">
                {stats.ditolak.count}
              </span>
              <span className="text-xs text-slate-500">
                {stats.ditolak.percentage}% • {formatRupiah(stats.ditolak.amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
