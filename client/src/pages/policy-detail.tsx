import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ChevronRight, FileText, Users, ClipboardList, FolderOpen, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/dashboard/Sidebar";

const samplePolicy = {
  policyCode: 'MIR',
  policyNumber: 'P03-01-10-2020-0000001',
  policyholderName: 'PT. Mitra Iswara & Rorimpandey Ltd',
  address: 'Wisma Slipi 9th Floor, JL. S.Parman Kav 12, Slipi, RT.12/RW.1, Kemanggisan, Kec. Palmerah, Kota Jakarta Barat, DKI Jakarta 11480',
  periodStart: '2020-10-14',
  periodEnd: '2021-10-13',
  peserta: 'Karyawan/ti, Suami, Istri, Anak-anak',
  jaminanUtama: 'Rawat Inap & Pembedahan',
  jaminanTambahan: 'Rawat Jalan',
  status: 'Aktif'
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function PolicyDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/polis/:policyId");
  const [activeTab, setActiveTab] = useState("manfaat");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="pl-6 py-6 pr-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <button
              onClick={() => setLocation('/pemegang-polis')}
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
              data-testid="breadcrumb-polis-peserta"
            >
              <ArrowLeft className="h-4 w-4" />
              Polis & Peserta
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">{samplePolicy.policyholderName}</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {samplePolicy.policyholderName}
              </h1>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Polis Aktif
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-edit-polis">
                Edit Polis
              </Button>
              <Button variant="outline" size="sm" data-testid="button-download">
                Unduh Dokumen
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
              <FileText className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Ikhtisar Polis</h2>
            </div>
            <div className="space-y-4">
              <div className="flex">
                <div className="w-48 text-sm text-slate-500 flex-shrink-0">Nomor Polis</div>
                <div className="text-sm text-slate-500 w-4 flex-shrink-0">:</div>
                <div className="text-sm font-medium text-slate-900">{samplePolicy.policyNumber}</div>
              </div>
              <div className="flex">
                <div className="w-48 text-sm text-slate-500 flex-shrink-0">Pemegang Polis</div>
                <div className="text-sm text-slate-500 w-4 flex-shrink-0">:</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{samplePolicy.policyholderName}</div>
                  <div className="text-sm text-slate-500 mt-1">{samplePolicy.address}</div>
                </div>
              </div>
              <div className="flex">
                <div className="w-48 text-sm text-slate-500 flex-shrink-0">Periode Polis</div>
                <div className="text-sm text-slate-500 w-4 flex-shrink-0">:</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatDate(samplePolicy.periodStart)} s.d {formatDate(samplePolicy.periodEnd)}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Pukul 00:00 WIB s.d Pukul 24:00 WIB (Waktu setempat, termasuk kedua tanggal tersebut)
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="w-48 text-sm text-slate-500 flex-shrink-0">Peserta</div>
                <div className="text-sm text-slate-500 w-4 flex-shrink-0">:</div>
                <div className="text-sm font-medium text-slate-900">{samplePolicy.peserta}</div>
              </div>
              <div className="flex">
                <div className="w-48 text-sm text-slate-500 flex-shrink-0">Jenis Pertanggungan</div>
                <div className="text-sm text-slate-500 w-4 flex-shrink-0">:</div>
                <div className="flex gap-12">
                  <div>
                    <div className="text-xs text-slate-400 uppercase mb-1">Jaminan Utama</div>
                    <div className="text-sm font-medium text-slate-900">1. {samplePolicy.jaminanUtama}</div>
                  </div>
                  {samplePolicy.jaminanTambahan && (
                    <div>
                      <div className="text-xs text-slate-400 uppercase mb-1">Jaminan Tambahan</div>
                      <div className="text-sm font-medium text-slate-900">1. {samplePolicy.jaminanTambahan}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="manfaat"
                className="px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent"
                data-testid="tab-tabel-manfaat"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tabel Manfaat
              </TabsTrigger>
              <TabsTrigger
                value="endorsemen"
                className="px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent"
                data-testid="tab-endorsemen-klausula"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Endorsemen Klausula
              </TabsTrigger>
              <TabsTrigger
                value="peserta"
                className="px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent"
                data-testid="tab-daftar-peserta"
              >
                <Users className="h-4 w-4 mr-2" />
                Daftar Peserta
              </TabsTrigger>
              <TabsTrigger
                value="dokumen"
                className="px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent"
                data-testid="tab-dokumen"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Dokumen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manfaat" className="mt-6">
              <TabelManfaatTab policyCode={samplePolicy.policyCode} />
            </TabsContent>

            <TabsContent value="endorsemen" className="mt-6">
              <EndorsemenKlausulaTab />
            </TabsContent>

            <TabsContent value="peserta" className="mt-6">
              <DaftarPesertaTab />
            </TabsContent>

            <TabsContent value="dokumen" className="mt-6">
              <DokumenTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function TabelManfaatTab({ policyCode }: { policyCode: string }) {
  const [activeType, setActiveType] = useState<'rawatInap' | 'rawatJalan'>('rawatInap');
  const [activeTier, setActiveTier] = useState('RI-458');

  const rawatInapTiers = ['RI-458', 'RI-600', 'RI-750', 'RI-1000'];
  const rawatJalanTiers = ['RJ-250', 'RJ-350', 'RJ-500'];

  const rawatInapBenefits = [
    { no: 1, limitId: `${policyCode}-RI-001`, manfaat: 'Biaya Kamar & Makan', batasan: 'Per hari, maks 60 hari/tahun', sesuaiKelas: 'Rp 458.000', kelasLebihTinggi: 'Rp 229.000' },
    { no: 2, limitId: `${policyCode}-RI-002`, manfaat: 'Biaya ICU/ICCU', batasan: 'Per hari, maks 30 hari/tahun', sesuaiKelas: 'Rp 916.000', kelasLebihTinggi: 'Rp 458.000' },
    { no: 3, limitId: `${policyCode}-RI-003`, manfaat: 'Biaya Dokter Umum', batasan: 'Per kunjungan', sesuaiKelas: 'Rp 150.000', kelasLebihTinggi: 'Rp 75.000' },
    { no: 4, limitId: `${policyCode}-RI-004`, manfaat: 'Biaya Dokter Spesialis', batasan: 'Per kunjungan', sesuaiKelas: 'Rp 200.000', kelasLebihTinggi: 'Rp 100.000' },
    { no: 5, limitId: `${policyCode}-RI-005`, manfaat: 'Biaya Pembedahan', batasan: '', sesuaiKelas: '', kelasLebihTinggi: '', isGroup: true, children: [
      { no: '5a', limitId: `${policyCode}-RI-011`, manfaat: 'Kategori 1 (Minor)', batasan: 'Per tindakan', sesuaiKelas: 'Rp 2.500.000', kelasLebihTinggi: 'Rp 1.250.000' },
      { no: '5b', limitId: `${policyCode}-RI-012`, manfaat: 'Kategori 2 (Intermediate)', batasan: 'Per tindakan', sesuaiKelas: 'Rp 5.000.000', kelasLebihTinggi: 'Rp 2.500.000' },
      { no: '5c', limitId: `${policyCode}-RI-013`, manfaat: 'Kategori 3 (Major)', batasan: 'Per tindakan', sesuaiKelas: 'Rp 10.000.000', kelasLebihTinggi: 'Rp 5.000.000' },
      { no: '5d', limitId: `${policyCode}-RI-014`, manfaat: 'Kategori 4 (Complex)', batasan: 'Per tindakan', sesuaiKelas: 'Rp 20.000.000', kelasLebihTinggi: 'Rp 10.000.000' },
    ]},
    { no: 6, limitId: `${policyCode}-RI-006`, manfaat: 'Biaya Anestesi', batasan: 'Per tindakan', sesuaiKelas: 'As Charged', kelasLebihTinggi: 'As Charged', isAsCharged: true },
    { no: 7, limitId: `${policyCode}-RI-007`, manfaat: 'Biaya Kamar Operasi', batasan: 'Per tindakan', sesuaiKelas: 'As Charged', kelasLebihTinggi: 'As Charged', isAsCharged: true },
    { no: 8, limitId: `${policyCode}-RI-008`, manfaat: 'Biaya Laboratorium', batasan: 'Per rawat inap', sesuaiKelas: 'Rp 1.000.000', kelasLebihTinggi: 'Rp 500.000' },
    { no: 9, limitId: `${policyCode}-RI-009`, manfaat: 'Biaya Radiologi', batasan: 'Per rawat inap', sesuaiKelas: 'Rp 1.500.000', kelasLebihTinggi: 'Rp 750.000' },
    { no: 10, limitId: `${policyCode}-RI-015`, manfaat: 'Biaya Obat-obatan', batasan: 'Per rawat inap', sesuaiKelas: 'As Charged', kelasLebihTinggi: 'As Charged', isAsCharged: true },
    { no: '', limitId: '', manfaat: 'Co-Insurance', batasan: 'Peserta menanggung', sesuaiKelas: '20%', kelasLebihTinggi: '30%', isCoInsurance: true },
  ];

  const rawatJalanBenefits = [
    { no: 1, limitId: `${policyCode}-RJ-001`, manfaat: 'Konsultasi Dokter Umum', batasan: 'Per kunjungan', limit: 'Rp 150.000' },
    { no: 2, limitId: `${policyCode}-RJ-002`, manfaat: 'Konsultasi Dokter Spesialis', batasan: 'Per kunjungan', limit: 'Rp 250.000' },
    { no: 3, limitId: `${policyCode}-RJ-003`, manfaat: 'Laboratorium Diagnostik', batasan: 'Per tahun', limit: 'Rp 1.000.000' },
    { no: 4, limitId: `${policyCode}-RJ-004`, manfaat: 'Radiologi', batasan: 'Per tahun', limit: 'Rp 750.000' },
    { no: 5, limitId: `${policyCode}-RJ-005`, manfaat: 'Obat-obatan', batasan: 'Per resep', limit: 'Rp 500.000' },
    { no: 6, limitId: `${policyCode}-RJ-006`, manfaat: 'Fisioterapi', batasan: 'Maks 12 sesi/tahun', limit: 'Rp 200.000' },
    { no: '', limitId: '', manfaat: 'Co-Insurance', batasan: 'Peserta menanggung', limit: '20%', isCoInsurance: true },
  ];

  return (
    <Card className="border-slate-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={activeType === 'rawatInap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveType('rawatInap'); setActiveTier('RI-458'); }}
            data-testid="button-rawat-inap"
          >
            Rawat Inap
          </Button>
          <Button
            variant={activeType === 'rawatJalan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveType('rawatJalan'); setActiveTier('RJ-250'); }}
            data-testid="button-rawat-jalan"
          >
            Rawat Jalan
          </Button>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          {(activeType === 'rawatInap' ? rawatInapTiers : rawatJalanTiers).map((tier) => (
            <Button
              key={tier}
              variant={activeTier === tier ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTier(tier)}
              data-testid={`button-tier-${tier}`}
            >
              {tier}
            </Button>
          ))}
        </div>
      </div>

      {activeType === 'rawatInap' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-12">No</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-32">Limit ID</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Manfaat</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-48">Batasan</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 w-36">Sesuai Kelas</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 w-36">Kelas Lebih Tinggi</th>
              </tr>
            </thead>
            <tbody>
              {rawatInapBenefits.map((benefit: any, idx) => (
                <>
                  <tr 
                    key={benefit.limitId || `row-${idx}`} 
                    className={`border-b border-slate-100 ${benefit.isCoInsurance ? 'bg-slate-50' : ''}`}
                  >
                    <td className="py-3 px-3 text-slate-600">{benefit.no}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{benefit.limitId}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{benefit.manfaat}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{benefit.batasan}</td>
                    <td className={`py-3 px-3 text-right ${benefit.isAsCharged ? 'text-green-600 italic' : 'text-slate-900'}`}>
                      {benefit.sesuaiKelas}
                    </td>
                    <td className={`py-3 px-3 text-right ${benefit.isAsCharged ? 'text-green-600 italic' : 'text-slate-900'}`}>
                      {benefit.kelasLebihTinggi}
                    </td>
                  </tr>
                  {benefit.children?.map((child: any) => (
                    <tr key={child.limitId} className="border-b border-slate-100 bg-slate-25">
                      <td className="py-2 px-3 text-slate-400 pl-6">└ {child.no}</td>
                      <td className="py-2 px-3 font-mono text-xs text-slate-400">{child.limitId}</td>
                      <td className="py-2 px-3 text-slate-700 pl-6">{child.manfaat}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs">{child.batasan}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{child.sesuaiKelas}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{child.kelasLebihTinggi}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-12">No</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-32">Limit ID</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Manfaat</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-48">Batasan</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 w-36">Limit</th>
              </tr>
            </thead>
            <tbody>
              {rawatJalanBenefits.map((benefit: any, idx) => (
                <tr 
                  key={benefit.limitId || `row-${idx}`} 
                  className={`border-b border-slate-100 ${benefit.isCoInsurance ? 'bg-slate-50' : ''}`}
                >
                  <td className="py-3 px-3 text-slate-600">{benefit.no}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">{benefit.limitId}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{benefit.manfaat}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{benefit.batasan}</td>
                  <td className="py-3 px-3 text-right text-slate-900">{benefit.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function EndorsemenKlausulaTab() {
  const endorsements = [
    { id: 1, date: '15 Januari 2021', type: 'Perubahan Limit', description: 'Peningkatan limit rawat inap dari Rp 458.000 menjadi Rp 500.000 per hari', status: 'Aktif' },
    { id: 2, date: '1 Maret 2021', type: 'Penambahan Klausula', description: 'Penambahan coverage untuk COVID-19', status: 'Aktif' },
    { id: 3, date: '20 Juni 2021', type: 'Pengecualian', description: 'Pengecualian treatment kosmetik dan estetika', status: 'Aktif' },
  ];

  return (
    <Card className="border-slate-200 p-6">
      <div className="space-y-4">
        {endorsements.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Belum ada endorsemen klausula untuk polis ini
          </div>
        ) : (
          endorsements.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">{item.type}</span>
                  <Badge variant="outline" className="text-xs">{item.status}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function DaftarPesertaTab() {
  const stats = {
    total: 1247,
    karyawan: 523,
    tanggungan: 724,
  };

  const members = [
    { id: 1, name: 'Ahmad Wijaya', nip: 'EMP001', relation: 'Karyawan', tier: 'RI-750', status: 'Aktif' },
    { id: 2, name: 'Siti Rahayu', nip: 'EMP001-D1', relation: 'Istri', tier: 'RI-750', status: 'Aktif' },
    { id: 3, name: 'Budi Santoso', nip: 'EMP002', relation: 'Karyawan', tier: 'RI-600', status: 'Aktif' },
    { id: 4, name: 'Maya Dewi', nip: 'EMP002-D1', relation: 'Istri', tier: 'RI-600', status: 'Aktif' },
    { id: 5, name: 'Andi Pratama', nip: 'EMP003', relation: 'Karyawan', tier: 'RI-458', status: 'Aktif' },
  ];

  return (
    <Card className="border-slate-200 p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{stats.total.toLocaleString('id-ID')}</div>
          <div className="text-sm text-blue-700">Total Peserta</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{stats.karyawan.toLocaleString('id-ID')}</div>
          <div className="text-sm text-green-700">Karyawan</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">{stats.tanggungan.toLocaleString('id-ID')}</div>
          <div className="text-sm text-purple-700">Tanggungan</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Nama</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">NIP</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Hubungan</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Plan</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-slate-100">
                <td className="py-3 px-3 font-medium text-slate-900">{member.name}</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">{member.nip}</td>
                <td className="py-3 px-3 text-slate-600">{member.relation}</td>
                <td className="py-3 px-3">
                  <Badge variant="outline">{member.tier}</Badge>
                </td>
                <td className="py-3 px-3">
                  <Badge className="bg-green-100 text-green-800">{member.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DokumenTab() {
  const documents = [
    { id: 1, name: 'Polis Induk', filename: 'polis_induk_mir_2020.pdf', type: 'PDF' },
    { id: 2, name: 'Tabel Manfaat', filename: 'tabel_manfaat_mir_2020.pdf', type: 'PDF' },
    { id: 3, name: 'Daftar Peserta Awal', filename: 'daftar_peserta_awal_mir.xlsx', type: 'Excel' },
    { id: 4, name: 'Endorsemen #1 - Perubahan Limit', filename: 'endorsemen_1_mir.pdf', type: 'PDF' },
    { id: 5, name: 'Endorsemen #2 - COVID-19', filename: 'endorsemen_2_covid_mir.pdf', type: 'PDF' },
  ];

  return (
    <Card className="border-slate-200 p-6">
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                <div className="text-xs text-slate-500">{doc.filename}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid={`button-lihat-${doc.id}`}>
                Lihat
              </Button>
              <Button variant="outline" size="sm" data-testid={`button-unduh-${doc.id}`}>
                Unduh
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
