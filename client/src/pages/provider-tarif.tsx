import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, ChevronDown, BookOpen, X, FileText, Trash2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { ProviderBukuTarif, ProviderActivity, ProviderTariffBook } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function ProviderTarifPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProviderDialog, setShowNewProviderDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [modalActivitySearchTerm, setModalActivitySearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Form state for new provider
  const [newProviderName, setNewProviderName] = useState('');
  const [newBerlakuSampai, setNewBerlakuSampai] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for update
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [updateBerlakuSampai, setUpdateBerlakuSampai] = useState('');
  const [localTariffBooks, setLocalTariffBooks] = useState<ProviderTariffBook[]>([]);

  const { data: providers = [], isLoading } = useQuery<ProviderBukuTarif[]>({
    queryKey: ['/api/providers/buku-tarif'],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ProviderActivity[]>({
    queryKey: ["/api/provider-activities"],
  });

  // Load local tariff books from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('strator_tariff_books');
    if (stored) {
      try {
        const books: ProviderTariffBook[] = JSON.parse(stored);
        setLocalTariffBooks(books);
      } catch {
        setLocalTariffBooks([]);
      }
    }
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter activities based on search term
  const filteredActivities = activities.filter(activity =>
    activity.providerName.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
    activity.activityType.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
    activity.note.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(activitySearchTerm.toLowerCase())
  );

  // Filter modal activities independently
  const filteredModalActivities = activities.filter(activity =>
    activity.providerName.toLowerCase().includes(modalActivitySearchTerm.toLowerCase()) ||
    activity.activityType.toLowerCase().includes(modalActivitySearchTerm.toLowerCase()) ||
    activity.note.toLowerCase().includes(modalActivitySearchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(modalActivitySearchTerm.toLowerCase())
  );

  // Get 5 most recent activities for main view
  const recentActivities = filteredActivities.slice(0, 5);

  // Modal controls
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showActivityModal) {
        setShowActivityModal(false);
        setModalActivitySearchTerm("");
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowActivityModal(false);
        setModalActivitySearchTerm("");
      }
    };

    if (showActivityModal) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showActivityModal]);

  const createMutation = useMutation({
    mutationFn: async (data: { provider_name: string; berlaku_sampai_tgl: string }) => {
      const res = await apiRequest('POST', '/api/providers/buku-tarif', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/buku-tarif'] });
      setShowNewProviderDialog(false);
      setNewProviderName('');
      setNewBerlakuSampai('');
      setUploadedFile(null);
      toast({
        title: 'Berhasil',
        description: 'Buku tarif baru berhasil ditambahkan',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; berlaku_sampai_tgl: string }) => {
      const res = await apiRequest('PUT', `/api/providers/buku-tarif/${data.id}`, { 
        berlaku_sampai_tgl: data.berlaku_sampai_tgl 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/buku-tarif'] });
      setShowUpdateDialog(false);
      setSelectedProviderId('');
      setUpdateBerlakuSampai('');
      toast({
        title: 'Berhasil',
        description: 'Buku tarif berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const filteredProviders = providers.filter(provider =>
    provider.provider_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatIndonesianDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'd MMMM yyyy', { locale: idLocale });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Berlaku': 'bg-green-50 text-green-700',
      'Lewat Masa Berlaku': 'bg-orange-50 text-orange-700',
      'Terminasi': 'bg-red-50 text-red-700',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleCreateProvider = async () => {
    if (!newProviderName || !newBerlakuSampai) {
      toast({
        title: 'Peringatan',
        description: 'Mohon lengkapi semua field',
        variant: 'destructive',
      });
      return;
    }

    // If file is uploaded, process it with AI
    if (uploadedFile) {
      setIsProcessingFile(true);
      setProcessingStatus('Memproses dokumen dengan AI...');
      
      try {
        const base64 = await fileToBase64(uploadedFile);
        
        const response = await fetch('/api/ai/process-tariff-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: uploadedFile.name,
            mimeType: uploadedFile.type,
            providerName: newProviderName,
          }),
        });

        if (!response.ok) {
          throw new Error('Gagal memproses buku tarif');
        }

        const result = await response.json();
        
        // Create the provider ID and tariff book structure
        const providerId = `PROV-${Date.now()}`;
        const today = format(new Date(), 'd MMMM yyyy', { locale: idLocale });
        
        const tariffBook: ProviderTariffBook = {
          id: providerId,
          providerName: newProviderName,
          providerCode: newProviderName.replace(/[^A-Z]/gi, '').substring(0, 6).toUpperCase() || 'PROV',
          berlakuMulai: today,
          berlakuSampai: format(new Date(newBerlakuSampai), 'd MMMM yyyy', { locale: idLocale }),
          totalItems: result.items?.length || 0,
          totalCategories: result.categoriesFound?.length || 0,
          status: new Date(newBerlakuSampai) > new Date() ? 'Aktif' : 'Kadaluarsa',
          uploadDate: today,
          items: (result.items || []).map((item: any, idx: number) => ({
            id: `${providerId}-ITEM-${idx + 1}`,
            providerId,
            tariffId: item.tariffId || `ITEM-${idx + 1}`,
            category: item.category || 'Other',
            itemName: item.itemName || 'Unknown Item',
            priceOPD: item.priceOPD,
            priceKelas3: item.priceKelas3,
            priceKelas2: item.priceKelas2,
            priceKelas1: item.priceKelas1,
            priceVIP: item.priceVIP,
            priceVVIP: item.priceVVIP,
          })),
          notes: result.summary || '',
        };

        // Save to localStorage
        const existing = localStorage.getItem('strator_tariff_books');
        const books: ProviderTariffBook[] = existing ? JSON.parse(existing) : [];
        books.push(tariffBook);
        localStorage.setItem('strator_tariff_books', JSON.stringify(books));
        setLocalTariffBooks(books);

        setProcessingStatus('');
        setIsProcessingFile(false);
        setShowNewProviderDialog(false);
        setNewProviderName('');
        setNewBerlakuSampai('');
        setUploadedFile(null);
        
        toast({
          title: 'Berhasil',
          description: `Buku tarif ${newProviderName} berhasil diproses (${result.items?.length || 0} item diekstrak)`,
        });
        
        // Navigate to detail page
        setLocation(`/provider/${providerId}`);
        return;
      } catch (error) {
        console.error('Tariff book processing error:', error);
        setProcessingStatus('');
        setIsProcessingFile(false);
        toast({
          title: 'Gagal',
          description: 'Gagal memproses buku tarif dengan AI',
          variant: 'destructive',
        });
        return;
      }
    }

    // If no file, just create the provider entry
    createMutation.mutate({
      provider_name: newProviderName,
      berlaku_sampai_tgl: newBerlakuSampai,
    });
  };

  const handleUpdateProvider = () => {
    if (!selectedProviderId || !updateBerlakuSampai) {
      toast({
        title: 'Peringatan',
        description: 'Mohon lengkapi semua field',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({
      id: selectedProviderId,
      berlaku_sampai_tgl: updateBerlakuSampai,
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <main className="pl-6 py-6">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Provider & Buku Tarif
            </h1>
            <p className="text-sm text-slate-600">
              Kelola jaringan provider dan buku tarif kontrak
            </p>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Daftar Buku Tarif</h2>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-upload-buku-tarif"
                    >
                      Upload Buku Tarif
                      <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem 
                      onClick={() => setShowNewProviderDialog(true)}
                      data-testid="menu-provider-baru"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Buku Tarif / Provider Baru
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowUpdateDialog(true)}
                      data-testid="menu-update-eksisting"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Update Buku Tarif Eksisting
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  data-testid="input-search-provider"
                />
              </div>

              <div className="flex items-center gap-6 border-b border-slate-200 mt-4 mb-6">
                <button className="flex items-center gap-2 pb-3 text-sm font-medium text-slate-900 border-b-2 border-slate-900 -mb-[1px]">
                  <BookOpen className="h-4 w-4" />
                  Buku Tarif
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Memuat data...</div>
              ) : filteredProviders.length === 0 && localTariffBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {searchQuery ? 'Tidak ada hasil ditemukan' : 'Belum ada data provider'}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-0 py-2 border-b border-slate-200 text-xs font-medium text-slate-500 tracking-wide">
                    <div>Provider</div>
                    <div>Tgl. Upload Pertama Kali</div>
                    <div>Tgl. Update Terakhir</div>
                    <div>Berlaku Sampai Tgl.</div>
                    <div>Status</div>
                  </div>

                  {filteredProviders.map((provider) => (
                    <div
                      key={provider.id}
                      onClick={() => setLocation(`/provider/${provider.id}`)}
                      className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-0 py-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      data-testid={`row-provider-${provider.id}`}
                    >
                      <div className="text-sm font-medium text-slate-900">{provider.provider_name}</div>
                      <div className="text-sm text-slate-700">{formatIndonesianDate(provider.tgl_upload_pertama)}</div>
                      <div className="text-sm text-slate-700">{formatIndonesianDate(provider.tgl_update_terakhir)}</div>
                      <div className="text-sm text-slate-700">{formatIndonesianDate(provider.berlaku_sampai_tgl)}</div>
                      <div>{getStatusBadge(provider.status)}</div>
                    </div>
                  ))}

                  {localTariffBooks.filter(book => 
                    book.providerName.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setLocation(`/provider/${book.id}`)}
                      className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-0 py-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      data-testid={`row-provider-${book.id}`}
                    >
                      <div className="text-sm font-medium text-slate-900">{book.providerName}</div>
                      <div className="text-sm text-slate-700">{book.uploadDate || '-'}</div>
                      <div className="text-sm text-slate-700">{book.uploadDate || '-'}</div>
                      <div className="text-sm text-slate-700">{book.berlakuSampai || '-'}</div>
                      <div>{getStatusBadge(book.status === 'Aktif' ? 'Berlaku' : 'Lewat Masa Berlaku')}</div>
                    </div>
                  ))}

                  <div className="flex justify-center pt-4">
                    <button className="text-sm text-slate-600 hover:text-slate-900 font-medium border border-slate-200 px-4 py-2 rounded hover:bg-slate-50 transition-colors">
                      Lihat semua ({filteredProviders.length + localTariffBooks.length} provider)
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-slate-200 mt-6">
            <div className="p-4">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Aktivitas Provider & Buku Tarif Terkini
              </h2>

              {/* Activity Table */}
              <div className="w-full">
                {/* Table Headers */}
                <div className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-2 pb-3 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <div>Waktu Pemrosesan</div>
                  <div>Diproses oleh</div>
                  <div>Provider</div>
                  <div>
                    Aktivitas{" "}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-semibold">
                      AI
                    </span>
                  </div>
                </div>

                {/* Activity Rows */}
                {activitiesLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading activities...
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Belum ada aktivitas provider
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-3 border-b border-slate-100 last:border-b-0"
                      data-testid={`provider-activity-row-${activity.id}`}
                    >
                      {/* Timestamp */}
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs text-slate-600">{activity.date}</div>
                        <div className="text-xs text-slate-500">{activity.time}</div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                          {activity.userInitials}
                        </div>
                        <span>{activity.user}</span>
                      </div>

                      {/* Provider Name */}
                      <div className="text-sm font-medium text-slate-900">
                        {activity.providerName}
                      </div>

                      {/* Activity Type and Note */}
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-slate-900">{activity.activityType}</div>
                        <div className="text-xs text-slate-600 leading-relaxed">{activity.note}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View All Button - Only show if there are more than 5 activities */}
              {activities.length > 5 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setShowActivityModal(true);
                      setModalActivitySearchTerm("");
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                    data-testid="button-view-all-activities"
                  >
                    Lihat Semua Aktivitas Provider & Buku Tarif
                  </button>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>

      {/* Modal Overlay for All Activities */}
      {showActivityModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          data-testid="modal-overlay"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-2xl flex flex-col w-[90%] max-w-[1200px] max-h-[85vh]"
            data-testid="modal-content"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 px-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Semua Aktivitas Provider & Buku Tarif
              </h2>
              <button
                onClick={() => {
                  setShowActivityModal(false);
                  setModalActivitySearchTerm("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                data-testid="button-close-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 px-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={modalActivitySearchTerm}
                  onChange={(e) => setModalActivitySearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  data-testid="input-modal-search"
                />
              </div>
            </div>

            {/* Modal Activity List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="w-full">
                {/* Table Headers */}
                <div className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-2 pb-3 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <div>Waktu Pemrosesan</div>
                  <div>Diproses oleh</div>
                  <div>Provider</div>
                  <div>
                    Aktivitas{" "}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-semibold">
                      AI
                    </span>
                  </div>
                </div>

                {/* Activity Rows */}
                {filteredModalActivities.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Tidak ada aktivitas ditemukan
                  </div>
                ) : (
                  filteredModalActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-3 border-b border-slate-100 last:border-b-0"
                    >
                      {/* Timestamp */}
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs text-slate-600">{activity.date}</div>
                        <div className="text-xs text-slate-500">{activity.time}</div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                          {activity.userInitials}
                        </div>
                        <span>{activity.user}</span>
                      </div>

                      {/* Provider Name */}
                      <div className="text-sm font-medium text-slate-900">
                        {activity.providerName}
                      </div>

                      {/* Activity Type and Note */}
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-slate-900">{activity.activityType}</div>
                        <div className="text-xs text-slate-600 leading-relaxed">{activity.note}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* New Provider Dialog */}
      <Dialog open={showNewProviderDialog} onOpenChange={setShowNewProviderDialog}>
        <DialogContent data-testid="dialog-provider-baru">
          <DialogHeader>
            <DialogTitle>Buku Tarif / Provider Baru</DialogTitle>
            <DialogDescription>
              Tambahkan provider baru dan upload buku tarif kontrak
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Nama Provider</Label>
              <Input
                id="provider-name"
                placeholder="Contoh: RS Permata Bekasi"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
                data-testid="input-provider-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="berlaku-sampai">Berlaku Sampai Tanggal</Label>
              <Input
                id="berlaku-sampai"
                type="date"
                value={newBerlakuSampai}
                onChange={(e) => setNewBerlakuSampai(e.target.value)}
                data-testid="input-berlaku-sampai"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Buku Tarif (PDF/Excel)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast({ title: 'Error', description: 'Ukuran file maksimal 10MB', variant: 'destructive' });
                      return;
                    }
                    setUploadedFile(file);
                  }
                }}
                className="hidden"
                data-testid="input-file-upload"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (!['pdf', 'xlsx', 'xls'].includes(ext || '')) {
                      toast({ title: 'Error', description: 'Format file harus PDF atau Excel', variant: 'destructive' });
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast({ title: 'Error', description: 'Ukuran file maksimal 10MB', variant: 'destructive' });
                      return;
                    }
                    setUploadedFile(file);
                  }
                }}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadedFile 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
                data-testid="dropzone-file-upload"
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid="button-remove-file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-blue-600">Klik untuk upload</span> atau drag & drop file
                    </p>
                    <p className="text-xs text-slate-500">PDF atau Excel (maks. 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {isProcessingFile && (
            <div className="py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span className="text-sm text-blue-700">{processingStatus || 'Memproses...'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProviderDialog(false)}
              disabled={isProcessingFile}
              data-testid="button-cancel-new"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateProvider}
              disabled={createMutation.isPending || isProcessingFile}
              data-testid="button-submit-new"
            >
              {isProcessingFile ? 'Memproses AI...' : createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Provider Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent data-testid="dialog-update-eksisting">
          <DialogHeader>
            <DialogTitle>Update Buku Tarif Eksisting</DialogTitle>
            <DialogDescription>
              Perbarui buku tarif untuk provider yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="select-provider">Pilih Provider</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger data-testid="select-provider">
                  <SelectValue placeholder="Pilih provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-berlaku-sampai">Berlaku Sampai Tanggal (Baru)</Label>
              <Input
                id="update-berlaku-sampai"
                type="date"
                value={updateBerlakuSampai}
                onChange={(e) => setUpdateBerlakuSampai(e.target.value)}
                data-testid="input-update-berlaku-sampai"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              data-testid="button-cancel-update"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateProvider}
              disabled={updateMutation.isPending}
              data-testid="button-submit-update"
            >
              {updateMutation.isPending ? 'Memperbarui...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
