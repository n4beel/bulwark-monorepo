// @ts-nocheck

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
  complexity: "low" | "medium" | "high";
}

export interface AuditEstimate {
  duration: {
    min: number;
    max: number;
    unit: "days";
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
    currency: "USD";
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
  type: "file" | "dir";
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
    depth?: "shallow" | "medium" | "deep";
  };
}

export interface OracleUsage {
  oracle: string;
  functions: string[];
  riskLevel: "low" | "medium" | "high";
}

export interface DeFiPattern {
  type: string;
  complexity: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
}

export interface EconomicRiskFactor {
  type: string;
  severity: "low" | "medium" | "high";
  count: number;
  weight: number;
}

export interface RiskFactor {
  type: string;
  severity: "low" | "medium" | "high";
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
      complexity: "low" | "medium" | "high";
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
  [key: string]: unknown;
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

export interface AIHotspot {
  file: string;
  lines: string;
  risk_score: number;
  components: string[];
}

export interface AIAnalysisFactors {
  highRiskHotspots?: AIHotspot[];
  mediumRiskHotspots?: AIHotspot[];
  recommendations?: string[];
  documentation_clarity?: number;
  testing_coverage?: number;
  financial_logic_complexity?: number;
  attack_vector_risk?: number;
  value_at_risk?: number;
}

export interface AIAnalysis {
  engine: string;
  version: string;
  success: boolean;
  error?: string | null;
  analysisFactors: AIAnalysisFactors;
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

// Main Report Interface
export interface StaticAnalysisReport {
  _id: string;
  repository: string;
  repositoryUrl: string;
  language: string;
  framework: string;
  scores: Scores;
  report: Result;
  static_analysis_scores: StaticAnalysisScores;
  analysis_engine: string;
  analyzer_version: string;
  analysis_date: string;
  rust_analysis?: RustAnalysis;
  ai_analysis?: AIAnalysis;
  performance: Performance;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Scores Interface
export interface Scores {
  structural: number;
  security: number;
  systemic: number;
  economic: number;
  total: number;
}

// Result Interface
export interface Result {
  filesCount: number;
  auditEffort: AuditEffort;
  hotspots: Hotspots;
  receiptId: string;
}

// export interface AuditEffort {
//   timeRange: {
//     minimumDays: number;
//     maximumDays: number;
//   };
//   resourceRange: {
//     minimumCount: number;
//     maximumCount: number;
//   };
//   totalCost: number;
// }

export interface AuditEffort {
  lowerAuditEffort: {
    timeRange: {
      minimumDays: number;
      maximumDays: number;
    };
    resources: number;
    costRange: {
      minimumCost: number;
      maximumCost: number;
    };
  };
  upperAuditEffort: {
    timeRange: {
      minimumDays: number;
      maximumDays: number;
    };

    resources: number;
    costRange: {
      minimumCost: number;
      maximumCost: number;
    };
  };
}
export interface Hotspots {
  totalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowPriorityCount: number;
}

// Static Analysis Scores Interface
export interface StaticAnalysisScores {
  structural: StructuralScores;
  security: SecurityScores;
  systemic: SystemicScores;
  economic: EconomicScores;
}

export interface StructuralScores {
  loc_factor: number;
  total_functions_factor: number;
  code_complexity_factor: number;
  modularity_factor: number;
  dependency_security_factor: number;
}

export interface SecurityScores {
  access_control_factor: number;
  pda_complexity_factor: number;
  cpi_factor: number;
  input_constraints_factor: number;
  arithmatic_factor: number;
  priviliged_roles_factor: number;
  unsafe_lowlevel_factor: number;
  error_handling_factor: number;
}

export interface SystemicScores {
  upgradeability_factor: number;
  external_integration_factor: number;
  composability_factor: number;
  dos_resource_limits_factor: number;
  operational_security_factor: number;
}

export interface EconomicScores {
  asset_types_factor: number;
  invariants_risk_factor: number;
}

// Rust Analysis Interface
export interface RustAnalysis {
  engine: string;
  version: string;
  success: boolean;
  error: string | null;
  analysisFactors: RustAnalysisFactors;
  total_lines_of_code: number;
  total_functions: number;
}

export interface RustAnalysisFactors {
  accessControl: AccessControl;
  arithmeticOperations: ArithmeticOperations;
  assetTypes: AssetTypes;
  complexity: Complexity;
  composability: Composability;
  cpiCalls: CpiCalls;
  dependencies: Dependencies;
  dosResourceLimits: DosResourceLimits;
  errorHandling: ErrorHandling;
  externalIntegration: ExternalIntegration;
  inputConstraints: InputConstraints;
  invariantsAndRiskParams: InvariantsAndRiskParams;
  modularity: Modularity;
  numFunctions: number;
  operationalSecurity: OperationalSecurity;
  pdaSeeds: PdaSeeds;
  privilegedRoles: PrivilegedRoles;
  totalLinesOfCode: number;
  unsafeLowLevel: UnsafeLowLevel;
  upgradeability: Upgradeability;
}

export interface AccessControl {
  accessControlFactor: number;
  accountCloseCount: number;
  gatedHandlerCount: number;
  manualCheckCount: number;
  uniqueRoleCount: number;
  uniqueRoles: string[];
}

export interface ArithmeticOperations {
  arithmeticFactor: number;
  highRiskOpsCount: number;
  mathHandlers: any[];
  mediumRiskOpsCount: number;
  rawRiskScore: number;
  totalHandlersFound: number;
  totalMathHandlers: number;
}

export interface AssetTypes {
  assetTypesFactor: number;
  customAssetDefinitions: number;
  distinctAssetStandards: number;
  filesAnalyzed: number;
  filesSkipped: number;
  usesMetaplexNft: boolean;
  usesSplToken: boolean;
  usesSplToken2022: boolean;
}

export interface Complexity {
  anchorInstructionHandlers: number;
  avgAnchorConstraintComplexity: number;
  avgCognitiveComplexity: number;
  avgCyclomaticComplexity: number;
  maxAnchorConstraintComplexity: number;
  maxCognitiveComplexity: number;
  maxCyclomaticComplexity: number;
  totalFunctions: number;
}

export interface Composability {
  composabilityFactor: number;
  filesAnalyzed: number;
  filesSkipped: number;
  multiCpiHandlersCount: number;
  rawRiskScore: number;
  totalHandlersFound: number;
}

export interface CpiCalls {
  associatedTokenProgramCpis: number;
  cpiComplexityScoreRaw: number;
  cpiFactor: number;
  otherProgramCpis: number;
  programTargets: string[];
  signedCpiCalls: number;
  systemProgramCpis: number;
  tokenProgramCpis: number;
  totalCpiCalls: number;
  uniquePrograms: number;
  unsignedCpiCalls: number;
}

export interface Dependencies {
  dependencyFactor: number;
  externalIntegrationFactor: number;
  tier1Crates: string[];
  tier1Dependencies: number;
  tier1_5Crates: string[];
  tier1_5Dependencies: number;
  tier2Crates: string[];
  tier2Dependencies: number;
  tier3Crates: string[];
  tier3Dependencies: number;
  tier4Crates: string[];
  tier4Dependencies: number;
  totalDependencies: number;
}

export interface DosResourceLimits {
  dynamicSpaceAccounts: number;
  filesAnalyzed: number;
  filesSkipped: number;
  handlersWithLoops: number;
  handlersWithVecParams: number;
  maxConstantSpace: number;
  rawRiskScore: number;
  resourceFactor: number;
  totalHandlersFound: number;
}

export interface ErrorHandling {
  errorHandlingFactor: number;
  filesAnalyzed: number;
  filesSkipped: number;
  rawRiskScore: number;
  totalInvariants: number;
  totalRequireEqMacros: number;
  totalRequireMacros: number;
}

export interface ExternalIntegration {
  allbridgeIntegrations: number;
  chainlinkOracleIntegrations: number;
  crossProgramInvocations: number;
  externalCpiCalls: number;
  externalDependencyScore: number;
  externalProgramReferences: number;
  filesAnalyzed: number;
  filesSkipped: number;
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

export interface InputConstraints {
  accountStructLengths: any[];
  avgAccountsPerHandler: number;
  inputConstraintFactor: number;
  maxAccountsPerHandler: number;
  rawRiskScore: number;
  totalAmountHandlers: number;
  totalConstraints: number;
  totalHandlersFound: number;
}

export interface InvariantsAndRiskParams {
  arithmeticOperations: number;
  assertEqMacros: number;
  assertMacros: number;
  assertionDetails: any[];
  comparisonsLogic: number;
  constraintDensityFactor: number;
  filesAnalyzed: number;
  filesSkipped: number;
  functionCalls: number;
  requireEqMacros: number;
  requireMacros: number;
  safeMathCalls: number;
  totalAssertionComplexityScore: number;
  totalAssertions: number;
}

export interface Modularity {
  anchorModularityScore: number;
  avgLinesPerFile: number;
  externalDependencies: number;
  filesWithHandlers: number;
  instructionHandlerDensity: number;
  internalCrossReferences: number;
  maxNestingDepth: number;
  modularityScore: number;
  totalFiles: number;
  totalImports: number;
  totalInstructionHandlers: number;
  totalModules: number;
}

export interface OperationalSecurity {
  controlHandlers: number;
  filesAnalyzed: number;
  filesSkipped: number;
  opsecFactor: number;
  pauseCheckPatterns: any[];
  pauseChecks: number;
  rawRiskScore: number;
  sysvarDependencies: number;
  totalHandlersFound: number;
}

export interface PdaSeeds {
  distinctSeedPatterns: number;
  pdaComplexityFactor: number;
  seedPatterns: any[];
  totalPdaAccounts: number;
  totalSeedComplexityScore: number;
}

export interface PrivilegedRoles {
  acFactor: number;
  handlersWithCloses: any[];
  handlersWithManualChecks: any[];
  rawRiskScore: number;
  totalAccountCloses: number;
  totalGatedHandlers: number;
  totalHandlersFound: number;
  totalManualChecks: number;
}

export interface UnsafeLowLevel {
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
  zeroCopyPatterns: number;
}

export interface Upgradeability {
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
  upgradeabilityPatternBreakdown: {
    [key: string]: number;
  };
  upgradeabilityRiskScore: number;
  upgradeableLoaderUsage: number;
}

// AI Analysis Interface
export interface AIAnalysis {
  engine: string;
  version: string;
  success: boolean;
  error: string | null | undefined;
  documentation_clarity: number;
  testing_coverage: number;
  financial_logic_complexity: number;
  attack_vector_risk: number;
  value_at_risk: number;
  game_theory_complexity: number;
}

// Performance Interface
export interface Performance {
  analysisTime: number;
  memoryUsage: number;
  typescript_analysis_included: boolean;
  rust_analysis_success: boolean;
}
