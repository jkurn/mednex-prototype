import { z } from "zod";
import { claimSchema } from "@shared/schema";
import { parseDDMMYYYY } from "./formatters";

type Claim = z.infer<typeof claimSchema>;

export type WeekRange = {
  label: string; // e.g., "Tgl 1-7" or "27 Okt - 2 Nov" for cross-month weeks
  startDate: Date;
  endDate: Date;
  isFuture: boolean;
  isCurrentWeek: boolean;
};

export type Granularity = '1-bln' | '3-bln' | '6-bln' | '1-thn' | 'semua';

export interface PeriodInfo {
  year: number; // Year of the END date for multi-month periods
  month?: number; // 0-indexed END month for monthly/multi-month periods (used for '1-bln', '3-bln', '6-bln')
  quarter?: number; // 1-4 for quarterly periods (deprecated, use startMonth/startYear instead)
  startMonth?: number; // 0-indexed start month (used for '3-bln', '6-bln' backward-looking periods)
  startYear?: number; // Year of the START date (for cross-year multi-month periods)
  label: string; // Display label e.g., "Oktober 2025", "Sep - Nov 2025", "Des 2024 - Feb 2025"
}

export type CheckpointIssue = {
  checkpoint: string;
  amount: number;
  count: number;
};

export type WeeklyData = {
  weekLabel: string;
  startDateIso: string; // ISO date string for week start (for X-axis positioning)
  isFuture: boolean;
  
  // Nilai (Rp) mode - dual line chart
  totalRpAtRisk: number; // Total Rp from temuan/overcharges (blue line)
  totalClaimsValue: number; // Total Rp from all claims (red line)
  
  // Klaim (#) mode - 4 categories (TEMUAN counts)
  pelanggaranPolis: number; // Number of temuan in Policy Violations
  kelebihanTagihan: number; // Number of temuan in Overcharges
  ketidaksesuaianMedis: number; // Number of temuan in Medical Inappropriateness
  penipuan: number; // Number of temuan in Fraud
  
  // UNIQUE claims with issues (for summary display)
  issueClaimIds: string[]; // IDs of claims with at least one issue
  issueClaimCount: number; // Count of unique claims with issues
  
  // Total claims reviewed in this period (for summary text)
  totalClaimsReviewed: number;
  
  // Total temuan count (sum of all 4 categories)
  totalTemuan: number;
};

export type DailyData = {
  dateLabel: string; // e.g., "1 Nov", "2 Nov"
  isoDate: string; // ISO date string for sorting
  totalRpAtRisk: number; // Total Rp temuan/overcharge on this date (blue line)
  totalClaimsValue: number; // Total Rp of all claims on this date (red line)
  claimCount: number; // Number of claims with issues on this date
  isFuture: boolean;
};

/**
 * Get week ranges for a custom date range
 */
export function getWeekRangesCustom(start: Date, end: Date): WeekRange[] {
  const weeks: WeekRange[] = [];
  const today = new Date();
  
  // Indonesian month abbreviations
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Fixed weekly buckets
  const weeklyBuckets = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
  ];
  
  let iteratingMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const periodEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  
  while (iteratingMonth <= periodEnd) {
    const year = iteratingMonth.getFullYear();
    const month = iteratingMonth.getMonth();
    const monthName = monthAbbr[month];
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    const bucketsForMonth = [...weeklyBuckets];
    if (lastDayOfMonth > 28) {
      bucketsForMonth.push({ start: 29, end: lastDayOfMonth });
    }
    
    bucketsForMonth.forEach(bucket => {
      const weekStart = new Date(year, month, bucket.start);
      const weekEnd = new Date(year, month, bucket.end, 23, 59, 59);
      
      if (weekEnd >= start && weekStart <= end) {
        const isFuture = weekStart > today;
        const isCurrentWeek = today >= weekStart && today <= weekEnd;
        
        weeks.push({
          label: `Tgl ${bucket.start}-${bucket.end} ${monthName}`,
          startDate: weekStart,
          endDate: weekEnd,
          isFuture,
          isCurrentWeek,
        });
      }
    });
    
    iteratingMonth = new Date(year, month + 1, 1);
  }
  
  return weeks;
}

/**
 * Get week ranges for a given period
 */
