import { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import { FileText, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { getCachedFile } from "@/utils/fileCache";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ClaimPdfViewerProps {
  fileBase64?: string;
  fileMimeType?: string;
  claimId?: string;
  onStateChange?: (state: PdfViewerState) => void;
}

export interface PdfViewerState {
  displayScale: number;
  currentPage: number;
  numPages: number;
  isImage: boolean;
  hasFile: boolean;
}

export interface PdfViewerHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  goToPage: (page: number) => void;
  getFileBlob: () => Blob | null;
}

const BASE_RENDER_SCALE = 2.0;

export const ClaimPdfViewer = forwardRef<PdfViewerHandle, ClaimPdfViewerProps>(
  function ClaimPdfViewer({ fileBase64, fileMimeType, claimId, onStateChange }, ref) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [displayScale, setDisplayScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<string[]>([]);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  const fileData = useMemo(() => {
    if (fileBase64 && fileMimeType) {
      return { base64: fileBase64, mimeType: fileMimeType };
    }
    if (claimId) {
      const cached = getCachedFile(claimId);
      if (cached) {
        return cached;
      }
    }
    return null;
  }, [fileBase64, fileMimeType, claimId]);

  const isImage = fileData?.mimeType.startsWith('image/') || false;

  const base64ToBlob = useCallback((base64: string, mimeType: string): Blob => {
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }, []);

  useImperativeHandle(ref, () => ({
    zoomIn: () => setDisplayScale(prev => Math.min(prev + 0.25, 3.0)),
    zoomOut: () => setDisplayScale(prev => Math.max(prev - 0.25, 0.5)),
    goToPage: (page: number) => {
      const idx = page - 1;
      if (idx >= 0 && idx < pageRefs.current.length && pageRefs.current[idx]) {
        pageRefs.current[idx]!.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    getFileBlob: () => {
      if (!fileData) return null;
      return base64ToBlob(fileData.base64, fileData.mimeType);
    },
  }), [fileData, base64ToBlob]);

  useEffect(() => {
    onStateChange?.({
      displayScale,
      currentPage: currentVisiblePage,
      numPages,
      isImage,
      hasFile: !!fileData,
    });
  }, [displayScale, currentVisiblePage, numPages, isImage, fileData]);

  useEffect(() => {
    if (!fileData) {
      setError(null);
      if (pdfDoc) {
        pdfDoc.destroy();
      }
      setPdfDoc(null);
      setDisplayScale(1.0);
      setNumPages(0);
      setRenderedPages([]);
      return;
    }

    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setDisplayScale(1.0);
      setRenderedPages([]);

      if (pdfDoc) {
        pdfDoc.destroy();
        setPdfDoc(null);
      }

      try {
        if (fileData.mimeType === 'application/pdf') {
          const blob = base64ToBlob(fileData.base64, fileData.mimeType);
          const arrayBuffer = await blob.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          if (!cancelled) {
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
          } else {
            pdf.destroy();
          }
        } else if (fileData.mimeType.startsWith('image/')) {
          if (!cancelled) {
            setPdfDoc(null);
            setNumPages(1);
          }
        } else {
          if (!cancelled) {
            setError('Format file tidak didukung');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError('Gagal memuat dokumen');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [fileData, base64ToBlob]);

  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    let cancelled = false;

    const renderAllPages = async () => {
      const pages: string[] = [];
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (cancelled) break;
        
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: BASE_RENDER_SCALE });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          } as any).promise;
          
          pages.push(canvas.toDataURL('image/png', 1.0));
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
          pages.push('');
        }
      }
      
      if (!cancelled) {
        setRenderedPages(pages);
      }
    };

    renderAllPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, numPages]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || renderedPages.length === 0) return;

    const handleScroll = () => {
      const scrollTop = scrollArea.scrollTop;
      const containerHeight = scrollArea.clientHeight;
      
      let currentPage = 1;
      let accumulatedHeight = 0;
      
      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          const pageHeight = pageEl.offsetHeight + 16;
          if (scrollTop < accumulatedHeight + pageHeight - containerHeight / 2) {
            currentPage = i + 1;
            break;
          }
          accumulatedHeight += pageHeight;
          currentPage = i + 1;
        }
      }
      
      setCurrentVisiblePage(Math.min(currentPage, numPages));
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [renderedPages, numPages]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollAreaRef.current) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      x: scrollAreaRef.current.scrollLeft,
      y: scrollAreaRef.current.scrollTop
    });
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollAreaRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    scrollAreaRef.current.scrollLeft = scrollStart.x - deltaX;
    scrollAreaRef.current.scrollTop = scrollStart.y - deltaY;
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!fileData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
        <FileText className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-sm font-medium">Tidak ada dokumen klaim</p>
        <p className="text-xs mt-1">Upload dokumen untuk melihat file asli</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-slate-600">Memuat dokumen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-red-500">
        <FileText className="w-16 h-16 mb-4 text-red-300" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-slate-100" ref={containerRef}>
      <div 
        ref={scrollAreaRef}
        className="flex-1"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          overflow: 'scroll',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        data-testid="pdf-viewer-content"
      >
        <div 
          className="p-4"
          style={{
            transform: `scale(${displayScale})`,
            transformOrigin: 'top left',
            width: `${100 / displayScale}%`,
            minWidth: 'fit-content',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            {isImage ? (
              <img 
                src={`data:${fileData.mimeType};base64,${fileData.base64.includes(',') ? fileData.base64.split(',')[1] : fileData.base64}`}
                alt="Dokumen klaim"
                className="max-w-full h-auto shadow-lg rounded pointer-events-none"
                draggable={false}
                data-testid="claim-image"
              />
            ) : (
              <>
                {renderedPages.length === 0 && numPages > 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-slate-600">Merender halaman...</span>
                  </div>
                )}
                {renderedPages.map((pageDataUrl, index) => (
                  <div
                    key={index}
                    ref={(el) => { pageRefs.current[index] = el; }}
                    className="shadow-lg bg-white"
                    data-testid={`pdf-page-${index + 1}`}
                  >
                    {pageDataUrl ? (
                      <img 
                        src={pageDataUrl} 
                        alt={`Halaman ${index + 1}`}
                        className="block pointer-events-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-[600px] h-[800px] flex items-center justify-center bg-slate-50">
                        <span className="text-slate-400">Gagal memuat halaman {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
