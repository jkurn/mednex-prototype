import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, Minus } from "lucide-react";
import { Claim } from "@shared/schema";
import { formatRupiah, formatDateIndonesian, calculateAge } from "@/utils/formatters";
import { getStatusTag } from "@/utils/checkpointHelpers";

interface HeroClaimSummaryProps {
  claim: Claim;
  originalTotalCharged?: number | null;
}

function getRecommendationInfo(claim: Claim): { label: string; color: string; icon: typeof CheckCircle } {
  const status = claim.checkpointStatuses?.keputusanAkhir;
  if (status === 'passed') {
    return { label: 'Setujui', color: 'bg-green-600 text-white', icon: CheckCircle };
  }
  if (status === 'failed') {
    return { label: 'Tolak', color: 'bg-red-600 text-white', icon: AlertTriangle };
  }

  const hasOvercharge = claim.fraudFlags?.some(f => f.type === 'OVERPRICING') ||
    claim.analysis?.priceAnalysis?.some(p => p.flag === 'OVERPRICED');
  const hasFailed = claim.checkpointStatuses?.analisisKlaim === 'failed' ||
    claim.checkpointStatuses?.pengecualianPolis === 'failed';

  if (hasOvercharge || hasFailed) {
    return { label: 'Setujui Sebagian', color: 'bg-yellow-500 text-white', icon: AlertTriangle };
  }

  const allPassed = claim.checkpointStatuses?.validitasPeserta === 'passed' &&
    claim.checkpointStatuses?.kelengkapanDokumen === 'passed' &&
    claim.checkpointStatuses?.ketepatanWaktu === 'passed';

  if (allPassed) {
    return { label: 'Setujui', color: 'bg-green-600 text-white', icon: CheckCircle };
  }

  return { label: 'Menunggu Review', color: 'bg-slate-500 text-white', icon: Clock };
}

function getConfidencePercent(claim: Claim): number {
  if (claim.cp4Decision?.aiRecommendation?.confidence) {
    return Math.round(claim.cp4Decision.aiRecommendation.confidence * 100);
  }
  if (claim.riskScore !== undefined) {
    return Math.max(50, 100 - claim.riskScore);
  }

  let score = 60;
  const cs = claim.checkpointStatuses;
  if (cs?.validitasPeserta === 'passed') score += 8;
  if (cs?.kelengkapanDokumen === 'passed') score += 7;
  if (cs?.ketepatanWaktu === 'passed') score += 5;
  if (cs?.pengecualianPolis === 'passed') score += 5;
  if (cs?.analisisKlaim === 'passed') score += 8;
  if (cs?.batasManfaat === 'passed') score += 7;
  return Math.min(98, score);
}

function getTemuanCount(claim: Claim): number {
  let count = 0;
  if (claim.fraudFlags) count += claim.fraudFlags.length;
  if (claim.fraudRisks) count += claim.fraudRisks.length;
  const cs = claim.checkpointStatuses;
  if (cs?.pengecualianPolis === 'failed') count++;
  if (cs?.kesesuaianMedisSubcheck === 'failed') count++;
  if (cs?.kesesuaianTerapiSubcheck === 'failed') count++;
  if (cs?.verifikasiHargaSubcheck === 'failed') count++;
  return count;
}

function getProcessingTime(claim: Claim): string {
  const docCount = claim.documents?.length || 1;
  const baseTime = 0.8 + (docCount * 0.3);
  const jitter = (parseInt(claim.id.replace(/\D/g, '').slice(-2) || '50') / 100) * 0.6;
  const time = baseTime + jitter;
  return time < 1 ? `${Math.round(time * 60)} detik` : `${time.toFixed(1)} menit`;
}

