import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import type { ProviderTariffBook, TariffItem, ProviderBukuTarif } from '@shared/schema';

const CATEGORIES = ['Semua', 'Admin & Room', 'Doctor Fee', 'Laboratory', 'Radiology', 'Procedure'] as const;

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [provider, setProvider] = useState<ProviderTariffBook | null>(null);
  const [apiProvider, setApiProvider] = useState<ProviderBukuTarif | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showNotes, setShowNotes] = useState(false);

  // Fetch providers from API
  const { data: apiProviders = [] } = useQuery<ProviderBukuTarif[]>({
    queryKey: ['/api/providers/buku-tarif'],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // First check localStorage for detailed tariff books
    const stored = localStorage.getItem('strator_tariff_books');
    if (stored) {
      try {
        const books: ProviderTariffBook[] = JSON.parse(stored);
        const found = books.find(b => b.id === id);
        if (found) {
          setProvider(found);
          setLoading(false);
          return;
        }
      } catch {
        // Continue to check API
      }
    }
    
    // Check API providers
    const foundApi = apiProviders.find(p => p.id === id);
    if (foundApi) {
      setApiProvider(foundApi);
    }
    
    setLoading(false);
  }, [id, apiProviders]);

  const filteredItems = useMemo(() => {
    if (!provider) return [];
    let items = provider.items;

    if (selectedCategory !== 'Semua') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.itemName.toLowerCase().includes(query) ||
        item.tariffId.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return items;
  }, [provider, selectedCategory, searchQuery]);

  const formatPrice = (price: number | null): string => {
    if (price === null) return '-';
    return new Intl.NumberFormat('id-ID').format(price);
  };

  const getProviderCodeBadge = (code: string): string => {
    return code.substring(0, 3).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-slate-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  // Show API provider when detailed tariff data is not available
  if (!provider && apiProvider) {
    const formatDate = (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    
    const getStatusColor = (status: string) => {
      if (status === 'Berlaku') return 'bg-green-50 text-green-700';
      if (status === 'Lewat Masa Berlaku') return 'bg-orange-50 text-orange-700';
      return 'bg-red-50 text-red-700';
    };
    
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="pl-6 py-6 pr-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/provider-tarif')}
              className="mb-4 text-slate-600 hover:text-slate-900"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Provider
            </Button>

            {/* Provider Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-sm">
                  {apiProvider.provider_name.substring(0, 3).toUpperCase()}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900" data-testid="text-provider-name">
                    {apiProvider.provider_name}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                    <span>Berlaku sampai {formatDate(apiProvider.berlaku_sampai_tgl)}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apiProvider.status)}`}>
                      {apiProvider.status === 'Berlaku' && <CheckCircle2 className="h-3 w-3" />}
                      {apiProvider.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-slate-200">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Detail Tarif Belum Tersedia</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Buku tarif ini telah terdaftar dalam sistem. Detail item tarif akan tersedia setelah 
                    dokumen buku tarif diekstrak oleh AI.
                  </p>
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg max-w-sm mx-auto">
                    <div className="text-xs text-slate-500 space-y-2">
                      <div className="flex justify-between">
                        <span>Upload pertama:</span>
                        <span className="font-medium text-slate-700">{formatDate(apiProvider.tgl_upload_pertama)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Update terakhir:</span>
                        <span className="font-medium text-slate-700">{formatDate(apiProvider.tgl_update_terakhir)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Berlaku sampai:</span>
                        <span className="font-medium text-slate-700">{formatDate(apiProvider.berlaku_sampai_tgl)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!provider && !apiProvider) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="pl-6 py-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/provider-tarif')}
              className="mb-4 text-slate-600 hover:text-slate-900"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Provider
            </Button>
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">Provider tidak ditemukan</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // TypeScript guard - provider is guaranteed non-null after above checks
  if (!provider) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="pl-6 py-6 pr-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation('/provider-tarif')}
            className="mb-4 text-slate-600 hover:text-slate-900"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Provider
          </Button>

          {/* Provider Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-sm">
                {getProviderCodeBadge(provider.providerCode)}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900" data-testid="text-provider-name">
                  {provider.providerName}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                  <span>Berlaku {provider.berlakuMulai}</span>
                  <span>•</span>
                  <span>{provider.totalItems} item</span>
                  <span>•</span>
                  <span>{provider.totalCategories} kategori</span>
                  <span>•</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    provider.status === 'Aktif' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-orange-50 text-orange-700'
                  }`}>
                    {provider.status === 'Aktif' && <CheckCircle2 className="h-3 w-3" />}
                    {provider.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="border-slate-200 mb-4">
            <CardContent className="py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari item tarif... contoh: ICU, konsultasi, administrasi"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  data-testid="input-search-tariff"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tekan Enter untuk mencari atau ketik minimal 2 karakter
              </p>
            </CardContent>
          </Card>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }
                data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Tariff Table */}
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Menampilkan {filteredItems.length} item
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-12">No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-40">Tariff ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-32">Kategori</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">OPD</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">Kls 3</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">Kls 2</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">Kls 1</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">VIP</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-24">VVIP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                          {searchQuery.length >= 2 
                            ? 'Tidak ada item ditemukan untuk pencarian tersebut'
                            : 'Tidak ada item tarif'}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className="border-b border-slate-100 hover:bg-slate-50"
                          data-testid={`row-tariff-${item.id}`}
                        >
                          <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-700">{item.tariffId}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.itemName}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceOPD)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceKelas3)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceKelas2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceKelas1)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceVIP)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700 font-mono">{formatPrice(item.priceVVIP)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {provider.notes && (
            <Card className="border-slate-200 mt-4">
              <CardContent className="p-0">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  data-testid="button-toggle-notes"
                >
                  <span className="text-sm font-medium text-slate-700">Catatan Buku Tarif</span>
                  {showNotes ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                {showNotes && (
                  <div className="px-4 py-3 border-t border-slate-200">
                    <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                      {provider.notes}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
