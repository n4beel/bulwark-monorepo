'use client';

import {
  ArrowLeft,
  Brain,
  CheckSquare,
  Code2,
  FileText,
  Search,
  Square,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AnalysisActionBar from '@/shared/components/AnalysisActionBar/AnalysisActionBar';
import { githubApi } from '@/services/api';
import { GitHubRepository } from '@/types/api';

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

type AnalysisType = 'ai' | 'static';

interface ContractFileSelectorProps {
  repository: GitHubRepository;
  accessToken: string;
  onBack: () => void;
  onProceed: (selectedFiles: string[], analysisType: AnalysisType) => void;
}

export default function ContractFileSelector({
  repository,
  accessToken,
  onBack,
  onProceed,
}: ContractFileSelectorProps) {
  const [contractFiles, setContractFiles] = useState<ContractFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('ai');

  const recursivelyFindContractFiles = useCallback(
    async (
      owner: string,
      repoName: string,
      accessToken: string,
      path: string = '',
    ): Promise<ContractFile[]> => {
      try {
        const contents = await githubApi.getRepositoryContents(
          owner,
          repoName,
          accessToken,
          path,
        );
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
                  size: item.size,
                  language: getLanguageFromExtension(item.name),
                });
              }
            }
          } else if (item.type === 'dir') {
            // Prioritize common contract directories
            const lowerDirName = item.name.toLowerCase();
            const priorityDirs = [
              'contracts',
              'src',
              'programs',
              'contract',
              'lib',
              'core',
            ];

            if (priorityDirs.includes(lowerDirName)) {
              // Search priority directories first
              const subFiles = await recursivelyFindContractFiles(
                owner,
                repoName,
                accessToken,
                item.path,
              );
              contractFiles.push(...subFiles);
            } else {
              // Search other directories
              const subFiles = await recursivelyFindContractFiles(
                owner,
                repoName,
                accessToken,
                item.path,
              );
              contractFiles.push(...subFiles);
            }
          }
        }

        return contractFiles.sort((a, b) => a.path.localeCompare(b.path));
      } catch (error) {
        console.warn(`Failed to load contents for path ${path}:`, error);
        return [];
      }
    },
    [],
  );

  const loadContractFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get repository contents to find contract files
      const [owner, repoName] = repository.full_name.split('/');
      const allContractFiles = await recursivelyFindContractFiles(
        owner,
        repoName,
        accessToken,
        '',
      );

      setContractFiles(allContractFiles);

      // Auto-select all files by default
      setSelectedFiles(new Set(allContractFiles.map((file) => file.path)));
    } catch (err: unknown) {
      setError('Failed to load contract files. Please try again.');
      console.error('Error loading contract files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, accessToken, recursivelyFindContractFiles]);

  useEffect(() => {
    loadContractFiles();
  }, [loadContractFiles]);

  const getLanguageFromExtension = (filename: string): string => {
    if (filename.endsWith('.sol')) return 'Solidity (EVM)';
    if (filename.endsWith('.rs')) return 'Rust (Solana/Near)';
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
    onProceed(Array.from(selectedFiles), analysisType);
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading contract files...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Select Contract Files
            </h2>
            <p className="text-gray-600 mt-1">
              Choose which contract files to include in the audit analysis
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Repositories
          </button>
        </div>

        {/* Repository Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-semibold text-blue-900">
                {repository.full_name}
              </h3>
              <p className="text-blue-700 text-sm">
                {contractFiles.length} contract files found
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Analysis Type Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Choose Analysis Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setAnalysisType('ai')}
              className={`p-4 border-2 rounded-lg transition-all ${
                analysisType === 'ai'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Brain
                  className={`w-6 h-6 ${
                    analysisType === 'ai' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">AI Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Comprehensive audit estimates with AI insights
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setAnalysisType('static')}
              className={`p-4 border-2 rounded-lg transition-all ${
                analysisType === 'static'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Code2
                  className={`w-6 h-6 ${
                    analysisType === 'static'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">
                    Static Analysis
                  </h4>
                  <p className="text-sm text-gray-600">
                    Code complexity and security metrics
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

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
                className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
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
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? 'No contract files found matching your search.'
                : 'No contract files found in this repository.'}
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
                          {file.language}
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
