'use client';

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import AnalysisActionBar from '../AnalysisActionBar/AnalysisActionBar';

interface Props {
  contractFiles: any[];
  onExecute: (files: string[]) => void;
  onBack: () => void;
}

type FileItem = {
  path: string;
  name?: string;
  size?: number;
  language?: string;
  [key: string]: any;
};

type TreeNode = {
  __files?: FileItem[];
  [key: string]: TreeNode | FileItem[] | undefined;
};

const buildTree = (files: any[]): any[] => {
  const tree: any = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = tree;

    parts.forEach((part: string, index: number) => {
      if (index === parts.length - 1) {
        if (!(current as TreeNode).__files) (current as TreeNode).__files = [];
        (current as TreeNode).__files!.push(file as FileItem);
      } else {
        if (!(current as Record<string, any>)[part]) {
          (current as Record<string, any>)[part] = {};
        }
        current = (current as Record<string, any>)[part] as TreeNode;
      }
    });
  });

  const convertToArray = (obj: any, parentPath: string = ''): any[] => {
    const result: any[] = [];

    Object.keys(obj).forEach((key) => {
      if (key === '__files') {
        result.push(...obj[key]);
      } else {
        const path = parentPath ? `${parentPath}/${key}` : key;
        const contents = convertToArray(obj[key], path);

        result.push({
          name: key,
          path: path,
          type: 'dir',
          size: 0,
          contents: contents,
        });
      }
    });

    return result;
  };

  return convertToArray(tree);
};

const isNested = (items: any[]): boolean => {
  return items.some((item) => item.type === 'dir' && item.contents);
};

const flattenFiles = (items: any[]): any[] => {
  const files: any[] = [];
  const traverse = (items: any[]) => {
    items.forEach((item) => {
      if (item.type === 'file' || !item.type) {
        files.push(item);
      } else if (item.type === 'dir' && item.contents) {
        traverse(item.contents);
      }
    });
  };
  traverse(items);
  return files;
};

const getFilesInDir = (dir: any): string[] => {
  const files: string[] = [];
  const traverse = (items: any[]) => {
    items.forEach((item) => {
      if (item.type === 'file' || !item.type) {
        files.push(item.path);
      } else if (item.type === 'dir' && item.contents) {
        traverse(item.contents);
      }
    });
  };
  if (dir.contents) traverse(dir.contents);
  return files;
};

