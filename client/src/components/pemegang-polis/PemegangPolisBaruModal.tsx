import { useState, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Check, Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  result?: string;
  extractedData?: any;
}

interface EndorsementClause {
  clauseName: string;
  standardRule: string;
  endorsedRule: string;
  status: 'OVERRIDE' | 'SPECIFIED' | 'SAME';
}

interface BenefitTier {
  code: string;
  name: string;
  annualLimit: number;
  roomLimit?: number;
}

interface MemberSummary {
  total: number;
  employees: number;
  dependents: number;
  validCount: number;
  invalidCount: number;
  errors?: string[];
}

interface PolicyFormData {
  accountType: 'baru' | 'renewal' | '';
  policyholderName: string;
  periodStart: string;
  periodEnd: string;
  benefitTypes: string[];
  endorsementFile: UploadedFile | null;
  benefitTableFile: UploadedFile | null;
  memberDataFile: UploadedFile | null;
  extractedClauses: EndorsementClause[];
  extractedTiers: BenefitTier[];
  memberSummary: MemberSummary | null;
}

interface PemegangPolisBaruModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: PolicyFormData) => void | Promise<void>;
  existingPolicyholders?: string[];
}

const BENEFIT_TYPES = [
  { id: 'rawat_inap', label: 'Rawat Inap' },
  { id: 'rawat_jalan', label: 'Rawat Jalan' },
  { id: 'rawat_bersalin', label: 'Rawat Bersalin' },
  { id: 'rawat_gigi', label: 'Rawat Gigi' },
  { id: 'kacamata', label: 'Kacamata' },
  { id: 'mcu', label: 'Medical Check-up' },
  { id: 'lainnya', label: 'Lain-lain' },
];

const ACCEPTED_DOC_FORMATS = '.pdf,.xlsx,.xls,.docx,.png,.jpg,.jpeg';
const ACCEPTED_DATA_FORMATS = '.xlsx,.xls,.csv';
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DATA_SIZE = 50 * 1024 * 1024; // 50MB

