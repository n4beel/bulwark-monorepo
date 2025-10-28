"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  CheckSquare,
  Square,
  FileText,
  Filter,
  Database,
  AlertCircle,
  Loader,
} from "lucide-react";
import { StaticAnalysisReport } from "@/types/api";
import {
  staticAnalysisApi,
  FactorsResponse,
  FactorInfo as APIFactorInfo,
} from "@/services/api";

interface ExportModalProps {
  reports: StaticAnalysisReport[];
  onClose: () => void;
}

type FactorInfo = APIFactorInfo;

interface FactorGroup {
  name: string;
  category: string;
  description: string;
  factors: { key: string; info: FactorInfo }[];
  expanded: boolean;
}

export default function ExportModal({ reports, onClose }: ExportModalProps) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(
    new Set()
  );
  const [availableFactors, setAvailableFactors] = useState<string[]>([]);
  const [selectedFactors, setSelectedFactors] = useState<Set<string>>(
    new Set()
  );
  const [factorGroups, setFactorGroups] = useState<FactorGroup[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [factorSearchTerm, setFactorSearchTerm] = useState("");

  // Helper function to get report ID regardless of format
  const getReportId = (report: StaticAnalysisReport): string => {
    // Handle both formats: { $oid: "id" } and "id"
    if (typeof report._id === "string") {
      return report._id;
    }
    // @ts-ignore
    return report._id.$oid;
  };

  useEffect(() => {
    loadAvailableFactors();
  }, [reports]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvailableFactors = async () => {
    try {
      setIsLoadingFactors(true);
      const factorsResponse = await staticAnalysisApi.getAvailableFactors();
      organizeFactorsIntoGroups(factorsResponse);
    } catch (err) {
      setError("Failed to load available factors");
      console.error("Error loading factors:", err);
    } finally {
      setIsLoadingFactors(false);
    }
  };

  const organizeFactorsIntoGroups = (factorsResponse: FactorsResponse) => {
    const organizedGroups: FactorGroup[] = [];
    const allFactors: string[] = [];

    Object.entries(factorsResponse).forEach(([groupKey, groupData]) => {
      const factors = Object.entries(groupData.factors).map(
        ([factorKey, factorInfo]) => {
          allFactors.push(factorKey);
          return {
            key: factorKey,
            info: factorInfo as FactorInfo,
          };
        }
      );

      organizedGroups.push({
        name: groupKey,
        category: groupData.category,
        description: groupData.description,
        factors: factors,
        expanded: groupKey === "basic" || groupKey === "scores", // Expand common groups by default
      });
    });

    setAvailableFactors(allFactors);
    setFactorGroups(organizedGroups);
  };

  const toggleReportSelection = (reportId: string) => {
    // Validate reportId to prevent null/undefined values
    if (!reportId || reportId === "undefined" || reportId === "null") {
      return;
    }

    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const toggleFactorSelection = (factor: string) => {
    const newSelected = new Set(selectedFactors);
    if (newSelected.has(factor)) {
      newSelected.delete(factor);
    } else {
      newSelected.add(factor);
    }
    setSelectedFactors(newSelected);
  };

  const selectAllReports = () => {
    setSelectedReports(new Set(filteredReports.map((r) => getReportId(r))));
  };

  const deselectAllReports = () => {
    setSelectedReports(new Set());
  };

  const selectAllFactors = () => {
    setSelectedFactors(new Set(availableFactors));
  };

  const deselectAllFactors = () => {
    setSelectedFactors(new Set());
  };

  const toggleGroupExpansion = (groupIndex: number) => {
    const newGroups = [...factorGroups];
    newGroups[groupIndex].expanded = !newGroups[groupIndex].expanded;
    setFactorGroups(newGroups);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError("");

    try {
      const reportIds =
        selectedReports.size > 0
          ? Array.from(selectedReports).filter(
              (id) => id != null && id !== undefined
            )
          : undefined;
      const factors =
        selectedFactors.size > 0 ? Array.from(selectedFactors) : undefined;

      // Only pass reportIds if we have valid IDs
      const validReportIds =
        reportIds && reportIds.length > 0 ? reportIds : undefined;

      const { blob, filename } = await staticAnalysisApi.exportReportsCSV(
        validReportIds,
        factors
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Export failed. Please try again."
      );
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.framework.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFactorGroups = factorGroups
    .map((group) => ({
      ...group,
      factors: group.factors.filter(
        (factor) =>
          factor.key.toLowerCase().includes(factorSearchTerm.toLowerCase()) ||
          factor.info.name
            .toLowerCase()
            .includes(factorSearchTerm.toLowerCase()) ||
          factor.info.description
            .toLowerCase()
            .includes(factorSearchTerm.toLowerCase())
      ),
    }))
    .filter((group) => group.factors.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Download className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Export Analysis Reports
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select reports and data fields to include in your CSV export
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <div className="flex h-[calc(90vh-200px)]">
            {/* Reports Selection */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Select Reports ({selectedReports.size}/{reports.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllReports}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select Visible
                    </button>
                    <button
                      onClick={deselectAllReports}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredReports.map((report) => {
                    const reportId = getReportId(report);
                    return (
                      <div
                        key={reportId}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReportSelection(reportId);
                        }}
                        className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="mr-3">
                          {selectedReports.has(reportId) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {report.repository}
                          </div>
                          <div className="text-sm text-gray-600">
                            {report.language} • {report.framework} •
                            {new Date(report.createdAt)?.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedReports.size === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No reports selected</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Leave empty to export all reports
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Factors Selection */}
            <div className="w-1/2 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Select Data Fields ({selectedFactors.size}/
                    {availableFactors.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllFactors}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllFactors}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search data fields..."
                  value={factorSearchTerm}
                  onChange={(e) => setFactorSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingFactors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">
                      Loading data fields...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFactorGroups.map((group, groupIndex) => (
                      <div
                        key={group.name}
                        className="border border-gray-200 rounded-md"
                      >
                        <button
                          onClick={() => toggleGroupExpansion(groupIndex)}
                          className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-200 flex items-center justify-between"
                        >
                          <div className="text-left">
                            <div className="font-medium">{group.category}</div>
                            <div className="text-xs text-gray-500 font-normal">
                              {group.description}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {
                              group.factors.filter((f) =>
                                selectedFactors.has(f.key)
                              ).length
                            }
                            /{group.factors.length}
                          </span>
                        </button>
                        {group.expanded && (
                          <div className="p-2 space-y-1">
                            {group.factors.map((factor) => (
                              <div
                                key={factor.key}
                                onClick={() =>
                                  toggleFactorSelection(factor.key)
                                }
                                className="flex items-start p-2 hover:bg-gray-50 cursor-pointer rounded"
                              >
                                <div className="mr-3 mt-0.5">
                                  {selectedFactors.has(factor.key) ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {factor.info.name}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono mt-1">
                                    {factor.key}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {factor.info.description}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 ml-2 shrink-0">
                                  {factor.info.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedFactors.size === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No data fields selected</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Leave empty to export all available fields
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedReports.size === 0
                ? `Exporting all ${reports.length} reports`
                : `Exporting ${selectedReports.size} of ${reports.length} reports`}
              {selectedFactors.size > 0 && (
                <span> with {selectedFactors.size} data fields</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