export function getWeekRanges(period: 'bulan-ini' | '3-bulan' | '6-bulan' | 'tahun-ini'): WeekRange[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'bulan-ini':
      startDate = new Date(todayYear, todayMonth, 1);
      endDate = new Date(todayYear, todayMonth + 1, 0);
      break;
    case '3-bulan':
      // Go back 2 months from today (covers last 3 months including current)
      startDate = new Date(todayYear, todayMonth - 2, 1);
      endDate = new Date(todayYear, todayMonth + 1, 0);
      break;
    case '6-bulan':
      // Go back 5 months from today (covers last 6 months including current)
      // This automatically handles year boundaries (e.g., Oct 2025 - 5 months = May 2025)
      startDate = new Date(todayYear, todayMonth - 5, 1);
      endDate = new Date(todayYear, todayMonth + 1, 0);
      break;
    case 'tahun-ini':
      // Show current year only
      startDate = new Date(todayYear, 0, 1);
      endDate = new Date(todayYear, 11, 31);
      break;
  }
  
  const weeks: WeekRange[] = [];
  
  // Indonesian month abbreviations
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Fixed weekly buckets within each month: 1-7, 8-14, 15-21, 22-28, 29-end
  const weeklyBuckets = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
  ];
  
  // Iterate through each month in the period
  const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  
  let iteratingMonth = new Date(periodStart);
  
  while (iteratingMonth <= periodEnd) {
    const year = iteratingMonth.getFullYear();
    const month = iteratingMonth.getMonth();
    const monthName = monthAbbr[month];
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate fixed buckets for this month
    const bucketsForMonth = [...weeklyBuckets];
    
    // Add final bucket if month has more than 28 days
    if (lastDayOfMonth > 28) {
      bucketsForMonth.push({ start: 29, end: lastDayOfMonth });
    }
    
    bucketsForMonth.forEach(bucket => {
      // Create immutable date objects
      const weekStart = new Date(year, month, bucket.start);
      const weekEnd = new Date(year, month, bucket.end, 23, 59, 59);
      
      // Only include weeks that overlap with the selected period
      if (weekEnd >= startDate && weekStart <= endDate) {
        const isFuture = weekStart > today;
        const isCurrentWeek = today >= weekStart && today <= weekEnd;
        
        weeks.push({
          label: `Tgl ${bucket.start}-${bucket.end} ${monthName}`,
          startDate: weekStart,
          endDate: weekEnd,
          isFuture,
          isCurrentWeek,
        });
      }
    });
    
    // Move to next month (immutable)
    iteratingMonth = new Date(year, month + 1, 1);
  }

  return weeks;
}

/**
 * Check if a claim has issues in a specific checkpoint
 * Issues include: failed, warning, in-progress (fraud detected), awaiting (needs review), pending
 */
function hasCheckpointIssue(claim: Claim, checkpoint: string): boolean {
  if (!claim.checkpointStatuses) return false;
  
  const status = claim.checkpointStatuses[checkpoint as keyof typeof claim.checkpointStatuses];
  return status === 'failed' || status === 'warning' || status === 'in-progress' || status === 'awaiting' || status === 'pending';
}

/**
 * Count temuan (findings) for a claim by category
 * Returns the number of issues per category for this specific claim
 */
function countTemuanByCategory(claim: Claim): {
  pelanggaranPolis: number;
  kelebihanTagihan: number;
  ketidaksesuaianMedis: number;
  penipuan: number;
} {
  const counts = {
    pelanggaranPolis: 0,
    kelebihanTagihan: 0,
    ketidaksesuaianMedis: 0,
    penipuan: 0,
  };
  
  // Process checkpoint-based temuan only if checkpoint statuses exist
  if (claim.checkpointStatuses) {
    // Pelanggaran Polis (Policy Violations) - CP1, CP2, CP3, CP4, CP6
    const policyCheckpoints = [
      'validitasPeserta',    // CP1: Member Validation
      'kelengkapanDokumen',  // CP2: Document Completeness
      'ketepatanWaktu',      // CP3: Claim Timeliness
      'pengecualianPolis',   // CP4: Policy Exclusions
      'batasManfaat',        // CP6: Benefit Limits
    ];
    
    for (const checkpoint of policyCheckpoints) {
      if (hasCheckpointIssue(claim, checkpoint)) {
        counts.pelanggaranPolis += 1;
      }
    }
    
    // Ketidaksesuaian Medis (Medical Inappropriateness) - CP5A via analisisKlaim failures
    if (hasCheckpointIssue(claim, 'analisisKlaim')) {
      counts.ketidaksesuaianMedis += 1;
    }
  }
  
  // Kelebihan Tagihan & Penipuan - detected via fraudFlags (always process regardless of checkpointStatuses)
  if (claim.fraudFlags && claim.fraudFlags.length > 0) {
    for (const fraudFlag of claim.fraudFlags) {
      if (fraudFlag.type === 'OVERPRICING') {
        counts.kelebihanTagihan += 1;
      } else {
        // Other fraud types go to Penipuan category
        counts.penipuan += 1;
      }
    }
  }
  
  return counts;
}

/**
 * Aggregate claims data by week using 4-category temuan counting
 */
