export interface RepositoryInfo {
    name: string;
    fullName: string;
    description: string;
    language: string;
    size: number;
    private: boolean;
}

export interface Analysis {
    totalLines: number;
    solidityFiles: number;
    contractFiles: string[];
    dependencies: string[];
    framework: string;
    testFiles: number;
    complexity: 'low' | 'medium' | 'high';
}

export interface AuditEstimate {
    duration: {
        min: number;
        max: number;
        unit: 'days';
        reasoning: string;
    };
    resources: {
        seniorAuditors: number;
        juniorAuditors: number;
        reasoning: string;
    };
    cost: {
        min: number;
        max: number;
        currency: 'USD';
        reasoning: string;
    };
    riskFactors: string[];
    specialConsiderations: string[];
}

export interface PreAuditReport {
    projectName: string;
    repositoryInfo: RepositoryInfo;
    analysis: Analysis;
    auditEstimate: AuditEstimate;
    generatedAt: string;
}

export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description: string;
    language: string;
    private: boolean;
    size: number;
    updated_at: string;
    html_url: string;
}

export interface GitHubRepositoryContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
    content?: string;
    encoding?: string;
}

export interface GenerateReportRequest {
    owner: string;
    repo: string;
    accessToken: string;
    selectedFiles?: string[];
}

// Static Analysis Types
export interface StaticAnalysisDto {
    owner: string;
    repo: string;
    accessToken: string;
    selectedFiles?: string[];
    analysisOptions?: {
        includeTests?: boolean;
        includeDependencies?: boolean;
        depth?: 'shallow' | 'medium' | 'deep';
    };
}

export interface OracleUsage {
    oracle: string;
    functions: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

export interface DeFiPattern {
    type: string;
    complexity: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
}

export interface EconomicRiskFactor {
    type: string;
    severity: 'low' | 'medium' | 'high';
    count: number;
    weight: number;
}

export interface RiskFactor {
    type: string;
    severity: 'low' | 'medium' | 'high';
    count: number;
    weight: number;
}

export interface AnalysisFactors {
    totalLinesOfCode: number;
    numPrograms: number;
    numFunctions: number;
    numStateVariables: number;
    avgCyclomaticComplexity: number;
    maxCyclomaticComplexity: number;
    compositionDepth: number;
    functionVisibility: {
        public: number;
        private: number;
    };
    viewFunctions: number;
    pureFunctions: number;
    integerOverflowRisks: number;
    accessControlIssues: number;
    inputValidationIssues: number;
    unsafeCodeBlocks: number;
    panicUsage: number;
    unwrapUsage: number;
    externalProgramCalls: number;
    uniqueExternalCalls: number;
    knownProtocolInteractions: string[];
    standardLibraryUsage: string[];
    oracleUsage: OracleUsage[];
    accessControlPatterns: {
        ownable: number;
        roleBased: number;
        custom: number;
    };
    tokenTransfers: number;
    complexMathOperations: number;
    timeDependentLogic: number;
    defiPatterns: DeFiPattern[];
    economicRiskFactors: EconomicRiskFactor[];
}

export interface StructuralScore {
    score: number;
    details: {
        totalLinesOfCode: number;
        numContracts: number;
        numFunctions: number;
        numStateVariables: number;
        avgCyclomaticComplexity: number;
        maxCyclomaticComplexity: number;
        inheritanceDepth: number;
    };
}

export interface SecurityScore {
    score: number;
    details: {
        lowLevelOperations: {
            assemblyBlocks: number;
            delegateCalls: number;
            rawCalls: number;
        };
        securityCriticalFeatures: {
            payableFunctions: number;
            txOriginUsage: number;
            selfDestructCalls: number;
            isProxyContract: boolean;
        };
        riskFactors: RiskFactor[];
    };
}

export interface SystemicScore {
    score: number;
    details: {
        externalDependencies: {
            externalContractCalls: number;
            uniqueFunctionCallsExternal: number;
            knownProtocolInteractions: string[];
        };
        standardInteractions: {
            erc20Interactions: boolean;
            erc721Interactions: boolean;
            erc1155Interactions: boolean;
        };
        oracleUsage: OracleUsage[];
        accessControlPattern: {
            type: string;
            complexity: 'low' | 'medium' | 'high';
        };
    };
}

export interface EconomicScore {
    score: number;
    details: {
        financialPrimitives: {
            isAMM: boolean;
            isLendingProtocol: boolean;
            isVestingContract: boolean;
            defiPatterns: DeFiPattern[];
        };
        tokenomics: {
            tokenTransfers: number;
            complexMathOperations: number;
            timeDependentLogic: boolean;
        };
        economicRiskFactors: EconomicRiskFactor[];
    };
}

export interface Scores {
    structural: StructuralScore;
    security: SecurityScore;
    systemic: SystemicScore;
    economic: EconomicScore;
}

export interface Performance {
    analysisTime: number;
    memoryUsage: number;
}

export interface StaticAnalysisReport {
    _id: {
        $oid: string;
    };
    repository: string;
    repositoryUrl: string;
    language: string;
    framework: string;
    analysisFactors: AnalysisFactors;
    scores: Scores;
    performance: Performance;
    createdAt: {
        $date: string;
    };
    updatedAt: {
        $date: string;
    };
    __v: number;
}
