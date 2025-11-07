'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FileArchive,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { uploadApi } from '@/services/api';

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

interface FolderUploadProps {
  onUploadSuccess: (
    extractedPath: string,
    contractFiles: ContractFile[],
  ) => void;
  onBack?: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function FolderUpload({
  onUploadSuccess,
  onBack,
}: FolderUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/gzip',
      'application/x-gzip',
      'application/x-tar',
      'application/x-7z-compressed',
      'application/x-rar-compressed',
    ];

    const allowedExtensions = ['.zip', '.tar.gz', '.tgz', '.7z', '.rar'];
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      setError('Please upload a valid archive file (.zip, .tar.gz, .7z, .rar)');
      return false;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return false;
    }

    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError('');

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError('');
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    },
    [],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!uploadedFile || !selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      // Use the stored file object instead of trying to get it from the input element
      const result = await uploadApi.discoverFiles(selectedFile);

      // Call the success callback with the extracted path and contract files
      onUploadSuccess(result.extractedPath, result.contractFiles);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setSelectedFile(null);
    setError('');
    const fileInput = document.getElementById(
      'file-upload',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Contract Folder
            </h2>
            <p className="text-gray-600 mt-1">
              Upload a zipped folder containing your smart contract files for
              analysis
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {/* File Upload Area */}
        <div className="mb-6">
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileArchive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop your archive file here
              </h3>
              <p className="text-gray-600 mb-4">
                Supports .zip, .tar.gz, .7z, .rar files up to 100MB
              </p>
              <div className="flex items-center justify-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".zip,.tar.gz,.tgz,.7z,.rar"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          ) : (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-sm text-green-700">
                      {formatFileSize(uploadedFile.size)} • Ready to upload
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Instructions */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Upload Instructions
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • Compress your smart contract project folder into a .zip,
              .tar.gz, .7z, or .rar file
            </li>
            <li>
              • Ensure your contracts are in common directories like /contracts,
              /src, or /programs
            </li>
            <li>• Supported contract types: Solidity (.sol) and Rust (.rs)</li>
            <li>• Maximum file size: 100MB</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {uploadedFile && (
              <span>File ready for upload and contract extraction</span>
            )}
          </div>
          <div className="flex space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!uploadedFile || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <span>Upload & Extract</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
