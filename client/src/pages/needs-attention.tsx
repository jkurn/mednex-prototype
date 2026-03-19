import { useState, useMemo, useEffect } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { ArrowLeft, Zap, Clock, FileEdit, List, RefreshCw, CheckCircle } from "lucide-react";
import ClaimReview from "@/pages/claim-review";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClaimsData } from "@/hooks/useClaimsData";
import { formatRupiah, formatDateIndonesian } from "@/utils/formatters";
import { Claim } from "@shared/schema";
import Sidebar from "@/components/dashboard/Sidebar";
import FileUpload from "@/components/dashboard/FileUpload";
import { shouldRouteToManualInput, hasMissingEssentialData, getClaimQualitySummary } from "@/utils/documentQuality";
import { getStatusTag } from "@/utils/checkpointHelpers";
import { PenLine, AlertTriangle } from "lucide-react";

type TabType = "ai_auto_review" | "pending" | "manual_input" | "all";

const validTabs: TabType[] = ["ai_auto_review", "pending", "manual_input", "all"];

function getTabFromSearch(searchString: string): TabType {
  const params = new URLSearchParams(searchString);
  const tab = params.get("tab");
  if (tab && validTabs.includes(tab as TabType)) {
    return tab as TabType;
  }
  return "ai_auto_review";
}