export default function PemegangPolisBaruModal({
  isOpen,
  onClose,
  onComplete,
  existingPolicyholders = [],
}: PemegangPolisBaruModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [formData, setFormData] = useState<PolicyFormData>({
    accountType: '',
    policyholderName: '',
    periodStart: '',
    periodEnd: '',
    benefitTypes: [],
    endorsementFile: null,
    benefitTableFile: null,
    memberDataFile: null,
    extractedClauses: [],
    extractedTiers: [],
    memberSummary: null,
  });

  const endorsementInputRef = useRef<HTMLInputElement>(null);
  const benefitInputRef = useRef<HTMLInputElement>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleFileUpload = async (
    file: File,
    type: 'endorsement' | 'benefit' | 'member'
  ) => {
    const maxSize = type === 'member' ? MAX_DATA_SIZE : MAX_DOC_SIZE;
    
    if (file.size > maxSize) {
      toast({
        title: "File terlalu besar",
        description: `Maksimal ${type === 'member' ? '50MB' : '10MB'}`,
        variant: "destructive",
      });
      return;
    }

    const uploadedFile: UploadedFile = {
      file,
      name: file.name,
      size: file.size,
      status: 'processing',
    };

    if (type === 'endorsement') {
      setFormData(prev => ({ ...prev, endorsementFile: uploadedFile }));
      await processEndorsementFile(file);
    } else if (type === 'benefit') {
      setFormData(prev => ({ ...prev, benefitTableFile: uploadedFile }));
      await processBenefitFile(file);
    } else {
      setFormData(prev => ({ ...prev, memberDataFile: uploadedFile }));
      await processMemberFile(file);
    }
  };

  const processEndorsementFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch('/api/ai/process-endorsement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileBase64: base64, 
          fileName: file.name,
          mimeType: file.type 
        }),
      });

      if (!response.ok) throw new Error('Failed to process endorsement');
      
      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        endorsementFile: {
          ...prev.endorsementFile!,
          status: 'success',
          result: `✓ Teridentifikasi ${result.clauses?.length || 0} klausula override`,
          extractedData: result,
        },
        extractedClauses: result.clauses || [],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Endorsement processing error:', errorMessage);
      setFormData(prev => ({
        ...prev,
        endorsementFile: {
          ...prev.endorsementFile!,
          status: 'error',
          result: `Gagal memproses dokumen endorsemen: ${errorMessage}`,
        },
      }));
      toast({
        title: "Gagal memproses endorsemen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processBenefitFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch('/api/ai/process-benefit-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileBase64: base64, 
          fileName: file.name,
          mimeType: file.type 
        }),
      });

      if (!response.ok) throw new Error('Failed to process benefit table');
      
      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        benefitTableFile: {
          ...prev.benefitTableFile!,
          status: 'success',
          result: `✓ Terdeteksi ${result.tiers?.length || 0} tingkat benefit (${result.tiers?.map((t: BenefitTier) => t.code).join(', ') || ''})`,
          extractedData: result,
        },
        extractedTiers: result.tiers || [],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Benefit table processing error:', errorMessage);
      setFormData(prev => ({
        ...prev,
        benefitTableFile: {
          ...prev.benefitTableFile!,
          status: 'error',
          result: `Gagal memproses tabel benefit: ${errorMessage}`,
        },
      }));
      toast({
        title: "Gagal memproses tabel benefit",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processMemberFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // Parse Excel file client-side using xlsx library
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('File Excel kosong atau tidak memiliki data');
      }
      
      // First row is headers
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1).filter((row: any[]) => row.some(cell => cell !== null && cell !== ''));
      
      // Normalize header helper: trim, lowercase, remove extra spaces
      const normalizeHeader = (header: string): string => {
        return header.toString().toLowerCase().trim().replace(/\s+/g, ' ');
      };
      
      // Map Indonesian column headers to field names with extensive aliases
      const headerAliases: Record<string, string[]> = {
        'entryNumber': ['nomor urut', 'no', 'no.', 'nomor', 'urut', 'row', 'baris'],
        'policyholderName': ['pemegang polis', 'nama pemegang polis', 'policyholder', 'nama perusahaan', 'perusahaan'],
        'memberCardNumber': ['nomor peserta', 'no peserta', 'nomor kartu', 'no kartu', 'kartu peserta', 'member card', 'id peserta', 'card number', 'member id', 'no. peserta', 'no. kartu'],
        'fullName': ['nama lengkap peserta', 'nama peserta', 'nama lengkap', 'nama', 'full name', 'member name', 'nama anggota'],
        'principalName': ['nama prinsipal', 'principal', 'nama principal', 'prinsipal', 'principal name'],
        'relationship': ['hub peserta', 'hub dengan prinsipal', 'hubungan', 'hubungan dengan prinsipal', 'hub. dengan prinsipal', 'relationship', 'status hubungan', 'relasi', 'hub'],
        'gender': ['jenis kelamin', 'gender', 'kelamin', 'l/p', 'sex'],
        'dateOfBirth': ['tanggal lahir', 'tgl lahir', 'tgl. lahir', 'date of birth', 'dob', 'lahir'],
        'enrollmentDate': ['tanggal mulai', 'tgl mulai', 'tgl. mulai', 'tanggal efektif', 'effective date', 'mulai aktif', 'start date', 'tgl efektif'],
        'terminationDate': ['tanggal selesai', 'tgl selesai', 'tgl. selesai', 'tanggal berakhir', 'end date', 'expiry date', 'selesai', 'berakhir'],
        'planIP': ['plan ip', 'plan rawat inap', 'plan ri', 'rawat inap', 'plan inap', 'ri plan'],
        'planOP': ['plan op', 'plan rawat jalan', 'plan rj', 'rawat jalan', 'plan jalan', 'rj plan'],
        'planRB': ['plan rb', 'plan rawat bersalin', 'rawat bersalin', 'plan bersalin', 'plan maternity'],
        'planRG': ['plan rg', 'plan rawat gigi', 'rawat gigi', 'plan gigi', 'plan dental'],
        'planKM': ['plan km', 'plan kacamata', 'kacamata', 'plan optical', 'plan glasses'],
        'planMCU': ['plan mcu', 'plan medical checkup', 'medical checkup', 'plan medical check up', 'mcu'],
        'planLainnya': ['plan lainnya', 'plan lain', 'plan other', 'plan tambahan', 'lainnya'],
      };
      
      // Build reverse lookup map
      const headerMap: Record<string, string> = {};
      Object.entries(headerAliases).forEach(([fieldName, aliases]) => {
        aliases.forEach(alias => {
          headerMap[alias] = fieldName;
        });
      });
      
      // Find column indices with fuzzy matching
      const columnIndices: Record<string, number> = {};
      headers.forEach((header, idx) => {
        if (header) {
          const normalizedHeader = normalizeHeader(header);
          // Try exact match first
          let fieldName = headerMap[normalizedHeader];
          if (!fieldName) {
            for (const [alias, field] of Object.entries(headerMap)) {
              if (normalizedHeader.includes(alias)) {
                fieldName = field;
                break;
              }
            }
          }
          if (fieldName && !columnIndices[fieldName]) {
            columnIndices[fieldName] = idx;
          }
        }
      });
      
      console.log('📋 Excel Header Mapping:', { headers, columnIndices });
      console.log(`📊 RAW DATA: ${jsonData.length} total rows, ${dataRows.length} data rows after filtering (file: ${file.name}, size: ${file.size} bytes)`);
      
      // Parse date helper
      const parseDate = (value: any): string | null => {
        if (!value) return null;
        if (typeof value === 'number') {
          const date = XLSX.SSF.parse_date_code(value);
          if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          }
        }
        if (value instanceof Date) {
          const y = value.getFullYear();
          const m = String(value.getMonth() + 1).padStart(2, '0');
          const d = String(value.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
        if (typeof value === 'string') {
          const parts = value.split(/[\/\-]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return value;
            } else {
              return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          const monthNames: Record<string, string> = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'mei': '05', 'jun': '06', 'jul': '07',
            'aug': '08', 'agu': '08', 'sep': '09', 'oct': '10',
            'okt': '10', 'nov': '11', 'dec': '12', 'des': '12',
          };
          const textMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
          if (textMatch) {
            const day = textMatch[1].padStart(2, '0');
            const monthKey = textMatch[2].substring(0, 3).toLowerCase();
            const month = monthNames[monthKey];
            const year = textMatch[3];
            if (month) return `${year}-${month}-${day}`;
          }
          const nativeDate = new Date(value);
          if (!isNaN(nativeDate.getTime()) && nativeDate.getFullYear() > 1900) {
            const y = nativeDate.getFullYear();
            const m = String(nativeDate.getMonth() + 1).padStart(2, '0');
            const d = String(nativeDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
        }
        return null;
      };
      
      // Extract member data from rows
      const parsedMembers = dataRows.map((row: any[], idx: number) => {
        const getValue = (field: string) => {
          const colIdx = columnIndices[field];
          return colIdx !== undefined ? row[colIdx] : null;
        };
        
        const fullName = getValue('fullName')?.toString() || '';
        const rawRelationship = getValue('relationship')?.toString() || '';
        const principalNameFromCol = getValue('principalName')?.toString() || '';
        
        // Normalize relationship for matching
        const normalizedRel = rawRelationship.toLowerCase().trim();
        
        // Check for dependent keywords (spouse, children, etc.)
        const isDependentKeyword = 
          normalizedRel.includes('anak') ||
          normalizedRel.includes('istri') ||
          normalizedRel.includes('suami') ||
          normalizedRel.includes('spouse') ||
          normalizedRel.includes('child') ||
          normalizedRel.includes('wife') ||
          normalizedRel.includes('husband') ||
          normalizedRel.includes('daughter') ||
          normalizedRel.includes('son') ||
          normalizedRel.includes('tanggungan') ||
          normalizedRel.includes('dependent');
        
        // Check for employee keywords
        const isEmployeeKeyword = 
          normalizedRel.includes('karyawan') ||
          normalizedRel.includes('employee') ||
          normalizedRel.includes('principal') ||
          normalizedRel.includes('prinsipal') ||
          normalizedRel.includes('pegawai') ||
          normalizedRel === 'p' ||
          normalizedRel === 'e';
        
        // Determine if employee:
        // - If dependent keyword found → NOT employee
        // - If employee keyword found → IS employee
        // - If no relationship AND fullName matches principalName → IS employee (is the principal)
        // - Default: NOT employee (tanggungan)
        const isEmployee = isDependentKeyword ? false : 
          (isEmployeeKeyword || (!rawRelationship && (!principalNameFromCol || principalNameFromCol === fullName)));
        
        const relationship = isEmployee ? 'Karyawan' : 'Tanggungan';
        const principalName = principalNameFromCol || (isEmployee ? fullName : '');
        
        return {
          entryNumber: getValue('entryNumber') || idx + 1,
          policyholderName: getValue('policyholderName')?.toString() || '',
          memberCardNumber: getValue('memberCardNumber')?.toString() || `TEMP-${Date.now()}-${idx}`,
          fullName,
          principalName,
          relationship,
          gender: getValue('gender')?.toString() || 'Laki-laki',
          dateOfBirth: parseDate(getValue('dateOfBirth')) || new Date().toISOString().split('T')[0],
          enrollmentDate: parseDate(getValue('enrollmentDate')) || new Date().toISOString().split('T')[0],
          terminationDate: parseDate(getValue('terminationDate')),
          status: 'ACTIVE',
          isEmployee,
          planIP: getValue('planIP')?.toString() || null,
          planOP: getValue('planOP')?.toString() || null,
          planRB: getValue('planRB')?.toString() || null,
          planRG: getValue('planRG')?.toString() || null,
          planKM: getValue('planKM')?.toString() || null,
          planMCU: getValue('planMCU')?.toString() || null,
          planLainnya: getValue('planLainnya')?.toString() || null,
        };
      }).filter(m => m.fullName && m.fullName.trim() !== '');
      
      // Calculate summary - count by isEmployee flag
      const employees = parsedMembers.filter(m => m.isEmployee).length;
      const dependents = parsedMembers.length - employees;
      
      const summary = {
        total: parsedMembers.length,
        employees,
        dependents,
        validCount: parsedMembers.length,
        invalidCount: 0,
      };
      
      // Add minimum processing delay so users can see the loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormData(prev => ({
        ...prev,
        memberDataFile: {
          ...prev.memberDataFile!,
          status: 'success',
          result: `✓ ${summary.total} peserta valid (${summary.employees} karyawan, ${summary.dependents} tanggungan) • Semua field wajib terisi`,
          extractedData: { summary, members: parsedMembers },
        },
        memberSummary: summary,
      }));
      
      console.log(`📊 Parsed ${parsedMembers.length} members from Excel:`, parsedMembers.slice(0, 3));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Member data processing error:', errorMessage);
      setFormData(prev => ({
        ...prev,
        memberDataFile: {
          ...prev.memberDataFile!,
          status: 'error',
          result: `Gagal memproses data peserta: ${errorMessage}`,
        },
      }));
      toast({
        title: "Gagal memproses data peserta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = async (file: File, retryCount = 0): Promise<string> => {
    const MAX_RETRIES = 2;
    
    // Try arrayBuffer method first (more reliable in Safari)
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      return btoa(binary);
    } catch (arrayBufferError) {
      console.warn('arrayBuffer method failed, falling back to FileReader:', arrayBufferError);
      
      // Fallback to FileReader method
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        const timeoutId = setTimeout(() => {
          reader.abort();
          if (retryCount < MAX_RETRIES) {
            console.warn(`File read timeout, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            fileToBase64(file, retryCount + 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`File read timeout. Try a smaller file or use Chrome browser.`));
          }
        }, 30000);
        
        reader.onload = () => {
          clearTimeout(timeoutId);
          const result = reader.result as string;
          if (!result) {
            reject(new Error('FileReader returned empty result'));
            return;
          }
          const base64 = result.split(',')[1];
          if (!base64) {
            reject(new Error('Failed to extract base64 from file'));
            return;
          }
          resolve(base64);
        };
        
        reader.onerror = () => {
          clearTimeout(timeoutId);
          if (retryCount < MAX_RETRIES) {
            console.warn(`FileReader error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            fileToBase64(file, retryCount + 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Failed to read file: ${file.name}. Try using Chrome browser.`));
          }
        };
        
        reader.onabort = () => {
          clearTimeout(timeoutId);
        };
        
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'endorsement' | 'benefit' | 'member') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (type: 'endorsement' | 'benefit' | 'member') => {
    if (type === 'endorsement') {
      setFormData(prev => ({ ...prev, endorsementFile: null, extractedClauses: [] }));
      if (endorsementInputRef.current) endorsementInputRef.current.value = '';
    } else if (type === 'benefit') {
      setFormData(prev => ({ ...prev, benefitTableFile: null, extractedTiers: [] }));
      if (benefitInputRef.current) benefitInputRef.current.value = '';
    } else {
      setFormData(prev => ({ ...prev, memberDataFile: null, memberSummary: null }));
      if (memberInputRef.current) memberInputRef.current.value = '';
    }
    console.log(`🗑️ Removed ${type} file, input element reset`);
  };

  const toggleBenefitType = (benefitId: string) => {
    setFormData(prev => ({
      ...prev,
      benefitTypes: prev.benefitTypes.includes(benefitId)
        ? prev.benefitTypes.filter(b => b !== benefitId)
        : [...prev.benefitTypes, benefitId],
    }));
  };

  const isStep1Valid = () => {
    return (
      formData.accountType !== '' &&
      formData.policyholderName.length >= 3 &&
      formData.periodStart !== '' &&
      formData.periodEnd !== '' &&
      new Date(formData.periodEnd) > new Date(formData.periodStart) &&
      formData.benefitTypes.length > 0 &&
      formData.benefitTableFile?.status === 'success' &&
      formData.memberDataFile?.status === 'success'
    );
  };

  const handleNext = () => {
    console.log('➡️ handleNext called, checking isStep1Valid:', isStep1Valid());
    console.log('📝 Form state:', {
      accountType: formData.accountType,
      policyholderName: formData.policyholderName,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      benefitTypesCount: formData.benefitTypes.length,
      benefitTableStatus: formData.benefitTableFile?.status,
      memberDataStatus: formData.memberDataFile?.status,
      memberDataHasExtracted: !!formData.memberDataFile?.extractedData?.members,
      memberCount: formData.memberDataFile?.extractedData?.members?.length || 0,
    });
    if (!isStep1Valid()) {
      toast({
        title: "Form belum lengkap",
        description: "Pastikan semua field wajib terisi dan dokumen sudah diproses",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ Step 1 valid, moving to Step 2');
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Debug: Log what data is being passed to onComplete
    console.log('🔍 handleConfirm - formData before onComplete:', {
      policyholderName: formData.policyholderName,
      memberSummary: formData.memberSummary,
      memberDataFile: {
        status: formData.memberDataFile?.status,
        hasExtractedData: !!formData.memberDataFile?.extractedData,
        hasMembersArray: !!formData.memberDataFile?.extractedData?.members,
        memberCount: formData.memberDataFile?.extractedData?.members?.length || 0,
        firstMember: formData.memberDataFile?.extractedData?.members?.[0] || null,
      },
    });
    try {
      await onComplete(formData);
      toast({
        title: "Polis berhasil diaktifkan",
        description: `${formData.policyholderName} telah ditambahkan ke sistem`,
      });
      onClose();
    } catch (error) {
      console.error('Policy activation error:', error);
      toast({
        title: "Gagal mengaktifkan polis",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: 'OVERRIDE' | 'SPECIFIED' | 'SAME') => {
    if (status === 'OVERRIDE') {
      return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">OVERRIDE</span>;
    }
    if (status === 'SPECIFIED') {
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">SPECIFIED</span>;
    }
    return <span className="text-green-600">✓</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              🆕 Pemegang Polis Baru
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {currentStep === 1 ? 'Langkah 1: Upload dokumen dan isi informasi polis' : 'Langkah 2: Review dan konfirmasi'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator - Centered and Compact */}
        <div className="px-8 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span className="text-xs font-medium">Upload & Input</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep > 1 ? 'bg-green-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <span className="text-xs font-medium">Konfirmasi</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Account Type & Name Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Tipe Akun <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: 'baru' | 'renewal') => 
                      setFormData(prev => ({ ...prev, accountType: value, policyholderName: '' }))
                    }
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-account-type">
                      <SelectValue placeholder="Pilih tipe akun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baru">Akun Baru</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Label className="text-sm font-medium text-slate-700">
                    Nama Pemegang Polis <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.policyholderName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, policyholderName: e.target.value }));
                      setShowSuggestions(formData.accountType === 'renewal' && e.target.value.length > 0);
                    }}
                    onFocus={() => {
                      if (formData.accountType === 'renewal' && formData.policyholderName.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder={formData.accountType === 'renewal' ? "Ketik nama pemegang polis..." : "PT Mitra Iswara & Rorimpandey Ltd"}
                    className="mt-1.5"
                    disabled={!formData.accountType}
                    data-testid="input-policyholder-name"
                  />
                  {/* Autocomplete suggestions for renewal */}
                  {showSuggestions && formData.accountType === 'renewal' && existingPolicyholders.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {existingPolicyholders
                        .filter(name => name.toLowerCase().includes(formData.policyholderName.toLowerCase()))
                        .map(name => (
                          <button
                            key={name}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, policyholderName: name }));
                              setShowSuggestions(false);
                            }}
                            data-testid={`suggestion-${name}`}
                          >
                            {name}
                          </button>
                        ))}
                      {existingPolicyholders.filter(name => name.toLowerCase().includes(formData.policyholderName.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-500">Tidak ada hasil</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Period Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Periode Polis Sejak <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        // Calculate end date: 1 year minus 1 day from start
                        let endDate = '';
                        if (startDate) {
                          const start = new Date(startDate);
                          const end = new Date(start);
                          end.setFullYear(end.getFullYear() + 1);
                          end.setDate(end.getDate() - 1);
                          endDate = end.toISOString().split('T')[0];
                        }
                        setFormData(prev => ({ ...prev, periodStart: startDate, periodEnd: endDate }));
                      }}
                      className={formData.periodStart ? 'text-transparent' : ''}
                      data-testid="input-period-start"
                    />
                    {formData.periodStart && (
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-sm text-slate-900">{formatDateDisplay(formData.periodStart)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Sampai <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                      className={formData.periodEnd ? 'text-transparent' : ''}
                      data-testid="input-period-end"
                    />
                    {formData.periodEnd && (
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-sm text-slate-900">{formatDateDisplay(formData.periodEnd)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefit Types */}
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Jenis Manfaat <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {BENEFIT_TYPES.map((benefit) => (
                    <div key={benefit.id} className="flex items-center gap-2">
                      <Checkbox
                        id={benefit.id}
                        checked={formData.benefitTypes.includes(benefit.id)}
                        onCheckedChange={() => toggleBenefitType(benefit.id)}
                        data-testid={`checkbox-${benefit.id}`}
                      />
                      <label htmlFor={benefit.id} className="text-sm text-slate-700 cursor-pointer">
                        {benefit.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Zones */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Upload Dokumen</h3>
                
                {/* Endorsement Upload (Optional) */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Endorsemen Klausula <span className="text-slate-400">(Opsional)</span>
                  </Label>
                  <div
                    onDrop={(e) => handleDrop(e, 'endorsement')}
                    onDragOver={handleDragOver}
                    className={`mt-1.5 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      formData.endorsementFile?.status === 'success' 
                        ? 'border-green-300 bg-green-50' 
                        : formData.endorsementFile?.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : formData.endorsementFile?.status === 'processing'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {formData.endorsementFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {formData.endorsementFile.status === 'processing' ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : formData.endorsementFile.status === 'success' ? (
                            <FileText className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900">{formData.endorsementFile.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(formData.endorsementFile.size)}
                              {formData.endorsementFile.status === 'processing' && ' • Memproses endorsemen klausula... Strator sedang mengidentifikasi T&C yang di-override'}
                            </p>
                            {formData.endorsementFile.result && (
                              <p className={`text-xs mt-1 ${formData.endorsementFile.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {formData.endorsementFile.result}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile('endorsement')}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Drag & drop atau klik untuk upload</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, Excel, Word, Image (max 10MB)</p>
                        <input
                          ref={endorsementInputRef}
                          type="file"
                          accept={ACCEPTED_DOC_FORMATS}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'endorsement')}
                          className="hidden"
                          data-testid="input-endorsement-file"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => endorsementInputRef.current?.click()}
                        >
                          Pilih File
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Benefit Table Upload (Required) */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Tabel Benefit <span className="text-red-500">*</span>
                  </Label>
                  <div
                    onDrop={(e) => handleDrop(e, 'benefit')}
                    onDragOver={handleDragOver}
                    className={`mt-1.5 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      formData.benefitTableFile?.status === 'success' 
                        ? 'border-green-300 bg-green-50' 
                        : formData.benefitTableFile?.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : formData.benefitTableFile?.status === 'processing'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {formData.benefitTableFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {formData.benefitTableFile.status === 'processing' ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : formData.benefitTableFile.status === 'success' ? (
                            <FileText className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900">{formData.benefitTableFile.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(formData.benefitTableFile.size)}
                              {formData.benefitTableFile.status === 'processing' && ' • Memproses tabel benefit... Strator sedang memvalidasi struktur dan limits'}
                            </p>
                            {formData.benefitTableFile.result && (
                              <p className={`text-xs mt-1 ${formData.benefitTableFile.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {formData.benefitTableFile.result}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile('benefit')}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Drag & drop atau klik untuk upload</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, Excel, Word, Image (max 10MB)</p>
                        <input
                          ref={benefitInputRef}
                          type="file"
                          accept={ACCEPTED_DOC_FORMATS}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'benefit')}
                          className="hidden"
                          data-testid="input-benefit-file"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => benefitInputRef.current?.click()}
                        >
                          Pilih File
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Member Data Upload (Required) */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Data Peserta Awal <span className="text-red-500">*</span>
                  </Label>
                  <div
                    onDrop={(e) => handleDrop(e, 'member')}
                    onDragOver={handleDragOver}
                    className={`mt-1.5 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      formData.memberDataFile?.status === 'success' 
                        ? 'border-green-300 bg-green-50' 
                        : formData.memberDataFile?.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : formData.memberDataFile?.status === 'processing'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {formData.memberDataFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {formData.memberDataFile.status === 'processing' ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : formData.memberDataFile.status === 'success' ? (
                            <FileText className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900">{formData.memberDataFile.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(formData.memberDataFile.size)}
                              {formData.memberDataFile.status === 'processing' && ' • Memproses data peserta... Strator sedang memvalidasi kelengkapan field wajib'}
                            </p>
                            {formData.memberDataFile.result && (
                              <p className={`text-xs mt-1 ${formData.memberDataFile.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {formData.memberDataFile.result}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile('member')}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Drag & drop atau klik untuk upload</p>
                        <p className="text-xs text-slate-400 mt-1">Excel, CSV (max 50MB)</p>
                        <input
                          ref={memberInputRef}
                          type="file"
                          accept={ACCEPTED_DATA_FORMATS}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'member')}
                          className="hidden"
                          data-testid="input-member-file"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => memberInputRef.current?.click()}
                        >
                          Pilih File
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Policy Info Section */}
              <Card className="p-5 border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Informasi Polis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Pemegang Polis</p>
                    <p className="text-sm font-medium text-slate-900">{formData.policyholderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Periode</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(formData.periodStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(formData.periodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Peserta</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formData.memberSummary ? (
                        `${formData.memberSummary.total} (${formData.memberSummary.employees} karyawan, ${formData.memberSummary.dependents} tanggungan)`
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Jenis Manfaat</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formData.benefitTypes.map(id => BENEFIT_TYPES.find(b => b.id === id)?.label).filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tingkat Benefit</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formData.extractedTiers.length > 0 
                        ? `${formData.extractedTiers.length} tingkat (${formData.extractedTiers.map(t => t.code).join(', ')})`
                        : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Endorsement Comparison Table */}
              {formData.extractedClauses.length > 0 && (
                <Card className="p-5 border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Perbandingan Klausula</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Klausula</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Polis Standard</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Endorsemen {formData.policyholderName}</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.extractedClauses.map((clause, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="py-2 px-3 text-slate-900">{clause.clauseName}</td>
                            <td className="py-2 px-3 text-slate-500">{clause.standardRule}</td>
                            <td className={`py-2 px-3 ${clause.status === 'OVERRIDE' ? 'text-blue-700 font-medium' : 'text-slate-900'}`}>
                              {clause.endorsedRule}
                            </td>
                            <td className="py-2 px-3">{getStatusBadge(clause.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Uploaded Documents */}
              <Card className="p-5 border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Dokumen Terupload</h3>
                <div className="space-y-2">
                  {formData.endorsementFile && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{formData.endorsementFile.name}</span>
                      <span className="text-xs text-slate-400">{formatFileSize(formData.endorsementFile.size)}</span>
                    </div>
                  )}
                  {formData.benefitTableFile && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{formData.benefitTableFile.name}</span>
                      <span className="text-xs text-slate-400">{formatFileSize(formData.benefitTableFile.size)}</span>
                    </div>
                  )}
                  {formData.memberDataFile && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{formData.memberDataFile.name}</span>
                      <span className="text-xs text-slate-400">{formatFileSize(formData.memberDataFile.size)}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            {currentStep === 2 && (
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Button>
            )}
          </div>
          <div>
            {currentStep === 1 && (
              <Button
                onClick={handleNext}
                disabled={!isStep1Valid() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-next"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button
                onClick={() => {
                  console.log('🔘 Confirm button clicked!');
                  handleConfirm();
                }}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Konfirmasi & Aktifkan Polis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
