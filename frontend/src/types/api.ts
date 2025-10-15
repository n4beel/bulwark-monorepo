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
        internal: number;
    };
    viewFunctions: number;
    pureFunctions: number;
    integerOverflowRisks: number;
    accessControlIssues: number;
    inputValidationIssues: number;
    unsafeCodeBlocks: number;
    panicUsage: number;
    unwrapUsage: number;
    expectUsage: number;
    matchWithoutDefault: number;
    arrayBoundsChecks: number;
    memorySafetyIssues: number;
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
    cpiUsage: number;
    crossProgramInvocation: string[];
    tokenTransfers: number;
    complexMathOperations: number;
    timeDependentLogic: number;
    defiPatterns: DeFiPattern[];
    economicRiskFactors: EconomicRiskFactor[];
    anchorSpecificFeatures: {
        accountValidation: number;
        constraintUsage: number;
        instructionHandlers: number;
        programDerives: string[];
        accountTypes: number;
        seedsUsage: number;
        bumpUsage: number;
        signerChecks: number;
        ownerChecks: number;
        spaceAllocation: number;
        rentExemption: number;
    };
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

// Rust Analysis specific types - Dynamic structure
export interface RustAnalysisFactors {
    numFunctions: number;
    totalLinesOfCode: number;
    // Dynamic nested sections - any object with string keys and various value types
    [key: string]: any;
}

// AI Analysis specific types
export interface AIAnalysisFactors {
    documentationClarity?: {
        codeCommentsScore: number;
        functionDocumentationScore: number;
        readmeQualityScore: number;
        securityDocumentationScore: number;
        overallClarityScore: number;
        findings: string[];
        confidence: number;
    };
    testingCoverage?: {
        unitTestCoverage: number;
        integrationTestCoverage: number;
        testQualityScore: number;
        edgeCaseTestingScore: number;
        securityTestScore: number;
        overallTestingScore: number;
        findings: string[];
        confidence: number;
    };
    financialLogicIntricacy?: {
        mathematicalComplexityScore: number;
        algorithmSophisticationScore: number;
        interestRateComplexityScore: number;
        ammPricingComplexityScore: number;
        rewardDistributionComplexityScore: number;
        riskManagementComplexityScore: number;
        overallFinancialComplexityScore: number;
        findings: string[];
        confidence: number;
    };
    profitAttackVectors?: {
        flashLoanAttackRisk: number;
        sandwichAttackRisk: number;
        arbitrageOpportunities: number;
        economicExploitRisk: number;
        overallAttackVectorScore: number;
        findings: string[];
        confidence: number;
    };
    valueAtRisk?: {
        assetVolumeComplexity: number;
        liquidityRiskScore: number;
        marketCapImplications: number;
        economicStakesScore: number;
        overallValueAtRiskScore: number;
        findings: string[];
        confidence: number;
    };
    gameTheoryIncentives?: {
        incentiveAlignmentScore: number;
        economicSecurityDependencies: number;
        maliciousActorResistance: number;
        protocolGovernanceComplexity: number;
        overallGameTheoryScore: number;
        findings: string[];
        confidence: number;
    };
    // Dynamic sections for future AI analysis categories
    [key: string]: any;
}

export interface AIAnalysis {
    engine: string;
    version: string;
    success: boolean;
    error?: string | null;
    analysisFactors: AIAnalysisFactors;
    documentation_clarity: number;
    testing_coverage: number;
    financial_logic_complexity: number;
    attack_vector_risk: number;
    value_at_risk: number;
    game_theory_complexity: number;
}

export interface RustAnalysis {
    engine: string;
    version: string;
    success: boolean;
    error?: string | null;
    analysisFactors: RustAnalysisFactors;
    total_lines_of_code: number;
    total_functions: number;
    complex_math_operations: number;
}

export interface StaticAnalysisReport {
    _id: {
        $oid: string;
    } | string;  // Handle both MongoDB object format and plain string
    repository: string;
    repositoryUrl: string;
    language: string;
    framework: string;
    analysisFactors: AnalysisFactors;
    scores: Scores;
    performance: Performance;
    rust_analysis?: RustAnalysis; // Optional field for Rust analysis
    ai_analysis?: AIAnalysis; // Optional field for AI analysis
    createdAt: {
        $date: string;
    };
    updatedAt: {
        $date: string;
    };
    __v: number;
}
