'use client';

import { useState } from 'react';
import {
    Code2,
    GitBranch,
    TrendingUp,
    Shield,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Database,
    Zap,
    Target,
    Layers,
    BarChart3
} from 'lucide-react';
import { StaticAnalysisReport } from '@/types/api';

interface StaticAnalysisReportDisplayProps {
    report: StaticAnalysisReport;
    onBack: () => void;
    onNewAnalysis: () => void;
}

export default function StaticAnalysisReportDisplay({ report, onBack, onNewAnalysis }: StaticAnalysisReportDisplayProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'factors' | 'risks' | 'anchor'>('scores');

    const getScoreColor = (score: number) => {
        if (score <= 20) return 'text-green-600 bg-green-100';
        if (score <= 40) return 'text-yellow-600 bg-yellow-100';
        if (score <= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
        switch (riskLevel) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const tabs = [
        { id: 'scores', label: 'Scores', icon: BarChart3 },
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'factors', label: 'Analysis Factors', icon: Code2 },
        { id: 'risks', label: 'Risk Assessment', icon: AlertTriangle },
        { id: 'anchor', label: 'Anchor Features', icon: Layers },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{report.repository}</h1>
                            <p className="text-gray-600 mt-1">
                                Static Analysis Report • {report.language.toUpperCase()} • {report.framework}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Generated {new Date(report.createdAt.$date).toLocaleString()}
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
                                    onClick={() => setActiveTab(tab.id as 'overview' | 'scores' | 'factors' | 'risks' | 'anchor')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
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
                                    <h3 className="text-xl font-bold text-blue-900">Repository Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Repository</p>
                                        <p className="font-semibold text-gray-900 text-lg">{report.repository}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Language</p>
                                        <p className="font-semibold text-gray-900 text-lg">{report.language.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Framework</p>
                                        <p className="font-semibold text-gray-900 text-lg">{report.framework}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">{report.analysisFactors.totalLinesOfCode.toLocaleString()}</div>
                                    <div className="text-sm text-gray-600">Lines of Code</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">{report.analysisFactors.numPrograms}</div>
                                    <div className="text-sm text-gray-600">Programs</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">{report.analysisFactors.numFunctions}</div>
                                    <div className="text-sm text-gray-600">Functions</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">{report.analysisFactors.avgCyclomaticComplexity.toFixed(2)}</div>
                                    <div className="text-sm text-gray-600">Avg Complexity</div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Zap className="w-6 h-6 text-green-600 mr-3" />
                                    <h3 className="text-xl font-bold text-green-900">Performance</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Analysis Time</p>
                                        <p className="font-semibold text-gray-900 text-lg">{(report.performance.analysisTime / 1000).toFixed(2)}s</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Memory Usage</p>
                                        <p className="font-semibold text-gray-900 text-lg">{(report.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'scores' && (
                        <div className="space-y-6">
                            {/* Overall Score Summary */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                                        <h3 className="text-2xl font-bold text-gray-900">Analysis Scores</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Overall Assessment</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {((report.scores.structural.score + report.scores.security.score + report.scores.systemic.score + report.scores.economic.score) / 4).toFixed(1)}/100
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${getScoreColor(report.scores.structural.score).split(' ')[0]}`}>
                                            {report.scores.structural.score.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600">Structural</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${getScoreColor(report.scores.security.score).split(' ')[0]}`}>
                                            {report.scores.security.score.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600">Security</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${getScoreColor(report.scores.systemic.score).split(' ')[0]}`}>
                                            {report.scores.systemic.score.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600">Systemic</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${getScoreColor(report.scores.economic.score).split(' ')[0]}`}>
                                            {report.scores.economic.score.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600">Economic</div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Legend */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Interpretation</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                                        <span className="text-green-600 font-medium">0-20: Excellent</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                                        <span className="text-yellow-600 font-medium">21-40: Good</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                                        <span className="text-orange-600 font-medium">41-60: Fair</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
                                        <span className="text-red-600 font-medium">61-100: Poor</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Lower scores indicate better code quality, security, and reduced risk factors.
                                </p>
                            </div>

                            {/* Detailed Score Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Structural Score */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Layers className="w-6 h-6 text-blue-600 mr-3" />
                                            <h3 className="text-lg font-semibold text-blue-900">Structural Score</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.structural.score)}`}>
                                            {report.scores.structural.score.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getScoreColor(report.scores.structural.score).split(' ')[1]}`}
                                                style={{ width: `${report.scores.structural.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700 font-medium">Total Lines:</span>
                                            <span className="font-semibold text-blue-900">{report.scores.structural.details.totalLinesOfCode.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700 font-medium">Functions:</span>
                                            <span className="font-semibold text-blue-900">{report.scores.structural.details.numFunctions}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700 font-medium">Avg Complexity:</span>
                                            <span className="font-semibold text-blue-900">{report.scores.structural.details.avgCyclomaticComplexity.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Score */}
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Shield className="w-6 h-6 text-red-600 mr-3" />
                                            <h3 className="text-lg font-semibold text-red-900">Security Score</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.security.score)}`}>
                                            {report.scores.security.score.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getScoreColor(report.scores.security.score).split(' ')[1]}`}
                                                style={{ width: `${report.scores.security.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-red-700 font-medium">Unsafe Code:</span>
                                            <span className="font-semibold text-red-900">{report.scores.security.details.lowLevelOperations.assemblyBlocks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-700 font-medium">Panic Usage:</span>
                                            <span className="font-semibold text-red-900">{report.analysisFactors.panicUsage}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-700 font-medium">Unwrap Usage:</span>
                                            <span className="font-semibold text-red-900">{report.analysisFactors.unwrapUsage}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Systemic Score */}
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Database className="w-6 h-6 text-purple-600 mr-3" />
                                            <h3 className="text-lg font-semibold text-purple-900">Systemic Score</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.systemic.score)}`}>
                                            {report.scores.systemic.score.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getScoreColor(report.scores.systemic.score).split(' ')[1]}`}
                                                style={{ width: `${report.scores.systemic.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-purple-700 font-medium">External Calls:</span>
                                            <span className="font-semibold text-purple-900">{report.scores.systemic.details.externalDependencies.externalContractCalls}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-purple-700 font-medium">Oracle Usage:</span>
                                            <span className="font-semibold text-purple-900">{report.analysisFactors.oracleUsage.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-purple-700 font-medium">Access Control:</span>
                                            <span className="font-semibold text-purple-900">{report.scores.systemic.details.accessControlPattern.type}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Economic Score */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                                            <h3 className="text-lg font-semibold text-green-900">Economic Score</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.economic.score)}`}>
                                            {report.scores.economic.score.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getScoreColor(report.scores.economic.score).split(' ')[1]}`}
                                                style={{ width: `${report.scores.economic.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-700 font-medium">Token Transfers:</span>
                                            <span className="font-semibold text-green-900">{report.analysisFactors.tokenTransfers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700 font-medium">Math Operations:</span>
                                            <span className="font-semibold text-green-900">{report.analysisFactors.complexMathOperations}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700 font-medium">DeFi Patterns:</span>
                                            <span className="font-semibold text-green-900">{report.analysisFactors.defiPatterns.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'factors' && (
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Complete Analysis Factors</h3>
                                <p className="text-sm text-gray-600 mt-1">Comprehensive list of all analyzed factors and metrics</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {/* Structural Complexity */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Total Lines of Code</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.totalLinesOfCode.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Number of Programs</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.numPrograms}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Number of Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.numFunctions}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Number of State Variables</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.numStateVariables}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Average Cyclomatic Complexity</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.avgCyclomaticComplexity.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Maximum Cyclomatic Complexity</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.maxCyclomaticComplexity}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Composition Depth</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.compositionDepth}</span>
                                    </div>

                                    {/* Function Visibility */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Public Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.functionVisibility.public}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Private Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.functionVisibility.private}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Internal Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.functionVisibility.internal || 0}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">View Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.viewFunctions}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Pure Functions</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.pureFunctions}</span>
                                    </div>

                                    {/* Security & Risk Factors */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Integer Overflow Risks</span>
                                        <span className="text-sm font-semibold text-red-600">{report.analysisFactors.integerOverflowRisks}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Access Control Issues</span>
                                        <span className="text-sm font-semibold text-red-600">{report.analysisFactors.accessControlIssues}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Input Validation Issues</span>
                                        <span className="text-sm font-semibold text-red-600">{report.analysisFactors.inputValidationIssues}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Unsafe Code Blocks</span>
                                        <span className="text-sm font-semibold text-red-600">{report.analysisFactors.unsafeCodeBlocks}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Panic Usage</span>
                                        <span className="text-sm font-semibold text-orange-600">{report.analysisFactors.panicUsage}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Unwrap Usage</span>
                                        <span className="text-sm font-semibold text-orange-600">{report.analysisFactors.unwrapUsage}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Expect Usage</span>
                                        <span className="text-sm font-semibold text-orange-600">{report.analysisFactors.expectUsage || 0}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Match Without Default</span>
                                        <span className="text-sm font-semibold text-orange-600">{report.analysisFactors.matchWithoutDefault || 0}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Array Bounds Checks</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.arrayBoundsChecks || 0}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Memory Safety Issues</span>
                                        <span className="text-sm font-semibold text-red-600">{report.analysisFactors.memorySafetyIssues || 0}</span>
                                    </div>

                                    {/* System Integration */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">External Program Calls</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.externalProgramCalls}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Unique External Calls</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.uniqueExternalCalls}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">CPI Usage</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.cpiUsage}</span>
                                    </div>

                                    {/* Economic & Financial */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Token Transfers</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.tokenTransfers}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Complex Math Operations</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.complexMathOperations}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Time Dependent Logic</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.timeDependentLogic}</span>
                                    </div>

                                    {/* Anchor-Specific Features */}
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Account Validation</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.accountValidation}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Constraint Usage</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.constraintUsage}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Instruction Handlers</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.instructionHandlers}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Account Types</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.accountTypes}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Seeds Usage</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.seedsUsage}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Bump Usage</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.bumpUsage}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Signer Checks</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.signerChecks}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Owner Checks</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.ownerChecks}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Space Allocation</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.spaceAllocation}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Rent Exemption</span>
                                        <span className="text-sm font-semibold text-gray-900">{report.analysisFactors.anchorSpecificFeatures.rentExemption}</span>
                                    </div>
                                </div>

                                {/* Complex Data Sections */}
                                <div className="mt-8 space-y-6">
                                    {/* Standard Library Usage */}
                                    {report.analysisFactors.standardLibraryUsage.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Standard Library Usage</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {report.analysisFactors.standardLibraryUsage.map((lib, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                                                    >
                                                        {lib}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Known Protocol Interactions */}
                                    {report.analysisFactors.knownProtocolInteractions.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Known Protocol Interactions</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {report.analysisFactors.knownProtocolInteractions.map((protocol, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                                                    >
                                                        {protocol}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Program Derives */}
                                    {report.analysisFactors.anchorSpecificFeatures.programDerives.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Program Derives</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {report.analysisFactors.anchorSpecificFeatures.programDerives.map((derive, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                                                    >
                                                        {derive}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Oracle Usage */}
                                    {report.analysisFactors.oracleUsage.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Oracle Usage</h4>
                                            <div className="space-y-2">
                                                {report.analysisFactors.oracleUsage.map((oracle, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <span className="font-medium text-gray-900">{oracle.oracle}</span>
                                                            <span className="ml-2 text-sm text-gray-600">({oracle.functions.length} functions)</span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(oracle.riskLevel)}`}>
                                                            {oracle.riskLevel.toUpperCase()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* DeFi Patterns */}
                                    {report.analysisFactors.defiPatterns.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">DeFi Patterns</h4>
                                            <div className="space-y-2">
                                                {report.analysisFactors.defiPatterns.map((pattern, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <span className="font-medium text-gray-900">{pattern.type}</span>
                                                            <span className="ml-2 text-sm text-gray-600">Complexity: {pattern.complexity}</span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(pattern.riskLevel)}`}>
                                                            {pattern.riskLevel.toUpperCase()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Economic Risk Factors */}
                                    {report.analysisFactors.economicRiskFactors.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Economic Risk Factors</h4>
                                            <div className="space-y-2">
                                                {report.analysisFactors.economicRiskFactors.map((risk, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <span className="font-medium text-gray-900">{risk.type}</span>
                                                            <span className="ml-2 text-sm text-gray-600">Count: {risk.count}, Weight: {risk.weight}</span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                                                            {risk.severity.toUpperCase()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cross Program Invocations */}
                                    {report.analysisFactors.crossProgramInvocation.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-900 mb-3">Cross Program Invocations</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {report.analysisFactors.crossProgramInvocation.map((cpi, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
                                                    >
                                                        {cpi}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'risks' && (
                        <div className="space-y-6">
                            {/* Security Risks */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                                    <h3 className="text-xl font-bold text-red-900">Security Risk Factors</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-white rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{report.analysisFactors.accessControlIssues}</div>
                                        <div className="text-sm text-gray-600">Access Control Issues</div>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{report.analysisFactors.inputValidationIssues}</div>
                                        <div className="text-sm text-gray-600">Input Validation Issues</div>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{report.analysisFactors.unsafeCodeBlocks}</div>
                                        <div className="text-sm text-gray-600">Unsafe Code Blocks</div>
                                    </div>
                                </div>
                            </div>

                            {/* Economic Risk Factors */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <DollarSign className="w-6 h-6 text-orange-600 mr-3" />
                                    <h3 className="text-xl font-bold text-orange-900">Economic Risk Factors</h3>
                                </div>
                                <div className="space-y-3">
                                    {report.analysisFactors.economicRiskFactors.map((risk, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <div className="flex items-center">
                                                <div className="flex items-center">
                                                    {risk.severity === 'high' && <XCircle className="w-5 h-5 text-red-500 mr-2" />}
                                                    {risk.severity === 'medium' && <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />}
                                                    {risk.severity === 'low' && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">{risk.type}</span>
                                                    <span className="ml-2 text-sm text-gray-600">({risk.count} occurrences)</span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                                                {risk.severity.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DeFi Patterns */}
                            {report.analysisFactors.defiPatterns.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Target className="w-6 h-6 text-blue-600 mr-3" />
                                        <h3 className="text-xl font-bold text-blue-900">DeFi Patterns Detected</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {report.analysisFactors.defiPatterns.map((pattern, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                <div>
                                                    <span className="font-medium text-gray-900">{pattern.type.toUpperCase()}</span>
                                                    <span className="ml-2 text-sm text-gray-600">({pattern.complexity} complexity)</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(pattern.riskLevel)}`}>
                                                    {pattern.riskLevel.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'anchor' && (
                        <div className="space-y-6">
                            {/* Anchor Account Management */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">Account Management</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{report.analysisFactors.anchorSpecificFeatures.accountValidation}</div>
                                        <div className="text-sm text-gray-600">Account Validations</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{report.analysisFactors.anchorSpecificFeatures.accountTypes}</div>
                                        <div className="text-sm text-gray-600">Account Types</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{report.analysisFactors.anchorSpecificFeatures.instructionHandlers}</div>
                                        <div className="text-sm text-gray-600">Instruction Handlers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{report.analysisFactors.anchorSpecificFeatures.constraintUsage || 0}</div>
                                        <div className="text-sm text-gray-600">Constraints</div>
                                    </div>
                                </div>
                            </div>

                            {/* Anchor Security Features */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-green-900 mb-4">Security Features</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{report.analysisFactors.anchorSpecificFeatures.signerChecks}</div>
                                        <div className="text-sm text-gray-600">Signer Checks</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{report.analysisFactors.anchorSpecificFeatures.ownerChecks || 0}</div>
                                        <div className="text-sm text-gray-600">Owner Checks</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{report.analysisFactors.anchorSpecificFeatures.seedsUsage}</div>
                                        <div className="text-sm text-gray-600">Seeds Usage</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{report.analysisFactors.anchorSpecificFeatures.bumpUsage || 0}</div>
                                        <div className="text-sm text-gray-600">Bump Usage</div>
                                    </div>
                                </div>
                            </div>

                            {/* Anchor Program Structure */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-purple-900 mb-4">Program Structure</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{report.analysisFactors.anchorSpecificFeatures.spaceAllocation}</div>
                                        <div className="text-sm text-gray-600">Space Allocations</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{report.analysisFactors.anchorSpecificFeatures.rentExemption}</div>
                                        <div className="text-sm text-gray-600">Rent Exemptions</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{report.analysisFactors.cpiUsage || 0}</div>
                                        <div className="text-sm text-gray-600">CPI Usage</div>
                                    </div>
                                </div>
                            </div>

                            {/* Program Derives */}
                            {report.analysisFactors.anchorSpecificFeatures.programDerives.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">Program Derives</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {report.analysisFactors.anchorSpecificFeatures.programDerives.map((derive, index) => (
                                            <span
                                                key={index}
                                                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                                            >
                                                {derive}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cross Program Invocations */}
                            {report.analysisFactors.crossProgramInvocation.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-indigo-900 mb-4">Cross Program Invocations</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {report.analysisFactors.crossProgramInvocation.map((cpi, index) => (
                                            <span
                                                key={index}
                                                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                                            >
                                                {cpi}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
