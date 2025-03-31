
import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload as UploadIcon, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileItem {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: api.uploadFile,
    onSuccess: (_, file) => {
      setFiles(current =>
        current.map(item =>
          item.file === file ? { ...item, status: 'success', progress: 100 } : item
        )
      );
      toast.success(`${file.name} uploaded successfully`);
    },
    onError: (error, file) => {
      setFiles(current =>
        current.map(item =>
          item.file === file ? { 
            ...item, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : item
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        status: 'idle' as FileStatus,
        progress: 0,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const handleUpload = (fileItem: FileItem) => {
    setFiles(current =>
      current.map(item =>
        item.file === fileItem.file ? { ...item, status: 'uploading', progress: 10 } : item
      )
    );
    
    // Simulate progress updates before completing
    const progressInterval = setInterval(() => {
      setFiles(current =>
        current.map(item =>
          item.file === fileItem.file && item.status === 'uploading' && item.progress < 90
            ? { ...item, progress: Math.min(item.progress + 10, 90) }
            : item
        )
      );
    }, 500);

    uploadMutation.mutate(fileItem.file, {
      onSettled: () => clearInterval(progressInterval),
    });
  };

  const handleRemoveFile = (fileItem: FileItem) => {
    setFiles(current => current.filter(item => item.file !== fileItem.file));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'csv':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-6 w-6 text-blue-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Upload</h2>
          <p className="text-muted-foreground">
            Upload documents to your knowledge base for AI-powered querying.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Supported formats: PDF, CSV, TXT, and MD files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.csv,.txt,.md"
                multiple
              />
              <UploadIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Drag and drop files here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Or click to browse files from your computer
              </p>
              <Button>Select Files</Button>
            </div>

            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium">Files</h3>
                <ul className="space-y-3">
                  {files.map((fileItem, index) => (
                    <li key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {getFileIcon(fileItem.file.name)}
                          <div>
                            <p className="font-medium">{fileItem.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(fileItem.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {fileItem.status === 'idle' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpload(fileItem)}
                            >
                              Upload
                            </Button>
                          )}
                          {fileItem.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {fileItem.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleRemoveFile(fileItem)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {(fileItem.status === 'uploading' || fileItem.status === 'success') && (
                        <Progress 
                          value={fileItem.progress} 
                          className="h-1 mt-2" 
                        />
                      )}
                      {fileItem.status === 'error' && fileItem.error && (
                        <p className="text-sm text-red-500 mt-1">{fileItem.error}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadPage;
