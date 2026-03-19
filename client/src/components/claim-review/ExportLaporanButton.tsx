import { useState, useRef, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Claim } from "@shared/schema";
import { exportClaimReport } from "@/services/pdfExport";

interface ExportLaporanButtonProps {
  claim: Claim;
}

export function ExportLaporanButton({ claim }: ExportLaporanButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ left: '50%', bottom: '24px' });

  useEffect(() => {
    const updatePosition = () => {
      const mainPane = containerRef.current?.closest('main');
      if (mainPane) {
        const rect = mainPane.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        setButtonPosition({
          left: `${centerX}px`,
          bottom: '24px',
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      const result = await exportClaimReport(claim);
      
      if (result.success) {
        toast({
          title: "✅ Laporan Berhasil Di-export!",
          description: `${result.filename} downloaded`,
          duration: 4000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal generate laporan",
          description: result.error || "Silakan coba lagi atau hubungi IT",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "❌ Gagal generate laporan",
        description: "Silakan coba lagi atau hubungi IT",
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <div 
        className="fixed z-[100] pointer-events-auto"
        style={{
          bottom: buttonPosition.bottom,
          left: buttonPosition.left,
          transform: 'translateX(-50%)',
        }}
      >
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3.5 h-auto text-[15px] font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          style={{
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(59, 130, 246, 0.2)',
            letterSpacing: '0.2px',
          }}
          data-testid="button-export-laporan"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-[18px] h-[18px] mr-2.5" />
              Export Laporan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
