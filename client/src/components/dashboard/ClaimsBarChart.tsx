import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { z } from "zod";
import { claimSchema } from "@shared/schema";
import { formatRupiah, formatRupiahCompact, formatLastUpdated, parseDDMMYYYY } from "@/utils/formatters";
import { 
  getWeekRanges,
  getWeekRangesCustom, 
  getWeekRangesMonday,
  getWeekRangesCalendar,
  getBiWeeklyRanges,
  getMonthlyRanges,
  getYearlyRanges,
  getQuarterlyRanges,
  aggregateClaimsByWeek,
  aggregateClaimsByDay,
  aggregateClaimsByWeekForLineChart,
  aggregateClaimsByMonthForLineChart,
  aggregateClaimsByQuarterForLineChart,
  generateAvailablePeriods,
  type Granularity,
  type PeriodInfo,
  type DailyData,
} from "@/utils/weeklyDataHelpers";
import { ISSUE_CATEGORIES } from "@/utils/categoryMapping";

type Claim = z.infer<typeof claimSchema>;

type ChartMode = 'nilai' | 'temuan'; // Nilai (Rp) or Temuan (#)

interface ClaimsBarChartProps {
  claims: Claim[];
  onRefresh?: () => void;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  '1-bln': '1 Bln',
  '3-bln': '3 Bln',
  '6-bln': '6 Bln',
  '1-thn': '1 Thn',
  'semua': 'Semua',
};