export default function StepFileSelect({
  contractFiles,
  onExecute,
  onBack,
}: Props) {
  const treeData = useMemo(() => {
    if (!contractFiles || contractFiles.length === 0) return [];
    return isNested(contractFiles) ? contractFiles : buildTree(contractFiles);
  }, [contractFiles]);

  const allFiles = useMemo(() => {
    if (!contractFiles || contractFiles.length === 0) return [];
    return isNested(contractFiles)
      ? flattenFiles(contractFiles)
      : contractFiles;
  }, [contractFiles]);

  const [selected, setSelected] = useState(
    new Set(allFiles.map((f) => f.path)),
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [expanded, setExpanded] = useState(() => {
    const firstLevel = new Set<string>();
    treeData.forEach((item) => {
      if (item.type === 'dir') {
        firstLevel.add(item.path);
      }
    });
    return firstLevel;
  });

  const toggleFile = (path: string) => {
    const s = new Set(selected);
    s.has(path) ? s.delete(path) : s.add(path);
    setSelected(s);
  };

  const toggleFolder = (dir: any) => {
    const filesInDir = getFilesInDir(dir);
    const s = new Set(selected);
    const allSelected = filesInDir.every((f) => s.has(f));

    filesInDir.forEach((f) => {
      allSelected ? s.delete(f) : s.add(f);
    });
    setSelected(s);
  };

  const getFolderState = (dir: any): 'none' | 'partial' | 'full' => {
    const filesInDir = getFilesInDir(dir);
    if (filesInDir.length === 0) return 'none';
    const selectedCount = filesInDir.filter((f) => selected.has(f)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === filesInDir.length) return 'full';
    return 'partial';
  };

  const selectAll = () => {
    setSelected(new Set(allFiles.map((f) => f.path)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const matchesSearch = (item: any, query: string): boolean => {
    const q = query.toLowerCase();
    if (item.name.toLowerCase().includes(q)) return true;
    if (item.type === 'dir' && item.contents) {
      return item.contents.some((child: any) => matchesSearch(child, query));
    }
    return false;
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return treeData;

    const filterItems = (items: any[]): any[] => {
      return items
        .map((item) => {
          if (item.type === 'dir' && item.contents) {
            const filteredContents = filterItems(item.contents);
            if (
              filteredContents.length > 0 ||
              item.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              return { ...item, contents: filteredContents };
            }
            return null;
          }
          if (matchesSearch(item, searchQuery)) {
            return item;
          }
          return null;
        })
        .filter(Boolean) as any[];
    };

    return filterItems(treeData);
  }, [treeData, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const allSelected = selected.size === allFiles.length;

  const renderTree = (items: any[], depth = 0) => {
    return items.map((item, index) => {
      if (item.type === 'dir') {
        const isExpanded = expanded.has(item.path);
        const folderState = getFolderState(item);
        const filesInDir = getFilesInDir(item);

        return (
          <div key={item.path}>
            <div
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-[var(--border-color)]"
              style={{ paddingLeft: `${depth * 20 + 16}px` }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Expand/Collapse */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const newExpanded = new Set(expanded);
                    if (newExpanded.has(item.path)) {
                      newExpanded.delete(item.path);
                    } else {
                      newExpanded.add(item.path);
                    }
                    setExpanded(newExpanded);
                  }}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                </div>

                {/* Checkbox */}
                <div
                  onClick={() => toggleFolder(item)}
                  className={`w-5 h-5 flex-shrink-0 rounded border-[2px] flex items-center justify-center cursor-pointer transition-colors border-[var(--blue-primary)]
                    ${folderState === 'partial' ? 'bg-blue-100' : ''}
                  `}
                >
                  {folderState === 'full' && (
                    <svg
                      className="w-3 h-3 text-[var(--blue-primary)]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                  {folderState === 'partial' && (
                    <div className="w-2 h-2 bg-[var(--blue-primary)] rounded-sm"></div>
                  )}
                </div>

                {/* Folder Icon */}
                <Folder className="w-5 h-5 flex-shrink-0 text-[var(--blue-primary)]" />

                {/* Folder Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {filesInDir.length} files
                  </p>
                </div>
              </div>
            </div>

            {isExpanded && item.contents && (
              <div>{renderTree(item.contents, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        // File
        return (
          <div
            key={item.path}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-[var(--border-color)]"
            style={{ paddingLeft: `${depth * 20 + 56}px` }}
            onClick={() => toggleFile(item.path)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Checkbox */}
              <div className="w-5 h-5 flex-shrink-0 rounded border-[2px] flex items-center justify-center cursor-pointer transition-colors border-[var(--blue-primary)]">
                {selected.has(item.path) && (
                  <svg
                    className="w-3 h-3 text-[var(--blue-primary)]"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>

              {/* File Icon */}
              <FileText className="w-5 h-5 flex-shrink-0 text-[var(--blue-primary)]" />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                    {item.name}
                  </p>
                  {item.language && (
                    <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
                      {item.language.includes('Rust') ? 'Rust' : item.language}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {item.path}
                </p>
              </div>
            </div>

            {/* File Size */}
            <span className="text-xs text-[var(--text-secondary)] ml-4 flex-shrink-0">
              {formatFileSize(item.size || 0)}
            </span>
          </div>
        );
      }
    });
  };

  return (
    <div className="flex flex-col justify-between h-full px-0 py-2 overflow-y- md:overflow-hidden sm:px-6 max-[420px]:px-0">
      <div className="">
        {/* Success Message */}
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
            ✓
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Upload Successful
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {allFiles.length} contract files found in uploaded archive
            </p>
          </div>
        </div>

        <h2 className="text-[20px] font-normal text-[var(--text-primary)] mb-2">
          Select Files to Include in the scan
        </h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search contract files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary text-sm"
          />
        </div>

        {/* Select All / Deselect All */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4 text-sm">
            <button
              onClick={selectAll}
              className={`hover:underline cursor-pointer ${
                allSelected
                  ? 'text-[var(--blue-primary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className={`hover:underline cursor-pointer ${
                !allSelected
                  ? 'text-[var(--blue-primary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              Deselect All
            </button>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            {selected.size} of {allFiles.length} files selected
          </span>
        </div>

        {/* File Tree */}
        <div className="border border-[var(--border-color)] rounded-xl overflow-hidden max-h-[180px] md:max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[var(--blue-primary)] [&::-webkit-scrollbar-thumb]:rounded-full">
          {renderTree(filteredItems)}
        </div>

        {/* Info Message */}
        <div className="mt-4 flex items-start gap-2">
          <Image
            src="/icons/InfoIcon.svg"
            alt="info"
            width={16}
            height={16}
            className="w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <p className="text-xs text-[var(--text-secondary)]">
            The files above are only the .rs files found in the archive
            uploaded. Any other files/documentation/test etc. will be utilized
            for security heuristics identification.
          </p>
        </div>
      </div>

      {/* Footer */}
      <AnalysisActionBar
        count={selected.size}
        onBack={onBack}
        onRun={() => onExecute(Array.from(selected))}
        backLabel="Back"
        runLabel="Run Static Analysis →"
      />
    </div>
  );
}
