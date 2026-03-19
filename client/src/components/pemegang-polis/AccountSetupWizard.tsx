import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Building2, FileText, Users, ChevronRight, Check } from "lucide-react";
import { formatDateIndonesian } from "@/utils/formatters";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Step 1: Company Information Schema
const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  effectiveDate: z.string().min(1, "Tanggal efektif wajib diisi"),
  notes: z.string().optional(),
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;

interface AccountSetupWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function AccountSetupWizard({ onClose, onComplete }: AccountSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState<CompanyInfoForm | null>(null);
  const [policyFiles, setPolicyFiles] = useState<File[]>([]);
  const [memberFile, setMemberFile] = useState<File | null>(null);

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phone: "",
      effectiveDate: "",
      notes: "",
    },
  });

  const steps = [
    { number: 1, title: "Informasi Perusahaan", icon: Building2 },
    { number: 2, title: "Upload Polis", icon: FileText },
    { number: 3, title: "Upload Member", icon: Users },
  ];

  const handleStep1Submit = (data: CompanyInfoForm) => {
    setCompanyData(data);
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    if (policyFiles.length === 0) {
      alert("Silakan upload minimal satu dokumen polis");
      return;
    }
    setCurrentStep(3);
  };

  const handleStep3Complete = async () => {
    // TODO: Submit all data to backend
    console.log("Account data:", {
      company: companyData,
      policies: policyFiles,
      members: memberFile,
    });
    
    onComplete();
  };

  const handleSkipMemberUpload = async () => {
    // Allow skipping member upload as per PRD
    await handleStep3Complete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Buat Akun Korporat Baru</h2>
            <p className="text-sm text-slate-600 mt-1">
              Setup wizard 3 langkah untuk membuat akun pemegang polis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-close-wizard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 font-medium ${
                        isActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleStep1Submit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nama Perusahaan *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PT Gold Coin Indonesia"
                          {...field}
                          data-testid="input-company-name"
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email Perusahaan *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="hr@goldcoin.co.id"
                            {...field}
                            data-testid="input-email"
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nomor Telepon *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+62 21 1234567"
                            {...field}
                            data-testid="input-phone"
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tanggal Efektif Polis *</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-effective-date"
                            className="text-sm"
                          />
                          {field.value && (
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateIndonesian(field.value)}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tambahkan catatan atau informasi tambahan..."
                          rows={3}
                          {...field}
                          data-testid="input-notes"
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {/* Step 2: Upload Policy Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Dokumen Polis</h3>
                <p className="text-sm text-slate-600">
                  Upload Master Policy dan TC Endorsements (jika ada). Sistem akan mengekstrak tabel benefit secara otomatis.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Drag & drop file PDF atau klik untuk browse
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Format: PDF, maksimal 50MB per file
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setPolicyFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="policy-upload"
                  data-testid="input-policy-files"
                />
                <label htmlFor="policy-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Pilih File</span>
                  </Button>
                </label>
              </div>

              {policyFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">File yang dipilih:</p>
                  {policyFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPolicyFiles(policyFiles.filter((_, i) => i !== index));
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Upload Member Database */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Database Member</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Upload file Excel berisi data karyawan dan tanggungan. Anda dapat melewati langkah ini dan upload member nanti.
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  Download Template Excel
                </Button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Drag & drop file Excel atau klik untuk browse
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Format: XLSX, maksimal 100K member
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setMemberFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="member-upload"
                  data-testid="input-member-file"
                />
                <label htmlFor="member-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Pilih File</span>
                  </Button>
                </label>
              </div>

              {memberFile && (
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{memberFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(memberFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMemberFile(null)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                data-testid="button-back"
              >
                Kembali
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep === 3 && (
              <Button
                variant="ghost"
                onClick={handleSkipMemberUpload}
                data-testid="button-skip-members"
                className="text-slate-600"
              >
                Lewati & Selesai Nanti
              </Button>
            )}
            {currentStep === 1 && (
              <Button
                onClick={form.handleSubmit(handleStep1Submit)}
                data-testid="button-next-step1"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Lanjut
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button
                onClick={handleStep2Continue}
                data-testid="button-next-step2"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Lanjut
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {currentStep === 3 && (
              <Button
                onClick={handleStep3Complete}
                data-testid="button-complete"
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Selesai
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
