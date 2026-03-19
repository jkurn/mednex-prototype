import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Consistent tag styling across all tag components
const TAG_BASE_STYLES = "text-sm px-3 py-1 font-medium rounded";

// Gender Tag Components
export function GenderTag({ gender }: { gender: 'L' | 'P' | 'Laki-laki' | 'Perempuan' }) {
  const isLakiLaki = gender === 'L' || gender === 'Laki-laki';
  
  return (
    <Badge 
      className={cn(
        TAG_BASE_STYLES,
        isLakiLaki 
          ? "bg-blue-500 text-white hover:bg-blue-600" 
          : "bg-pink-500 text-white hover:bg-pink-600"
      )}
    >
      {isLakiLaki ? 'Laki-laki' : 'Perempuan'}
    </Badge>
  );
}

// Relationship to Principal Tag Components
export function RelationshipTag({ relationship }: { relationship: 'Prinsipal' | 'Suami' | 'Isteri' | 'Anak' }) {
  return (
    <Badge 
      variant="outline"
      className={cn(TAG_BASE_STYLES, "bg-slate-100 text-slate-700 border-slate-300")}
    >
      {relationship}
    </Badge>
  );
}

// Benefit Category Tag with Emojis
export function BenefitCategoryTag({ category }: { category?: string }) {
  const configs = {
    'RAWAT JALAN': { emoji: '🏥', label: 'Rawat Jalan', color: 'bg-blue-50 text-slate-900 border-slate-200' },
    'RAWAT INAP': { emoji: '🛏️', label: 'Rawat Inap', color: 'bg-slate-100 text-slate-900 border-slate-200' },
    'RAWAT BERSALIN': { emoji: '🤰', label: 'Rawat Bersalin', color: 'bg-slate-100 text-slate-900 border-slate-200' },
    'RAWAT GIGI': { emoji: '🪥', label: 'Rawat Gigi', color: 'bg-slate-100 text-slate-900 border-slate-200' },
    'KACAMATA': { emoji: '👓', label: 'Kacamata', color: 'bg-slate-100 text-slate-900 border-slate-200' },
    'MEDICAL CHECK-UP': { emoji: '🔬', label: 'Medical Check-Up', color: 'bg-slate-100 text-slate-900 border-slate-200' },
  };

  const config = category ? configs[category as keyof typeof configs] : null;
  if (!config) return null;

  return (
    <Badge 
      variant="outline" 
      className={cn(TAG_BASE_STYLES, "border", config.color)}
    >
      {config.emoji} {config.label}
    </Badge>
  );
}

// Status Tag (for checkpoint validation)
export function StatusTag({ status }: { status: 'LOLOS' | 'GAGAL' | 'PERLU REVIEW' }) {
  const configs = {
    'LOLOS': { color: 'bg-green-500 text-white', text: 'LOLOS' },
    'GAGAL': { color: 'bg-red-500 text-white', text: 'GAGAL' },
    'PERLU REVIEW': { color: 'bg-yellow-500 text-white', text: 'PERLU REVIEW' },
  };

  const config = configs[status];

  return (
    <Badge className={cn(TAG_BASE_STYLES, config.color)}>
      {config.text}
    </Badge>
  );
}

// Document Status Tag
export function DocumentStatusTag({ status }: { status: 'LENGKAP' | 'TIDAK LENGKAP' }) {
  return (
    <Badge 
      className={cn(
        TAG_BASE_STYLES,
        status === 'LENGKAP' 
          ? "bg-green-500 text-white" 
          : "bg-red-500 text-white"
      )}
    >
      {status}
    </Badge>
  );
}

// Member Status Tag (for membership verification)
export function MemberStatusTag({ status }: { status: 'Aktif' | 'Tidak Aktif' | 'Tidak Ditemukan' }) {
  const configs = {
    'Aktif': { color: 'bg-green-500 text-white hover:bg-green-600', text: 'Aktif' },
    'Tidak Aktif': { color: 'bg-red-500 text-white hover:bg-red-600', text: 'Tidak Aktif' },
    'Tidak Ditemukan': { color: 'bg-slate-400 text-white hover:bg-slate-500', text: 'Tidak Ditemukan' },
  };

  const config = configs[status];

  return (
    <Badge className={cn(TAG_BASE_STYLES, config.color)}>
      {config.text}
    </Badge>
  );
}
