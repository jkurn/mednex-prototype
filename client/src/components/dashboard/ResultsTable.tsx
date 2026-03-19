import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Claim } from "@shared/schema";
import { useClaimsData } from "@/hooks/useClaimsData";
import { formatRupiah, formatDateIndonesian } from "@/utils/formatters";
import ClaimDetailModal from "./ClaimDetailModal";

export default function ResultsTable() {
  const { claims } = useClaimsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const itemsPerPage = 10;

  // Filter and sort claims
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = claims.filter(claim =>
      claim.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patientId.includes(searchTerm)
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
  }, [claims, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClaims.length / itemsPerPage);
  const paginatedClaims = filteredAndSortedClaims.slice(
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

  const openClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  // Helper function to get findings/flags
  const getFindings = (claim: Claim): string[] => {
    const findings: string[] = [];
    
    // Check for overpricing
    if (claim.analysis?.priceAnalysis?.some(p => p.flag === 'OVERPRICED')) {
      findings.push('Overcharges');
    }
    
    // Check for fraud
    if (claim.fraudRisks && claim.fraudRisks.length > 0) {
      findings.push('Fraud');
    }
    
    // Check for overutilization
    if (claim.recommendations?.forClaims?.some(r => 
      r.action.toLowerCase().includes('reduce') || 
      r.action.toLowerCase().includes('unnecessary') ||
      r.action.toLowerCase().includes('excessive')
    )) {
      findings.push('Overutilise');
    }
    
    return findings;
  };

  // Helper function to derive final status from reviewDecision.finalDecision (source of truth)
  const getFinalStatus = (claim: Claim): 'Approve' | 'Approve Sebagian' | 'Ditolak' | null => {
    // PRIMARY SOURCE: reviewDecision.finalDecision - this is what analysts see/edit
    const finalDecision = claim.reviewDecision?.finalDecision;
    if (finalDecision) {
      if (finalDecision === 'TOLAK') return 'Ditolak';
      if (finalDecision === 'SETUJUI PARTIAL') return 'Approve Sebagian';
      if (finalDecision === 'SETUJU') return 'Approve';
    }
    
    // SECONDARY: Check member validation failures
    if (claim.memberStatus === 'TIDAK DITEMUKAN' || claim.memberStatus === 'TIDAK AKTIF') {
      return 'Ditolak';
    }
    
    // TERTIARY: Check checkpoint status failures
    if (claim.checkpointStatuses?.validitasPeserta === 'failed') {
      return 'Ditolak';
    }
    if (claim.checkpointStatuses?.keputusanAkhir === 'failed') {
      return 'Ditolak';
    }
    
    // FALLBACK: adjudicationResult (legacy)
    if (claim.adjudicationResult) {
      if (claim.adjudicationResult === 'Tolak') return 'Ditolak';
      return claim.adjudicationResult as 'Approve' | 'Approve Sebagian';
    }
    
    return null;
  };

  // Helper function to calculate revised amount
  const getRevisedAmount = (claim: Claim): number => {
    if (claim.revisedAmount !== undefined) {
      return claim.revisedAmount;
    }
    
    // Calculate from analysis
    let totalDeduction = 0;
    
    // Add overpricing deductions
    if (claim.analysis?.priceAnalysis) {
      totalDeduction += claim.analysis.priceAnalysis
        .filter(p => p.flag === 'OVERPRICED')
        .reduce((sum, p) => sum + (p.chargedPrice - p.marketPrice), 0);
    }
    
    // Add fraud overcharges
    if (claim.fraudRisks) {
      totalDeduction += claim.fraudRisks
        .reduce((sum, r) => sum + (r.estimatedOvercharge || 0), 0);
    }
    
    // Add unnecessary treatment savings
    if (claim.recommendations?.forClaims) {
      totalDeduction += claim.recommendations.forClaims
        .reduce((sum, r) => sum + (r.potentialSavings || 0), 0);
    }
    
    // Ensure revised amount is never negative
    return Math.max(0, claim.amount - totalDeduction);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-success/10 text-success hover:bg-success/20 text-[10px] px-1.5 py-0"><i className="fas fa-check mr-0.5"></i>Processed</Badge>;
      case 'processing':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-1.5 py-0"><i className="fas fa-cog fa-spin mr-0.5"></i>Processing</Badge>;
      case 'incomplete':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 text-[10px] px-1.5 py-0"><i className="fas fa-exclamation-triangle mr-0.5"></i>Incomplete</Badge>;
      case 'error':
        return <Badge className="bg-error/10 text-error hover:bg-error/20 text-[10px] px-1.5 py-0"><i className="fas fa-times mr-0.5"></i>Error</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <i className={`fas ml-1 text-xs ${
      sortField === field 
        ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
        : 'fa-sort'
    }`}></i>
  );

  return (
    <Card className="shadow-sm border border-slate-200 mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 sm:mb-0">
            <i className="fas fa-table mr-2 text-primary"></i>
            Klaim yang Memerlukan Perhatianmu
          </h3>
          <div className="relative">
            <Input
              type="text"
              placeholder="Cari klaim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-56"
            />
            <i className="fas fa-search absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-medical text-2xl text-slate-400"></i>
            </div>
            <h4 className="text-sm font-medium text-text-primary mb-2">No Claims Processed</h4>
            <p className="text-xs text-slate-600">Upload medical bills to start processing claims data.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead 
                      className="cursor-pointer hover:bg-slate-50 text-xs font-medium"
                      onClick={() => handleSort('patientName')}
                    >
                      Nama Peserta <SortIcon field="patientName" />
                    </TableHead>
                    <TableHead className="text-xs font-medium">Nama Pemegang Polis</TableHead>
                    <TableHead className="text-xs font-medium">Nomor Polis</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-slate-50 text-xs font-medium"
                      onClick={() => handleSort('provider')}
                    >
                      Provider <SortIcon field="provider" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-slate-50 text-xs font-medium"
                      onClick={() => handleSort('date')}
                    >
                      Tanggal Klaim Disubmit <SortIcon field="date" />
                    </TableHead>
                    <TableHead className="text-xs font-medium">Diagnosa</TableHead>
                    <TableHead className="text-xs font-medium">Indikasi</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-slate-50 text-xs font-medium"
                      onClick={() => handleSort('amount')}
                    >
                      Total Nominal Klaim <SortIcon field="amount" />
                    </TableHead>
                    <TableHead className="text-xs font-medium">Total Klaim Terindikasi</TableHead>
                    <TableHead className="text-xs font-medium">Hasil Analisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClaims.map((claim) => {
                    const findings = getFindings(claim);
                    const revisedAmount = getRevisedAmount(claim);
                    
                    return (
                      <TableRow 
                        key={claim.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => openClaimDetails(claim)}
                        data-testid={`row-claim-${claim.id}`}
                      >
                        <TableCell className="py-2">
                          <span className="text-xs text-text-primary">
                            {claim.patientName || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs text-text-primary">
                            {claim.policyHolderName || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs font-mono text-text-primary">
                            {claim.policyNumber || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs text-text-primary">
                            {claim.provider}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs text-text-primary">
                            {formatDateIndonesian(claim.date)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs text-text-primary">
                            {claim.icd10Codes && claim.icd10Codes.length > 0 ? (
                              <div className="space-y-1">
                                {claim.icd10Codes.map((icd, idx) => (
                                  <div key={idx}>
                                    <span className="font-mono font-semibold">{icd.code}</span> - {icd.name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>{claim.diagnosis}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {findings.length > 0 ? (
                              findings.map((finding, idx) => (
                                <Badge 
                                  key={idx}
                                  className={`text-[10px] px-1.5 py-0 ${
                                    finding === 'Melebihi Buku Tarif' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                    finding === 'Penipuan' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  }`}
                                >
                                  {finding}
                                </Badge>
                              ))
                            ) : (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-[10px] px-1.5 py-0">
                                Normal
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs font-semibold text-text-primary">
                            {formatRupiah(claim.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs font-semibold text-text-primary">
                            {formatRupiah(revisedAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          {(() => {
                            const finalStatus = getFinalStatus(claim);
                            return finalStatus ? (
                              <Badge 
                                className={`text-[10px] px-2 py-0.5 ${
                                  finalStatus === 'Approve' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                  finalStatus === 'Approve Sebagian' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                  'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {finalStatus}
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 text-[10px] px-2 py-0.5">
                                Pending
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Menampilkan{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                hingga{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedClaims.length)}
                </span>{' '}
                dari{' '}
                <span className="font-medium">{filteredAndSortedClaims.length}</span>{' '}
                hasil
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-xs h-7 px-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left mr-1 text-[10px]"></i>Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`text-xs h-7 px-2.5 min-w-[28px] border rounded ${
                      page === currentPage 
                        ? 'bg-primary text-white border-primary' 
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs h-7 px-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya<i className="fas fa-chevron-right ml-1 text-[10px]"></i>
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Claim Detail Modal */}
        {selectedClaim && (
          <ClaimDetailModal
            claim={selectedClaim}
            isOpen={!!selectedClaim}
            onClose={() => setSelectedClaim(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
