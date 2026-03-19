import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ArrowLeft, Download, Eye, ChevronLeft, ChevronRight, Users, UserCheck, UserX } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import * as XLSX from 'xlsx';

interface Member {
  id: number;
  memberId: string;
  policyId: string;
  policyNumber: string | null;
  policyholderName: string;
  policyExpiryDate: string | null;
  memberCardNumber: string;
  fullName: string;
  principalMemberId: string | null;
  principalName: string | null;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  enrollmentDate: string;
  terminationDate: string | null;
  status: string;
  planIP: string | null;
  planOP: string | null;
  planRB: string | null;
  planRG: string | null;
  planKM: string | null;
  planMCU: string | null;
  planLainnya: string | null;
  createdAt: string;
}

interface MemberListResponse {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DaftarPeserta() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'TERMINATED'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const pageSize = 20;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: membersData, isLoading } = useQuery<MemberListResponse>({
    queryKey: ['/api/members', statusFilter, searchQuery, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await fetch(`/api/members?${params}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/members/stats/count'],
    queryFn: async () => {
      const response = await fetch('/api/members/stats/count');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    } catch {
      return '-';
    }
  };

  const handleExportExcel = () => {
    if (!membersData?.members) return;
    
    const exportData = membersData.members.map((m, idx) => ({
      'No': idx + 1,
      'Nomor Kartu': m.memberCardNumber,
      'Nama Lengkap': m.fullName,
      'Pemegang Polis': m.policyholderName,
      'Nama Prinsipal': m.principalName || m.fullName,
      'Hubungan': m.relationship,
      'Jenis Kelamin': m.gender,
      'Tanggal Lahir': formatDate(m.dateOfBirth),
      'Usia': calculateAge(m.dateOfBirth),
      'Tanggal Mulai': formatDate(m.enrollmentDate),
      'Tanggal Selesai': formatDate(m.terminationDate),
      'Status': m.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Peserta');
    XLSX.writeFile(wb, `Daftar_Peserta_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalPages = membersData?.totalPages || 1;
  const totalMembers = membersData?.total || 0;
  const activeCount = statsData?.count || 0;

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
                  Daftar Peserta Aktif
                </h1>
                <p className="text-xs text-slate-600">
                  Menampilkan {membersData?.members.length || 0} dari {totalMembers} peserta yang terdaftar dalam sistem.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{activeCount} Aktif</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{totalMembers} Total</span>
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
                    placeholder="Cari nama atau nomor kartu peserta..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">No</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nomor Kartu</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nama Lengkap</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Pemegang Polis</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nama Prinsipal</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Hubungan</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Jenis Kelamin</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Tanggal Lahir</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Usia</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Tgl Mulai</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">RI</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">RJ</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">RB</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">RG</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">KM</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">MCU</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Lain</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={idx} className="border-b animate-pulse">
                          {Array.from({ length: 19 }).map((_, colIdx) => (
                            <td key={colIdx} className="px-4 py-3">
                              <div className="h-4 bg-slate-200 rounded w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : membersData?.members.length === 0 ? (
                      <tr>
                        <td colSpan={19} className="px-4 py-12 text-center text-slate-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">Belum ada data peserta</p>
                          <p className="text-sm mt-1">Upload data peserta melalui menu Pemegang Polis</p>
                        </td>
                      </tr>
                    ) : (
                      membersData?.members.map((member, idx) => (
                        <tr
                          key={member.id}
                          className="border-b hover:bg-slate-50 transition-colors"
                          data-testid={`row-member-${member.id}`}
                        >
                          <td className="px-4 py-3 text-slate-500">{(currentPage - 1) * pageSize + idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{member.memberCardNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{member.fullName}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{member.policyholderName}</td>
                          <td className="px-4 py-3 text-slate-600">{member.principalName || member.fullName}</td>
                          <td className="px-4 py-3 text-slate-600">{member.relationship}</td>
                          <td className="px-4 py-3 text-slate-600">{member.gender === 'Laki-laki' || member.gender === 'L' ? 'L' : 'P'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(member.dateOfBirth)}</td>
                          <td className="px-4 py-3 text-slate-600">{calculateAge(member.dateOfBirth)} th</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(member.enrollmentDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              member.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {member.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planIP || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planOP || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planRB || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planRG || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planKM || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planMCU || '-'}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">{member.planLainnya || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMember(member)}
                              className="h-8 w-8 p-0"
                              data-testid={`button-view-${member.id}`}
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
                    Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalMembers)} dari {totalMembers} peserta
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

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedMember?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {selectedMember?.status === 'ACTIVE' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-lg font-semibold">{selectedMember?.fullName}</p>
                <p className="text-sm font-normal text-slate-500">{selectedMember?.memberCardNumber}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Data Pribadi</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Jenis Kelamin</span>
                      <span className="text-sm font-medium text-slate-900">{selectedMember.gender}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Tanggal Lahir</span>
                      <span className="text-sm font-medium text-slate-900">{formatDate(selectedMember.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Usia</span>
                      <span className="text-sm font-medium text-slate-900">{calculateAge(selectedMember.dateOfBirth)} tahun</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Hubungan</span>
                      <span className="text-sm font-medium text-slate-900">{selectedMember.relationship}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-sm text-slate-600">Nama Prinsipal</span>
                      <span className="text-sm font-medium text-slate-900">{selectedMember.principalName || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Data Polis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Pemegang Polis</span>
                      <span className="text-sm font-medium text-slate-900 text-right max-w-[180px] truncate">{selectedMember.policyholderName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Nomor Polis</span>
                      <span className="text-sm font-medium text-slate-900">{selectedMember.policyNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Tanggal Mulai</span>
                      <span className="text-sm font-medium text-slate-900">{formatDate(selectedMember.enrollmentDate)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Tanggal Selesai</span>
                      <span className="text-sm font-medium text-slate-900">{formatDate(selectedMember.terminationDate)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-sm text-slate-600">Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedMember.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedMember.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
