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
        loc_factor: number;
        total_functions_factor: number;
        code_complexity_factor: number;
        modularity_factor: number;
        dependency_security_factor: number;
    };
}

export interface SecurityScore {
    score: number;
    details: {
        access_control_factor: number;
        pda_complexity_factor: number;
        cpi_factor: number;
        input_constraints_factor: number;
        arithmatic_factor: number;
        priviliged_roles_factor: number;
        unsafe_lowlevel_factor: number;
        error_handling_factor: number;
    };
}

export interface SystemicScore {
    score: number;
    details: {
        upgradeability_factor: number;
        external_integration_factor: number;
        composability_factor: number;
        dos_resource_limits_factor: number;
        operational_security_factor: number;
    };
}

export interface EconomicScore {
    score: number;
    details: {
        asset_types_factor: number;
        invariants_risk_factor: number;
    };
}

export interface Scores {
    structural: number;
    security: number;
    systemic: number;
    economic: number;
    total?: number;
}

export interface Performance {
    analysisTime: number;
    memoryUsage: number;
}

// Rust Analysis specific types - Dynamic structure
export interface AccessControlMetrics {
    accessControlFactor: number;
    manualCheckCount: number;
    gatedHandlerCount: number;
    accountCloseCount: number;
    uniqueRoleCount: number;
    uniqueRoles?: string[];
}

export interface ErrorHandlingMetrics {
    errorHandlingFactor: number;
    rawRiskScore: number;
    totalInvariants: number;
    totalRequireMacros: number;
    totalRequireEqMacros: number;
}

export interface DependencyMetrics {
    dependencyFactor: number;
    totalDependencies: number;
    tier1Dependencies: number;
    tier2Dependencies: number;
    tier4Dependencies: number;
    tier1Crates?: string[];
}

export interface CpiCallMetrics {
    cpiFactor: number;
    totalCpiCalls: number;
    uniquePrograms: number;
    signedCpiCalls: number;
    unsignedCpiCalls: number;
    cpiComplexityScoreRaw: number;
}

export interface AssetTypesMetrics {
    assetTypesFactor: number;
    distinctAssetStandards: number;
    usesSplToken: boolean;
    usesSplToken2022: boolean;
    usesMetaplexNft: boolean;
}

export interface ModularityMetrics {
    modularityScore: number;
    totalFiles: number;
    totalModules: number;
    totalInstructionHandlers: number;
    totalImports: number;
}

export interface ComplexityMetrics {
    totalFunctions: number;
    maxCyclomaticComplexity: number;
}

export interface PdaSeedsMetrics {
    pdaComplexityFactor: number;
    totalSeedComplexityScore: number;
    distinctSeedPatterns: number;
    totalPdaAccounts: number;
    seedPatterns?: string[];
}

export interface InvariantsAndRiskParamsMetrics {
    constraintDensityFactor: number;
    totalAssertions: number;
    requireMacros: number;
    assertMacros: number;
    assertEqMacros: number;
    assertionDetails?: Array<{
        file: string;
        line: number;
        macro_name: string;
        expression: string;
        complexity_score: number;
    }>;
}

// Additional missing analysis factor interfaces
export interface ArithmeticOperationsMetrics {
    arithmeticFactor: number;
    highRiskOpsCount: number;
    mathHandlers: string[];
    mediumRiskOpsCount: number;
    rawRiskScore: number;
    totalHandlersFound: number;
    totalMathHandlers: number;
}

export interface ComposabilityMetrics {
    composabilityFactor: number;
    filesAnalyzed: number;
    filesSkipped: number;
    multiCpiHandlersCount: number;
    rawRiskScore: number;
    totalHandlersFound: number;
}

export interface DosResourceLimitsMetrics {
    accountSpaceTypes: Record<string, string>;
    dynamicSpaceAccounts: number;
    filesAnalyzed: number;
    filesSkipped: number;
    handlerLoopCounts: Record<string, number>;
    handlersWithLoops: number;
    handlersWithVecParams: number;
    maxConstantSpace: number;
    rawRiskScore: number;
    resourceFactor: number;
    totalHandlersFound: number;
}

export interface ExternalIntegrationMetrics {
    allbridgeIntegrations: number;
    chainlinkOracleIntegrations: number;
    crossProgramInvocations: number;
    externalCpiCalls: number;
    externalDependencyScore: number;
    externalProgramReferences: number;
    filesAnalyzed: number;
    filesSkipped: number;
    integrationPatternBreakdown: Record<string, number>;
    integrationRiskScore: number;
    jupiterIntegrations: number;
    lendingIntegrations: number;
    oracleDependencyScore: number;
    orcaIntegrations: number;
    otherBridgeIntegrations: number;
    otherDefiIntegrations: number;
    otherIntegrationPatterns: number;
    otherOracleIntegrations: number;
    priceFeedIntegrations: number;
    pythOracleIntegrations: number;
    raydiumIntegrations: number;
    serumIntegrations: number;
    stakingIntegrations: number;
    switchboardOracleIntegrations: number;
    tokenSwapIntegrations: number;
    totalBridgeIntegrations: number;
    totalDefiIntegrations: number;
    totalOracleIntegrations: number;
    wormholeBridgeIntegrations: number;
}