export function aggregateClaimsByWeek(claims: Claim[], weekRanges: WeekRange[]): WeeklyData[] {
  return weekRanges.map(week => {
    // Filter claims that fall within this week range
    const claimsInWeek = claims.filter(claim => {
      if (!claim.submissionDate) return false;
      
      // Parse DD/MM/YYYY format using helper function
      const claimDate = parseDDMMYYYY(claim.submissionDate);
      if (isNaN(claimDate.getTime())) {
        return false;
      }
      
      return claimDate >= week.startDate && claimDate <= week.endDate;
    });

    // Initialize week data
    const weekData: WeeklyData = {
      weekLabel: week.label,
      startDateIso: week.startDate.toISOString().split('T')[0],
      isFuture: week.isFuture,
      totalRpAtRisk: 0,
      totalClaimsValue: 0,
      pelanggaranPolis: 0,
      kelebihanTagihan: 0,
      ketidaksesuaianMedis: 0,
      penipuan: 0,
      issueClaimIds: [],
      issueClaimCount: 0,
      totalClaimsReviewed: claimsInWeek.length,
      totalTemuan: 0,
    };
    
    // Calculate total claims value (sum of ALL claims in this week)
    weekData.totalClaimsValue = claimsInWeek.reduce((sum, claim) => sum + (claim.amount || 0), 0);

    // Track unique claims with ANY issue
    const issueClaimIds = new Set<string>();
    
    claimsInWeek.forEach(claim => {
      // Count temuan by category for this claim
      const temuanCounts = countTemuanByCategory(claim);
      
      // Add temuan to week totals
      weekData.pelanggaranPolis += temuanCounts.pelanggaranPolis;
      weekData.kelebihanTagihan += temuanCounts.kelebihanTagihan;
      weekData.ketidaksesuaianMedis += temuanCounts.ketidaksesuaianMedis;
      weekData.penipuan += temuanCounts.penipuan;
      
      // Check if claim has ANY temuan
      const hasAnyTemuan = 
        temuanCounts.pelanggaranPolis > 0 ||
        temuanCounts.kelebihanTagihan > 0 ||
        temuanCounts.ketidaksesuaianMedis > 0 ||
        temuanCounts.penipuan > 0;
      
      // Track unique claim with issues (for temuan Rp calculation)
      if (hasAnyTemuan && !issueClaimIds.has(claim.id)) {
        issueClaimIds.add(claim.id);
        // Use totalOvercharge (temuan amount) for the blue line
        const temuanAmount = claim.totalOvercharge || 0;
        weekData.totalRpAtRisk += temuanAmount;
      }
    });
    
    // Finalize week data
    weekData.issueClaimIds = Array.from(issueClaimIds);
    weekData.issueClaimCount = issueClaimIds.size;
    weekData.totalTemuan = 
      weekData.pelanggaranPolis +
      weekData.kelebihanTagihan +
      weekData.ketidaksesuaianMedis +
      weekData.penipuan;

    return weekData;
  });
}

/**
 * Calculate total issues across all weeks
 * For Nilai (Rp) mode: returns total Rp at risk
 * For Klaim (#) mode: returns total temuan count
 */
export function calculateTotalIssues(weeklyData: WeeklyData[], viewMode: 'rp' | 'count'): {
  total: number;
  grandTotal: number;
} {
  const total = weeklyData
    .filter(w => !w.isFuture)
    .reduce((sum, w) => sum + (viewMode === 'rp' ? w.totalRpAtRisk : w.totalTemuan), 0);

  // Grand total is the same as total for now (we'll enhance later if needed)
  const grandTotal = total;

  return { total, grandTotal };
}

/**
 * Get bi-weekly ranges (1-15, 16-end of month)
 * Used for 3 Bln granularity as per accounting best practices
 */
export function getBiWeeklyRanges(startDate: Date, endDate: Date): WeekRange[] {
  const weeks: WeekRange[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Normalize dates to start of day
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);
  
  // Iterate through months in the actual period
  const firstMonth = new Date(normalizedStart.getFullYear(), normalizedStart.getMonth(), 1);
  const lastMonth = new Date(normalizedEnd.getFullYear(), normalizedEnd.getMonth(), 1);
  
  let iteratingMonth = new Date(firstMonth);
  
  while (iteratingMonth <= lastMonth) {
    const year = iteratingMonth.getFullYear();
    const month = iteratingMonth.getMonth();
    const monthName = monthAbbr[month];
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    // First half: 1-15
    const firstHalfStart = new Date(year, month, 1);
    const firstHalfEnd = new Date(year, month, 15, 23, 59, 59);
    
    // Only include if overlaps with the requested period
    if (firstHalfEnd >= normalizedStart && firstHalfStart <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      const isFuture = firstHalfStart > today;
      const isCurrentWeek = today >= firstHalfStart && today <= firstHalfEnd;
      
      weeks.push({
        label: `1-15 ${monthName}`,
        startDate: firstHalfStart,
        endDate: firstHalfEnd,
        isFuture,
        isCurrentWeek,
      });
    }
    
    // Second half: 16-end
    const secondHalfStart = new Date(year, month, 16);
    const secondHalfEnd = new Date(year, month, lastDayOfMonth, 23, 59, 59);
    
    if (secondHalfEnd >= normalizedStart && secondHalfStart <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      const isFuture = secondHalfStart > today;
      const isCurrentWeek = today >= secondHalfStart && today <= secondHalfEnd;
      
      weeks.push({
        label: `16-${lastDayOfMonth} ${monthName}`,
        startDate: secondHalfStart,
        endDate: secondHalfEnd,
        isFuture,
        isCurrentWeek,
      });
    }
    
    // Move to next month (immutable)
    iteratingMonth = new Date(year, month + 1, 1);
  }

  return weeks;
}

