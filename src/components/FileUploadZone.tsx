import React, { useCallback, useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/cn';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  loading?: boolean;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  loading = false,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      alert(`File troppo grande. Dimensione massima: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }
    return true;
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {selectedFile ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <File className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
              <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Trascina un file qui o clicca per selezionare
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Dimensione massima: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={loading}
            className="text-sm"
          >
            {loading ? 'Caricamento...' : 'Seleziona File'}
          </Button>
        </div>
      )}
    </div>
  );
};