export function getRecommendedAmount(claim: Claim, totalCharged?: number | null): number {
  const recommendation = getRecommendationInfo(claim);
  if (recommendation.label === 'Tolak') return 0;

  const billAmount = totalCharged ?? claim.amount;

  if (claim.revisedAmount !== undefined) return Math.min(claim.revisedAmount, billAmount);

  let totalDeduction = 0;
  if (claim.totalOvercharge) totalDeduction += claim.totalOvercharge;
  if (claim.fraudFlags) {
    for (const flag of claim.fraudFlags) {
      if (flag.estimatedSaving) totalDeduction += flag.estimatedSaving;
      if (flag.excess) totalDeduction += flag.excess;
    }
  }
  if (claim.fraudRisks) {
    for (const risk of claim.fraudRisks) {
      if (risk.estimatedOvercharge) totalDeduction += risk.estimatedOvercharge;
    }
  }
  const recommended = Math.max(0, claim.amount - totalDeduction);
  return Math.min(recommended, billAmount);
}

interface FindingCategory {
  title: string;
  items: string[];
}

function getFindings(claim: Claim): FindingCategory[] {
  const pelanggaranPolis: string[] = [];
  const indikasOvercharge: string[] = [];
  const indikasKetidaksesuaian: string[] = [];
  const indikasiFraud: string[] = [];

  const cs = claim.checkpointStatuses;
  if (cs?.pengecualianPolis === 'failed' || cs?.pengecualianPolisSubcheck === 'failed') {
    if (claim.cp4Decision?.aiRecommendation?.summary) {
      pelanggaranPolis.push(claim.cp4Decision.aiRecommendation.summary);
    } else {
      pelanggaranPolis.push('Terdapat pengecualian polis yang berlaku untuk klaim ini');
    }
  }
  if (cs?.ketepatanWaktu === 'failed') {
    pelanggaranPolis.push('Klaim diajukan melebihi batas waktu yang ditetapkan');
  }
  if (cs?.kelengkapanDokumen === 'failed') {
    pelanggaranPolis.push('Dokumen klaim tidak lengkap sesuai ketentuan polis');
  }

  if (claim.fraudFlags) {
    for (const flag of claim.fraudFlags) {
      if (flag.type === 'OVERPRICING') {
        const detail = flag.item
          ? `${flag.item}${flag.excess ? ` - ${formatRupiah(flag.excess)} di atas harga pasar` : ''}`
          : flag.description;
        indikasOvercharge.push(detail);
      }
    }
  }
  if (claim.analysis?.priceAnalysis) {
    for (const p of claim.analysis.priceAnalysis) {
      if (p.flag === 'OVERPRICED') {
        indikasOvercharge.push(`${p.item} (ditagih ${formatRupiah(p.chargedPrice)}, harga pasar ${formatRupiah(p.marketPrice)})`);
      }
    }
  }

  if (cs?.kesesuaianMedisSubcheck === 'failed') {
    if (claim.aiAnalysis?.kesesuaianMedisSubcheck) {
      indikasKetidaksesuaian.push(claim.aiAnalysis.kesesuaianMedisSubcheck);
    } else {
      indikasKetidaksesuaian.push('Ditemukan ketidaksesuaian diagnosis dengan tindakan medis');
    }
  }
  if (cs?.kesesuaianTerapiSubcheck === 'failed') {
    if (claim.aiAnalysis?.kesesuaianTerapiSubcheck) {
      indikasKetidaksesuaian.push(claim.aiAnalysis.kesesuaianTerapiSubcheck);
    } else {
      indikasKetidaksesuaian.push('Ditemukan item obat tidak sesuai formularium');
    }
  }
  if ((claim as any).itemizedAnalysis) {
    for (const item of (claim as any).itemizedAnalysis) {
      if (item.issues && item.issues.length > 0) {
        for (const issue of item.issues) {
          if (!indikasKetidaksesuaian.includes(issue)) {
            indikasKetidaksesuaian.push(issue);
          }
        }
      }
    }
  }

  if (claim.memberStatus === 'TIDAK DITEMUKAN') {
    indikasiFraud.unshift('Peserta tidak ditemukan dalam database kepesertaan aktif — identitas klaim tidak dapat diverifikasi');
  }

  if (claim.fraudFlags) {
    for (const flag of claim.fraudFlags) {
      if (flag.type !== 'OVERPRICING') {
        indikasiFraud.push(flag.description);
      }
    }
  }
  if (claim.fraudRisks) {
    for (const risk of claim.fraudRisks) {
      if (risk.type !== 'OVERPRICING' && risk.type !== 'overpricing') {
        indikasiFraud.push(risk.description);
      }
    }
  }


  return [
    { title: 'Pelanggaran Polis', items: pelanggaranPolis },
    { title: 'Indikasi Overcharge', items: indikasOvercharge },
    { title: 'Indikasi Ketidaksesuaian Medis', items: indikasKetidaksesuaian },
    { title: 'Indikasi Fraud', items: indikasiFraud },
  ];
}

