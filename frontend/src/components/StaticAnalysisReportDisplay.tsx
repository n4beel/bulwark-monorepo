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
    DollarSign,
    Database,
    Lock,
    Zap,
    Coins,
    AlertTriangle,
    Calculator,
    Network,
    HardDrive,
    Globe,
    Settings,
    Eye,
    Crown,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { StaticAnalysisReport, AssertionDetail } from '@/types/api';

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

    const formatRustAnalysisValue = (value: unknown): string => {
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
            invariantsAndRiskParams: 'Constraint Density Analysis',
            constraintDensity: 'Constraint Density Analysis',
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
            invariantsAndRiskParams: 'Programmatic assertion density and complexity analysis',
            constraintDensity: 'Programmatic assertion density and complexity analysis',
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
            invariantsAndRiskParams: 'purple',
            constraintDensity: 'purple',
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

    const renderConstraintDensityDetails = (sectionData: Record<string, unknown>, color: string) => {
        const assertionDetails = sectionData.assertionDetails;
        if (!assertionDetails || !Array.isArray(assertionDetails) || assertionDetails.length === 0) {
            return null;
        }

        return (
            <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assertion Details ({assertionDetails.length} assertions)</h4>
                <div className="space-y-3">
                    {assertionDetails.slice(0, 10).map((assertion: AssertionDetail, index: number) => (
                        <div key={index} className={`p-4 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                                        {assertion.macroName || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Line {assertion.line || 'Unknown'}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${assertion.complexityScore > 5 ? 'bg-red-100 text-red-800' :
                                    assertion.complexityScore > 2 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    Complexity: {assertion.complexityScore || 0}
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="font-medium text-gray-700">File: </span>
                                <span className="text-gray-900 font-mono text-xs">{assertion.file || 'Unknown'}</span>
                            </div>
                            <div className="mt-2">
                                <span className="font-medium text-gray-700">Expression: </span>
                                <code className={`text-xs bg-gray-100 px-2 py-1 rounded border text-gray-800`}>
                                    {assertion.expression || 'N/A'}
                                </code>
                            </div>
                        </div>
                    ))}
                    {assertionDetails.length > 10 && (
                        <div className={`text-center py-3 text-sm text-${color}-600 bg-${color}-50 rounded-lg`}>
                            ...and {assertionDetails.length - 10} more assertions
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderArrayValue = (value: unknown[], key: string, color: string) => {
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

    const renderScoreCards = (sectionData: Record<string, unknown>, color: string) => {
        const scoreKeys = ['score', 'riskScore', 'securityScore', 'modularityScore', 'dependencyRiskScore', 'dependencySecurityScore', 'constraintDensityFactor'];
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
                                    onClick={() => setActiveTab(tab.id as 'scores' | 'rust' | 'ai')}
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
                                            {report.scores ?
                                                ((report.scores.structural + report.scores.security + report.scores.systemic + report.scores.economic) / 4).toFixed(1) + '/100' :
                                                'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                                {report.scores ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getScoreColor(report.scores.structural || 0).split(' ')[0]}`}>
                                                {(report.scores.structural || 0).toFixed(1)}
                                            </div>
                                            <div className="text-sm text-gray-600">Structural</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getScoreColor(report.scores.security || 0).split(' ')[0]}`}>
                                                {(report.scores.security || 0).toFixed(1)}
                                            </div>
                                            <div className="text-sm text-gray-600">Security</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getScoreColor(report.scores.systemic || 0).split(' ')[0]}`}>
                                                {(report.scores.systemic || 0).toFixed(1)}
                                            </div>
                                            <div className="text-sm text-gray-600">Systemic</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getScoreColor(report.scores.economic || 0).split(' ')[0]}`}>
                                                {(report.scores.economic || 0).toFixed(1)}
                                            </div>
                                            <div className="text-sm text-gray-600">Economic</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No traditional scores available for this analysis type</p>
                                    </div>
                                )}
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
                            {report.scores ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Structural Score */}
                                    {report.scores.structural !== undefined && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <Layers className="w-6 h-6 text-blue-600 mr-3" />
                                                    <h3 className="text-lg font-semibold text-blue-900">Structural Score</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.structural)}`}>
                                                    {report.scores.structural.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreColor(report.scores.structural).split(' ')[1]}`}
                                                        style={{ width: `${report.scores.structural}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-medium">Total Statements Count Factor:</span>
                                                    <span className="font-semibold text-blue-900">{report.static_analysis_scores?.structural?.loc_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-medium">Functions Factor:</span>
                                                    <span className="font-semibold text-blue-900">{report.static_analysis_scores?.structural?.total_functions_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-medium">Complexity Factor:</span>
                                                    <span className="font-semibold text-blue-900">{report.static_analysis_scores?.structural?.code_complexity_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-medium">Modularity Factor:</span>
                                                    <span className="font-semibold text-blue-900">{report.static_analysis_scores?.structural?.modularity_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-medium">Dependency Security:</span>
                                                    <span className="font-semibold text-blue-900">{report.static_analysis_scores?.structural?.dependency_security_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Score */}
                                    {report.scores.security !== undefined && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <Shield className="w-6 h-6 text-red-600 mr-3" />
                                                    <h3 className="text-lg font-semibold text-red-900">Security Score</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.security)}`}>
                                                    {report.scores.security.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreColor(report.scores.security).split(' ')[1]}`}
                                                        style={{ width: `${report.scores.security}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Access Control:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.access_control_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">PDA Complexity:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.pda_complexity_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">CPI Factor:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.cpi_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Input Constraints:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.input_constraints_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Arithmetic Factor:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.arithmatic_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Privileged Roles:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.priviliged_roles_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Unsafe Low-Level:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.unsafe_lowlevel_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-700 font-medium">Error Handling:</span>
                                                    <span className="font-semibold text-red-900">{report.static_analysis_scores?.security?.error_handling_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Systemic Score */}
                                    {report.scores.systemic !== undefined && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <Database className="w-6 h-6 text-purple-600 mr-3" />
                                                    <h3 className="text-lg font-semibold text-purple-900">Systemic Score</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.systemic)}`}>
                                                    {report.scores.systemic.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreColor(report.scores.systemic).split(' ')[1]}`}
                                                        style={{ width: `${report.scores.systemic}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700 font-medium">Upgradeability:</span>
                                                    <span className="font-semibold text-purple-900">{report.static_analysis_scores?.systemic?.upgradeability_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700 font-medium">External Integration:</span>
                                                    <span className="font-semibold text-purple-900">{report.static_analysis_scores?.systemic?.external_integration_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700 font-medium">Composability:</span>
                                                    <span className="font-semibold text-purple-900">{report.static_analysis_scores?.systemic?.composability_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700 font-medium">DOS Resource Limits:</span>
                                                    <span className="font-semibold text-purple-900">{report.static_analysis_scores?.systemic?.dos_resource_limits_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700 font-medium">Operational Security:</span>
                                                    <span className="font-semibold text-purple-900">{report.static_analysis_scores?.systemic?.operational_security_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Economic Score */}
                                    {report.scores.economic !== undefined && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                                                    <h3 className="text-lg font-semibold text-green-900">Economic Score</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.scores.economic)}`}>
                                                    {report.scores.economic.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreColor(report.scores.economic).split(' ')[1]}`}
                                                        style={{ width: `${report.scores.economic}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-green-700 font-medium">Asset Types Factor:</span>
                                                    <span className="font-semibold text-green-900">{report.static_analysis_scores?.economic?.asset_types_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-green-700 font-medium">Constraint Density:</span>
                                                    <span className="font-semibold text-green-900">{report.static_analysis_scores?.economic?.invariants_risk_factor?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No detailed scores available for this analysis type</p>
                                </div>
                            )}
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
                                                        {typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData) ?
                                                            renderScoreCards(sectionData as Record<string, unknown>, color) : null}

                                                        {/* Render regular properties */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                                            {typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData) ?
                                                                Object.entries(sectionData as Record<string, unknown>).map(([key, value]) => {
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
                                                                }) : null}
                                                        </div>

                                                        {/* Render findings as special content */}
                                                        {typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData) &&
                                                            'findings' in sectionData && Array.isArray(sectionData.findings) && sectionData.findings.length > 0 ? (
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
                                                        ) : null}

                                                        {/* Render confidence score if available */}
                                                        {typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData) &&
                                                            'confidence' in sectionData && typeof sectionData.confidence === 'number' ? (
                                                            <div className="mt-4 flex items-center justify-end">
                                                                <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                                                                <span className={`px-2 py-1 rounded text-sm font-medium ${sectionData.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                                                    sectionData.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {sectionData.confidence}%
                                                                </span>
                                                            </div>
                                                        ) : null}
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
                                                Confidence scores indicate the AI&apos;s certainty in its assessments.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'rust' && report.rust_analysis && (
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Cpu className="w-6 h-6 text-blue-600 mr-3" />
                                        <h3 className="text-lg font-semibold text-gray-900">Rust Analysis</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Engine: {report.rust_analysis.engine} v{report.rust_analysis.version}</p>
                                        <div className="flex items-center mt-1">
                                            {report.rust_analysis.success ? (
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                            )}
                                            <span className={`text-sm font-medium ${report.rust_analysis.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {report.rust_analysis.success ? 'Analysis Successful' : 'Analysis Failed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {report.rust_analysis.analysisFactors ? (
                                    <div className="space-y-8">
                                        {/* High-Level Overview */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center shadow-sm">
                                                <div className="text-2xl font-bold text-blue-700">{report.rust_analysis.total_lines_of_code?.toLocaleString() || 'N/A'}</div>
                                                <div className="text-sm text-blue-600 font-medium">Lines of Code</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center shadow-sm">
                                                <div className="text-2xl font-bold text-green-700">{report.rust_analysis.total_functions || 'N/A'}</div>
                                                <div className="text-sm text-green-600 font-medium">Total Functions</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center shadow-sm">
                                                <div className="text-2xl font-bold text-purple-700">{report.rust_analysis.analysisFactors.complexity?.totalFunctions || 'N/A'}</div>
                                                <div className="text-sm text-purple-600 font-medium">Complex Functions</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 text-center shadow-sm">
                                                <div className="text-2xl font-bold text-orange-700">{report.rust_analysis.analysisFactors.complexity?.maxCyclomaticComplexity || 'N/A'}</div>
                                                <div className="text-sm text-orange-600 font-medium">Max Complexity</div>
                                            </div>
                                        </div>

                                        {/* Security & Risk Analysis */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Access Control */}
                                            {report.rust_analysis.analysisFactors.accessControl && (
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Shield className="w-5 h-5 text-red-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-red-900">Access Control</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.accessControl.accessControlFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.accessControl.accessControlFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.accessControl.manualCheckCount}</div>
                                                                <div className="text-xs text-red-700 font-medium">Manual Checks</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.accessControl.gatedHandlerCount}</div>
                                                                <div className="text-xs text-red-700 font-medium">Gated Handlers</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-700 font-medium">Account Closes:</span>
                                                            <span className="font-semibold text-red-900">{report.rust_analysis.analysisFactors.accessControl.accountCloseCount}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-700 font-medium">Unique Roles:</span>
                                                            <span className="font-semibold text-red-900">{report.rust_analysis.analysisFactors.accessControl.uniqueRoleCount}</span>
                                                        </div>
                                                        {report.rust_analysis.analysisFactors.accessControl.uniqueRoles && report.rust_analysis.analysisFactors.accessControl.uniqueRoles.length > 0 && (
                                                            <div className="mt-3">
                                                                <span className="text-red-700 font-medium text-sm">Roles:</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {report.rust_analysis.analysisFactors.accessControl.uniqueRoles.map((role: string, index: number) => (
                                                                        <span key={index} className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                                                            {role}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error Handling */}
                                            {report.rust_analysis.analysisFactors.errorHandling && (
                                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-yellow-900">Error Handling</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.errorHandling.errorHandlingFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.errorHandling.errorHandlingFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-4 bg-white rounded shadow-sm">
                                                            <div className="text-3xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.errorHandling.rawRiskScore}</div>
                                                            <div className="text-sm text-yellow-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.errorHandling.totalInvariants}</div>
                                                                <div className="text-xs text-yellow-700 font-medium">Total Assertions</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.errorHandling.totalRequireMacros}</div>
                                                                <div className="text-xs text-yellow-700 font-medium">Require Macros</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-yellow-700 font-medium">Require Eq Macros:</span>
                                                            <span className="font-semibold text-yellow-900">{report.rust_analysis.analysisFactors.errorHandling.totalRequireEqMacros}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dependencies */}
                                            {report.rust_analysis.analysisFactors.dependencies && (
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Database className="w-5 h-5 text-green-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-green-900">Dependencies</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.dependencies.dependencyFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.dependencies.dependencyFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-green-600">{report.rust_analysis.analysisFactors.dependencies.totalDependencies}</div>
                                                                <div className="text-xs text-green-700 font-medium">Total Dependencies</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-green-600">{report.rust_analysis.analysisFactors.dependencies.tier1Dependencies}</div>
                                                                <div className="text-xs text-green-700 font-medium">Tier 1</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-green-700 font-medium">Tier 2:</span>
                                                            <span className="font-semibold text-green-900">{report.rust_analysis.analysisFactors.dependencies.tier2Dependencies}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-green-700 font-medium">Tier 4:</span>
                                                            <span className="font-semibold text-green-900">{report.rust_analysis.analysisFactors.dependencies.tier4Dependencies}</span>
                                                        </div>
                                                        {report.rust_analysis.analysisFactors.dependencies.tier1Crates && report.rust_analysis.analysisFactors.dependencies.tier1Crates.length > 0 && (
                                                            <div className="mt-3">
                                                                <span className="text-green-700 font-medium text-sm">Tier 1 Crates:</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {report.rust_analysis.analysisFactors.dependencies.tier1Crates.map((crate: string, index: number) => (
                                                                        <span key={index} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                                            {crate}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* CPI Calls */}
                                            {report.rust_analysis.analysisFactors.cpiCalls && (
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Zap className="w-5 h-5 text-purple-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-purple-900">CPI Calls</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.cpiCalls.cpiFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.cpiCalls.cpiFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.cpiCalls.totalCpiCalls}</div>
                                                                <div className="text-xs text-purple-700 font-medium">Total CPI Calls</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.cpiCalls.uniquePrograms}</div>
                                                                <div className="text-xs text-purple-700 font-medium">Unique Programs</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Signed CPI Calls:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.cpiCalls.signedCpiCalls}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Unsigned CPI Calls:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.cpiCalls.unsignedCpiCalls}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Complexity Score:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.cpiCalls.cpiComplexityScoreRaw.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Asset Types & Modularity */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Asset Types */}
                                            {report.rust_analysis.analysisFactors.assetTypes && (
                                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Coins className="w-5 h-5 text-indigo-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-indigo-900">Asset Types</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.assetTypes.assetTypesFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.assetTypes.assetTypesFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-indigo-600">{report.rust_analysis.analysisFactors.assetTypes.distinctAssetStandards}</div>
                                                            <div className="text-xs text-indigo-700 font-medium">Distinct Standards</div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700 font-medium">Uses SPL Token:</span>
                                                                <span className={`font-semibold ${report.rust_analysis.analysisFactors.assetTypes.usesSplToken ? 'text-green-600' : 'text-gray-600'}`}>
                                                                    {report.rust_analysis.analysisFactors.assetTypes.usesSplToken ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700 font-medium">Uses SPL Token 2022:</span>
                                                                <span className={`font-semibold ${report.rust_analysis.analysisFactors.assetTypes.usesSplToken2022 ? 'text-green-600' : 'text-gray-600'}`}>
                                                                    {report.rust_analysis.analysisFactors.assetTypes.usesSplToken2022 ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700 font-medium">Uses Metaplex NFT:</span>
                                                                <span className={`font-semibold ${report.rust_analysis.analysisFactors.assetTypes.usesMetaplexNft ? 'text-green-600' : 'text-gray-600'}`}>
                                                                    {report.rust_analysis.analysisFactors.assetTypes.usesMetaplexNft ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Modularity */}
                                            {report.rust_analysis.analysisFactors.modularity && (
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Layers className="w-5 h-5 text-blue-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-blue-900">Modularity</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.modularity.modularityScore)}`}>
                                                            {report.rust_analysis.analysisFactors.modularity.modularityScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-blue-600">{report.rust_analysis.analysisFactors.modularity.totalFiles}</div>
                                                                <div className="text-xs text-blue-700 font-medium">Total Files</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-blue-600">{report.rust_analysis.analysisFactors.modularity.totalModules}</div>
                                                                <div className="text-xs text-blue-700 font-medium">Total Modules</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-700 font-medium">Instruction Handlers:</span>
                                                            <span className="font-semibold text-blue-900">{report.rust_analysis.analysisFactors.modularity.totalInstructionHandlers}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-700 font-medium">Total Imports:</span>
                                                            <span className="font-semibold text-blue-900">{report.rust_analysis.analysisFactors.modularity.totalImports}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* PDA Seeds Analysis */}
                                        {report.rust_analysis.analysisFactors.pdaSeeds && (
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <Lock className="w-5 h-5 text-gray-600 mr-2" />
                                                        <h4 className="text-lg font-semibold text-gray-900">PDA Seeds Analysis</h4>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.pdaSeeds.pdaComplexityFactor)}`}>
                                                        {report.rust_analysis.analysisFactors.pdaSeeds.pdaComplexityFactor.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="text-center p-4 bg-white rounded shadow-sm">
                                                        <div className="text-3xl font-bold text-gray-700">{report.rust_analysis.analysisFactors.pdaSeeds.totalSeedComplexityScore}</div>
                                                        <div className="text-sm text-gray-600 font-medium">Total Seed Complexity Score</div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-gray-700">{report.rust_analysis.analysisFactors.pdaSeeds.distinctSeedPatterns}</div>
                                                            <div className="text-xs text-gray-600 font-medium">Distinct Seed Patterns</div>
                                                        </div>
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-gray-700">{report.rust_analysis.analysisFactors.pdaSeeds.totalPdaAccounts}</div>
                                                            <div className="text-xs text-gray-600 font-medium">Total PDA Accounts</div>
                                                        </div>
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-gray-700">{report.rust_analysis.analysisFactors.pdaSeeds.pdaComplexityFactor}</div>
                                                            <div className="text-xs text-gray-600 font-medium">PDA Complexity Factor</div>
                                                        </div>
                                                    </div>
                                                    {report.rust_analysis.analysisFactors.pdaSeeds.seedPatterns && report.rust_analysis.analysisFactors.pdaSeeds.seedPatterns.length > 0 && (
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Seed Patterns ({report.rust_analysis.analysisFactors.pdaSeeds.seedPatterns.length} total)</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                                                {report.rust_analysis.analysisFactors.pdaSeeds.seedPatterns.map((pattern: string, index: number) => (
                                                                    <div key={index} className="bg-white border border-gray-200 rounded p-3 text-xs">
                                                                        <div className="font-mono text-gray-800 font-medium">
                                                                            {pattern}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Constraint Density Analysis */}
                                        {report.rust_analysis.analysisFactors.invariantsAndRiskParams && (
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <Lock className="w-5 h-5 text-gray-600 mr-2" />
                                                        <h4 className="text-lg font-semibold text-gray-900">Constraint Density Analysis</h4>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.invariantsAndRiskParams.constraintDensityFactor)}`}>
                                                        {report.rust_analysis.analysisFactors.invariantsAndRiskParams.constraintDensityFactor.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="text-center p-3 bg-white rounded shadow-sm">
                                                        <div className="text-xl font-bold text-gray-900">{report.rust_analysis.analysisFactors.invariantsAndRiskParams.totalAssertions}</div>
                                                        <div className="text-xs text-gray-600 font-medium">Total Assertions</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-white rounded shadow-sm">
                                                        <div className="text-xl font-bold text-gray-900">{report.rust_analysis.analysisFactors.invariantsAndRiskParams.requireMacros}</div>
                                                        <div className="text-xs text-gray-600 font-medium">Require Macros</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-white rounded shadow-sm">
                                                        <div className="text-xl font-bold text-gray-900">{report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertMacros}</div>
                                                        <div className="text-xs text-gray-600 font-medium">Assert Macros</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-white rounded shadow-sm">
                                                        <div className="text-xl font-bold text-gray-900">{report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertEqMacros}</div>
                                                        <div className="text-xs text-gray-600 font-medium">Assert Eq Macros</div>
                                                    </div>
                                                </div>
                                                {report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails && report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails.length > 0 && (
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Recent Assertions ({report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails.length} total)</h5>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails.slice(0, 10).map((assertion, index: number) => (
                                                                <div key={index} className="bg-white border border-gray-200 rounded p-3 text-xs shadow-sm">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="font-medium text-gray-900">{assertion.macro_name}</span>
                                                                        <span className="text-gray-500">Complexity: {assertion.complexity_score}</span>
                                                                    </div>
                                                                    <div className="text-gray-600 font-mono text-xs truncate">
                                                                        {assertion.file.split('/').pop()}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails.length > 10 && (
                                                                <div className="text-center py-2 text-sm text-gray-500">
                                                                    ...and {report.rust_analysis.analysisFactors.invariantsAndRiskParams.assertionDetails.length - 10} more assertions
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Additional Analysis Factors */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Arithmetic Operations */}
                                            {report.rust_analysis.analysisFactors.arithmeticOperations && (
                                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Calculator className="w-5 h-5 text-orange-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-orange-900">Arithmetic Operations</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.arithmeticOperations.arithmeticFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.arithmeticOperations.arithmeticFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-orange-600">{report.rust_analysis.analysisFactors.arithmeticOperations.rawRiskScore}</div>
                                                            <div className="text-xs text-orange-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-orange-600">{report.rust_analysis.analysisFactors.arithmeticOperations.highRiskOpsCount}</div>
                                                                <div className="text-xs text-orange-700 font-medium">High Risk Ops</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-orange-600">{report.rust_analysis.analysisFactors.arithmeticOperations.mediumRiskOpsCount}</div>
                                                                <div className="text-xs text-orange-700 font-medium">Medium Risk Ops</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-orange-700 font-medium">Total Math Handlers:</span>
                                                            <span className="font-semibold text-orange-900">{report.rust_analysis.analysisFactors.arithmeticOperations.totalMathHandlers}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Composability */}
                                            {report.rust_analysis.analysisFactors.composability && (
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Network className="w-5 h-5 text-purple-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-purple-900">Composability</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.composability.composabilityFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.composability.composabilityFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.composability.rawRiskScore}</div>
                                                            <div className="text-xs text-purple-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Multi-CPI Handlers:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.composability.multiCpiHandlersCount}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Total Handlers:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.composability.totalHandlersFound}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* DOS Resource Limits */}
                                            {report.rust_analysis.analysisFactors.dosResourceLimits && (
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <HardDrive className="w-5 h-5 text-red-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-red-900">DOS Resource Limits</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.dosResourceLimits.resourceFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.dosResourceLimits.resourceFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.dosResourceLimits.rawRiskScore}</div>
                                                            <div className="text-xs text-red-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.dosResourceLimits.dynamicSpaceAccounts}</div>
                                                                <div className="text-xs text-red-700 font-medium">Dynamic Space Accounts</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.dosResourceLimits.handlersWithLoops}</div>
                                                                <div className="text-xs text-red-700 font-medium">Handlers with Loops</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-700 font-medium">Handlers with Vec Params:</span>
                                                            <span className="font-semibold text-red-900">{report.rust_analysis.analysisFactors.dosResourceLimits.handlersWithVecParams}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* External Integration */}
                                            {report.rust_analysis.analysisFactors.externalIntegration && (
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Globe className="w-5 h-5 text-blue-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-blue-900">External Integration</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.externalIntegration.integrationRiskScore)}`}>
                                                            {report.rust_analysis.analysisFactors.externalIntegration.integrationRiskScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-blue-600">{report.rust_analysis.analysisFactors.externalIntegration.externalCpiCalls}</div>
                                                            <div className="text-xs text-blue-700 font-medium">External CPI Calls</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-blue-600">{report.rust_analysis.analysisFactors.externalIntegration.tokenSwapIntegrations}</div>
                                                                <div className="text-xs text-blue-700 font-medium">Token Swap Integrations</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-blue-600">{report.rust_analysis.analysisFactors.externalIntegration.totalOracleIntegrations}</div>
                                                                <div className="text-xs text-blue-700 font-medium">Oracle Integrations</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-700 font-medium">Total Bridge Integrations:</span>
                                                            <span className="font-semibold text-blue-900">{report.rust_analysis.analysisFactors.externalIntegration.totalBridgeIntegrations}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Input Constraints */}
                                            {report.rust_analysis.analysisFactors.inputConstraints && (
                                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Settings className="w-5 h-5 text-yellow-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-yellow-900">Input Constraints</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.inputConstraints.inputConstraintFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.inputConstraints.inputConstraintFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.inputConstraints.rawRiskScore}</div>
                                                            <div className="text-xs text-yellow-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.inputConstraints.totalConstraints}</div>
                                                                <div className="text-xs text-yellow-700 font-medium">Total Constraints</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-yellow-600">{report.rust_analysis.analysisFactors.inputConstraints.maxAccountsPerHandler}</div>
                                                                <div className="text-xs text-yellow-700 font-medium">Max Accounts/Handler</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-yellow-700 font-medium">Avg Accounts/Handler:</span>
                                                            <span className="font-semibold text-yellow-900">{report.rust_analysis.analysisFactors.inputConstraints.avgAccountsPerHandler.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Operational Security */}
                                            {report.rust_analysis.analysisFactors.operationalSecurity && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Eye className="w-5 h-5 text-gray-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-gray-900">Operational Security</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.operationalSecurity.opsecFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.operationalSecurity.opsecFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-gray-600">{report.rust_analysis.analysisFactors.operationalSecurity.rawRiskScore}</div>
                                                            <div className="text-xs text-gray-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-gray-600">{report.rust_analysis.analysisFactors.operationalSecurity.controlHandlers}</div>
                                                                <div className="text-xs text-gray-700 font-medium">Control Handlers</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-gray-600">{report.rust_analysis.analysisFactors.operationalSecurity.sysvarDependencies}</div>
                                                                <div className="text-xs text-gray-700 font-medium">Sysvar Dependencies</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-700 font-medium">Pause Checks:</span>
                                                            <span className="font-semibold text-gray-900">{report.rust_analysis.analysisFactors.operationalSecurity.pauseChecks}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Privileged Roles */}
                                            {report.rust_analysis.analysisFactors.privilegedRoles && (
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <Crown className="w-5 h-5 text-purple-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-purple-900">Privileged Roles</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.privilegedRoles.acFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.privilegedRoles.acFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.privilegedRoles.rawRiskScore}</div>
                                                            <div className="text-xs text-purple-700 font-medium">Raw Risk Score</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.privilegedRoles.totalGatedHandlers}</div>
                                                                <div className="text-xs text-purple-700 font-medium">Gated Handlers</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-purple-600">{report.rust_analysis.analysisFactors.privilegedRoles.totalManualChecks}</div>
                                                                <div className="text-xs text-purple-700 font-medium">Manual Checks</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-purple-700 font-medium">Account Closes:</span>
                                                            <span className="font-semibold text-purple-900">{report.rust_analysis.analysisFactors.privilegedRoles.totalAccountCloses}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unsafe Low Level */}
                                            {report.rust_analysis.analysisFactors.unsafeLowLevel && (
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-red-900">Unsafe Low Level</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.unsafeLowLevel.unsafeFactor)}`}>
                                                            {report.rust_analysis.analysisFactors.unsafeLowLevel.unsafeFactor.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.unsafeLowLevel.totalUnsafeOperations}</div>
                                                            <div className="text-xs text-red-700 font-medium">Total Unsafe Operations</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.unsafeLowLevel.bytemuckUsage}</div>
                                                                <div className="text-xs text-red-700 font-medium">Bytemuck Usage</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-red-600">{report.rust_analysis.analysisFactors.unsafeLowLevel.totalUnsafeBlocks}</div>
                                                                <div className="text-xs text-red-700 font-medium">Unsafe Blocks</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-700 font-medium">Complexity Score:</span>
                                                            <span className="font-semibold text-red-900">{report.rust_analysis.analysisFactors.unsafeLowLevel.unsafeComplexityScore.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upgradeability */}
                                            {report.rust_analysis.analysisFactors.upgradeability && (
                                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <RefreshCw className="w-5 h-5 text-indigo-600 mr-2" />
                                                            <h4 className="text-lg font-semibold text-indigo-900">Upgradeability</h4>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.rust_analysis.analysisFactors.upgradeability.upgradeabilityRiskScore)}`}>
                                                            {report.rust_analysis.analysisFactors.upgradeability.upgradeabilityRiskScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-center p-3 bg-white rounded shadow-sm">
                                                            <div className="text-xl font-bold text-indigo-600">{report.rust_analysis.analysisFactors.upgradeability.totalUpgradeAuthorities}</div>
                                                            <div className="text-xs text-indigo-700 font-medium">Total Upgrade Authorities</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-indigo-600">{report.rust_analysis.analysisFactors.upgradeability.singleKeyAuthorities}</div>
                                                                <div className="text-xs text-indigo-700 font-medium">Single Key Authorities</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white rounded shadow-sm">
                                                                <div className="text-xl font-bold text-indigo-600">{report.rust_analysis.analysisFactors.upgradeability.unknownAuthorities}</div>
                                                                <div className="text-xs text-indigo-700 font-medium">Unknown Authorities</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-indigo-700 font-medium">Upgradeable Programs:</span>
                                                            <span className="font-semibold text-indigo-900">{report.rust_analysis.analysisFactors.upgradeability.totalUpgradeablePrograms}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No Rust analysis factors available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