/**
 * Get monthly ranges (one range per month)
 * Used for 6 Bln and 1 Thn granularity
 */
export function getMonthlyRanges(startDate: Date, endDate: Date): WeekRange[] {
  const months: WeekRange[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Normalize dates
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);
  
  // Iterate through months in the actual period
  const firstMonth = new Date(normalizedStart.getFullYear(), normalizedStart.getMonth(), 1);
  const lastMonth = new Date(normalizedEnd.getFullYear(), normalizedEnd.getMonth(), 1);
  
  let iteratingMonth = new Date(firstMonth);
  
  while (iteratingMonth <= lastMonth) {
    const year = iteratingMonth.getFullYear();
    const month = iteratingMonth.getMonth();
    const monthName = monthAbbr[month];
    
    // Full month range
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
    // Only include if overlaps with the requested period
    if (monthEnd >= normalizedStart && monthStart <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      const isFuture = monthStart > today;
      const isCurrentWeek = today >= monthStart && today <= monthEnd;
      
      months.push({
        label: monthName,
        startDate: monthStart,
        endDate: monthEnd,
        isFuture,
        isCurrentWeek,
      });
    }
    
    // Move to next month (immutable)
    iteratingMonth = new Date(year, month + 1, 1);
  }

  return months;
}

/**
 * Get quarterly ranges (Q1, Q2, Q3, Q4)
 * Used for Semua granularity following accounting quarters:
 * Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
 */
export function getQuarterlyRanges(startDate: Date, endDate: Date): WeekRange[] {
  const quarters: WeekRange[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Normalize dates
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);
  
  const startYear = normalizedStart.getFullYear();
  const endYear = normalizedEnd.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    // Q1: Jan - Mar
    const q1Start = new Date(year, 0, 1);
    const q1End = new Date(year, 2, 31, 23, 59, 59);
    if (q1End >= normalizedStart && q1Start <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      quarters.push({
        label: `Q1 ${year}`,
        startDate: q1Start,
        endDate: q1End,
        isFuture: q1Start > today,
        isCurrentWeek: today >= q1Start && today <= q1End,
      });
    }
    
    // Q2: Apr - Jun
    const q2Start = new Date(year, 3, 1);
    const q2End = new Date(year, 5, 30, 23, 59, 59);
    if (q2End >= normalizedStart && q2Start <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      quarters.push({
        label: `Q2 ${year}`,
        startDate: q2Start,
        endDate: q2End,
        isFuture: q2Start > today,
        isCurrentWeek: today >= q2Start && today <= q2End,
      });
    }
    
    // Q3: Jul - Sep
    const q3Start = new Date(year, 6, 1);
    const q3End = new Date(year, 8, 30, 23, 59, 59);
    if (q3End >= normalizedStart && q3Start <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      quarters.push({
        label: `Q3 ${year}`,
        startDate: q3Start,
        endDate: q3End,
        isFuture: q3Start > today,
        isCurrentWeek: today >= q3Start && today <= q3End,
      });
    }
    
    // Q4: Oct - Dec
    const q4Start = new Date(year, 9, 1);
    const q4End = new Date(year, 11, 31, 23, 59, 59);
    if (q4End >= normalizedStart && q4Start <= normalizedEnd) {
      // NO per-bucket clamping - use full canonical calendar boundaries
      quarters.push({
        label: `Q4 ${year}`,
        startDate: q4Start,
        endDate: q4End,
        isFuture: q4Start > today,
        isCurrentWeek: today >= q4Start && today <= q4End,
      });
    }
  }

  return quarters;
}

/**
 * Get calendar-based week ranges (1-7, 8-14, 15-21, 22-28, 29-end)
 * Uses calendar day grouping instead of Monday-based weeks
 * Used for 1 Bln granularity
 */
export function getWeekRangesCalendar(startDate: Date, endDate: Date): WeekRange[] {
  const weeks: WeekRange[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Fixed weekly buckets within each month: 1-7, 8-14, 15-21, 22-28, 29-end
  const weeklyBuckets = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
  ];
  
  // Iterate through each month in the period
  const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  
  let iteratingMonth = new Date(periodStart);
  
  while (iteratingMonth <= periodEnd) {
    const year = iteratingMonth.getFullYear();
    const month = iteratingMonth.getMonth();
    const monthName = monthAbbr[month];
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate fixed buckets for this month
    const bucketsForMonth = [...weeklyBuckets];
    
    // Add final bucket if month has more than 28 days
    if (lastDayOfMonth > 28) {
      bucketsForMonth.push({ start: 29, end: lastDayOfMonth });
    }
    
    bucketsForMonth.forEach(bucket => {
      // Create immutable date objects
      const weekStart = new Date(year, month, bucket.start);
      const weekEnd = new Date(year, month, bucket.end, 23, 59, 59);
      
      // Only include weeks that overlap with the selected period
      if (weekEnd >= startDate && weekStart <= endDate) {
        // NO per-bucket clamping - use full canonical calendar boundaries
        const isFuture = weekStart > today;
        const isCurrentWeek = today >= weekStart && today <= weekEnd;
        
        weeks.push({
          label: `${bucket.start}-${bucket.end} ${monthName}`, // Format: "1-7 Nov"
          startDate: weekStart,
          endDate: weekEnd,
          isFuture,
          isCurrentWeek,
        });
      }
    });
    
    // Move to next month (immutable)
    iteratingMonth = new Date(year, month + 1, 1);
  }

  return weeks;
}