export default function NeedsAttentionPage() {
  const { claims, lastUpdated, refreshData } = useClaimsData();
  const [, setLocation] = useLocation();
  const [match] = useRoute("/klaim/:id");
  const searchString = useSearch();
  
  // Derive active tab directly from URL - this ensures it's always in sync
  const activeTab = useMemo(() => getTabFromSearch(searchString), [searchString]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-refresh database when page opens
  useEffect(() => {
    refreshData();
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Update URL when tab changes (tab state is derived from URL, so we just navigate)
  const handleTabChange = (tab: string) => {
    setCurrentPage(1);
    setLocation(`/needs-attention?tab=${tab}`);
  };

  // Filter claims for Manual Input FIRST (priority routing)
  // Claims with handwritten financial docs or low OCR quality go here
  // EXCEPTION: Clear rejection cases (member not found) should NOT go to manual input
  const manualInputClaims = useMemo(() => {
    return claims.filter(c => {
      // CLEAR REJECTION CASES - these are "slam dunk" rejections, no manual review needed
      // They should go to AI Auto-Review, not Manual Input
      const isClearRejection = 
        c.memberStatus === 'TIDAK DITEMUKAN' || 
        (c.memberValidation as any)?.autoReject === true ||
        (c.adjudicationResult === 'Tolak' && c.memberValidation?.passed === false);
      
      if (isClearRejection) {
        return false; // Don't route to manual input - go to AI Auto-Review
      }
      
      // Use new document quality assessment
      const needsManualInput = shouldRouteToManualInput(c);
      const hasMissingData = hasMissingEssentialData(c);
      return needsManualInput || hasMissingData;
    });
  }, [claims]);

  // Filter claims for AI Auto-Review (claims with AI analysis completed)
  // CRITICAL: Exclude claims that should go to Manual Input
  const aiAutoReviewClaims = useMemo(() => {
    // Get IDs of claims that need manual input
    const manualInputIds = new Set(manualInputClaims.map(c => c.id));
    
    return claims.filter(c => {
      // Must have AI analysis completed
      const hasAnalysis = c.analysis && c.checkpointStatuses;
      // Must NOT need manual input
      const needsManualInput = manualInputIds.has(c.id);
      return hasAnalysis && !needsManualInput;
    });
  }, [claims, manualInputClaims]);

  // Filter claims for Pending (>2 days or high value without decision)
  const pendingClaims = useMemo(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    return claims.filter(c => {
      const claimDate = new Date(c.date);
      const isPendingLong = claimDate < twoDaysAgo && !c.adjudicationResult;
      const isHighValue = (c.amount || 0) > 5000000;
      return isPendingLong || (isHighValue && !c.adjudicationResult);
    });
  }, [claims]);

  // Helper function to filter and sort claims
  const filterAndSortClaims = (claimsToFilter: Claim[]) => {
    let filtered = claimsToFilter.filter(claim =>
      claim.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policyHolderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patientId?.includes(searchTerm) ||
      claim.policyNumber?.includes(searchTerm) ||
      false
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof typeof a];
        const bValue = b[sortField as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  };

  // Filter and sort for each tab
  const filteredAiAutoReviewClaims = useMemo(() => 
    filterAndSortClaims(aiAutoReviewClaims),
    [aiAutoReviewClaims, searchTerm, sortField, sortDirection]
  );

  const filteredPendingClaims = useMemo(() => 
    filterAndSortClaims(pendingClaims),
    [pendingClaims, searchTerm, sortField, sortDirection]
  );

  const filteredManualInputClaims = useMemo(() => 
    filterAndSortClaims(manualInputClaims),
    [manualInputClaims, searchTerm, sortField, sortDirection]
  );

  const filteredAllClaims = useMemo(() => 
    filterAndSortClaims(claims),
    [claims, searchTerm, sortField, sortDirection]
  );

  // Pagination for AI Auto-Review tab
  const totalPagesAiAutoReview = Math.ceil(filteredAiAutoReviewClaims.length / itemsPerPage);
  const paginatedAiAutoReviewClaims = filteredAiAutoReviewClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination for Pending tab
  const totalPagesPending = Math.ceil(filteredPendingClaims.length / itemsPerPage);
  const paginatedPendingClaims = filteredPendingClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination for Manual Input tab
  const totalPagesManualInput = Math.ceil(filteredManualInputClaims.length / itemsPerPage);
  const paginatedManualInputClaims = filteredManualInputClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination for All tab
  const totalPagesAll = Math.ceil(filteredAllClaims.length / itemsPerPage);
  const paginatedAllClaims = filteredAllClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFindings = (claim: Claim): string[] => {
    const findings: string[] = [];
    if (claim.analysis?.priceAnalysis?.some(p => p.flag === 'OVERPRICED')) {
      findings.push('Overcharges');
    }
    if (claim.fraudRisks && claim.fraudRisks.length > 0) {
      findings.push('Fraud');
    }
    if (claim.recommendations?.forClaims?.some(r => 
      r.action.toLowerCase().includes('reduce') || 
      r.action.toLowerCase().includes('unnecessary') ||
      r.action.toLowerCase().includes('excessive')
    )) {
      findings.push('Overutilise');
    }
    return findings;
  };

  const getRevisedAmount = (claim: Claim): number => {
    if (claim.revisedAmount !== undefined) {
      return claim.revisedAmount;
    }
    let totalDeduction = 0;
    if (claim.analysis?.priceAnalysis) {
      totalDeduction += claim.analysis.priceAnalysis
        .filter(p => p.flag === 'OVERPRICED')
        .reduce((sum, p) => sum + (p.chargedPrice - p.marketPrice), 0);
    }
    if (claim.fraudRisks) {
      totalDeduction += claim.fraudRisks
        .reduce((sum, r) => sum + (r.estimatedOvercharge || 0), 0);
    }
    if (claim.recommendations?.forClaims) {
      totalDeduction += claim.recommendations.forClaims
        .reduce((sum, r) => sum + (r.potentialSavings || 0), 0);
    }
    return Math.max(0, claim.amount - totalDeduction);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <i className={`fas ml-1 text-xs ${
      sortField === field 
        ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
        : 'fa-sort'
    }`}></i>
  );

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return '-';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes} ${ampm}`;
    
    if (isToday) {
      return `Hari ini, ${timeString}`;
    }
    
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName} ${day} ${monthName} ${year}, ${timeString}`;
  };

  // Render claims table
  const renderClaimsTable = (claimsList: Claim[], totalPages: number, tabName: string) => {
    if (claimsList.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h4 className="text-sm font-medium text-slate-900 mb-2">
            {tabName === 'all' ? 'Belum ada klaim' : `Tidak ada klaim dalam kategori ini`}
          </h4>
          <p className="text-xs text-slate-600">
            {tabName === 'all' 
              ? 'Upload klaim untuk mulai analisis'
              : `Kamu sudah menyelesaikan semua klaim ${tabName}!`}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100 text-xs font-medium w-[120px]"
                  onClick={() => handleSort('patientName')}
                >
                  Nama Peserta <SortIcon field="patientName" />
                </TableHead>
                <TableHead className="text-xs font-medium w-[140px]">Nama Pemegang Polis</TableHead>
                <TableHead className="text-xs font-medium w-[150px]">Nomor Polis</TableHead>
                <TableHead className="text-xs font-medium w-[140px]">Provider</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100 text-xs font-medium w-[130px]"
                  onClick={() => handleSort('date')}
                >
                  Tanggal Klaim Disubmit <SortIcon field="date" />
                </TableHead>
                <TableHead className="text-xs font-medium w-[200px]">Diagnosa</TableHead>
                <TableHead className="text-xs font-medium w-[120px]">Indikasi</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100 text-xs font-medium w-[130px]"
                  onClick={() => handleSort('amount')}
                >
                  Total Nominal Klaim <SortIcon field="amount" />
                </TableHead>
                <TableHead className="text-xs font-medium w-[140px]">Total Klaim Terindikasi</TableHead>
                <TableHead className="text-xs font-medium w-[110px]">Hasil Analisa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claimsList.map((claim, idx) => {
                const findings = getFindings(claim);
                const revisedAmount = getRevisedAmount(claim);
                const qualitySummary = getClaimQualitySummary(claim);
                
                return (
                  <TableRow 
                    key={idx}
                    onClick={() => setLocation(`/klaim/${claim.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    data-testid={`row-claim-${idx}`}
                  >
                    <TableCell className="text-xs w-[120px]">
                      <div className="flex items-center gap-1">
                        <span>{claim.patientName || '-'}</span>
                        {qualitySummary.requiresManualInput && (
                          <span 
                            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] bg-orange-100 text-orange-700 border border-orange-200"
                            title={qualitySummary.message}
                          >
                            <PenLine className="w-2.5 h-2.5" />
                            Manual
                          </span>
                        )}
                        {qualitySummary.status === 'warning' && !qualitySummary.requiresManualInput && (
                          <span title={qualitySummary.message}>
                            <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs w-[140px]">{claim.policyHolderName || '-'}</TableCell>
                    <TableCell className="text-xs w-[150px]">{claim.policyNumber || '-'}</TableCell>
                    <TableCell className="text-xs w-[140px]">{claim.provider}</TableCell>
                    <TableCell className="text-xs w-[130px]">{formatDateIndonesian(claim.date)}</TableCell>
                    <TableCell className="text-xs w-[200px]">
                      {claim.icd10Codes && claim.icd10Codes.length > 0 ? (
                        <div className="space-y-1">
                          {claim.icd10Codes.map((icd, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{icd.code}</span>
                              {icd.name && <span className="text-slate-600"> - {icd.name}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{claim.icd10 || claim.diagnosis}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs w-[120px]">
                      <div className="flex flex-wrap gap-1">
                        {findings.map((finding, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                            {finding}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium w-[130px]">{formatRupiah(claim.amount)}</TableCell>
                    <TableCell className="text-xs font-medium w-[140px]">{formatRupiah(revisedAmount)}</TableCell>
                    <TableCell className="text-xs w-[110px]">
                      {(() => {
                        // Use keputusanAkhir as source of truth (matches claim review page)
                        const keputusanStatus = claim.checkpointStatuses?.keputusanAkhir;
                        if (!keputusanStatus || keputusanStatus === 'pending') return '-';
                        
                        const tag = getStatusTag('keputusanAkhir', keputusanStatus, claim);
                        const colorClass = tag.color === 'green' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : tag.color === 'yellow'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : tag.color === 'red'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200';
                        
                        return (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${colorClass}`}
                          >
                            {tag.text}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, claimsList.length)} dari {claimsList.length} klaim
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-prev-page"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-next-page"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background-alt">
      <Sidebar />
      <div className="ml-64">
        <main className="pl-6 py-6">
          {/* Back Button */}
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Klaim</span>
          </button>

          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Perlu Perhatianmu
            </h1>
            <p className="text-xs text-slate-600 mb-3">
              Strator menggunakan AI untuk mengidentifikasi dan mensortir mana kasus-kasus klaim terbaru yang memerlukan perhatianmu dalam halaman ini.
            </p>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-slate-500">•</span>
                <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
                <span><span className="font-medium">AI Auto-Review:</span> kasus-kasus klaim yang sudah di-review secara otomatis oleh Strator AI.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-500">•</span>
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
                <span><span className="font-medium">Pending:</span> kasus-kasus klaim mendesak yang belum terproses lebih dari 2 hari atau mendekati batas SLA.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-500">•</span>
                <FileEdit className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
                <span><span className="font-medium">Input Manual:</span> kasus-kasus klaim yang memerlukan input manual karena dokumen tidak terbaca dengan jelas.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-500">•</span>
                <List className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
                <span><span className="font-medium">Lihat Semua:</span> lihat semua kasus klaim terbaru.</span>
              </div>
            </div>
          </div>

          {/* Table Card with Tabs */}
          <Card className="shadow-sm border border-slate-200">
            <div className="p-6">
              {/* Search - Above Tabs */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Cari klaim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                  data-testid="input-search-claims"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"></i>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                {/* Tab Headers with Last Updated and Refresh */}
                <div className="flex items-center justify-between border-b border-slate-200 mb-4">
                  <TabsList className="bg-transparent p-0 h-auto rounded-none w-auto justify-start border-0">
                    <TabsTrigger 
                      value="ai_auto_review" 
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 px-3 text-xs font-medium text-slate-600 data-[state=active]:text-slate-900"
                      data-testid="tab-ai-auto-review"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      AI Auto-Review
                      <span className="ml-2 text-slate-500">({aiAutoReviewClaims.length})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 px-3 text-xs font-medium text-slate-600 data-[state=active]:text-slate-900"
                      data-testid="tab-pending"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                      <span className="ml-2 text-slate-500">({pendingClaims.length})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="manual_input"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 px-3 text-xs font-medium text-slate-600 data-[state=active]:text-slate-900"
                      data-testid="tab-manual-input"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Input Manual
                      <span className="ml-2 text-slate-500">({manualInputClaims.length})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 px-3 text-xs font-medium text-slate-600 data-[state=active]:text-slate-900"
                      data-testid="tab-all"
                    >
                      <List className="w-4 h-4 mr-2" />
                      Lihat Semua
                      <span className="ml-2 text-slate-500">({claims.length})</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Last Updated and Refresh Button */}
                  <div className="flex items-center gap-3 pb-2">
                    <span className="text-xs text-slate-400" data-testid="text-last-updated">
                      Terakhir update database: {formatLastUpdated(lastUpdated)}
                    </span>
                    <button
                      onClick={refreshData}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Refresh data"
                      data-testid="button-refresh-data"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Auto-Review Tab Content */}
                <TabsContent value="ai_auto_review" className="mt-0">
                  {renderClaimsTable(paginatedAiAutoReviewClaims, totalPagesAiAutoReview, "AI Auto-Review")}
                </TabsContent>

                {/* Pending Tab Content */}
                <TabsContent value="pending" className="mt-0">
                  {renderClaimsTable(paginatedPendingClaims, totalPagesPending, "Pending")}
                </TabsContent>

                {/* Manual Input Tab Content */}
                <TabsContent value="manual_input" className="mt-0">
                  {renderClaimsTable(paginatedManualInputClaims, totalPagesManualInput, "Input Manual")}
                </TabsContent>

                {/* Lihat Semua Tab Content */}
                <TabsContent value="all" className="mt-0">
                  {renderClaimsTable(paginatedAllClaims, totalPagesAll, "all")}
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* File Upload Section - Separate Card Below */}
          <div className="mt-6">
            <FileUpload />
          </div>
        </main>
      </div>
      
      {/* Modal overlay - renders on top when on /klaim/:id route */}
      {match && <ClaimReview />}
    </div>
  );
}
