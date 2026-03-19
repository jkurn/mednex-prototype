import * as XLSX from 'xlsx';
import { Claim } from '@shared/schema';
import { formatRupiah, formatDateDDMMYYYY } from '@/utils/formatters';

export async function exportToExcel(claims: Claim[]): Promise<void> {
  try {
    // Prepare data for Excel export
    const exportData = claims.map((claim, index) => ({
      'No.': index + 1,
      'File Name': claim.fileName,
      'Provider Name': claim.provider,
      'Date': formatDateDDMMYYYY(claim.date),
      'Patient ID': claim.patientId,
      'Diagnosis': claim.diagnosis,
      'Amount': formatRupiahForExcel(claim.amount),
      'Status': getStatusText(claim.status),
      'Processing Date': formatDateDDMMYYYY(claim.createdAt.toString()),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // No.
      { wch: 25 }, // File Name
      { wch: 30 }, // Provider Name
      { wch: 12 }, // Date
      { wch: 12 }, // Patient ID
      { wch: 25 }, // Diagnosis
      { wch: 18 }, // Amount
      { wch: 12 }, // Status
      { wch: 15 }, // Processing Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Claims Data');

    // Add summary sheet
    const summaryData = [
      ['Summary Report', ''],
      ['Generated Date:', formatDateDDMMYYYY(new Date().toISOString())],
      ['Total Claims:', claims.length],
      ['Total Amount:', formatRupiahForExcel(claims.reduce((sum, claim) => sum + claim.amount, 0))],
      ['Processed Claims:', claims.filter(c => c.status === 'processed').length],
      ['High Value Claims (> Rp 3.000.000):', claims.filter(c => c.amount > 3000000).length],
      ['Success Rate:', `${claims.length > 0 ? ((claims.filter(c => c.status === 'processed').length / claims.length) * 100).toFixed(1) : 0}%`],
      [''],
      ['Status Breakdown:', ''],
      ['Processed:', claims.filter(c => c.status === 'processed').length],
      ['Processing:', claims.filter(c => c.status === 'processing').length],
      ['Incomplete:', claims.filter(c => c.status === 'incomplete').length],
      ['Error:', claims.filter(c => c.status === 'error').length],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `Strator_Claims_Export_${currentDate}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Failed to export data to Excel');
  }
}

function formatRupiahForExcel(amount: number): string {
  // For Excel, we want to maintain the Indonesian format but ensure it's readable
  return formatRupiah(amount);
}

function getStatusText(status: string): string {
  switch (status) {
    case 'processed': return 'Processed';
    case 'processing': return 'Processing';
    case 'incomplete': return 'Incomplete';
    case 'error': return 'Error';
    default: return status;
  }
}