/**
 * Get week ranges starting on Monday (for 1 Bln and 3 Bln views)
 * Weeks can span across months with cross-month labels like "27 Okt - 2 Nov"
 */
export function getWeekRangesMonday(startDate: Date, endDate: Date): WeekRange[] {
  const weeks: WeekRange[] = [];
  const today = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Find first Monday on or after startDate
  let currentMonday = new Date(startDate);
  const dayOfWeek = currentMonday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
  currentMonday.setDate(currentMonday.getDate() + daysUntilMonday);
  
  // If first Monday is after startDate, create partial week from startDate to Sunday before first Monday
  if (currentMonday > startDate) {
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() - 1);
    sunday.setHours(23, 59, 59);
    
    const weekStart = new Date(startDate);
    const weekEnd = sunday;
    const isFuture = weekStart > today;
    const isCurrentWeek = today >= weekStart && today <= weekEnd;
    
    const label = formatWeekLabel(weekStart, weekEnd, monthNames);
    weeks.push({ label, startDate: weekStart, endDate: weekEnd, isFuture, isCurrentWeek });
  }
  
  // Generate full weeks (Monday to Sunday)
  while (currentMonday <= endDate) {
    const weekStart = new Date(currentMonday);
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59);
    
    // Don't exceed endDate
    const actualEnd = weekEnd > endDate ? endDate : weekEnd;
    
    const isFuture = weekStart > today;
    const isCurrentWeek = today >= weekStart && today <= actualEnd;
    
    const label = formatWeekLabel(weekStart, actualEnd, monthNames);
    weeks.push({ label, startDate: weekStart, endDate: actualEnd, isFuture, isCurrentWeek });
    
    // Move to next Monday
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return weeks;
}

/**
 * Format week label with cross-month support
 * Examples: "1-7 Okt", "27 Okt - 2 Nov"
 */
function formatWeekLabel(start: Date, end: Date, monthNames: string[]): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  
  if (startMonth === endMonth) {
    // Same month: "1-7 Okt"
    return `${startDay}-${endDay} ${monthNames[startMonth]}`;
  } else {
    // Cross-month: "27 Okt - 2 Nov"
    return `${startDay} ${monthNames[startMonth]} - ${endDay} ${monthNames[endMonth]}`;
  }
}


/**
 * Get yearly ranges (for Semua view)
 */
export function getYearlyRanges(startDate: Date, endDate: Date): WeekRange[] {
  const years: WeekRange[] = [];
  const today = new Date();
  
  let current = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  while (current <= endYear) {
    const yearStart = new Date(current, 0, 1);
    const yearEnd = new Date(current, 11, 31, 23, 59, 59);
    
    const isFuture = yearStart > today;
    const isCurrentWeek = today >= yearStart && today <= yearEnd;
    
    years.push({
      label: `${current}`,
      startDate: yearStart,
      endDate: yearEnd,
      isFuture,
      isCurrentWeek,
    });
    
    current++;
  }
  
  return years;
}

/**
 * Generate all available periods for a given granularity
 * Returns array of PeriodInfo objects
 * @param claims Optional claims array to verify which periods actually contain data (used for 6-bln filtering)
 */
