"use client";

import { useState } from "react";
import {
  Code2,
  BarChart3,
  Cpu,
  Brain,
  CheckCircle,
  XCircle,
  Layers,
  Shield,
  DollarSign,
  Database,
} from "lucide-react";
import { StaticAnalysisReport } from "@/types/api";
import Image from "next/image";
import ComplexityCard from "./ComplexityCard";
import HotspotsCard from "./HotspotCards";
import AuditEffortCard from "./AuditEffortCard";
import ScoreCards from "./ScoreCards";
import { getScoreColor } from "@/utils";
import AIAnalysisTab from "./AiAnalysis";
import UpgradeForensicModal from "./UpgradeForensicModal";

interface StaticAnalysisReportDisplayProps {
  report: StaticAnalysisReport;
  onBack: () => void;
  onNewAnalysis: () => void;
}

export default function StaticAnalysisReportDisplay({
  report,
  onBack,
  onNewAnalysis,
}: StaticAnalysisReportDisplayProps) {
  console.log({ report });
  const [activeTab, setActiveTab] = useState<
    "scores" | "vulnerability" | "rust" | "ai"
  >("scores");

  // Utility functions for Rust analysis
  const formatRustAnalysisKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatRustAnalysisValue = (value: unknown): string => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "0 (empty)";
      // For arrays with primitive values, show count and sample
      if (
        value.every(
          (item) => typeof item === "string" || typeof item === "number"
        )
      ) {
        const sample = value.slice(0, 2).join(", ");
        return value.length > 2
          ? `${value.length} items (${sample}...)`
          : `${value.length} items (${sample})`;
      }
      // For arrays with objects, just show count
      return `${value.length} items`;
    }
    if (typeof value === "object" && value !== null) {
      // Handle nested objects by showing key count
      const keys = Object.keys(value);
      if (keys.length === 0) return "Empty object";
      return `Object with ${keys.length} properties`;
    }
    return String(value);
  };

  const getSectionTitle = (sectionKey: string): string => {
    const titleMap: { [key: string]: string } = {
      accessControl: "Access Control",
      complexity: "Complexity Analysis",
      dependencies: "Dependencies Analysis",
      modularity: "Modularity Analysis",
      pdaSeeds: "PDA Seeds Analysis",
      security: "Security Analysis",
      performance: "Performance Metrics",
      patterns: "Code Patterns",
      validation: "Input Validation",
      errorHandling: "Error Handling",
      testing: "Testing Coverage",
      // AI Analysis sections
      documentationClarity: "Documentation Clarity",
      testingCoverage: "Testing Coverage",
      financialLogicIntricacy: "Financial Logic Intricacy",
      profitAttackVectors: "Profit Attack Vectors",
      valueAtRisk: "Value at Risk",
      gameTheoryIncentives: "Game Theory Incentives",
    };
    return titleMap[sectionKey] || formatRustAnalysisKey(sectionKey);
  };

  const getSectionDescription = (sectionKey: string): string => {
    const descriptionMap: { [key: string]: string } = {
      accessControl: "Security and authorization patterns",
      complexity: "Code complexity and maintainability metrics",
      dependencies: "External dependencies and risk assessment",
      modularity: "Code organization and module structure",
      pdaSeeds: "Program Derived Address (PDA) seed analysis",
      security: "Security vulnerabilities and best practices",
      performance: "Performance and optimization metrics",
      patterns: "Common code patterns and anti-patterns",
      validation: "Input validation and sanitization",
      errorHandling: "Error handling and recovery patterns",
      testing: "Test coverage and quality metrics",
      // AI Analysis descriptions
      documentationClarity: "Code documentation quality and clarity assessment",
      testingCoverage: "Test coverage analysis and quality evaluation",
      financialLogicIntricacy:
        "Financial logic complexity and mathematical operations",
      profitAttackVectors:
        "Economic attack vectors and profit extraction risks",
      valueAtRisk: "Asset value exposure and liquidity risk assessment",
      gameTheoryIncentives:
        "Economic incentive alignment and game theory analysis",
    };
    return (
      descriptionMap[sectionKey] ||
      `Analysis of ${formatRustAnalysisKey(sectionKey).toLowerCase()}`
    );
  };

  const getSectionColor = (sectionKey: string): string => {
    const colorMap: { [key: string]: string } = {
      accessControl: "green",
      complexity: "blue",
      dependencies: "yellow",
      modularity: "purple",
      pdaSeeds: "indigo",
      security: "red",
      performance: "orange",
      patterns: "pink",
      validation: "teal",
      errorHandling: "cyan",
      testing: "lime",
      // AI Analysis colors
      documentationClarity: "blue",
      testingCoverage: "green",
      financialLogicIntricacy: "purple",
      profitAttackVectors: "red",
      valueAtRisk: "orange",
      gameTheoryIncentives: "indigo",
    };
    return colorMap[sectionKey] || "gray";
  };

  const renderArrayValue = (value: unknown[], key: string, color: string) => {
    if (value.length === 0) return null;

    // Check if array contains objects
    const hasObjects = value.some(
      (item) => typeof item === "object" && item !== null
    );

    if (hasObjects) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {formatRustAnalysisKey(key)} ({value.length} items)
          </h4>
          <div className="space-y-2">
            {value.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}
              >
                {typeof item === "object" && item !== null ? (
                  <div className="space-y-1">
                    {Object.entries(item)
                      .slice(0, 3)
                      .map(([objKey, objValue]) => (
                        <div
                          key={objKey}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium text-gray-700">
                            {formatRustAnalysisKey(objKey)}:
                          </span>
                          <span className="text-gray-900">
                            {formatRustAnalysisValue(objValue)}
                          </span>
                        </div>
                      ))}
                    {Object.keys(item).length > 3 && (
                      <div className="text-xs text-gray-500">
                        ...and {Object.keys(item).length - 3} more properties
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-900">{String(item)}</span>
                )}
              </div>
            ))}
            {value.length > 5 && (
              <div className={`text-center py-2 text-sm text-${color}-600`}>
                ...and {value.length - 5} more items
              </div>
            )}
          </div>
        </div>
      );
    }

    // For primitive arrays, use the original tag display
    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          {formatRustAnalysisKey(key)}
        </h4>
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm font-medium`}
            >
              {typeof item === "string"
                ? item
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : String(item)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderScoreCards = (
    sectionData: Record<string, unknown>,
    color: string
  ) => {
    const scoreKeys = [
      "score",
      "riskScore",
      "securityScore",
      "modularityScore",
      "dependencyRiskScore",
      "dependencySecurityScore",
    ];
    const scoreEntries = Object.entries(sectionData).filter(([key]) =>
      scoreKeys.some((scoreKey) =>
        key.toLowerCase().includes(scoreKey.toLowerCase())
      )
    );

    if (scoreEntries.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scoreEntries.map(([key, value]) => (
          <div
            key={key}
            className={`text-center p-4 bg-${color}-50 rounded-lg`}
          >
            <div className={`text-2xl font-bold text-${color}-600`}>
              {typeof value === "number"
                ? key.toLowerCase().includes("risk") && value < 1
                  ? `${(value * 100)?.toFixed(1)}%`
                  : value.toFixed(1)
                : String(value)}
            </div>
            <div className="text-sm text-gray-600">
              {formatRustAnalysisKey(key)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: "scores", label: "Summary", icon: BarChart3, disabled: false },
    ...(report.rust_analysis
      ? [{ id: "rust", label: "Component Details", icon: Cpu, disabled: false }]
      : []),
    ...(report.ai_analysis
      ? [{ id: "ai", label: "AI Analysis", icon: Brain, disabled: false }]
      : []),
    {
      id: "vulnerability",
      label: "Vulnerability Assessment ",
      icon: Cpu,
      disabled: false,
    },
  ];

  return (
    <div className="w-full  ">
      <div className="bg-white rounded-lg shadow-lg ">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex flex-row items-center gap-3">
          <div className="flex ">
            <button
              onClick={onBack}
              className="px-4 py-1 h-10 cursor-pointer text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 doto">
                {report.repository}
              </h1>
              <p className="text-gray-600 mt-1">
                Static Analysis Report • {report.language.toUpperCase()} •{" "}
                {report.framework}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Generated
                {/* {new Date(report.createdAt.$date).toLocaleString()} */}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;

              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    !isDisabled &&
                    setActiveTab(
                      tab.id as "scores" | "vulnerability" | "rust" | "ai"
                    )
                  }
                  disabled={isDisabled}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center cursor-pointer space-x-2 transition-all ${
                    isDisabled
                      ? "opacity-50 border-blue-500 text-blue-600 cursor-not-allowed"
                      : isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-row gap-6">
          {/* Content */}
          <div className="p-6 pr-0 w-[80%]">
            {activeTab === "scores" && (
              <div className="space-y-6">
                <div className="flex flex-row items-start gap-4 w-full">
                  {/* 20% width */}
                  <div className="w-[20%] h-[150px]">
                    <ComplexityCard
                      complexityScore={Number(report?.scores?.total) || 0}
                    />
                  </div>

                  {/* 45% width */}
                  <div className="w-[40%]  h-[150px]">
                    <HotspotsCard
                      findings={{
                        totalFindings:
                          report?.result?.hotspots?.totalCount || 0,
                        severityCounts: {
                          high: report?.result?.hotspots?.highRiskCount || 0,
                          medium:
                            report?.result?.hotspots?.mediumRiskCount || 0,
                          low: report?.result?.hotspots?.lowPriorityCount || 0,
                        },
                      }}
                    />
                  </div>

                  {/* 35% width */}
                  <div className="w-[40%] h-[150px]">
                    <AuditEffortCard
                      estimate={{
                        days: [
                          report?.result?.auditEffort?.timeRange?.minimumDays ??
                            0,
                          report?.result?.auditEffort?.timeRange?.maximumDays ??
                            0,
                        ],
                        devs: [
                          report?.result?.auditEffort?.resourceRange
                            ?.minimumCount ?? 0,
                          report?.result?.auditEffort?.resourceRange
                            ?.maximumCount ?? 0,
                        ],
                        cost: report?.result?.auditEffort?.totalCost ?? 0,
                        variance: 20, // or calculate dynamically if you have that info
                      }}
                    />
                  </div>
                </div>

                {/* Detailed Score Cards */}
                {/* Detailed Score Cards */}
                <ScoreCards report={report} getScoreColor={getScoreColor} />
              </div>
            )}

            {activeTab === "vulnerability" && report?.ai_analysis && (
              <div className="relative min-h-[600px]">
                {/* LOCKED CONTENT (no selection + no click) */}
                <div className="locked-tab opacity-60 pointer-events-none select-none user-select-none">
                  <AIAnalysisTab ai={report.ai_analysis} />
                </div>

                {/* Glass Overlay */}
                <div className="absolute inset-0 rounded-xl border border-[var(--blue-primary)]/60 bg-[rgba(127,175,200,0.05)] backdrop-blur-[6px] pointer-events-none" />

                {/* Upgrade Overlay Image */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src="/icons/Forensic.svg"
                    alt="Upgrade Overlay"
                    width={480}
                    height={480}
                    className="opacity-90"
                  />
                </div>
              </div>
            )}

            {activeTab === "ai" && report?.ai_analysis && (
              <AIAnalysisTab ai={report.ai_analysis} />
            )}

            {activeTab === "rust" &&
              report.rust_analysis &&
              (() => {
                const rustAnalysis = report.rust_analysis;
                return (
                  <div className="space-y-6">
                    {/* Rust Analysis Header */}

                    {/* Error Display */}
                    {!rustAnalysis.success && rustAnalysis.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center mb-2">
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <h4 className="text-lg font-semibold text-red-900">
                            Analysis Error
                          </h4>
                        </div>
                        <p className="text-red-700">{rustAnalysis.error}</p>
                      </div>
                    )}

                    {/* Rust Analysis Factors - Dynamic Sections */}
                    {rustAnalysis.success && rustAnalysis.analysisFactors && (
                      <div className="space-y-6">
                        {/* Core Metrics - Always show first */}
                        <div className="bg-white rounded-lg border border-gray-200">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Core Metrics
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Basic code metrics and statistics
                            </p>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-700">
                                  Total Lines of Code
                                </span>
                                <span
                                  className={`text-sm font-semibold text-gray-900 p-1 ${getScoreColor(
                                    (rustAnalysis.analysisFactors
                                      .totalLinesOfCodeScore as number) || 0
                                  )}`}
                                >
                                  {rustAnalysis.analysisFactors.totalLinesOfCode.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-700">
                                  Number of Functions
                                </span>
                                <span
                                  className={`text-sm font-semibold text-gray-900  p-1 ${getScoreColor(
                                    (rustAnalysis.analysisFactors
                                      .numFunctionsScore as number) || 0
                                  )}`}
                                >
                                  {rustAnalysis.analysisFactors.numFunctions}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Sections - Render all nested objects */}
                        {Object.entries(rustAnalysis.analysisFactors).map(
                          ([sectionKey, sectionData]) => {
                            // Skip core metrics (already rendered above) and non-object values
                            if (
                              sectionKey === "totalLinesOfCode" ||
                              sectionKey === "numFunctions" ||
                              typeof sectionData !== "object" ||
                              sectionData === null
                            ) {
                              return null;
                            }

                            const color = getSectionColor(sectionKey);
                            const title = getSectionTitle(sectionKey);
                            const description =
                              getSectionDescription(sectionKey);

                            return (
                              <div
                                key={sectionKey}
                                className="bg-white rounded-lg border border-gray-200"
                              >
                                <div className="px-6 py-4 border-b border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {description}
                                  </p>
                                </div>
                                <div className="p-6">
                                  {/* Render score cards if any score-like properties exist */}
                                  {typeof sectionData === "object" &&
                                  sectionData !== null &&
                                  !Array.isArray(sectionData)
                                    ? renderScoreCards(
                                        sectionData as Record<string, unknown>,
                                        color
                                      )
                                    : null}

                                  {/* Render regular properties */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {typeof sectionData === "object" &&
                                    sectionData !== null &&
                                    !Array.isArray(sectionData)
                                      ? Object.entries(
                                          sectionData as Record<string, unknown>
                                        ).map(([key, value]) => {
                                          // Skip arrays and score properties (handled separately)
                                          if (
                                            Array.isArray(value) ||
                                            key.toLowerCase().includes("score")
                                          ) {
                                            return null;
                                          }

                                          // Handle nested objects
                                          if (
                                            typeof value === "object" &&
                                            value !== null
                                          ) {
                                            return (
                                              <div
                                                key={key}
                                                className="col-span-full"
                                              >
                                                <div className="py-2 border-b border-gray-100">
                                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                    {formatRustAnalysisKey(key)}
                                                  </h4>
                                                  <div
                                                    className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}
                                                  >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                                      {Object.entries(
                                                        value
                                                      ).map(
                                                        ([
                                                          nestedKey,
                                                          nestedValue,
                                                        ]) => (
                                                          <div
                                                            key={nestedKey}
                                                            className="flex justify-between text-sm"
                                                          >
                                                            <span className="font-medium text-gray-700">
                                                              {formatRustAnalysisKey(
                                                                nestedKey
                                                              )}
                                                              :
                                                            </span>
                                                            <span className="text-gray-900">
                                                              {formatRustAnalysisValue(
                                                                nestedValue
                                                              )}
                                                            </span>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div
                                              key={key}
                                              className="flex justify-between py-2 border-b border-gray-100"
                                            >
                                              <span className="text-sm font-medium text-gray-700">
                                                {formatRustAnalysisKey(key)}
                                              </span>
                                              <span className="text-sm font-semibold text-gray-900">
                                                {formatRustAnalysisValue(value)}
                                              </span>
                                            </div>
                                          );
                                        })
                                      : null}
                                  </div>

                                  {/* Render arrays as tag collections */}
                                  {typeof sectionData === "object" &&
                                  sectionData !== null &&
                                  !Array.isArray(sectionData)
                                    ? Object.entries(
                                        sectionData as Record<string, unknown>
                                      ).map(([key, value]) => {
                                        if (Array.isArray(value)) {
                                          return renderArrayValue(
                                            value,
                                            key,
                                            color
                                          );
                                        }
                                        return null;
                                      })
                                    : null}

                                  {/* Special handling for dependency tiers */}
                                  {sectionKey === "dependencies" && (
                                    <div className="mt-6">
                                      <div className="space-y-4">
                                        {[
                                          {
                                            tier: "tier1",
                                            label: "Tier 1 (Core)",
                                            color: "green",
                                          },
                                          {
                                            tier: "tier2",
                                            label: "Tier 2 (Standard)",
                                            color: "blue",
                                          },
                                          {
                                            tier: "tier3",
                                            label: "Tier 3 (Common)",
                                            color: "yellow",
                                          },
                                          {
                                            tier: "tier4",
                                            label: "Tier 4 (External)",
                                            color: "red",
                                          },
                                        ].map(
                                          ({
                                            tier,
                                            label,
                                            color: tierColor,
                                          }) => {
                                            const cratesKey = `${tier}Crates`;
                                            const countKey = `${tier}Dependencies`;
                                            const crates = (
                                              sectionData as Record<
                                                string,
                                                unknown
                                              >
                                            )[cratesKey];
                                            const count = (
                                              sectionData as Record<
                                                string,
                                                unknown
                                              >
                                            )[countKey];

                                            if (
                                              !crates ||
                                              !Array.isArray(crates) ||
                                              crates.length === 0
                                            ) {
                                              return null;
                                            }

                                            return (
                                              <div key={tier}>
                                                <div className="flex items-center justify-between mb-2">
                                                  <h4 className="text-sm font-semibold text-gray-900">
                                                    {label}
                                                  </h4>
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium bg-${tierColor}-100 text-${tierColor}-800`}
                                                  >
                                                    {typeof count === "number"
                                                      ? count
                                                      : 0}{" "}
                                                    dependencies
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {Array.isArray(crates)
                                                    ? crates.map(
                                                        (crate, index) => (
                                                          <span
                                                            key={index}
                                                            className={`bg-${tierColor}-50 text-${tierColor}-700 px-3 py-1 rounded-full text-sm`}
                                                          >
                                                            {typeof crate ===
                                                            "string"
                                                              ? crate
                                                              : String(crate)}
                                                          </span>
                                                        )
                                                      )
                                                    : null}
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}

                        {/* Analysis Comparison Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">
                            Analysis Engine Comparison
                          </h4>
                          <p className="text-sm text-blue-700">
                            This Rust analysis uses semantic AST-based parsing
                            for more accurate results compared to regex-based
                            analysis. The metrics shown here represent the most
                            precise analysis available for Rust/Solana programs.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
          <div className="flex flex-col -mt-6">
            <Image
              src="/icons/AuditorProfile.svg"
              alt="Match Auditor Illustration"
              width={350}
              height={260}
              className="mt-6 mx-auto"
            />

            <button className="mt-8 w-4/5  mx-auto inline-flex items-center justify-center gap-2 px-2 py-3 rounded-lg cursor-pointer text-white bg-[var(--button-secondary)] hover:bg-[var(--button-primary-hover)] transition">
              Get Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
