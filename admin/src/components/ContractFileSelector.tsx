'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

interface ContractFileSelectorProps {
  owner: string;
  repo: string;
  accessToken: string;
  onBack: () => void;
  onProceed: (selectedFiles: string[]) => void;
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

export default function ContractFileSelector({
  owner,
  repo,
  accessToken,
  onBack,
  onProceed,
}: ContractFileSelectorProps) {
  const [contractFiles, setContractFiles] = useState<ContractFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getLanguageFromExtension = (filename: string): string => {
    if (filename.endsWith('.rs')) return 'Rust';
    if (filename.endsWith('.sol')) return 'Solidity';
    return 'Unknown';
  };

  const recursivelyFindContractFiles = useCallback(
    async (
      owner: string,
      repoName: string,
      accessToken: string,
      path: string = '',
    ): Promise<ContractFile[]> => {
      try {
        const headers: any = {
          Accept: 'application/vnd.github.v3+json',
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
        const response = await axios.get<GitHubContentItem[]>(url, { headers });
        const contents = response.data;
        const contractFiles: ContractFile[] = [];

        for (const item of contents) {
          if (item.type === 'file') {
            // Check if it's a contract file
            const contractExtensions = ['.sol', '.rs'];
            if (contractExtensions.some((ext) => item.name.endsWith(ext))) {
              // Filter out test files and common non-contract files
              const lowerPath = item.path.toLowerCase();
              const excludePatterns = [
                '/test/',
                '/tests/',
                '/testing/',
                '/example/',
                '/examples/',
                '/docs/',
                '/documentation/',
                '/scripts/',
                '/tools/',
                '/migrations/',
                '/deploy/',
                'test.sol',
                'test.rs',
                'mock',
                'mockup',
                'fake',
              ];

              const shouldExclude = excludePatterns.some((pattern) =>
                lowerPath.includes(pattern),
              );

              if (!shouldExclude) {
                contractFiles.push({
                  path: item.path,
                  name: item.name,
                  size: item.size || 0,
                  language: getLanguageFromExtension(item.name),
                });
              }
            }
          } else if (item.type === 'dir') {
            // Recursively search subdirectories
            const subFiles = await recursivelyFindContractFiles(
              owner,
              repoName,
              accessToken,
              item.path,
            );
            contractFiles.push(...subFiles);
          }
        }

        return contractFiles.sort((a, b) => a.path.localeCompare(b.path));
      } catch (err: any) {
        console.error(`Error fetching contents for ${path}:`, err);
        // Return empty array on error (might be permission issue or file not found)
        return [];
      }
    },
    [],
  );

  const loadContractFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allContractFiles = await recursivelyFindContractFiles(
        owner,
        repo,
        accessToken,
        '',
      );

      if (allContractFiles.length === 0) {
        setError('No contract files found in this repository.');
      } else {
        setContractFiles(allContractFiles);
        // Auto-select all files by default
        setSelectedFiles(new Set(allContractFiles.map((file) => file.path)));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load contract files. Please try again.',
      );
      console.error('Error loading contract files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, accessToken, recursivelyFindContractFiles]);

  useEffect(() => {
    loadContractFiles();
  }, [loadContractFiles]);

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
      setError('Please select at least one contract file to analyze.');
      return;
    }
    onProceed(Array.from(selectedFiles));
  };

  const filteredFiles = contractFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Select Contract Files
              </h1>
              <p className="text-gray-600 mt-1">
                Choose which files to analyze from {owner}/{repo}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contract files...</p>
          </div>
        )}

        {/* File List */}
        {!isLoading && contractFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {contractFiles.length} contract files found
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files match your search.
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedFiles.has(file.path)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleFile(file.path)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.path)}
                      onChange={() => toggleFile(file.path)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {file.name}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {file.language}
                        </span>
                        {file.size > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {file.path}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selection Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {selectedFiles.size} of {contractFiles.length} files selected
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && contractFiles.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={selectedFiles.size === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Analyze {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

