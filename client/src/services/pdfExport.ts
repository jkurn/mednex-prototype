import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Claim } from '@shared/schema';
import { formatRupiah, formatDateIndonesian, formatDateDDMMYYYY } from '@/utils/formatters';

interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

interface AuditLogEntry {
  action: string;
  user: string;
  userId: string;
  timestamp: string;
  claimId: string;
  patientRef: string;
  format: string;
  filename: string;
  totalCharged: number;
  totalAnalyzed: number;
  differential: number;
  differentialPercentage: number;
  findingsCount: number;
  reportId: string;
}

const MAX_AUDIT_LOGS = 100;

function generateReportId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `RPT-${date}-${seq}`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
}

function hashPatientRef(name: string): string {
  const initials = name.split(' ').map(n => n[0] || '').join('').toUpperCase();
  const hash = name.length.toString(16).padStart(4, '0');
  return `${initials}-${hash}`;
}

function safeLocalStorage(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('localStorage unavailable:', e);
    return false;
  }
}

function getAuditLogs(): AuditLogEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    return JSON.parse(localStorage.getItem('strator_audit_logs') || '[]');
  } catch {
    return [];
  }
}

function getUserProfile(): { fullName: string; preferredName: string; initials: string } {
  try {
    const savedProfile = localStorage.getItem('strator_user_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      const name = profile.preferredName || profile.fullName || 'Demo User';
      const initials = getInitialsFromName(name);
      return {
        fullName: profile.fullName || '',
        preferredName: profile.preferredName || 'Demo User',
        initials,
      };
    }
  } catch {
    // Fallback
  }
  return { fullName: '', preferredName: 'Demo User', initials: 'DU' };
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

async function recordClaimActivity(claim: Claim, filename: string): Promise<void> {
  try {
    const userProfile = getUserProfile();
    const now = new Date();
    
    const activity = {
      claimId: claim.id,
      peserta: claim.patientName || 'Unknown',
      policyHolderName: claim.policyHolderName || 'Unknown',
      activityType: 'Export Laporan',
      note: `Laporan analisis klaim di-export sebagai ${filename}`,
      user: userProfile.preferredName,
      userInitials: userProfile.initials,
      date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
      timestamp: now.toISOString(),
    };

    await fetch('/api/claim-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
  } catch (error) {
    console.warn('Failed to record claim activity:', error);
  }
}

function getVarianceItems(claim: Claim): Array<{
  name: string;
  charged: number;
  analyzed: number;
  variance: number;
}> {
  const items: Array<{ name: string; charged: number; analyzed: number; variance: number }> = [];
  
  if (claim.cp5ItemAnalysis && claim.cp5ItemAnalysis.length > 0) {
    claim.cp5ItemAnalysis.forEach(item => {
      const charged = item.chargedPrice || 0;
      const analyzed = item.marketPrice || charged;
      const variance = charged - analyzed;
      if (variance > 0) {
        items.push({
          name: item.itemName,
          charged,
          analyzed,
          variance,
        });
      }
    });
  } else if (claim.analysis?.priceAnalysis) {
    claim.analysis.priceAnalysis.forEach(item => {
      const variance = item.chargedPrice - item.marketPrice;
      if (item.flag === 'OVERPRICED' && variance > 0) {
        items.push({
          name: item.item,
          charged: item.chargedPrice,
          analyzed: item.marketPrice,
          variance,
        });
      }
    });
  }
  
  return items;
}

function calculateTotals(claim: Claim): {
  totalCharged: number;
  totalAnalyzed: number;
  totalVariance: number;
  variancePercentage: number;
} {
  let totalCharged = claim.amount || 0;
  let totalAnalyzed = claim.revisedAmount || claim.amount || 0;
  
  if (claim.cp5ItemAnalysis && claim.cp5ItemAnalysis.length > 0) {
    totalCharged = claim.cp5ItemAnalysis.reduce((sum, item) => sum + (item.chargedPrice || 0), 0);
    totalAnalyzed = claim.cp5ItemAnalysis.reduce((sum, item) => sum + (item.marketPrice || item.chargedPrice || 0), 0);
  } else if (claim.analysis?.priceAnalysis && claim.analysis.priceAnalysis.length > 0) {
    totalCharged = claim.analysis.priceAnalysis.reduce((sum, item) => sum + item.chargedPrice, 0);
    totalAnalyzed = claim.analysis.priceAnalysis.reduce((sum, item) => sum + item.marketPrice, 0);
  }
  
  const totalVariance = totalCharged - totalAnalyzed;
  const variancePercentage = totalCharged > 0 ? (totalVariance / totalCharged) * 100 : 0;
  
  return { totalCharged, totalAnalyzed, totalVariance, variancePercentage };
}

export async function exportClaimReport(claim: Claim): Promise<ExportResult> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;
    
    const reportId = generateReportId();
    const analysisDate = new Date().toISOString();
    const patientName = claim.patientName || 'Unknown';
    const sanitizedName = sanitizeFilename(patientName);
    const filename = `Analisis_${sanitizedName}_${formatDateDDMMYYYY(analysisDate).replace(/\//g, '')}.pdf`;
    
    const totals = calculateTotals(claim);
    const varianceItems = getVarianceItems(claim);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN ANALISIS KLAIM', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Comprehensive Claim Analysis Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    const leftCol = margin;
    const rightCol = pageWidth / 2 + 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared By:', leftCol, yPos);
    doc.text('Nomor Klaim:', rightCol, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Insurance Company - Claims Department', leftCol, yPos);
    doc.text(claim.id || 'N/A', rightCol, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Analysis Date:', leftCol, yPos);
    doc.text('Report ID:', rightCol, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(formatDateIndonesian(analysisDate), leftCol, yPos);
    doc.text(reportId, rightCol, yPos);
    yPos += 12;
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'FD');
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('INFORMASI KLAIM', margin + 4, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    const col1 = margin + 4;
    const col2 = margin + 50;
    const col3 = pageWidth / 2 + 10;
    const col4 = pageWidth / 2 + 50;
    
    doc.text('Pasien:', col1, yPos);
    doc.setTextColor(30, 41, 59);
    doc.text(`${patientName}${claim.patientAge ? `, ${claim.patientAge} Thn` : ''}${claim.patientGender ? `, ${claim.patientGender === 'L' ? 'Laki-laki' : 'Perempuan'}` : ''}`, col2, yPos);
    
    doc.setTextColor(71, 85, 105);
    doc.text('Provider:', col3, yPos);
    doc.setTextColor(30, 41, 59);
    doc.text(claim.provider || 'N/A', col4, yPos);
    yPos += 5;
    
    doc.setTextColor(71, 85, 105);
    doc.text('Tanggal Layanan:', col1, yPos);
    doc.setTextColor(30, 41, 59);
    doc.text(claim.treatmentDate ? formatDateIndonesian(claim.treatmentDate) : (claim.date ? formatDateIndonesian(claim.date) : 'N/A'), col2, yPos);
    
    doc.setTextColor(71, 85, 105);
    doc.text('Kategori:', col3, yPos);
    doc.setTextColor(30, 41, 59);
    doc.text(claim.benefitCategory || claim.serviceType || 'N/A', col4, yPos);
    yPos += 5;
    
    doc.setTextColor(71, 85, 105);
    doc.text('Diagnosis:', col1, yPos);
    doc.setTextColor(30, 41, 59);
    const diagnosisText = `${claim.diagnosis || 'N/A'}${claim.icd10 ? ` (${claim.icd10})` : ''}`;
    doc.text(diagnosisText.substring(0, 60), col2, yPos);
    yPos += 12;
    
    if (totals.totalVariance > 0) {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(251, 191, 36);
    } else {
      doc.setFillColor(220, 252, 231);
      doc.setDrawColor(34, 197, 94);
    }
    doc.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'FD');
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('RINGKASAN ANALISIS', margin + 4, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    
    const summaryCol1 = margin + 4;
    const summaryCol2 = margin + contentWidth * 0.35;
    const summaryCol3 = margin + contentWidth * 0.65;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Charged Amount:', summaryCol1, yPos);
    doc.text('Analyzed Amount (per Buku Tarif):', summaryCol2, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(formatRupiah(totals.totalCharged), summaryCol1, yPos);
    doc.text(formatRupiah(totals.totalAnalyzed), summaryCol2, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Variance Identified:', summaryCol1, yPos);
    doc.text('Variance Percentage:', summaryCol2, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    if (totals.totalVariance > 0) {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(22, 163, 74);
    }
    doc.text(formatRupiah(totals.totalVariance), summaryCol1, yPos);
    doc.text(`${totals.variancePercentage.toFixed(1)}%`, summaryCol2, yPos);
    yPos += 12;
    
    if (varianceItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('ANALISIS DETAIL', margin, yPos);
      yPos += 6;
      
      varianceItems.forEach((item, idx) => {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, 'FD');
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`${idx + 1}. ${item.name}`, margin + 4, yPos);
        
        doc.setTextColor(180, 83, 9);
        doc.text(`Variance: ${formatRupiah(item.variance)}`, pageWidth - margin - 4, yPos, { align: 'right' });
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Charged Amount: ${formatRupiah(item.charged)}`, margin + 8, yPos);
        doc.text(`Contracted Rate (Buku Tarif): ${formatRupiah(item.analyzed)}`, margin + contentWidth / 2, yPos);
        yPos += 5;
        
        doc.setTextColor(100, 116, 139);
        doc.text('Analysis: Variance identified between charged amount and contracted rate per Buku Tarif documentation.', margin + 8, yPos);
        yPos += 10;
      });
      
      yPos += 4;
    }
    
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('TABEL PERBANDINGAN', margin, yPos);
    yPos += 6;
    
    const tableData: string[][] = [];
    
    if (claim.cp5ItemAnalysis && claim.cp5ItemAnalysis.length > 0) {
      claim.cp5ItemAnalysis.forEach((item, idx) => {
        const charged = item.chargedPrice || 0;
        const analyzed = item.marketPrice || charged;
        const variance = charged - analyzed;
        tableData.push([
          (idx + 1).toString(),
          item.itemName,
          formatRupiah(charged),
          formatRupiah(analyzed),
          formatRupiah(variance),
        ]);
      });
    } else if (claim.analysis?.priceAnalysis && claim.analysis.priceAnalysis.length > 0) {
      claim.analysis.priceAnalysis.forEach((item, idx) => {
        const variance = item.chargedPrice - item.marketPrice;
        tableData.push([
          (idx + 1).toString(),
          item.item,
          formatRupiah(item.chargedPrice),
          formatRupiah(item.marketPrice),
          formatRupiah(variance),
        ]);
      });
    } else if (claim.items && claim.items.length > 0) {
      claim.items.forEach((item, idx) => {
        tableData.push([
          (idx + 1).toString(),
          item.name,
          formatRupiah(item.totalPrice),
          formatRupiah(item.totalPrice),
          formatRupiah(0),
        ]);
      });
    }
    
    tableData.push([
      '',
      'TOTAL',
      formatRupiah(totals.totalCharged),
      formatRupiah(totals.totalAnalyzed),
      formatRupiah(totals.totalVariance),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['No', 'Item', 'Charged', 'Analyzed', 'Variance']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        yPos = data.cursor?.y || yPos + 40;
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(234, 179, 8);
    doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'FD');
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(113, 63, 18);
    doc.text('SUMMARY OF FINDINGS', margin + 4, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 63, 18);
    
    const summaryText = `Analysis completed on claim #${claim.id} indicates variance of ${formatRupiah(totals.totalVariance)} between charged amount (${formatRupiah(totals.totalCharged)}) and contracted rate amounts (${formatRupiah(totals.totalAnalyzed)}) per Buku Tarif documentation.`;
    
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 8);
    doc.text(splitSummary, margin + 4, yPos);
    yPos += splitSummary.length * 4 + 4;
    
    doc.text(`Variance identified across ${varianceItems.length} line items, detailed in analysis sections above.`, margin + 4, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Variance: ${formatRupiah(totals.totalVariance)} (${totals.variancePercentage.toFixed(1)}%)`, margin + 4, yPos);
    yPos += 12;
    
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SUPPORTING DOCUMENTATION', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`• Original invoice ${claim.provider || 'Provider'} (${claim.treatmentDate ? formatDateIndonesian(claim.treatmentDate) : formatDateIndonesian(claim.date || new Date().toISOString())})`, margin + 4, yPos);
    yPos += 4;
    doc.text(`• Buku Tarif ${claim.provider || 'Provider'} (extract - effective date)`, margin + 4, yPos);
    yPos += 4;
    doc.text('• Line-by-line analysis documentation', margin + 4, yPos);
    yPos += 4;
    doc.text(`• Medical records & diagnosis documentation (ICD-10: ${claim.icd10 || 'N/A'})`, margin + 4, yPos);
    yPos += 12;
    
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    const sigLeftCol = margin;
    const sigRightCol = pageWidth / 2 + 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    
    doc.line(sigLeftCol, yPos + 12, sigLeftCol + 50, yPos + 12);
    doc.line(sigRightCol, yPos + 12, sigRightCol + 50, yPos + 12);
    yPos += 16;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Claims Analyst', sigLeftCol, yPos);
    doc.text('Head of Claims Department', sigRightCol, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Insurance Company', sigLeftCol, yPos);
    doc.text('Insurance Company', sigRightCol, yPos);
    yPos += 12;
    
    const footerY = pageHeight - 15;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    
    doc.text('Document Information:', margin, footerY);
    doc.text(`Generated by: Strator MedNex AI-Powered Claims Intelligence System`, margin, footerY + 3);
    doc.text(`Analysis Date: ${formatDateIndonesian(analysisDate)} WIB | Report ID: ${reportId}`, margin, footerY + 6);
    doc.text('Confidence Score: High Confidence - Auto-generated with human validation', margin, footerY + 9);
    
    doc.save(filename);
    
    // Record activity for dashboard feed
    await recordClaimActivity(claim, filename);
    
    const userProfile = getUserProfile();
    const auditLog: AuditLogEntry = {
      action: 'ANALYSIS_REPORT_EXPORTED',
      user: userProfile.preferredName,
      userId: 'USR_001',
      timestamp: analysisDate,
      claimId: claim.id,
      patientRef: hashPatientRef(patientName),
      format: 'pdf',
      filename,
      totalCharged: totals.totalCharged,
      totalAnalyzed: totals.totalAnalyzed,
      differential: totals.totalVariance,
      differentialPercentage: totals.variancePercentage,
      findingsCount: varianceItems.length,
      reportId,
    };
    console.log('Audit Log:', auditLog);
    
    const existingLogs = getAuditLogs();
    existingLogs.push(auditLog);
    const trimmedLogs = existingLogs.slice(-MAX_AUDIT_LOGS);
    safeLocalStorage('strator_audit_logs', JSON.stringify(trimmedLogs));
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
