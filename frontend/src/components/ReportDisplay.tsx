'use client';

import {
  AlertTriangle,
  Brain,
  Clock,
  Code,
  DollarSign,
  FileText,
  GitBranch,
  Lightbulb,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { PreAuditReport } from '@/types/api';

interface ReportDisplayProps {
  report: PreAuditReport;
  onBack: () => void;
  onNewAnalysis: () => void;
}

export default function ReportDisplay({
  report,
  onBack,
  onNewAnalysis,
}: ReportDisplayProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analysis' | 'ai-insights'
  >('overview');

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'hardhat':
        return '🔧';
      case 'truffle':
        return '🦄';
      case 'foundry':
        return '⚒️';
      case 'anchor':
        return '⚓';
      case 'solana':
        return '☀️';
      default:
        return '📁';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'analysis', label: 'Technical Analysis', icon: Code },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {report.projectName}
              </h1>
              <p className="text-gray-600 mt-1">
                Pre-Audit Report • Generated{' '}
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={onNewAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                New Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as 'overview' | 'analysis' | 'ai-insights',
                    )
                  }
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Repository Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <GitBranch className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold text-blue-900">
                    Repository Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Full Name
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {report.repositoryInfo.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Language
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {report.repositoryInfo.language}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Size</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {report.repositoryInfo.size} KB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Visibility
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {report.repositoryInfo.private ? 'Private' : 'Public'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">
                      Duration
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {report.auditEstimate.duration.min}-
                    {report.auditEstimate.duration.max}
                  </p>
                  <p className="text-blue-700">working days</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Cost Estimate
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${report.auditEstimate.cost.min.toLocaleString()}-$
                    {report.auditEstimate.cost.max.toLocaleString()}
                  </p>
                  <p className="text-green-700">USD</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Users className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900">
                      Resources
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-purple-700">
                      {report.auditEstimate.resources.seniorAuditors} Senior
                      Auditor
                      {report.auditEstimate.resources.seniorAuditors !== 1
                        ? 's'
                        : ''}
                    </p>
                    <p className="text-purple-700">
                      {report.auditEstimate.resources.juniorAuditors} Junior
                      Auditor
                      {report.auditEstimate.resources.juniorAuditors !== 1
                        ? 's'
                        : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.analysis.totalLines.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Lines of Code</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.analysis.solidityFiles}
                  </div>
                  <div className="text-sm text-gray-600">Contract Files</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.analysis.dependencies.length}
                  </div>
                  <div className="text-sm text-gray-600">Dependencies</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.analysis.testFiles}
                  </div>
                  <div className="text-sm text-gray-600">Test Files</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Technical Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Framework:
                      </span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {getFrameworkIcon(report.analysis.framework)}{' '}
                        {report.analysis.framework}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Complexity:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(report.analysis.complexity)}`}
                      >
                        {report.analysis.complexity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Total Lines:
                      </span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {report.analysis.totalLines.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Contract Files:
                      </span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {report.analysis.solidityFiles}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Test Files:
                      </span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {report.analysis.testFiles}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Contract Files
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {report.analysis.contractFiles.length > 0 ? (
                      report.analysis.contractFiles.map((file, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <FileText className="w-4 h-4 text-gray-600 mr-2" />
                          <code className="bg-gray-100 border border-gray-300 px-3 py-2 rounded text-sm font-medium text-gray-900">
                            {file}
                          </code>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No contract files found
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dependencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.dependencies.map((dep, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              {/* AI Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">
                      Duration Reasoning
                    </h3>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {report.auditEstimate.duration.reasoning}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Cost Reasoning
                    </h3>
                  </div>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {report.auditEstimate.cost.reasoning}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Users className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900">
                      Resource Reasoning
                    </h3>
                  </div>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {report.auditEstimate.resources.reasoning}
                  </p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-xl font-bold text-red-900">
                    Key Risk Factors
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.auditEstimate.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-red-800">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Considerations */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-600 mr-3" />
                  <h3 className="text-xl font-bold text-yellow-900">
                    Special Considerations
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.auditEstimate.specialConsiderations.map(
                    (consideration, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-yellow-800">{consideration}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
