'use client';

import { CheckSquare, FileText, Search, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnalysisActionBar from '@/shared/components/AnalysisActionBar/AnalysisActionBar';

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

type AnalysisType = 'ai' | 'static';

interface UploadedContractFileSelectorProps {
  contractFiles: ContractFile[];
  onBack: () => void;
  onProceed: (selectedFiles: string[], analysisType: AnalysisType) => void;
}

export default function UploadedContractFileSelector({
  contractFiles,
  onBack,
  onProceed,
}: UploadedContractFileSelectorProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-select all files by default
    setSelectedFiles(new Set(contractFiles.map((file) => file.path)));
  }, [contractFiles]);

  const getLanguageFromExtension = (filename: string): string => {
    if (filename.endsWith('.sol')) return 'Solidity (EVM)';
    if (filename.endsWith('.rs')) return 'Rust';
    return 'Unknown';
  };

  const toggleFile = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    const allPaths = contractFiles.map((file) => file.path);
    setSelectedFiles(new Set(allPaths));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleProceed = () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one contract file to audit.');
      return;
    }

    onProceed(Array.from(selectedFiles), 'static');
  };

  const filteredFiles = contractFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg  p-0 md:p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[20px] font-normal text-[var(--text-primary)]">
              Select Contract Files
            </h2>
            <p className="text-gray-600 mt-1">
              Choose which contract files to include in the audit analysis
            </p>
          </div>
        </div>

        {/* Upload Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="font-semibold text-green-900">
                Upload Successful
              </h3>
              <p className="text-green-700 text-sm">
                {contractFiles.length} contract files found in uploaded archive
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Search and Selection Controls */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contract files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium  cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium  cursor-pointer"
              >
                Deselect All
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {selectedFiles.size} of {contractFiles.length} files selected
            </div>
          </div>
        </div>

        {/* Contract Files List */}
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? 'No contract files found matching your search.'
                : 'No contract files found in uploaded archive.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleFile(file.path)}
                >
                  <div className="flex items-center flex-1">
                    <button
                      className="mr-3 text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFile(file.path);
                      }}
                    >
                      {selectedFiles.has(file.path) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {file.name}
                        </span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {getLanguageFromExtension(file.name)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{file.path}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <AnalysisActionBar
          count={selectedFiles.size}
          onBack={onBack}
          onRun={handleProceed}
        />
      </div>
    </div>
  );
}