export function generateAvailablePeriods(
  granularity: Granularity,
  earliestDate: Date,
  latestDate: Date,
  claims?: any[] // Accepting any[] to avoid circular dependency with Claim type
): PeriodInfo[] {
  const periods: PeriodInfo[] = [];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  if (granularity === 'semua') {
    // No periods for "Semua" - shows everything
    return [];
  }
  
  if (granularity === '1-bln') {
    // Monthly periods: Oktober 2025, November 2025, etc.
    // Use current date to include future/empty months up to today
    const today = new Date();
    let current = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (current <= end) {
      periods.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
      });
      current.setMonth(current.getMonth() + 1);
    }
  } else if (granularity === '3-bln') {
    // 3-month periods using ACCOUNTING QUARTERS: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3); // 0=Q1, 1=Q2, 2=Q3, 3=Q4
    
    // Start from Q1 of earliest year to ensure canonical accounting quarter alignment
    const earliestYear = earliestDate.getFullYear();
    
    // Generate ALL quarters from Q1 of earliest year to current quarter
    for (let year = earliestYear; year <= currentYear; year++) {
      const startQ = 0; // Always start from Q1 for each year
      const endQ = (year === currentYear) ? currentQuarter : 3; // Up to Q4 for past years, current quarter for current year
      
      for (let q = startQ; q <= endQ; q++) {
        const quarterStartMonth = q * 3; // 0, 3, 6, 9 for Jan, Apr, Jul, Oct
        const quarterEndMonth = quarterStartMonth + 2; // 2, 5, 8, 11 for Mar, Jun, Sep, Dec
        
        const label = `${monthAbbr[quarterStartMonth]} - ${monthAbbr[quarterEndMonth]} ${year}`;
        
        periods.push({
          year: year,
          month: quarterEndMonth, // Store END month of quarter
          startMonth: quarterStartMonth,
          startYear: year,
          label,
        });
      }
    }
  } else if (granularity === '6-bln') {
    // FISCAL HALF-YEAR periods following accounting standards:
    // H1 (Jan-Jun): months 0-5
    // H2 (Jul-Des): months 6-11
    // Only show fiscal periods that actually contain claims data
    const today = new Date();
    
    // If no claims, return empty array
    if (!claims || claims.length === 0) {
      return periods;
    }
    
    // Use the MINIMUM of latestDate and today to avoid showing empty future periods
    const effectiveLatest = latestDate < today ? latestDate : today;
    const latestYear = effectiveLatest.getFullYear();
    const latestMonth = effectiveLatest.getMonth();
    const latestHalf = latestMonth < 6 ? 0 : 1; // 0=H1 (Jan-Jun), 1=H2 (Jul-Des)
    
    const earliestYear = earliestDate.getFullYear();
    const earliestMonth = earliestDate.getMonth();
    const earliestHalf = earliestMonth < 6 ? 0 : 1;
    
    // Generate fiscal half-years from earliest to latest, verifying data presence
    for (let year = earliestYear; year <= latestYear; year++) {
      const startH = (year === earliestYear) ? earliestHalf : 0; // Start from earliest half for earliest year
      const endH = (year === latestYear) ? latestHalf : 1; // Up to H2 for past years, latest half for latest year
      
      for (let h = startH; h <= endH; h++) {
        const halfStartMonth = h * 6; // 0 for H1 (Jan), 6 for H2 (Jul)
        const halfEndMonth = halfStartMonth + 5; // 5 for H1 (Jun), 11 for H2 (Des)
        
        // VERIFY this fiscal half-year contains claims data
        const hasData = claims.some(claim => {
          // Guard against missing submissionDate
          if (!claim.submissionDate) return false;
          
          // Parse DD/MM/YYYY format using utility function
          const claimDate = parseDDMMYYYY(claim.submissionDate);
          if (isNaN(claimDate.getTime())) return false; // Invalid date
          
          const claimYear = claimDate.getFullYear();
          const claimMonth = claimDate.getMonth();
          return claimYear === year && claimMonth >= halfStartMonth && claimMonth <= halfEndMonth;
        });
        
        if (!hasData) continue; // Skip empty fiscal half-years
        
        const label = `${monthAbbr[halfStartMonth]} - ${monthAbbr[halfEndMonth]} ${year}`;
        
        periods.push({
          year: year,
          month: halfEndMonth, // Store END month of half-year
          startMonth: halfStartMonth,
          startYear: year,
          label,
        });
      }
    }
  } else if (granularity === '1-thn') {
    // Yearly periods: 2024, 2025, 2026
    // Use current date to include future/empty years up to today
    const today = new Date();
    let currentYear = earliestDate.getFullYear();
    const endYear = today.getFullYear();
    
    while (currentYear <= endYear) {
      periods.push({
        year: currentYear,
        month: 11, // December (end of year)
        startMonth: 0, // January (start of year)
        startYear: currentYear,
        label: `${currentYear}`,
      });
      currentYear++;
    }
  }
  
  return periods;
}

/**
 * Aggregate claims by day for daily line chart (Nilai mode)
 * Generates period-specific data points for each day
 * Line = Daily Rp loss for that specific day (NOT cumulative)
 */