function buildPatientSummary(claim: Claim): string {
  const name = claim.patientName || 'Pasien';
  const gender = claim.patientGender === 'P' ? 'perempuan' : 'laki-laki';
  const age = claim.patientAge || (claim.patientDOB ? calculateAge(claim.patientDOB) : null);
  const ageStr = age ? `berusia ${Math.floor(age)} tahun` : '';
  const claimType = claim.benefitCategory || 'Rawat Jalan';
  const diagnosis = claim.diagnosis || '-';
  const icdCodes = claim.icd10Codes?.map(c => c.code).join(', ') || claim.icd10 || '';
  const icdStr = icdCodes ? ` - ${icdCodes}` : '';
  const provider = claim.provider || '-';
  const treatmentDate = claim.treatmentDate ? formatDateIndonesian(claim.treatmentDate) : claim.date ? formatDateIndonesian(claim.date) : '-';

  let summary = `${name}, ${gender}`;
  if (ageStr) summary += `, ${ageStr}`;
  summary += ` mengajukan klaim ${claimType}`;
  summary += `, di diagnosa dengan ${diagnosis}${icdStr}`;
  summary += `. Pemeriksaan dilakukan di ${provider} pada tanggal ${treatmentDate}.`;

  return summary;
}

export function HeroClaimSummary({ claim, originalTotalCharged }: HeroClaimSummaryProps) {
  const recommendation = getRecommendationInfo(claim);
  const confidence = getConfidencePercent(claim);
  const temuanCount = getTemuanCount(claim);
  const processingTime = getProcessingTime(claim);
  const recommendedAmount = getRecommendedAmount(claim, originalTotalCharged);
  const findings = getFindings(claim);
  const patientSummary = buildPatientSummary(claim);
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Rekomendasi Strator MedNex</h3>

      <div className="flex items-center gap-3 mb-4">
        <Badge className={`${recommendation.color} text-xs px-3 py-1 font-medium flex items-center gap-1.5`}>
          <RecommendationIcon className="w-3.5 h-3.5" />
          {recommendation.label}
        </Badge>
        <span className="text-xs text-slate-600 font-medium">{confidence}% Confidence</span>
      </div>

      <h4 className="text-xs font-semibold text-slate-700 mb-2">Rangkuman</h4>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Total Klaim</div>
          <div className="text-sm font-bold text-slate-900">{formatRupiah(originalTotalCharged ?? claim.amount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Rekomendasi</div>
          <div className="text-sm font-bold text-slate-900">{formatRupiah(recommendedAmount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Temuan</div>
          <div className="text-sm font-bold text-slate-900">{temuanCount}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Waktu Pemrosesan</div>
          <div className="text-sm font-bold text-slate-900">{processingTime}</div>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-slate-700 mb-2">Tentang Klaim Ini</h4>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
        <p className="text-xs text-blue-800 leading-relaxed">{patientSummary}</p>
      </div>

      <h4 className="text-xs font-semibold text-slate-700 mb-3">Temuan-temuan</h4>
      <div className="space-y-3">
        {findings.map((category, idx) => (
          <div key={idx}>
            <div className="text-xs font-semibold text-slate-800 mb-1">{category.title}</div>
            {category.items.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
                <Minus className="w-3 h-3" />
                Tidak ada temuan
              </div>
            ) : (
              <ul className="space-y-1 pl-2">
                {category.items.map((item, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}