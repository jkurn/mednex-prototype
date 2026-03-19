import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, ArrowLeft, Download, Filter, Eye, ChevronLeft, ChevronRight, FileText, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import * as XLSX from 'xlsx';

interface Policy {
  id: string;
  policyNumber: string;
  policyholderName: string;
  periodStart: string;
  periodEnd: string;
  totalMembers: number;
  employees: number;
  dependents: number;
  benefitTypes: string[];
  status: string;
  createdAt: string;
}

const samplePolicies: Policy[] = [
  {
    id: 'demo',
    policyNumber: 'P03-01-10-2020-0000001',
    policyholderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
    periodStart: '2020-10-14',
    periodEnd: '2021-10-13',
    totalMembers: 1247,
    employees: 523,
    dependents: 724,
    benefitTypes: ['Rawat Inap', 'Rawat Jalan'],
    status: 'Aktif',
    createdAt: '2020-10-01',
  },
  {
    id: 'pol-002',
    policyNumber: 'P03-02-05-2021-0000002',
    policyholderName: 'PT. Berkah Sejahtera Abadi',
    periodStart: '2021-05-01',
    periodEnd: '2022-04-30',
    totalMembers: 856,
    employees: 342,
    dependents: 514,
    benefitTypes: ['Rawat Inap', 'Rawat Jalan', 'Gigi'],
    status: 'Aktif',
    createdAt: '2021-04-15',
  },
  {
    id: 'pol-003',
    policyNumber: 'P03-03-01-2022-0000003',
    policyholderName: 'PT. Teknologi Nusantara Prima',
    periodStart: '2022-01-01',
    periodEnd: '2022-12-31',
    totalMembers: 2134,
    employees: 890,
    dependents: 1244,
    benefitTypes: ['Rawat Inap', 'Rawat Jalan'],
    status: 'Aktif',
    createdAt: '2021-12-15',
  },
  {
    id: 'pol-004',
    policyNumber: 'P03-04-08-2019-0000004',
    policyholderName: 'CV. Mandiri Jaya Sentosa',
    periodStart: '2019-08-01',
    periodEnd: '2020-07-31',
    totalMembers: 156,
    employees: 78,
    dependents: 78,
    benefitTypes: ['Rawat Inap'],
    status: 'Tidak Aktif',
    createdAt: '2019-07-15',
  },
];

export default function DaftarPolis() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Tidak Aktif'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [policies, setPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    const storedPolicies = localStorage.getItem('strator_policies');
    const dataWasReset = localStorage.getItem('strator_data_reset') === 'true';
    
    // If data was reset, only show policies from localStorage (empty after reset)
    if (dataWasReset) {
      if (storedPolicies) {
        try {
          const parsed = JSON.parse(storedPolicies);
          setPolicies(parsed);
        } catch {
          setPolicies([]);
        }
      } else {
        setPolicies([]);
      }
    } else {
      // Normal mode: include sample policies as demo data
      if (storedPolicies) {
        try {
          const parsed = JSON.parse(storedPolicies);
          setPolicies([...samplePolicies, ...parsed]);
        } catch {
          setPolicies(samplePolicies);
        }
      } else {
        setPolicies(samplePolicies);
      }
    }
  }, []);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = searchQuery === '' || 
      policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.policyholderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredPolicies.length / pageSize) || 1;
  const activeCount = policies.filter(p => p.status === 'Aktif').length;
  const totalCount = policies.length;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredPolicies.map((p, idx) => ({
      'No': idx + 1,
      'Nomor Polis': p.policyNumber,
      'Pemegang Polis': p.policyholderName,
      'Periode Mulai': formatDate(p.periodStart),
      'Periode Selesai': formatDate(p.periodEnd),
      'Total Peserta': p.totalMembers,
      'Karyawan': p.employees,
      'Tanggungan': p.dependents,
      'Jenis Manfaat': p.benefitTypes.join(', '),
      'Status': p.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Polis');
    XLSX.writeFile(wb, `Daftar_Polis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-background-alt">
      <Sidebar />
      <div className="ml-64">
        <main className="pl-6 py-6 pr-6">
          <button
            onClick={() => setLocation("/pemegang-polis")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            data-testid="button-back-to-pemegang-polis"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pemegang Polis</span>
          </button>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Daftar Polis
                </h1>
                <p className="text-xs text-slate-600">
                  Menampilkan {paginatedPolicies.length} dari {filteredPolicies.length} polis yang terdaftar dalam sistem.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{activeCount} Aktif</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{totalCount} Total</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="gap-2"
                  data-testid="button-export-excel"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border border-slate-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Cari nomor polis atau nama pemegang polis..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                    data-testid="filter-all"
                  >
                    Semua
                  </Button>
                  <Button
                    variant={statusFilter === 'Aktif' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatusFilter('Aktif'); setCurrentPage(1); }}
                    data-testid="filter-active"
                  >
                    Aktif
                  </Button>
                  <Button
                    variant={statusFilter === 'Tidak Aktif' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatusFilter('Tidak Aktif'); setCurrentPage(1); }}
                    data-testid="filter-terminated"
                  >
                    Tidak Aktif
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">No</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nomor Polis</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Pemegang Polis</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Periode</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Peserta</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Jenis Manfaat</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPolicies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">Belum ada data polis</p>
                          <p className="text-sm mt-1">Upload data polis melalui menu Pemegang Polis</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedPolicies.map((policy, idx) => (
                        <tr
                          key={policy.id}
                          className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/polis/${policy.id}`)}
                          data-testid={`row-policy-${policy.id}`}
                        >
                          <td className="px-4 py-3 text-slate-500">{(currentPage - 1) * pageSize + idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{policy.policyNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 max-w-[250px] truncate">{policy.policyholderName}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {formatDate(policy.periodStart)} - {formatDate(policy.periodEnd)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="text-sm">{policy.totalMembers.toLocaleString('id-ID')} peserta</div>
                            <div className="text-xs text-slate-400">{policy.employees} karyawan, {policy.dependents} tanggungan</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {policy.benefitTypes.join(', ')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              policy.status === 'Aktif'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {policy.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/polis/${policy.id}`);
                              }}
                              className="h-8 w-8 p-0"
                              data-testid={`button-view-${policy.id}`}
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredPolicies.length)} dari {filteredPolicies.length} polis
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      const pageNum = currentPage <= 3
                        ? idx + 1
                        : currentPage >= totalPages - 2
                          ? totalPages - 4 + idx
                          : currentPage - 2 + idx;
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8"
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