export default function ClaimsBarChart({ claims, onRefresh }: ClaimsBarChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('temuan'); // Default: Temuan (#) mode
  const [granularity, setGranularity] = useState<Granularity>('1-bln');
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdate] = useState(new Date());

  // Calculate earliest and latest claim dates
  const { earliestDate, latestDate } = useMemo(() => {
    if (claims.length === 0) {
      const today = new Date();
      return { earliestDate: new Date(2024, 0, 1), latestDate: today };
    }
    
    const claimDates = claims
      .filter(c => c.submissionDate)
      .map(c => parseDDMMYYYY(c.submissionDate!))
      .filter(d => !isNaN(d.getTime()));
    
    if (claimDates.length === 0) {
      const today = new Date();
      return { earliestDate: new Date(2024, 0, 1), latestDate: today };
    }
    
    // Derive min/max from actual claim dates, normalized to start/end of day
    const minDate = new Date(Math.min(...claimDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...claimDates.map(d => d.getTime())));
    
    // Normalize to start/end of day to avoid timezone drift
    const earliestDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0);
    const latestDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59);
    
    return { earliestDate, latestDate };
  }, [claims]);

  // Generate available periods based on granularity
  const availablePeriods = useMemo(() => {
    return generateAvailablePeriods(granularity, earliestDate, latestDate, claims);
  }, [granularity, earliestDate, latestDate, claims]);

  // Ensure currentPeriodIndex is within bounds
  const safeCurrentPeriodIndex = useMemo(() => {
    if (granularity === 'semua') return 0;
    if (availablePeriods.length === 0) return 0;
    return Math.min(currentPeriodIndex, availablePeriods.length - 1);
  }, [currentPeriodIndex, availablePeriods, granularity]);

  // Get current period info
  const currentPeriod = granularity === 'semua' 
    ? null 
    : availablePeriods[safeCurrentPeriodIndex] || availablePeriods[availablePeriods.length - 1];

  // Compute fallback period label for 6-bln when no data exists
  const computedPeriodLabel = useMemo(() => {
    // If we have a period from the data, use it
    if (currentPeriod) {
      return currentPeriod.label;
    }
    
    // For 6-bln with no data: Show current fiscal half-year label
    if (granularity === '6-bln') {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      
      if (currentMonth < 6) {
        // H1: Jan-Jun
        return `${monthAbbr[0]} - ${monthAbbr[5]} ${currentYear}`;
      } else {
        // H2: Jul-Des
        return `${monthAbbr[6]} - ${monthAbbr[11]} ${currentYear}`;
      }
    }
    
    // For other granularities with no data, return null
    return null;
  }, [granularity, currentPeriod]);

  // Generate date ranges for current period using new grouping strategy
  const { weeklyData, periodStartDate, periodEndDate } = useMemo(() => {
    let ranges;
    let startDate: Date;
    let endDate: Date;
    
    if (granularity === 'semua') {
      // Semua: Quarterly (Q1-Q4)
      // Extend to next quarter for future placeholder
      const today = new Date();
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const nextQuarterStartMonth = (currentQuarter + 1) * 3;
      
      // If next quarter is in current year, use end of next quarter; otherwise use end of Q4 this year
      const nextQuarterEnd = nextQuarterStartMonth < 12
        ? new Date(today.getFullYear(), nextQuarterStartMonth + 2, 31, 23, 59, 59)
        : new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      
      ranges = getQuarterlyRanges(earliestDate, nextQuarterEnd);
      startDate = earliestDate;
      endDate = nextQuarterEnd;
    } else if (granularity === '1-thn') {
      // 1 Thn: Monthly - use currentPeriod metadata to show full year
      if (!currentPeriod) {
        const today = new Date();
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      } else {
        // Use the full year from period metadata
        const year = currentPeriod.year;
        startDate = new Date(year, 0, 1); // Jan 1
        endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31
      }
      ranges = getMonthlyRanges(startDate, endDate);
    } else if (granularity === '6-bln' && !currentPeriod) {
      // 6-bln with no data: Show current fiscal half-year
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentHalf = currentMonth < 6 ? 0 : 1; // 0=H1 (Jan-Jun), 1=H2 (Jul-Des)
      const halfStartMonth = currentHalf * 6; // 0 or 6
      const halfEndMonth = halfStartMonth + 5; // 5 or 11
      
      startDate = new Date(currentYear, halfStartMonth, 1);
      endDate = new Date(currentYear, halfEndMonth + 1, 0); // Last day of end month
      ranges = getWeekRangesCustom(startDate, endDate);
    } else if (currentPeriod) {
      // For 1-bln, 3-bln, 6-bln: use period metadata
      const endYear = currentPeriod.year;
      const endMonth = currentPeriod.month!;
      
      if (granularity === '1-bln') {
        // For 1-bln: Show the full month from day 1 to last day
        startDate = new Date(endYear, endMonth, 1);
        endDate = new Date(endYear, endMonth + 1, 0); // Last day of the month
      } else if (granularity === '3-bln' || granularity === '6-bln') {
        // Use backward-looking period metadata
        const startYear = currentPeriod.startYear!;
        const startMonth = currentPeriod.startMonth!;
        startDate = new Date(startYear, startMonth, 1);
        endDate = new Date(endYear, endMonth + 1, 0); // Last day of end month
      } else {
        // Fallback (should not reach here)
        startDate = new Date(endYear, endMonth, 1);
        endDate = new Date(endYear, endMonth + 1, 0);
      }
      
      // NO CLAMPING - Use full calendar boundaries
      // The range helpers will handle isFuture flagging for periods after today
      
      // Select appropriate grouping based on granularity
      if (granularity === '1-bln') {
        // Weekly: 1-7, 8-14, 15-21, 22-28, 29-end
        ranges = getWeekRangesCalendar(startDate, endDate);
      } else if (granularity === '3-bln') {
        // Bi-weekly: 1-14, 15-end
        ranges = getBiWeeklyRanges(startDate, endDate);
      } else if (granularity === '6-bln') {
        // 6-bln: Weekly buckets over 6 months (~26 buckets)
        ranges = getWeekRangesCustom(startDate, endDate);
      } else {
        // Fallback
        ranges = getMonthlyRanges(startDate, endDate);
      }
    } else {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      ranges = getWeekRanges('bulan-ini');
    }
    
    // PRE-FILTER claims to requested period to prevent out-of-range data leakage
    // while still emitting all canonical calendar buckets (including empty/future)
    const filteredClaims = claims.filter(claim => {
      if (!claim.submissionDate) return false;
      const claimDate = parseDDMMYYYY(claim.submissionDate);
      if (isNaN(claimDate.getTime())) return false;
      return claimDate >= startDate && claimDate <= endDate;
    });
    
    return {
      weeklyData: aggregateClaimsByWeek(filteredClaims, ranges),
      periodStartDate: startDate,
      periodEndDate: endDate,
    };
  }, [claims, granularity, currentPeriod, earliestDate, latestDate, safeCurrentPeriodIndex]);

  // Generate data for Nilai mode line chart based on granularity
  const dailyData = useMemo(() => {
    if (chartMode !== 'nilai') return [];
    
    // Different aggregations for different granularities per requirements:
    // - 1 Bln, 3 Bln: Daily data (cumulative)
    // - 6 Bln: Weekly aggregation (cumulative)
    // - 1 Thn: Monthly aggregation (cumulative)
    // - Semua: Quarterly aggregation (cumulative)
    
    let result;
    if (granularity === '6-bln') {
      result = aggregateClaimsByWeekForLineChart(claims, periodStartDate, periodEndDate);
    } else if (granularity === '1-thn') {
      result = aggregateClaimsByMonthForLineChart(claims, periodStartDate, periodEndDate);
    } else if (granularity === 'semua') {
      result = aggregateClaimsByQuarterForLineChart(claims, periodStartDate, periodEndDate);
    } else {
      // 1-bln and 3-bln use daily aggregation
      result = aggregateClaimsByDay(claims, periodStartDate, periodEndDate);
    }
    
    return result;
  }, [claims, periodStartDate, periodEndDate, chartMode, granularity]);

  // Calculate totals for summary display - use UNIQUE claims to avoid double-counting
  const { totalRpAtRisk, totalTemuan, claimsWithIssues, totalClaimsReviewed, totalClaimsValue } = useMemo(() => {
    const nonFutureWeeks = weeklyData.filter(w => !w.isFuture);
    
    // Collect unique claim IDs with issues across all weeks
    const uniqueIssueClaimIds = new Set<string>();
    nonFutureWeeks.forEach(w => {
      w.issueClaimIds.forEach(id => uniqueIssueClaimIds.add(id));
    });
    
    // Calculate totalRpAtRisk from unique claims only (temuan/error amounts)
    const claimsMap = new Map<string, number>(); // claimId -> temuan amount
    nonFutureWeeks.forEach(week => {
      week.issueClaimIds.forEach(claimId => {
        if (!claimsMap.has(claimId)) {
          const claim = claims.find(c => c.id === claimId);
          if (claim) {
            // Use ONLY totalOvercharge (temuan amount) - no fallbacks
            const temuanAmount = claim.totalOvercharge || 0;
            claimsMap.set(claimId, temuanAmount);
          }
        }
      });
    });
    
    const uniqueTotalRpAtRisk = Array.from(claimsMap.values()).reduce((sum, amount) => sum + amount, 0);
    
    // Calculate total claims value (sum of ALL claim amounts, not just those with issues)
    const totalClaimsValue = claims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
    
    return {
      totalRpAtRisk: uniqueTotalRpAtRisk,
      totalTemuan: nonFutureWeeks.reduce((sum, w) => sum + w.totalTemuan, 0),
      claimsWithIssues: uniqueIssueClaimIds.size,
      totalClaimsReviewed: claims.length,
      totalClaimsValue, // Total Rp value of all claims
    };
  }, [weeklyData, claims]);

  // Shared monthly tick computation for 6-bln mode (used by Nilai LineChart)
  const monthAxis = useMemo(() => {
    if (granularity !== '6-bln' || !periodStartDate || !periodEndDate) {
      return null;
    }
    
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Generate month ticks from period bounds (first day of each month)
    const ticks: string[] = [];
    let current = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), 1);
    const end = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), 1);
    
    while (current <= end) {
      // Format as YYYY-MM-DD manually to avoid timezone offset issues
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = '01';
      ticks.push(`${year}-${month}-${day}`);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    
    // Formatter: Extract month from ISO date and show abbreviation
    const formatter = (value: string) => {
      const date = new Date(value + 'T00:00:00');
      return monthAbbr[date.getMonth()];
    };
    
    return { ticks, formatter };
  }, [granularity, periodStartDate, periodEndDate]);

  // Monthly tick computation for Temuan 6-bln mode (BarChart needs ticks matching actual data points)
  const temuanMonthAxis = useMemo(() => {
    if (granularity !== '6-bln' || !periodStartDate || !periodEndDate || weeklyData.length === 0) {
      return null;
    }
    
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Find the first week of each month from weeklyData
    // For each month in the period, find the first weeklyData entry that starts in that month
    const ticks: string[] = [];
    const tickToMonthMap: Record<string, string> = {};
    
    let currentMonth = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), 1);
    const endMonth = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const targetMonth = currentMonth.getMonth();
      const targetYear = currentMonth.getFullYear();
      
      // Find the first week that starts in this month
      const firstWeekOfMonth = weeklyData.find(week => {
        if (!week.startDateIso) return false;
        const weekStart = new Date(week.startDateIso + 'T00:00:00');
        return weekStart.getMonth() === targetMonth && weekStart.getFullYear() === targetYear;
      });
      
      if (firstWeekOfMonth && firstWeekOfMonth.startDateIso) {
        ticks.push(firstWeekOfMonth.startDateIso);
        tickToMonthMap[firstWeekOfMonth.startDateIso] = monthAbbr[targetMonth];
      }
      
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    // Formatter: Map weekStartIso to month abbreviation
    const formatter = (value: string) => {
      return tickToMonthMap[value] || '';
    };
    
    return { ticks, formatter };
  }, [granularity, periodStartDate, periodEndDate, weeklyData]);

  // Format data for chart
  const chartData = useMemo(() => {
    if (chartMode === 'nilai') {
      // For 6-bln mode, use weekly data to match Temuan granularity
      if (granularity === '6-bln') {
        return weeklyData.map((week) => ({
          date: week.startDateIso, // Use ISO date as unique X-axis key
          dayLabel: week.weekLabel, // Week label for tooltip
          totalClaimsRp: week.isFuture ? null : week.totalClaimsValue, // Red line - total claims
          temuanRp: week.isFuture ? null : week.totalRpAtRisk, // Blue line - temuan/overcharge
          claimCount: week.issueClaimCount,
          isFuture: week.isFuture,
        }));
      }
      // Other granularities: Include ALL days (including future) for full X-axis coverage
      // Set future days' values to null so line stops at current day
      return dailyData.map((day) => ({
        date: day.isoDate, // Use ISO date as unique X-axis key
        dayLabel: day.dateLabel, // Keep day label for tooltip
        totalClaimsRp: day.isFuture ? null : day.totalClaimsValue, // Red line - total claims
        temuanRp: day.isFuture ? null : day.totalRpAtRisk, // Blue line - temuan/overcharge
        claimCount: day.claimCount,
        isFuture: day.isFuture,
      }));
    } else {
      // Temuan mode: 4-category stacked bars showing weekly temuan counts
      return weeklyData.map(week => ({
        week: week.weekLabel,
        weekStartIso: week.startDateIso, // ISO date for X-axis positioning
        'Pelanggaran Polis': week.isFuture ? 0 : week.pelanggaranPolis,
        'Kelebihan Tagihan': week.isFuture ? 0 : week.kelebihanTagihan,
        'Ketidaksesuaian Medis': week.isFuture ? 0 : week.ketidaksesuaianMedis,
        'Penipuan': week.isFuture ? 0 : week.penipuan,
        total: week.isFuture ? 0 : week.totalTemuan,
        isFuture: week.isFuture,
      }));
    }
  }, [dailyData, weeklyData, chartMode]);

  // Generate X-axis ticks for Nilai mode based on granularity
  const { dailyTicks, tickFormatter } = useMemo(() => {
    if (chartMode !== 'nilai') {
      return { dailyTicks: undefined, tickFormatter: undefined };
    }
    
    if (!periodStartDate || !periodEndDate || dailyData.length === 0) {
      return { dailyTicks: undefined, tickFormatter: undefined };
    }
    
    // For Nilai mode: X-axis shows full period range (including future dates)
    // but chartData is filtered to only include non-future points
    // This way the line stops at today but the X-axis shows the full range
    
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Different granularities use different tick strategies
    if (granularity === '6-bln') {
      // 6 Bln: Use weekly data with monthly labels (same as Temuan mode)
      if (temuanMonthAxis) {
        return { dailyTicks: temuanMonthAxis.ticks, tickFormatter: temuanMonthAxis.formatter };
      }
      return { dailyTicks: undefined, tickFormatter: undefined };
    } else if (granularity === '1-thn' || granularity === 'semua') {
      // For monthly/quarterly: Use all data points (including future) for ticks
      // The chartData filtering ensures only non-future points are plotted
      const ticks = dailyData.map(d => d.isoDate);
      const formatter = (value: string) => {
        const item = dailyData.find(d => d.isoDate === value);
        return item ? item.dateLabel : '';
      };
      return { dailyTicks: ticks, tickFormatter: formatter };
    } else if (granularity === '1-bln') {
      // 1 Bln: Show daily ticks (1, 2, 3, ... up to last day of month)
      // Ensure ticks are in chronological order by sorting dailyData by isoDate
      const sortedData = [...dailyData].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
      const ticks = sortedData.map(d => d.isoDate);
      const formatter = (value: string) => {
        const date = new Date(value + 'T00:00:00');
        return date.getDate().toString();
      };
      return { dailyTicks: ticks, tickFormatter: formatter };
    } else if (granularity === '3-bln') {
      // 3 Bln: Show bi-weekly period labels (e.g., "1-15 Okt", "16-31 Okt")
      // Generate bi-weekly ranges for the period
      const biWeeklyRanges = getBiWeeklyRanges(periodStartDate, periodEndDate);
      
      // Use the start date of each bi-weekly period as tick position
      const ticks = biWeeklyRanges.map(range => range.startDate.toISOString().split('T')[0]);
      
      const formatter = (value: string) => {
        // Find the bi-weekly range that starts on this date
        const range = biWeeklyRanges.find(r => r.startDate.toISOString().split('T')[0] === value);
        if (!range) return '';
        
        // Extract start/end day and month from label (e.g., "1-15 Okt")
        return range.label;
      };
      
      return { dailyTicks: ticks, tickFormatter: formatter };
    }
    
    return { dailyTicks: undefined, tickFormatter: undefined };
  }, [chartMode, periodStartDate, periodEndDate, dailyData, granularity]);

  // Calculate Y-axis max
  const maxValue = Math.max(...chartData.map(d => {
    if (chartMode === 'nilai') {
      // Use the max of totalClaimsRp for dual-line chart
      return (d as any).totalClaimsRp || 0;
    } else {
      return (d as any).total || 0;
    }
  }));
  
  let yAxisMax: number;
  if (chartMode === 'nilai') {
    // For Nilai (Rp): round to nice numbers
    const rawMax = maxValue * 1.2;
    if (rawMax >= 1000000000) { // Billions
      yAxisMax = Math.ceil(rawMax / 100000000) * 100000000; // Round to nearest 100M
    } else if (rawMax >= 100000000) { // Hundreds of millions
      yAxisMax = Math.ceil(rawMax / 10000000) * 10000000; // Round to nearest 10M
    } else if (rawMax >= 1000000) { // Millions
      yAxisMax = Math.ceil(rawMax / 1000000) * 1000000; // Round to nearest 1M
    } else if (rawMax >= 100000) {
      yAxisMax = Math.ceil(rawMax / 100000) * 100000;
    } else {
      yAxisMax = Math.ceil(rawMax / 10000) * 10000;
    }
  } else {
    // For Temuan (#): whole numbers
    const rawMax = Math.ceil(maxValue * 1.2);
    if (rawMax <= 10) {
      yAxisMax = 10;
    } else if (rawMax <= 20) {
      yAxisMax = 20;
    } else if (rawMax <= 30) {
      yAxisMax = 30;
    } else {
      yAxisMax = Math.ceil(rawMax / 10) * 10;
    }
  }
  
  // Ensure minimum values
  if (chartMode === 'temuan' && yAxisMax < 10) yAxisMax = 10;
  if (chartMode === 'nilai' && yAxisMax < 1000000) yAxisMax = 1000000; // Min 1M

  // Generate Y-axis ticks with whole numbers for Temuan mode
  const generateYAxisTicks = (max: number): number[] => {
    if (chartMode === 'temuan') {
      // For count data, generate exactly 5 evenly spaced whole number ticks
      // Find a nice interval that divides evenly and covers the data
      let interval: number;
      
      if (max <= 4) interval = 1;        // [0,1,2,3,4]
      else if (max <= 8) interval = 2;   // [0,2,4,6,8]
      else if (max <= 12) interval = 3;  // [0,3,6,9,12]
      else if (max <= 20) interval = 5;  // [0,5,10,15,20]
      else if (max <= 40) interval = 10; // [0,10,20,30,40]
      else if (max <= 80) interval = 20; // [0,20,40,60,80]
      else if (max <= 100) interval = 25;// [0,25,50,75,100]
      else interval = Math.ceil(max / 4 / 10) * 10; // Round to nearest 10
      
      // Generate exactly 5 evenly-spaced whole number ticks
      return [0, interval, interval * 2, interval * 3, interval * 4];
    } else {
      // For Nilai (Rp) mode, use the original approach
      const interval = max / 4;
      return [0, interval, interval * 2, interval * 3, max];
    }
  };

  const yAxisTicks = generateYAxisTicks(yAxisMax);

  // Custom Y-axis tick formatter
  const formatYAxis = (value: number) => {
    if (chartMode === 'nilai') {
      // Format as RpXXJt (millions)
      const millions = value / 1000000;
      return `Rp${millions}Jt`;
    } else {
      // Format as "X temuan"
      return `${value} temuan`;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    if (data.isFuture) return null;

    // For Nilai mode, use dayLabel instead of label (which is isoDate)
    const displayLabel = chartMode === 'nilai' ? data.dayLabel : label;

    return (
      <div className="bg-gray-900 bg-opacity-95 rounded-md p-3 shadow-lg border border-gray-700">
        <p className="text-white font-semibold mb-2">{displayLabel}</p>
        
        {chartMode === 'nilai' ? (
          <>
            <p className="text-red-400 text-sm mb-1">
              <span className="font-semibold">Total klaim: </span>
              {formatRupiah(data.totalClaimsRp || 0)}
            </p>
            <p className="text-blue-400 text-sm">
              <span className="font-semibold">Total temuan: </span>
              {formatRupiah(data.temuanRp || 0)}
            </p>
          </>
        ) : (
          <>
            {ISSUE_CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-3 text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-white">{cat.label}:</span>
                </div>
                <span className="text-white font-semibold">
                  {data[cat.label] || 0} temuan
                </span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2">
              <p className="text-white text-sm font-semibold">
                Total: {data.total || 0} temuan (dari ~{weeklyData.find(w => w.weekLabel === label)?.issueClaimCount || 0} klaim)
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  // Navigation handlers
  const handlePreviousPeriod = () => {
    if (safeCurrentPeriodIndex > 0) {
      setCurrentPeriodIndex(safeCurrentPeriodIndex - 1);
    }
  };

  const handleNextPeriod = () => {
    if (safeCurrentPeriodIndex < availablePeriods.length - 1) {
      setCurrentPeriodIndex(safeCurrentPeriodIndex + 1);
    }
  };

  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
    setIsInitialized(false);
  };

  // Reset to latest period when granularity changes
  useEffect(() => {
    if (availablePeriods.length > 0 && !isInitialized) {
      setCurrentPeriodIndex(availablePeriods.length - 1);
      setIsInitialized(true);
    }
  }, [availablePeriods, granularity, isInitialized]);

  const canGoPrevious = safeCurrentPeriodIndex > 0 && granularity !== 'semua';
  const canGoNext = safeCurrentPeriodIndex < availablePeriods.length - 1 && granularity !== 'semua';
  const showNavigation = granularity !== 'semua';

  return (
    <Card className="w-full" data-testid="claims-bar-chart">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          {/* Title and Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Issue Terdeteksi
            </CardTitle>
            
            {/* Controls: Interval | Period Nav | Timestamp + Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Interval Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3" data-testid="granularity-dropdown">
                    {GRANULARITY_LABELS[granularity]}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
                    <DropdownMenuItem
                      key={g}
                      onClick={() => handleGranularityChange(g)}
                      data-testid={`granularity-${g}`}
                    >
                      {GRANULARITY_LABELS[g]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Period Navigation */}
              {showNavigation && (
                <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-md px-3 h-9">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousPeriod}
                    disabled={!canGoPrevious}
                    className="h-9 w-9 p-0"
                    data-testid="period-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                    {computedPeriodLabel || 'No data'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextPeriod}
                    disabled={!canGoNext}
                    className="h-9 w-9 p-0"
                    data-testid="period-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mode Toggle - Nilai (Rp) / Temuan (#) with Timestamp on Right */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-6">
              <button
                onClick={() => setChartMode('temuan')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  chartMode === 'temuan'
                    ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid="mode-toggle-temuan"
              >
                Temuan (#)
              </button>
              <button
                onClick={() => setChartMode('nilai')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  chartMode === 'nilai'
                    ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid="mode-toggle-nilai"
              >
                Nilai (Rp)
              </button>
            </div>
            
            {/* Timestamp + Refresh on Right */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Terakhir update database: {formatLastUpdated(lastUpdate)}
              </span>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 px-2 hover:bg-transparent"
                  data-testid="refresh-button"
                >
                  <RefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary Display */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              KLAIM BERMASALAH
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {chartMode === 'nilai' ? formatRupiah(totalRpAtRisk) : `${totalTemuan} Temuan`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {chartMode === 'nilai' 
                ? `(dari ${formatRupiah(totalClaimsValue)} total klaim)`
                : `(dari ${claimsWithIssues} klaim bermasalah • ${totalClaimsReviewed} total klaim)`
              }
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'nilai' ? (
              // Nilai mode: Line chart with daily data points, specific day markers (7, 14, 21, last)
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  ticks={dailyTicks}
                  tickFormatter={tickFormatter}
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="line"
                  iconSize={14}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Line
                  type="monotone"
                  dataKey="totalClaimsRp"
                  name="Total Klaim"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#ef4444' }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="temuanRp"
                  name="Total Temuan"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : (
              // Temuan mode: Stacked bar chart
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={granularity === '6-bln' ? 'weekStartIso' : 'week'}
                  ticks={granularity === '6-bln' && temuanMonthAxis ? temuanMonthAxis.ticks : undefined}
                  tickFormatter={granularity === '6-bln' && temuanMonthAxis ? temuanMonthAxis.formatter : undefined}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  domain={[0, yAxisTicks[yAxisTicks.length - 1]]}
                  ticks={yAxisTicks}
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />

                {/* 4-category stacked bars with white separators */}
                <Bar
                  dataKey="Pelanggaran Polis"
                  stackId="a"
                  fill={ISSUE_CATEGORIES[0].color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFuture ? '#e2e8f0' : ISSUE_CATEGORIES[0].color}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="Kelebihan Tagihan"
                  stackId="a"
                  fill={ISSUE_CATEGORIES[1].color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFuture ? '#e2e8f0' : ISSUE_CATEGORIES[1].color}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="Ketidaksesuaian Medis"
                  stackId="a"
                  fill={ISSUE_CATEGORIES[2].color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFuture ? '#e2e8f0' : ISSUE_CATEGORIES[2].color}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="Penipuan"
                  stackId="a"
                  fill={ISSUE_CATEGORIES[3].color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFuture ? '#e2e8f0' : ISSUE_CATEGORIES[3].color}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