export interface InputConstraintsMetrics {
    accountStructLengths: number[];
    avgAccountsPerHandler: number;
    constraintBreakdown: Record<string, number>;
    inputConstraintFactor: number;
    maxAccountsPerHandler: number;
    rawRiskScore: number;
    totalAmountHandlers: number;
    totalConstraints: number;
    totalHandlersFound: number;
}

export interface OperationalSecurityMetrics {
    controlHandlers: number;
    filesAnalyzed: number;
    filesSkipped: number;
    opsecFactor: number;
    pauseCheckPatterns: string[];
    pauseChecks: number;
    rawRiskScore: number;
    sysvarAccessTypes: Record<string, string>;
    sysvarDependencies: number;
    totalHandlersFound: number;
}

export interface PrivilegedRolesMetrics {
    acFactor: number;
    handlersWithCloses: string[];
    handlersWithManualChecks: string[];
    rawRiskScore: number;
    totalAccountCloses: number;
    totalGatedHandlers: number;
    totalHandlersFound: number;
    totalManualChecks: number;
}

export interface UnsafeLowLevelMetrics {
    bytemuckUsage: number;
    ffiCalls: number;
    filesAnalyzed: number;
    filesSkipped: number;
    libcUsage: number;
    manualMemoryOps: number;
    memTransmute: number;
    memZeroed: number;
    nestedUnsafeBlocks: number;
    pointerArithmetic: number;
    ptrOperations: number;
    totalFfiFunctions: number;
    totalRawPointers: number;
    totalUnsafeBlocks: number;
    totalUnsafeFunctions: number;
    totalUnsafeImpls: number;
    totalUnsafeOperations: number;
    totalUnsafeTraits: number;
    transmuteUsage: number;
    unsafeComplexityScore: number;
    unsafeFactor: number;
    unsafePatternBreakdown: Record<string, number>;
    zeroCopyPatterns: number;
}

export interface UpgradeabilityMetrics {
    anchorUpgradeablePatterns: number;
    authorityTransferFunctions: number;
    emergencyUpgradeFunctions: number;
    filesAnalyzed: number;
    filesSkipped: number;
    governanceAuthorities: number;
    governanceMaturityScore: number;
    governanceProgramCalls: number;
    governanceVotingPatterns: number;
    multisigAuthorities: number;
    programUpgradeCalls: number;
    singleKeyAuthorities: number;
    timelockDetection: number;
    timelockedAuthorities: number;
    totalUpgradeAuthorities: number;
    totalUpgradeablePrograms: number;
    unknownAuthorities: number;
    upgradeControlFunctions: number;
    upgradeControlScore: number;
    upgradeDelayPatterns: number;
    upgradePauseFunctions: number;
    upgradeabilityPatternBreakdown: Record<string, number>;
    upgradeabilityRiskScore: number;
    upgradeableLoaderUsage: number;
}

export interface RustAnalysisFactors {
    numFunctions: number;
    totalLinesOfCode: number;
    complexity?: ComplexityMetrics;
    accessControl?: AccessControlMetrics;
    errorHandling?: ErrorHandlingMetrics;
    dependencies?: DependencyMetrics;
    cpiCalls?: CpiCallMetrics;
    assetTypes?: AssetTypesMetrics;
    modularity?: ModularityMetrics;
    pdaSeeds?: PdaSeedsMetrics;
    invariantsAndRiskParams?: InvariantsAndRiskParamsMetrics;
    arithmeticOperations?: ArithmeticOperationsMetrics;
    composability?: ComposabilityMetrics;
    dosResourceLimits?: DosResourceLimitsMetrics;
    externalIntegration?: ExternalIntegrationMetrics;
    inputConstraints?: InputConstraintsMetrics;
    operationalSecurity?: OperationalSecurityMetrics;
    privilegedRoles?: PrivilegedRolesMetrics;
    unsafeLowLevel?: UnsafeLowLevelMetrics;
    upgradeability?: UpgradeabilityMetrics;
    // Allow for additional dynamic properties
    [key: string]: unknown;
}

// Constraint Density Factor specific types
export interface AssertionDetail {
    file: string;
    line: number;
    macroName: string;
    expression: string;
    complexityScore: number;
}

export interface ConstraintDensityMetrics {
    constraintDensityFactor: number;
    totalAssertions: number;
    totalAssertionComplexityScore: number;
    requireMacros: number;
    requireEqMacros: number;
    assertMacros: number;
    assertEqMacros: number;
    arithmeticOperations: number;
    safeMathCalls: number;
    comparisonsLogic: number;
    functionCalls: number;
    assertionDetails: AssertionDetail[];
    filesAnalyzed: number;
    filesSkipped: number;
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
    [key: string]: unknown;
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
    static_analysis_scores?: {
        structural: {
            loc_factor: number;
            total_functions_factor: number;
            code_complexity_factor: number;
            modularity_factor: number;
            dependency_security_factor: number;
        };
        security: {
            access_control_factor: number;
            pda_complexity_factor: number;
            cpi_factor: number;
            input_constraints_factor: number;
            arithmatic_factor: number;
            priviliged_roles_factor: number;
            unsafe_lowlevel_factor: number;
            error_handling_factor: number;
        };
        systemic: {
            upgradeability_factor: number;
            external_integration_factor: number;
            composability_factor: number;
            dos_resource_limits_factor: number;
            operational_security_factor: number;
        };
        economic: {
            asset_types_factor: number;
            invariants_risk_factor: number;
        };
    };
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