export function aggregateClaimsByDay(claims: Claim[], startDate: Date, endDate: Date): DailyData[] {
  // Full Indonesian month names for tooltip display
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dailyData: DailyData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start-of-day for comparison
  
  // Generate a data point for each day in the range
  const currentDay = new Date(startDate);
  currentDay.setHours(0, 0, 0, 0);
  
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);
  
  while (currentDay <= rangeEnd) {
    const dayStart = new Date(currentDay);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDay);
    dayEnd.setHours(23, 59, 59, 999);
    
    const isFuture = dayStart > today;
    
    let totalRpAtRisk = 0;
    let totalClaimsValue = 0;
    let claimCount = 0;
    
    // Only process claims up to today
    if (!isFuture) {
      // Filter claims that fall on this specific day
      const claimsOnDay = claims.filter(claim => {
        if (!claim.submissionDate) return false;
        
        const claimDate = parseDDMMYYYY(claim.submissionDate);
        if (isNaN(claimDate.getTime())) return false;
        
        return claimDate >= dayStart && claimDate <= dayEnd;
      });
      
      // Calculate total claims value (ALL claims on this day)
      totalClaimsValue = claimsOnDay.reduce((sum, claim) => sum + (claim.amount || 0), 0);
      
      // Calculate total Rp at risk for THIS DAY ONLY (temuan/overcharge amounts)
      claimsOnDay.forEach(claim => {
        const temuanCounts = countTemuanByCategory(claim);
        
        // Check if claim has any temuan
        const hasAnyTemuan = 
          temuanCounts.pelanggaranPolis > 0 ||
          temuanCounts.kelebihanTagihan > 0 ||
          temuanCounts.ketidaksesuaianMedis > 0 ||
          temuanCounts.penipuan > 0;
        
        if (hasAnyTemuan) {
          // Use ONLY totalOvercharge for temuan amount - no fallbacks
          totalRpAtRisk += claim.totalOvercharge || 0;
          claimCount++;
        }
      });
    }
    
    // FIX BUG 3: Use full Indonesian date format "13 November 2025" instead of just "13"
    const fullDateLabel = `${currentDay.getDate()} ${monthNames[currentDay.getMonth()]} ${currentDay.getFullYear()}`;
    
    // FIX BUG 1 & BUG 2: Generate ISO date in LOCAL timezone to avoid UTC conversion offset
    // Using toISOString() would convert to UTC, causing a 1-day shift for Indonesia timezone (UTC+7)
    const localIsoDate = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    
    dailyData.push({
      dateLabel: fullDateLabel,
      isoDate: localIsoDate,
      totalRpAtRisk: totalRpAtRisk,
      totalClaimsValue: totalClaimsValue,
      claimCount: claimCount,
      isFuture,
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return dailyData;
}

/**
 * Aggregate claims by week for 6 Bln line chart (Nilai mode)
 * Generates period-specific weekly data points (~26 weeks)
 * Line = Weekly Rp loss for that specific week (NOT cumulative)
 */
export function aggregateClaimsByWeekForLineChart(claims: Claim[], startDate: Date, endDate: Date): DailyData[] {
  const weeklyData: DailyData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate weekly buckets
  const currentWeekStart = new Date(startDate);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);
  
  let weekNumber = 1;
  
  while (currentWeekStart <= rangeEnd) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Week is future if it STARTS after today
    const weekStartsAfterToday = currentWeekStart > today;
    
    let totalRpAtRisk = 0;
    let totalClaimsValue = 0;
    let claimCount = 0;
    
    // Only process claims up to today (cap weekEnd at today)
    if (!weekStartsAfterToday) {
      const effectiveWeekEnd = weekEnd > today ? today : weekEnd;
      
      const claimsInWeek = claims.filter(claim => {
        if (!claim.submissionDate) return false;
        const claimDate = parseDDMMYYYY(claim.submissionDate);
        if (isNaN(claimDate.getTime())) return false;
        return claimDate >= currentWeekStart && claimDate <= effectiveWeekEnd;
      });
      
      // Calculate total claims value (ALL claims in this week)
      totalClaimsValue = claimsInWeek.reduce((sum, claim) => sum + (claim.amount || 0), 0);
      
      // Calculate total Rp at risk for THIS WEEK ONLY
      claimsInWeek.forEach(claim => {
        const temuanCounts = countTemuanByCategory(claim);
        const hasAnyTemuan = 
          temuanCounts.pelanggaranPolis > 0 ||
          temuanCounts.kelebihanTagihan > 0 ||
          temuanCounts.ketidaksesuaianMedis > 0 ||
          temuanCounts.penipuan > 0;
        
        if (hasAnyTemuan) {
          // Use ONLY totalOvercharge for temuan amount - no fallbacks
          totalRpAtRisk += claim.totalOvercharge || 0;
          claimCount++;
        }
      });
    }
    
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Return ALL weeks (including future) but mark them with isFuture flag
    // Future weeks get zero value but are needed for X-axis ticks
    weeklyData.push({
      dateLabel: `W${weekNumber} ${monthAbbr[currentWeekStart.getMonth()]}`,
      isoDate: currentWeekStart.toISOString().split('T')[0],
      totalRpAtRisk: totalRpAtRisk,
      totalClaimsValue: totalClaimsValue,
      claimCount: claimCount,
      isFuture: weekStartsAfterToday,
    });
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }
  
  return weeklyData;
}

/**
 * Aggregate claims by month for 1 Thn line chart (Nilai mode)
 * Generates period-specific monthly data points (12 months)
 * Line = Monthly Rp loss for that specific month (NOT cumulative)
 */
