import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useClaimsData } from "@/hooks/useClaimsData";
import { processFile } from "@/services/fileProcessing";
import { validateFileType, ACCEPTED_FILE_TYPES } from "@/utils/validation";

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'queued' | 'processing' | 'complete' | 'error';
  result?: any;
  error?: string;
}

export default function FileUpload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addClaim } = useClaimsData();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(file => {
      const isValid = validateFileType(file);
      if (!isValid) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Please upload PDF, JPG, or JPEG files only.`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    const newFiles: FileWithProgress[] = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'queued',
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Show bulk processing notification
    if (newFiles.length > 10) {
      toast({
        title: "Bulk Processing Started",
        description: `Processing ${newFiles.length} files with 2-second intervals to avoid rate limits. This will take approximately ${Math.ceil(newFiles.length * 2 / 60)} minutes.`,
      });
    }

    // Process files sequentially with better rate limiting for bulk uploads
    newFiles.forEach((fileWithProgress, index) => {
      // For bulk processing (>10 files), increase delay to 2 seconds per file
      const delay = newFiles.length > 10 ? index * 2000 : index * 1000;
      setTimeout(() => processFileAsync(fileWithProgress), delay);
    });
  };

  const processFileAsync = async (fileWithProgress: FileWithProgress) => {
    setFiles(prev => prev.map(f => 
      f.id === fileWithProgress.id 
        ? { ...f, status: 'processing', progress: 10 } 
        : f
    ));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileWithProgress.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 } 
            : f
        ));
      }, 500);

      const result = await processFile(fileWithProgress.file);
      
      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => 
        f.id === fileWithProgress.id 
          ? { ...f, status: 'complete', progress: 100, result } 
          : f
      ));

      // Add to claims data - PASS ALL FIELDS FROM BACKEND
      addClaim({
        ...result, // Pass EVERYTHING from backend (includes checkpointStatuses, submissionDate, etc.)
        fileName: fileWithProgress.file.name,
        // Only override if backend didn't provide these
        provider: result.provider || "We couldn't find such information in the file",
        date: result.date || new Date().toISOString().split('T')[0],
        patientId: result.patientId || "***0000",
        diagnosis: result.diagnosis || "We couldn't find such information in the file",
        amount: result.amount || 0,
        serviceType: result.serviceType as any || 'Outpatient',
        status: result.provider && result.diagnosis && result.amount ? 'processed' : 'incomplete',
        processingErrors: result.errors || [],
      });

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${fileWithProgress.file.name}`,
      });

    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === fileWithProgress.id 
          ? { ...f, status: 'error', progress: 0, error: error.message } 
          : f
      ));

      toast({
        title: "Processing Failed",
        description: `${fileWithProgress.file.name}: ${error.message || "An error occurred while processing the file"}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryFile = (id: string) => {
    const fileToRetry = files.find(f => f.id === id);
    if (fileToRetry) {
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { ...f, status: 'queued', progress: 0, error: undefined } 
          : f
      ));
      setTimeout(() => processFileAsync(fileToRetry), 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <i className="fas fa-check text-success"></i>;
      case 'processing': return <i className="fas fa-cog fa-spin text-primary"></i>;
      case 'error': return <i className="fas fa-times text-error"></i>;
      default: return <i className="fas fa-clock text-slate-500"></i>;
    }
  };

  const getStatusText = (file: FileWithProgress) => {
    switch (file.status) {
      case 'complete': return 'Processing Complete';
      case 'processing': return 'Processing...';
      case 'error': return file.error || 'Processing Failed';
      default: return 'Queued';
    }
  };

  // Calculate processing statistics
  const completedFiles = files.filter(f => f.status === 'complete').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;
  const queuedFiles = files.filter(f => f.status === 'queued').length;
  const totalFiles = files.length;

  return (
    <Card className="shadow-sm border border-slate-200 mb-8">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          <i className="fas fa-upload mr-2 text-primary"></i>
          Upload Medical Claims Documents
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-300 hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-cloud-upload-alt text-2xl text-primary"></i>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">Drop medical bills here or click to browse</h3>
              <p className="text-xs text-slate-600 mt-1">Supports PDF, JPG, JPEG files up to 10MB each</p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-text-primary">
                {processingFiles > 0 || queuedFiles > 0 
                  ? `Uploading ${completedFiles + processingFiles} out of ${totalFiles} files`
                  : `Upload Complete - ${totalFiles} files processed`
                }
              </h4>
              {(completedFiles > 0 || errorFiles > 0) && (
                <div className="text-sm text-slate-600">
                  {completedFiles > 0 && <span className="text-green-600">{completedFiles} succeeded</span>}
                  {completedFiles > 0 && errorFiles > 0 && <span className="mx-2">•</span>}
                  {errorFiles > 0 && <span className="text-red-600">{errorFiles} failed</span>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileWithProgress) => (
                <Card key={fileWithProgress.id} className={`border ${
                  fileWithProgress.status === 'error' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <i className={`text-lg mr-2 ${
                          fileWithProgress.file.type.includes('pdf') 
                            ? 'fas fa-file-pdf text-error' 
                            : 'fas fa-file-image text-primary'
                        }`}></i>
                        <span className="text-sm font-medium text-text-primary truncate">
                          {fileWithProgress.file.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {fileWithProgress.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryFile(fileWithProgress.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Retry processing"
                          >
                            <i className="fas fa-redo text-xs"></i>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileWithProgress.id)}
                          className="text-slate-400 hover:text-error transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <Progress 
                      value={fileWithProgress.progress} 
                      className={`mb-2 ${
                        fileWithProgress.status === 'error' 
                          ? '[&>div]:bg-red-500' 
                          : ''
                      }`} 
                    />
                    
                    <p className={`text-xs mt-2 flex items-center ${
                      fileWithProgress.status === 'complete' ? 'text-success' :
                      fileWithProgress.status === 'processing' ? 'text-primary' :
                      fileWithProgress.status === 'error' ? 'text-error' :
                      'text-slate-500'
                    }`}>
                      {getStatusIcon(fileWithProgress.status)}
                      <span className="ml-1">{getStatusText(fileWithProgress)}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
