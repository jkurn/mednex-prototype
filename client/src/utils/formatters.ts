export function formatRupiah(amount: number): string {
  // Format without decimals, no space after Rp for compact display
  return `Rp${Math.round(amount).toLocaleString('id-ID', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Format Rupiah with Indonesian abbreviations for chart axes
 * Uses: rb (ribuan/thousands), jt (jutaan/millions), M (milyar/billions)
 */
export function formatRupiahCompact(value: number): string {
  if (value >= 1000000000) {
    // Billions -> M (milyar)
    return `Rp${(value / 1000000000).toFixed(1)}M`;
  }
  if (value >= 1000000) {
    // Millions -> jt (jutaan)
    return `Rp${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    // Thousands -> rb (ribuan)
    return `Rp${(value / 1000).toFixed(0)}rb`;
  }
  // Less than 1000
  return `Rp${value}`;
}

export function formatDateDDMMYYYY(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Parse Indonesian date format DD/MM/YYYY to Date object
export function parseDDMMYYYY(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Check if already in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  if (dateString.includes('-')) {
    // Parse ISO format into local time to avoid timezone issues
    const parts = dateString.split('T')[0].split('-'); // Get just the date part
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed  
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  }
  
  // Parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  return new Date(dateString);
}

// Format date to Indonesian format with full month name (e.g., "22 Oktober 2025")
export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  
  // Use parseDDMMYYYY to handle both DD/MM/YYYY and ISO formats
  const date = parseDDMMYYYY(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${monthName} ${year}`;
}

// Format timestamp with Indonesian date and time
export function formatLastUpdated(date: Date | null): string {
  if (!date) return '-';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const updateDate = new Date(date);
  updateDate.setHours(0, 0, 0, 0);
  
  const isToday = updateDate.getTime() === today.getTime();
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const displayHours = date.getHours() % 12 || 12;
  const timeStr = `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  
  if (isToday) {
    return `Hari ini, ${timeStr}`;
  }
  
  // Indonesian day names
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  const dayName = days[date.getDay()];
  
  return `${dayName}, ${timeStr}`;
}

// Calculate age from date of birth (accepts YYYY-MM-DD or DD Month YYYY format)
export function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  
  let dob: Date;
  
  // Try parsing as ISO date first (YYYY-MM-DD)
  dob = new Date(dateOfBirth);
  
  // If invalid, return null
  if (isNaN(dob.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}