export function aggregateClaimsByMonthForLineChart(claims: Claim[], startDate: Date, endDate: Date): DailyData[] {
  const monthlyData: DailyData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Generate monthly buckets
  const currentMonth = new Date(startDate);
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);
  
  while (currentMonth <= rangeEnd) {
    const monthStart = new Date(currentMonth);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(currentMonth);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of current month
    monthEnd.setHours(23, 59, 59, 999);
    
    // Month is future if it STARTS after today
    const monthStartsAfterToday = monthStart > today;
    
    let totalRpAtRisk = 0;
    let totalClaimsValue = 0;
    let claimCount = 0;
    
    // Only process claims up to today (cap monthEnd at today)
    if (!monthStartsAfterToday) {
      const effectiveMonthEnd = monthEnd > today ? today : monthEnd;
      
      const claimsInMonth = claims.filter(claim => {
        if (!claim.submissionDate) return false;
        const claimDate = parseDDMMYYYY(claim.submissionDate);
        if (isNaN(claimDate.getTime())) return false;
        return claimDate >= monthStart && claimDate <= effectiveMonthEnd;
      });
      
      // Calculate total claims value (ALL claims in this month)
      totalClaimsValue = claimsInMonth.reduce((sum, claim) => sum + (claim.amount || 0), 0);
      
      // Calculate total Rp at risk for THIS MONTH ONLY
      claimsInMonth.forEach(claim => {
        const temuanCounts = countTemuanByCategory(claim);
        const hasAnyTemuan = 
          temuanCounts.pelanggaranPolis > 0 ||
          temuanCounts.kelebihanTagihan > 0 ||
          temuanCounts.ketidaksesuaianMedis > 0 ||
          temuanCounts.penipuan > 0;
        
        if (hasAnyTemuan) {
          // Use ONLY totalOvercharge for temuan amount - no fallbacks
          totalRpAtRisk += claim.totalOvercharge || 0;
          claimCount++;
        }
      });
    }
    
    // Return ALL months (including future) but mark them with isFuture flag
    // Future months get zero value but are needed for X-axis ticks
    monthlyData.push({
      dateLabel: monthAbbr[currentMonth.getMonth()],
      isoDate: currentMonth.toISOString().split('T')[0],
      totalRpAtRisk: totalRpAtRisk,
      totalClaimsValue: totalClaimsValue,
      claimCount: claimCount,
      isFuture: monthStartsAfterToday,
    });
    
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  return monthlyData;
}

/**
 * Aggregate claims by quarter for Semua line chart (Nilai mode)
 * Generates period-specific quarterly data points (4-8 quarters)
 * Line = Quarterly Rp loss for that specific quarter (NOT cumulative)
 */
export function aggregateClaimsByQuarterForLineChart(claims: Claim[], startDate: Date, endDate: Date): DailyData[] {
  const quarterlyData: DailyData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Determine starting quarter
  const startYear = startDate.getFullYear();
  const startQuarter = Math.floor(startDate.getMonth() / 3);
  
  const endYear = endDate.getFullYear();
  const endQuarter = Math.floor(endDate.getMonth() / 3);
  
  // Generate quarterly buckets
  let currentYear = startYear;
  let currentQuarter = startQuarter;
  
  while (currentYear < endYear || (currentYear === endYear && currentQuarter <= endQuarter)) {
    const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
    quarterStart.setHours(0, 0, 0, 0);
    
    const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
    quarterEnd.setHours(23, 59, 59, 999);
    
    // Quarter is future if it STARTS after today
    const quarterStartsAfterToday = quarterStart > today;
    
    let totalRpAtRisk = 0;
    let totalClaimsValue = 0;
    let claimCount = 0;
    
    // Only process claims up to today (cap quarterEnd at today)
    if (!quarterStartsAfterToday) {
      const effectiveQuarterEnd = quarterEnd > today ? today : quarterEnd;
      
      const claimsInQuarter = claims.filter(claim => {
        if (!claim.submissionDate) return false;
        const claimDate = parseDDMMYYYY(claim.submissionDate);
        if (isNaN(claimDate.getTime())) return false;
        return claimDate >= quarterStart && claimDate <= effectiveQuarterEnd;
      });
      
      // Calculate total claims value (ALL claims in this quarter)
      totalClaimsValue = claimsInQuarter.reduce((sum, claim) => sum + (claim.amount || 0), 0);
      
      // Calculate total Rp at risk for THIS QUARTER ONLY
      claimsInQuarter.forEach(claim => {
        const temuanCounts = countTemuanByCategory(claim);
        const hasAnyTemuan = 
          temuanCounts.pelanggaranPolis > 0 ||
          temuanCounts.kelebihanTagihan > 0 ||
          temuanCounts.ketidaksesuaianMedis > 0 ||
          temuanCounts.penipuan > 0;
        
        if (hasAnyTemuan) {
          // Use ONLY totalOvercharge for temuan amount - no fallbacks
          totalRpAtRisk += claim.totalOvercharge || 0;
          claimCount++;
        }
      });
    }
    
    // Generate quarter label with month names
    const quarterMonthRanges = [
      '(Jan-Mar)',
      '(Apr-Jun)',
      '(Jul-Sep)',
      '(Okt-Des)'
    ];
    
    // Return ALL quarters (including future) but mark them with isFuture flag
    // Future quarters get zero value but are needed for X-axis ticks
    quarterlyData.push({
      dateLabel: `Q${currentQuarter + 1} ${currentYear} ${quarterMonthRanges[currentQuarter]}`,
      isoDate: quarterStart.toISOString().split('T')[0],
      totalRpAtRisk: totalRpAtRisk,
      totalClaimsValue: totalClaimsValue,
      claimCount: claimCount,
      isFuture: quarterStartsAfterToday,
    });
    
    currentQuarter++;
    if (currentQuarter > 3) {
      currentQuarter = 0;
      currentYear++;
    }
  }
  
  return quarterlyData;
}
