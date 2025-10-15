'use client';

import { useState } from 'react';
import {
    Code2,
    BarChart3,
    Cpu,
    Brain,
    CheckCircle,
    XCircle,
    Layers,
    Shield,
    TrendingUp,
    DollarSign,
    Database
} from 'lucide-react';
import { StaticAnalysisReport } from '@/types/api';

interface StaticAnalysisReportDisplayProps {
    report: StaticAnalysisReport;
    onBack: () => void;
    onNewAnalysis: () => void;
}

export default function StaticAnalysisReportDisplay({ report, onBack, onNewAnalysis }: StaticAnalysisReportDisplayProps) {
    const [activeTab, setActiveTab] = useState<'scores' | 'factors' | 'rust' | 'ai'>('scores');

    // Utility functions for Rust analysis
    const formatRustAnalysisKey = (key: string): string => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const formatRustAnalysisValue = (value: any): string => {
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return '0 (empty)';
            // For arrays with primitive values, show count and sample
            if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
                const sample = value.slice(0, 2).join(', ');
                return value.length > 2 ? `${value.length} items (${sample}...)` : `${value.length} items (${sample})`;
            }
            // For arrays with objects, just show count
            return `${value.length} items`;
        }
        if (typeof value === 'object' && value !== null) {
            // Handle nested objects by showing key count
            const keys = Object.keys(value);
            if (keys.length === 0) return 'Empty object';
            return `Object with ${keys.length} properties`;
        }
        return String(value);
    };

    const getSectionTitle = (sectionKey: string): string => {
        const titleMap: { [key: string]: string } = {
            accessControl: 'Access Control',
            complexity: 'Complexity Analysis',
            dependencies: 'Dependencies Analysis',
            modularity: 'Modularity Analysis',
            pdaSeeds: 'PDA Seeds Analysis',
            security: 'Security Analysis',
            performance: 'Performance Metrics',
            patterns: 'Code Patterns',
            validation: 'Input Validation',
            errorHandling: 'Error Handling',
            testing: 'Testing Coverage',
            // AI Analysis sections
            documentationClarity: 'Documentation Clarity',
            testingCoverage: 'Testing Coverage',
            financialLogicIntricacy: 'Financial Logic Intricacy',
            profitAttackVectors: 'Profit Attack Vectors',
            valueAtRisk: 'Value at Risk',
            gameTheoryIncentives: 'Game Theory Incentives'
        };
        return titleMap[sectionKey] || formatRustAnalysisKey(sectionKey);
    };

    const getSectionDescription = (sectionKey: string): string => {
        const descriptionMap: { [key: string]: string } = {
            accessControl: 'Security and authorization patterns',
            complexity: 'Code complexity and maintainability metrics',
            dependencies: 'External dependencies and risk assessment',
            modularity: 'Code organization and module structure',
            pdaSeeds: 'Program Derived Address (PDA) seed analysis',
            security: 'Security vulnerabilities and best practices',
            performance: 'Performance and optimization metrics',
            patterns: 'Common code patterns and anti-patterns',
            validation: 'Input validation and sanitization',
            errorHandling: 'Error handling and recovery patterns',
            testing: 'Test coverage and quality metrics',
            // AI Analysis descriptions
            documentationClarity: 'Code documentation quality and clarity assessment',
            testingCoverage: 'Test coverage analysis and quality evaluation',
            financialLogicIntricacy: 'Financial logic complexity and mathematical operations',
            profitAttackVectors: 'Economic attack vectors and profit extraction risks',
            valueAtRisk: 'Asset value exposure and liquidity risk assessment',
            gameTheoryIncentives: 'Economic incentive alignment and game theory analysis'
        };
        return descriptionMap[sectionKey] || `Analysis of ${formatRustAnalysisKey(sectionKey).toLowerCase()}`;
    };

    const getSectionColor = (sectionKey: string): string => {
        const colorMap: { [key: string]: string } = {
            accessControl: 'green',
            complexity: 'blue',
            dependencies: 'yellow',
            modularity: 'purple',
            pdaSeeds: 'indigo',
            security: 'red',
            performance: 'orange',
            patterns: 'pink',
            validation: 'teal',
            errorHandling: 'cyan',
            testing: 'lime',
            // AI Analysis colors
            documentationClarity: 'blue',
            testingCoverage: 'green',
            financialLogicIntricacy: 'purple',
            profitAttackVectors: 'red',
            valueAtRisk: 'orange',
            gameTheoryIncentives: 'indigo'
        };
        return colorMap[sectionKey] || 'gray';
    };

    const renderArrayValue = (value: any[], key: string, color: string) => {
        if (value.length === 0) return null;

        // Check if array contains objects
        const hasObjects = value.some(item => typeof item === 'object' && item !== null);

        if (hasObjects) {
            return (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{formatRustAnalysisKey(key)} ({value.length} items)</h4>
                    <div className="space-y-2">
                        {value.slice(0, 5).map((item, index) => (
                            <div key={index} className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                                {typeof item === 'object' && item !== null ? (
                                    <div className="space-y-1">
                                        {Object.entries(item).slice(0, 3).map(([objKey, objValue]) => (
                                            <div key={objKey} className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-700">{formatRustAnalysisKey(objKey)}:</span>
                                                <span className="text-gray-900">{formatRustAnalysisValue(objValue)}</span>
                                            </div>
                                        ))}
                                        {Object.keys(item).length > 3 && (
                                            <div className="text-xs text-gray-500">...and {Object.keys(item).length - 3} more properties</div>
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
                <h4 className="text-sm font-semibold text-gray-900 mb-2">{formatRustAnalysisKey(key)}</h4>
                <div className="flex flex-wrap gap-2">
                    {value.map((item, index) => (
                        <span key={index} className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm font-medium`}>
                            {typeof item === 'string' ? item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : String(item)}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const renderScoreCards = (sectionData: any, color: string) => {
        const scoreKeys = ['score', 'riskScore', 'securityScore', 'modularityScore', 'dependencyRiskScore', 'dependencySecurityScore'];
        const scoreEntries = Object.entries(sectionData).filter(([key]) =>
            scoreKeys.some(scoreKey => key.toLowerCase().includes(scoreKey.toLowerCase()))
        );

        if (scoreEntries.length === 0) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {scoreEntries.map(([key, value]) => (
                    <div key={key} className={`text-center p-4 bg-${color}-50 rounded-lg`}>
                        <div className={`text-2xl font-bold text-${color}-600`}>
                            {typeof value === 'number' ?
                                (key.toLowerCase().includes('risk') && value < 1 ?
                                    `${(value * 100).toFixed(1)}%` :
                                    value.toFixed(1)
                                ) :
                                String(value)
                            }
                        </div>
                        <div className="text-sm text-gray-600">{formatRustAnalysisKey(key)}</div>
                    </div>
                ))}
            </div>
        );
    };

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
        { id: 'factors', label: 'Analysis Factors', icon: Code2 },
        ...(report.rust_analysis ? [{ id: 'rust', label: 'Rust Analysis', icon: Cpu }] : []),
        ...(report.ai_analysis ? [{ id: 'ai', label: 'AI Analysis', icon: Brain }] : []),
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
                                    onClick={() => setActiveTab(tab.id as 'scores' | 'factors' | 'rust' | 'ai')}
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

                    {activeTab === 'ai' && report.ai_analysis && (() => {
                        const aiAnalysis = report.ai_analysis;
                        return (
                            <div className="space-y-6">
                                {/* AI Analysis Header */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Brain className="w-8 h-8 text-purple-600 mr-3" />
                                            <h3 className="text-2xl font-bold text-gray-900">AI Analysis</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Engine: {aiAnalysis.engine}</p>
                                            <p className="text-sm text-gray-600">Version: {aiAnalysis.version}</p>
                                            <div className="flex items-center mt-1">
                                                {aiAnalysis.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                                )}
                                                <span className={`text-sm font-medium ${aiAnalysis.success ? 'text-green-600' : 'text-red-600'}`}>
                                                    {aiAnalysis.success ? 'Success' : 'Failed'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Display */}
                                    {!aiAnalysis.success && aiAnalysis.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                            <div className="flex items-center">
                                                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                                                <span className="text-red-700 font-medium">Analysis Error</span>
                                            </div>
                                            <p className="text-red-600 mt-2">{aiAnalysis.error}</p>
                                        </div>
                                    )}
                                </div>

                                {/* AI Analysis Summary Scores */}
                                {aiAnalysis.success && (
                                    <div className="bg-white rounded-lg border border-gray-200">
                                        <div className="px-6 py-4 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">AI Analysis Summary</h3>
                                            <p className="text-sm text-gray-600 mt-1">Overall assessment scores from AI analysis</p>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">{aiAnalysis.documentation_clarity}</div>
                                                    <div className="text-sm text-gray-600">Documentation Clarity</div>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600">{aiAnalysis.testing_coverage}</div>
                                                    <div className="text-sm text-gray-600">Testing Coverage</div>
                                                </div>
                                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-purple-600">{aiAnalysis.financial_logic_complexity}</div>
                                                    <div className="text-sm text-gray-600">Financial Logic Complexity</div>
                                                </div>
                                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-red-600">{aiAnalysis.attack_vector_risk}</div>
                                                    <div className="text-sm text-gray-600">Attack Vector Risk</div>
                                                </div>
                                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-orange-600">{aiAnalysis.value_at_risk}</div>
                                                    <div className="text-sm text-gray-600">Value at Risk</div>
                                                </div>
                                                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-indigo-600">{aiAnalysis.game_theory_complexity}</div>
                                                    <div className="text-sm text-gray-600">Game Theory Complexity</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* AI Analysis Factors - Dynamic Sections */}
                                {aiAnalysis.success && aiAnalysis.analysisFactors && (
                                    <div className="space-y-6">
                                        {/* Dynamic Sections - Render all AI analysis categories */}
                                        {Object.entries(aiAnalysis.analysisFactors).map(([sectionKey, sectionData]) => {
                                            if (typeof sectionData !== 'object' || sectionData === null) {
                                                return null;
                                            }

                                            const color = getSectionColor(sectionKey);
                                            const title = getSectionTitle(sectionKey);
                                            const description = getSectionDescription(sectionKey);

                                            return (
                                                <div key={sectionKey} className="bg-white rounded-lg border border-gray-200">
                                                    <div className="px-6 py-4 border-b border-gray-200">
                                                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                                                    </div>
                                                    <div className="p-6">
                                                        {/* Render score cards if any score-like properties exist */}
                                                        {renderScoreCards(sectionData, color)}

                                                        {/* Render regular properties */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                                            {Object.entries(sectionData).map(([key, value]) => {
                                                                // Skip arrays, score properties, and findings (handled separately)
                                                                if (Array.isArray(value) || key.toLowerCase().includes('score') || key === 'findings' || key === 'confidence') {
                                                                    return null;
                                                                }

                                                                // Handle nested objects
                                                                if (typeof value === 'object' && value !== null) {
                                                                    return (
                                                                        <div key={key} className="col-span-full">
                                                                            <div className="py-2 border-b border-gray-100">
                                                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">{formatRustAnalysisKey(key)}</h4>
                                                                                <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                                                                        {Object.entries(value).map(([nestedKey, nestedValue]) => (
                                                                                            <div key={nestedKey} className="flex justify-between text-sm">
                                                                                                <span className="font-medium text-gray-700">{formatRustAnalysisKey(nestedKey)}:</span>
                                                                                                <span className="text-gray-900">{formatRustAnalysisValue(nestedValue)}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                                                                        <span className="text-sm font-medium text-gray-700">{formatRustAnalysisKey(key)}</span>
                                                                        <span className="text-sm font-semibold text-gray-900">
                                                                            {formatRustAnalysisValue(value)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Render findings as special content */}
                                                        {sectionData.findings && Array.isArray(sectionData.findings) && sectionData.findings.length > 0 && (
                                                            <div className="mt-6">
                                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h4>
                                                                <div className="space-y-2">
                                                                    {sectionData.findings.map((finding: string, index: number) => (
                                                                        <div key={index} className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                                                                            <p className="text-sm text-gray-700">{finding}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Render confidence score if available */}
                                                        {sectionData.confidence && (
                                                            <div className="mt-4 flex items-center justify-end">
                                                                <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                                                                <span className={`px-2 py-1 rounded text-sm font-medium ${sectionData.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                                                    sectionData.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {sectionData.confidence}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* AI Analysis Interpretation Note */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                                                <h4 className="text-lg font-semibold text-purple-900">AI Analysis Interpretation</h4>
                                            </div>
                                            <p className="text-purple-800 text-sm leading-relaxed">
                                                This AI analysis provides insights into code quality, security risks, and economic factors using advanced language models.
                                                The findings are based on pattern recognition and should be used in conjunction with manual code review and security audits.
                                                Confidence scores indicate the AI's certainty in its assessments.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'rust' && report.rust_analysis && (() => {
                        const rustAnalysis = report.rust_analysis;
                        return (
                            <div className="space-y-6">
                                {/* Rust Analysis Header */}
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Cpu className="w-8 h-8 text-orange-600 mr-3" />
                                            <h3 className="text-2xl font-bold text-gray-900">Rust Analysis</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Engine: {rustAnalysis.engine}</p>
                                            <p className="text-sm text-gray-600">Version: {rustAnalysis.version}</p>
                                            <div className="flex items-center mt-1">
                                                {rustAnalysis.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                                )}
                                                <span className={`text-sm font-medium ${rustAnalysis.success ? 'text-green-600' : 'text-red-600'}`}>
                                                    {rustAnalysis.success ? 'Success' : 'Failed'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Metrics Comparison */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-white rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{rustAnalysis.total_lines_of_code.toLocaleString()}</div>
                                            <div className="text-sm text-gray-600">Lines of Code</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{rustAnalysis.total_functions}</div>
                                            <div className="text-sm text-gray-600">Functions</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{rustAnalysis.complex_math_operations}</div>
                                            <div className="text-sm text-gray-600">Complex Math Operations</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {!rustAnalysis.success && rustAnalysis.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <div className="flex items-center mb-2">
                                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                                            <h4 className="text-lg font-semibold text-red-900">Analysis Error</h4>
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
                                                <h3 className="text-lg font-semibold text-gray-900">Core Metrics</h3>
                                                <p className="text-sm text-gray-600 mt-1">Basic code metrics and statistics</p>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-700">Total Lines of Code</span>
                                                        <span className="text-sm font-semibold text-gray-900">{rustAnalysis.analysisFactors.totalLinesOfCode.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-700">Number of Functions</span>
                                                        <span className="text-sm font-semibold text-gray-900">{rustAnalysis.analysisFactors.numFunctions}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Sections - Render all nested objects */}
                                        {Object.entries(rustAnalysis.analysisFactors).map(([sectionKey, sectionData]) => {
                                            // Skip core metrics (already rendered above) and non-object values
                                            if (sectionKey === 'totalLinesOfCode' || sectionKey === 'numFunctions' || typeof sectionData !== 'object' || sectionData === null) {
                                                return null;
                                            }

                                            const color = getSectionColor(sectionKey);
                                            const title = getSectionTitle(sectionKey);
                                            const description = getSectionDescription(sectionKey);

                                            return (
                                                <div key={sectionKey} className="bg-white rounded-lg border border-gray-200">
                                                    <div className="px-6 py-4 border-b border-gray-200">
                                                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                                                    </div>
                                                    <div className="p-6">
                                                        {/* Render score cards if any score-like properties exist */}
                                                        {renderScoreCards(sectionData, color)}

                                                        {/* Render regular properties */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                                            {Object.entries(sectionData).map(([key, value]) => {
                                                                // Skip arrays and score properties (handled separately)
                                                                if (Array.isArray(value) || key.toLowerCase().includes('score')) {
                                                                    return null;
                                                                }

                                                                // Handle nested objects
                                                                if (typeof value === 'object' && value !== null) {
                                                                    return (
                                                                        <div key={key} className="col-span-full">
                                                                            <div className="py-2 border-b border-gray-100">
                                                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">{formatRustAnalysisKey(key)}</h4>
                                                                                <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                                                                        {Object.entries(value).map(([nestedKey, nestedValue]) => (
                                                                                            <div key={nestedKey} className="flex justify-between text-sm">
                                                                                                <span className="font-medium text-gray-700">{formatRustAnalysisKey(nestedKey)}:</span>
                                                                                                <span className="text-gray-900">{formatRustAnalysisValue(nestedValue)}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                                                                        <span className="text-sm font-medium text-gray-700">{formatRustAnalysisKey(key)}</span>
                                                                        <span className="text-sm font-semibold text-gray-900">
                                                                            {formatRustAnalysisValue(value)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Render arrays as tag collections */}
                                                        {Object.entries(sectionData).map(([key, value]) => {
                                                            if (Array.isArray(value)) {
                                                                return renderArrayValue(value, key, color);
                                                            }
                                                            return null;
                                                        })}

                                                        {/* Special handling for dependency tiers */}
                                                        {sectionKey === 'dependencies' && (
                                                            <div className="mt-6">
                                                                <div className="space-y-4">
                                                                    {[
                                                                        { tier: 'tier1', label: 'Tier 1 (Core)', color: 'green' },
                                                                        { tier: 'tier2', label: 'Tier 2 (Standard)', color: 'blue' },
                                                                        { tier: 'tier3', label: 'Tier 3 (Common)', color: 'yellow' },
                                                                        { tier: 'tier4', label: 'Tier 4 (External)', color: 'red' }
                                                                    ].map(({ tier, label, color: tierColor }) => {
                                                                        const cratesKey = `${tier}Crates`;
                                                                        const countKey = `${tier}Dependencies`;
                                                                        const crates = sectionData[cratesKey];
                                                                        const count = sectionData[countKey];

                                                                        if (!crates || !Array.isArray(crates) || crates.length === 0) {
                                                                            return null;
                                                                        }

                                                                        return (
                                                                            <div key={tier}>
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${tierColor}-100 text-${tierColor}-800`}>
                                                                                        {count} dependencies
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {crates.map((crate, index) => (
                                                                                        <span key={index} className={`bg-${tierColor}-50 text-${tierColor}-700 px-3 py-1 rounded-full text-sm`}>
                                                                                            {crate}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Analysis Comparison Note */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                            <h4 className="text-sm font-semibold text-blue-900 mb-2">Analysis Engine Comparison</h4>
                                            <p className="text-sm text-blue-700">
                                                This Rust analysis uses semantic AST-based parsing for more accurate results compared to regex-based analysis.
                                                The metrics shown here represent the most precise analysis available for Rust/Solana programs.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
