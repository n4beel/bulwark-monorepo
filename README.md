# 🛡️ MySecurity Platform - Comprehensive Project Analysis

## Executive Summary

**MySecurity** is a comprehensive smart contract security analysis platform that provides automated pre-audit assessment, complexity scoring, and audit cost/time estimation for Solana/Anchor smart contracts. The platform combines static analysis, AI-powered assessment, and blockchain storage to deliver actionable security insights.

---

## 🚀 CLI Installation

The Bulwark CLI tool allows you to analyze smart contracts directly from your terminal.

### Quick Install

**One-liner installation:**
```bash
curl -fsSL https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh | bash
```

**Or download manually:**

1. Visit the [Releases page](https://github.com/n4beel/bulwark-monorepo/releases)
2. Download the archive for your platform:
   - **Linux (x86_64)**: `bulwark-<version>-x86_64-unknown-linux-gnu.tar.gz`
   - **macOS (Intel)**: `bulwark-<version>-x86_64-apple-darwin.tar.gz`
   - **macOS (Apple Silicon)**: `bulwark-<version>-aarch64-apple-darwin.tar.gz`
3. Extract and install:
   ```bash
   tar xzf bulwark-*.tar.gz
   sudo mv bulwark /usr/local/bin/
   ```

### Quick Start

```bash
# Login (opens browser for OAuth)
bulwark login

# Analyze a project
bulwark analyze /path/to/your/project

# View configuration
bulwark config view

# Get help
bulwark --help
```

### Features

- ✅ **Local Analysis**: Analyze contracts without uploading code
- ✅ **AI-Powered**: GPT-4o analysis for risk assessment
- ✅ **Offline Support**: Queue results for later sync
- ✅ **Multiple Factors**: Analyze specific factors or categories
- ✅ **Beautiful Output**: Formatted receipts with scores and hotspots

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 + React 19 + TypeScript + Tailwind CSS       │  │
│  │  • GitHub OAuth Authentication                           │  │
│  │  • Repository Selection & Analysis                         │  │
│  │  • Report Visualization & Export                         │  │
│  │  • Dashboard with User Reports                           │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS/REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                     NestJS Backend Server                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Auth Module (GitHub OAuth + JWT)                      │  │
│  │  • User Management (MongoDB)                             │  │
│  │  • Static Analysis Orchestration                         │  │
│  │  • AI Analysis Integration                               │  │
│  │  • Arcium Storage Integration                            │  │
│  │  • Report Management & Export                            │  │
│  └───────┬──────────────┬──────────────┬────────────────────┘  │
└──────────┼──────────────┼──────────────┼───────────────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │ Rust        │ │ OpenAI     │ │ Arcium     │
    │ Analyzer    │ │ GPT-4o     │ │ Solana     │
    │ HTTP Server │ │ AI Service │ │ Storage    │
    └─────────────┘ └────────────┘ └────────────┘
```

---

## 📱 Frontend Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Lottie React

### Key Components

#### 1. **Authentication Flow**
- GitHub OAuth integration
- JWT token management
- Protected routes with `ProtectedRoute` component
- Auth state management via Redux

#### 2. **Main Features**
- **Repository Selector**: Browse and search GitHub repositories
- **Upload Flow**: Upload ZIP files for analysis
- **Analysis Progress**: Real-time progress tracking
- **Report Display**: Comprehensive report visualization
- **Dashboard**: User-specific report management
- **Export**: CSV export functionality

#### 3. **Report Visualization**
- **ScoreCards**: Display complexity scores (Structural, Security, Systemic, Economic)
- **AuditEffortCard**: Show audit timeline and cost estimates
- **HotspotCards**: Display security hotspots (High/Medium/Low risk)
- **ComplexityCard**: Visual complexity indicators
- **Receipt**: Transaction receipt display

### API Integration

The frontend communicates with the backend via:
- `POST /static-analysis/analyze-rust-contract` - Analyze GitHub repository
- `POST /static-analysis/analyze-uploaded-contract` - Analyze uploaded files
- `POST /static-analysis/reports` - Get all reports (user-filtered)
- `GET /static-analysis/reports/:id` - Get specific report
- `POST /static-analysis/export-csv` - Export reports to CSV
- `POST /auth/github/url` - Get GitHub OAuth URL
- `GET /auth/github/callback` - GitHub OAuth callback
- `POST /static-analysis/reports/:id/associate` - Associate report with user

---

## 🔧 Backend Architecture (NestJS)

### Module Structure

```
server/
├── src/
│   ├── app.module.ts              # Root module
│   ├── auth/                      # Authentication & Authorization
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts       # GitHub OAuth handling
│   │   └── auth.controller.ts     # Auth endpoints
│   ├── users/                     # User Management
│   │   ├── user.module.ts
│   │   ├── user.service.ts        # User CRUD + JWT generation
│   │   ├── schemas/user.schema.ts # MongoDB user schema
│   │   └── guards/                # JWT auth guards
│   ├── static-analysis/           # Core Analysis Module
│   │   ├── static-analysis.module.ts
│   │   ├── static-analysis.service.ts    # Main orchestration
│   │   ├── static-analysis.controller.ts # API endpoints
│   │   ├── static-analysis.utils.ts      # Complexity & estimation
│   │   ├── rust-analyzer.service.ts      # Rust analyzer integration
│   │   └── schemas/static-analysis.schema.ts
│   ├── ai-analysis/               # AI Analysis Module
│   │   ├── ai-analysis.service.ts # OpenAI GPT-4o integration
│   │   └── ai-analysis.module.ts
│   ├── arcium-storage/            # Blockchain Storage
│   │   ├── arcium-storage.service.ts # Arcium integration
│   │   └── arcium-storage.module.ts
│   ├── github/                    # GitHub Integration
│   │   ├── github.service.ts      # Repository cloning & metadata
│   │   └── github.module.ts
│   ├── uploads/                   # File Upload Handling
│   │   ├── uploads.service.ts
│   │   └── uploads.module.ts
│   └── database/                  # MongoDB Configuration
│       └── database.module.ts
```

### Key Services

#### 1. **StaticAnalysisService** (`static-analysis.service.ts`)
The core orchestration service that:
- Coordinates Rust analyzer, AI analysis, and Arcium storage
- Manages repository cloning and cleanup
- Aggregates analysis results
- Calculates complexity scores
- Stores reports in MongoDB

**Key Methods:**
- `analyzeRustContractWithWorkspace()`: Main entry point for GitHub repo analysis
- `analyzeUploadedContract()`: Handles uploaded ZIP file analysis
- `getAllReports(userId?)`: Retrieves reports (user-filtered if authenticated)
- `associateReportWithUser()`: Associates existing reports with users

#### 2. **StaticAnalysisUtils** (`static-analysis.utils.ts`)
Contains the core complexity calculation and audit estimation logic:

**Complexity Scoring:**
- **Structural Score** (20%): LOC, functions, cyclomatic complexity, modularity, dependencies
- **Security Score** (30%): Access control, PDA seeds, CPI calls, input validation, arithmetic ops, privileged roles, unsafe code, error handling
- **Systemic Score** (30%): Upgradability, external integrations, composability, DOS, operational security
- **Economic Score** (20%): Asset types, invariants & risk parameters

**Total Score Formula:**
```typescript
totalScore = (structuralScore * 0.20) + 
             (securityScore * 0.30) + 
             (systemicScore * 0.30) + 
             (economicScore * 0.20)
```

**Audit Estimation Algorithm:**
- Uses 5 data points with `medianComplexity` values: [16.98, 23.895, 35.01, 43.81, 50.62]
- Performs linear interpolation between bounding complexity values
- Handles edge cases (above max, below min)
- Calculates timelines for 2 and 3 auditors
- Estimates costs based on days × budget rates

#### 3. **AuthService** (`auth.service.ts`)
- GitHub OAuth token exchange
- GitHub user info retrieval
- OAuth URL generation

#### 4. **UserService** (`user.service.ts`)
- User creation/update from GitHub data
- JWT token generation and verification
- User lookup by ID or GitHub ID

#### 5. **GitHubService** (`github.service.ts`)
- Repository cloning
- Metadata retrieval
- Latest commit hash retrieval
- File content fetching
- Repository cleanup

---

## 🔬 Rust Analyzer (Static Analysis Engine)

### Architecture

```
rust-analyzer/
├── src/
│   ├── lib.rs                    # Core library
│   ├── analysis.rs               # Analyzer engine
│   ├── visitor.rs                # AST visitor pattern
│   ├── factors/                  # 23 Analysis Factors
│   │   ├── access_control.rs
│   │   ├── arithmetic.rs
│   │   ├── asset_types.rs
│   │   ├── composability.rs
│   │   ├── complexity.rs
│   │   ├── dependencies.rs
│   │   ├── dos_resource_limits.rs
│   │   ├── error_handling.rs
│   │   ├── external_integration.rs
│   │   ├── input_constraints.rs
│   │   ├── modularity.rs
│   │   ├── operational_security.rs
│   │   ├── pda_seeds.rs
│   │   ├── privileged_roles.rs
│   │   ├── unsafe_lowlevel.rs
│   │   ├── upgradeability.rs
│   │   └── lines_of_code.rs
│   ├── patterns.rs               # Pattern recognition
│   ├── metrics.rs                # Metrics calculation
│   └── output.rs                 # Report generation
└── src/bin/
    ├── server.rs                 # HTTP Server (Axum)
    └── cli.rs                    # CLI interface
```

### 23 Analysis Factors

The Rust analyzer evaluates 23 distinct factors:

#### **Structural Factors:**
1. **Total Lines of Code** - Raw code volume
2. **Function Count** - Number of functions/instruction handlers
3. **Cyclomatic Complexity** - Control flow complexity
4. **Modularity** - Code organization and module structure
5. **External Dependencies** - Dependency security classification

#### **Security Factors:**
6. **Access Control** - Handler access control patterns
7. **PDA Seeds** - PDA seed complexity and patterns
8. **CPI Calls** - Cross-program invocation analysis
9. **Input Constraints** - Input validation coverage
10. **Arithmetic Operations** - Overflow/underflow risks
11. **Privileged Roles** - Admin/authority patterns
12. **Unsafe/Low-Level Usage** - Unsafe code blocks
13. **Error Handling** - Error handling patterns

#### **Systemic Factors:**
14. **Upgradability** - Upgrade and governance patterns
15. **External Integration** - Oracle and external service integration
16. **Composability** - Inter-program complexity
17. **DOS & Resource Limits** - Resource exhaustion risks
18. **Operational Security** - Operational security factors

#### **Economic Factors:**
19. **Asset Types** - Number and types of assets
20. **Invariants & Risk Parameters** - Constraint density

#### **Additional Metrics:**
21. **Dependency Security Tiers** - 4-tier classification (Official → Security/Crypto → Popular → Unknown)
22. **Composability Patterns** - DeFi protocol interactions
23. **Statefulness Analysis** - State management complexity

### HTTP Server Endpoints

The Rust analyzer exposes:
- `GET /health` - Health check
- `POST /augment` - Main analysis endpoint (returns 23 factors)
- `GET /augment` - GET version of augment
- `GET /workspaces` - List available workspaces
- `GET /routes` - List available routes
- `POST /analyze` - Full repository analysis
- `POST /test` - Test shared volume
- `POST /test-direct` - Direct test endpoint

### Integration Flow

1. **Workspace Staging**: NestJS server stages repository files in shared workspace
2. **HTTP Request**: Server sends POST to `/augment` with `workspace_id`
3. **AST Analysis**: Rust analyzer parses Rust code using `syn` crate
4. **Factor Calculation**: All 23 factors calculated in parallel
5. **AI & SAST Analysis**: AI analysis and sol-azy SAST run in parallel
6. **JSON Response**: Returns factors, metadata, AI results, SAST results, and overridden fields
7. **Workspace Cleanup**: Server cleans up staged workspace

### SAST Integration (sol-azy)

The Rust analyzer integrates **sol-azy** CLI tool for Static Application Security Testing (SAST). SAST analysis runs automatically in parallel with AI analysis during the augment workflow.

#### Automatic Installation

sol-azy is automatically installed during the Rust build process via `build.rs` script:
- No manual installation required
- Version pinned for consistency (currently `0.1.0`)
- Works for both server and CLI binaries
- Build succeeds even if sol-azy installation fails (SAST features disabled)

#### Configuration

Environment variables (all optional):
- `SOLAZY_ENABLED` - Enable/disable SAST (default: `true`)
- `SOLAZY_PATH` - Custom path to sol-azy binary (default: `sol-azy` in PATH)
- `SOLAZY_RULES_DIR` - Path to directory containing custom `.star` rule files (optional)
  - If not set, sol-azy uses its built-in/default rules
  - If set, sol-azy will use rules from this directory instead of built-in rules
  - Alternatively, if a `rules/` directory exists in the workspace, it will be used automatically
- `SOLAZY_TIMEOUT_SECONDS` - Execution timeout in seconds (default: `60`)
- `SOLAZY_FULL_SCAN` - Set to `true` to disable `--syn-scan-only` flag (default: `false`, uses faster syn-scan-only mode)
- `SKIP_SOLAZY_INSTALL` - Skip automatic installation during build (for CI/CD)
- `SOLAZY_VERSION_OVERRIDE` - Override pinned version for testing

**Note:** sol-azy comes with built-in security rules by default. You can optionally provide custom rules by:
1. Setting `SOLAZY_RULES_DIR` environment variable to point to your custom rules directory
2. Creating a `rules/` directory in your workspace with `.star` rule files

#### SAST Results

SAST analysis results are included in:
- `/augment` endpoint response (`sast_results` field)
- CLI analysis output (`sast_results` field)
- MongoDB reports (`sast_analysis` field)

Results include:
- Security findings (critical, high, medium, low severity)
- Summary statistics
- Execution time
- sol-azy version information

#### Version Management

- Version is pinned in `analyzer/build.rs` (`SOLAZY_VERSION` constant)
- Update version by modifying the constant and rebuilding
- Test new versions in staging before production deployment
- Version mismatches are logged as warnings (build still succeeds)

---

## 🤖 AI Analysis Service

### Purpose
Provides high-level semantic analysis using OpenAI GPT-4o to complement static analysis.

### Analysis Dimensions

1. **Code Analysis** (`CodeMetrics`)
   - High/Medium/Low risk hotspots
   - Overall risk score
   - Recommendations
   - Findings

2. **Documentation Clarity** (`DocumentationMetrics`)
   - Code comments score
   - Function documentation score
   - README quality score
   - Security documentation score
   - Overall clarity score

3. **Testing Coverage** (`TestingMetrics`)
   - Unit test coverage
   - Integration test coverage
   - Test quality score
   - Edge case testing score
   - Security test score

4. **Financial Logic Intricacy** (`FinancialLogicMetrics`)
   - Mathematical complexity
   - Algorithm sophistication
   - Interest rate complexity
   - AMM pricing complexity
   - Reward distribution complexity
   - Risk management complexity

5. **Attack Vector Analysis** (`AttackVectorMetrics`)
   - Flash loan attack risk
   - Sandwich attack risk
   - Arbitrage opportunities
   - Economic exploit risk

6. **Value at Risk** (`ValueAtRiskMetrics`)
   - Asset volume complexity
   - Liquidity risk score
   - Market cap implications
   - Economic stakes score


---

## 🔐 Arcium Storage Integration

### Overview
Arcium provides confidential computing on Solana, allowing encrypted storage and computation of audit results.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              ArciumStorageService (NestJS)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • Solana Connection                              │  │
│  │  • Anchor Program Initialization                  │  │
│  │  • MXE Public Key Management                      │  │
│  │  • RescueCipher Encryption                        │  │
│  │  • Computation Definition Management              │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ Anchor Program Calls
┌──────────────────────────▼──────────────────────────────┐
│           Bulwark Storage Program (Solana)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • storeAuditResults()                            │  │
│  │  • retrieveByCommit()                            │  │
│  │  • ComputationDefinitionAccount                   │  │
│  │  • Encrypted Instruction Processing               │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Key Components

1. **Program ID**: `25kmZvexST8MZ1pbUbHECzapos78v2SMmySnxsSYr3vE`
2. **Cluster**: Devnet (offset: 1078779259)
3. **Encryption**: RescueCipher with X25519 key exchange
4. **Storage Format**: Compact binary structures optimized for Solana

### Data Structure

```typescript
interface AuditStorageData {
    auditEffort: {
        timeRange: { minimumDays, maximumDays },
        resourceRange: { minimumCount, maximumCount },
        totalCost: number
    },
    hotspots: {
        totalCount: number,
        highRiskCount: number,
        mediumRiskCount: number
    },
    commitHash: string // 64-char hex string (32 bytes)
}
```

### Storage Flow

1. **Encryption**: Data encrypted using RescueCipher with shared secret
2. **Instruction Creation**: `storeAuditResults` instruction prepared
3. **Account Resolution**: All required accounts (payer, MXE, mempool, etc.) resolved
4. **Transaction Signing**: Transaction signed with owner keypair
5. **Submission**: Transaction sent to Solana cluster
6. **Finalization**: Computation definition finalized via callback

---

## 📊 Complexity Calculation & Audit Estimation

### Complexity Score Calculation

#### Step 1: Factor Extraction
The Rust analyzer provides raw factor values (e.g., `totalLinesOfCode: 5420`, `numFunctions: 127`).

#### Step 2: Category Scoring

**Structural Score (20% weight):**
```typescript
structuralScore = (
    total_statement_count * 0.25 +
    number_of_functions * 0.25 +
    cyclomatic_complexity * 0.20 +
    modularity * 0.15 +
    external_dependencies * 0.15
)
```

**Security Score (30% weight):**
```typescript
securityScore = (
    access_controlled_handlers * 0.20 +
    PDA_seeds * 0.15 +
    CPI_calls * 0.15 +
    input_constraints * 0.15 +
    arithmetic_operations * 0.10 +
    privileged_roles * 0.10 +
    unsafe_low_level * 0.10 +
    error_handling * 0.05
)
```

**Systemic Score (30% weight):**
```typescript
systemicScore = (
    upgradability * 0.20 +
    external_integration_oracles * 0.30 +
    composability * 0.20 +
    DOS_resource_limits * 0.15 +
    operational_security * 0.15
)
```

**Economic Score (20% weight):**
```typescript
economicScore = (
    number_of_assets * 0.50 +
    invariants_risk_params * 0.50
)
```

#### Step 3: Total Score
```typescript
totalScore = (
    structuralScore * 0.20 +
    securityScore * 0.30 +
    systemicScore * 0.30 +
    economicScore * 0.20
)
```

### Audit Estimation Algorithm

The platform uses **historical audit data** to estimate timelines and costs:

#### Data Points (Median Complexity → Timeline Mapping)
```typescript
const data = [
    { medianComplexity: 16.98,  medianDays: 8,  skewedDays: 12.2 },
    { medianComplexity: 23.895, medianDays: 15, skewedDays: 24.6 },
    { medianComplexity: 35.01,  medianDays: 17, skewedDays: 28 },
    { medianComplexity: 43.81, medianDays: 20, skewedDays: 28 },
    { medianComplexity: 50.62,  medianDays: 30, skewedDays: 36 }
]
```

#### Algorithm Steps

1. **Find Bounding Values**: Locate the two data points where `totalScore` falls between their `medianComplexity` values
2. **Linear Interpolation**: Calculate timeline using linear interpolation:
   ```typescript
   slope = (totalScore - lower.medianComplexity) / 
           (upper.medianComplexity - lower.medianComplexity)
   medianDays = lower.medianDays + slope * (upper.medianDays - lower.medianDays)
   skewedDays = lower.skewedDays + slope * (upper.skewedDays - lower.skewedDays)
   ```

3. **Edge Cases**:
   - **Above Max**: Use last data point + extrapolation slope (1.468429)
   - **Below Min**: Use first data point - extrapolation slope (0.627746)

4. **Multiple Auditor Scenarios**:
   - **2 Auditors**: Base timeline (medianDays, skewedDays)
   - **3 Auditors**: Apply multiplier: `(1 - PHI) + PHI * (2/3)` where `PHI = 0.8`
     - Result: `medianDays3 = medianDays * 0.733` (roughly 27% faster)

5. **Cost Calculation**:
   ```typescript
   costPerWeek = (days / 5) * budgetRate
   totalCost = costPerWeek * numberOfAuditors
   
   Budget Rates:
   - Low: $2,500/week
   - High: $6,000/week
   ```

6. **Final Output**:
   ```typescript
   {
       lowerAuditEffort: {
           timeRange: { minimumDays, maximumDays },
           resources: 2,
           costRange: { minimumCost, maximumCost }
       },
       upperAuditEffort: {
           timeRange: { minimumDays, maximumDays },
           resources: 3,
           costRange: { minimumCost, maximumCost }
       }
   }
   ```

---

## 🔄 Complete Data Flow

### GitHub Repository Analysis Flow

```
1. User authenticates via GitHub OAuth
   ↓
2. User selects repository from GitHub
   ↓
3. Frontend sends: POST /static-analysis/analyze-rust-contract
   Body: { owner, repo, accessToken, selectedFiles? }
   ↓
4. Backend (StaticAnalysisService):
   a. Get repository info from GitHub API
   b. Get latest commit hash → create commit URL
   c. Clone repository to temp directory
   ↓
5. Stage workspace for Rust analyzer
   ↓
6. POST to Rust Analyzer HTTP Server: /augment
   Body: { workspace_id, selected_files?, api_version }
   ↓
7. Rust Analyzer:
   a. Parse Rust code using syn crate
   b. Calculate 23 analysis factors
   c. Return JSON response
   ↓
8. Backend receives Rust analysis results
   ↓
9. (Optional) AI Analysis:
   a. Prepare code context (top 15 files)
   b. Send to OpenAI GPT-4o
   c. Get semantic analysis results
   ↓
10. Calculate Complexity Scores:
    - Map Rust factors to 4 categories
    - Calculate weighted scores
    - Compute total score
    ↓
11. Estimate Audit Effort:
    - Find bounding complexity values
    - Interpolate timeline
    - Calculate costs for 2 & 3 auditors
    ↓
12. Create Report Object:
    {
        repository, repositoryUrl, commitHash, commitUrl,
        rust_analysis: { factors, scores },
        ai_analysis: { metrics },
        scores: { structural, security, systemic, economic, total },
        result: {
            lowerAuditEffort,
            upperAuditEffort,
            hotspots,
            receiptId,
            commitUrl
        }
    }
    ↓
13. Save to MongoDB
    ↓
14. (Optional) Store to Arcium:
    a. Encrypt audit data
    b. Create Solana transaction
    c. Submit to Arcium program
    ↓
15. Return report to frontend
    ↓
16. Frontend displays comprehensive report
```

### Upload Flow

Similar flow but:
- User uploads ZIP file instead of GitHub repo
- Files extracted to temp directory
- No commit hash retrieval (uses uploaded files)
- Same Rust analyzer and AI analysis steps

---

## 💾 Data Storage

### MongoDB (Primary Storage)

**Collections:**
1. **users** - User accounts
   - `githubId`, `githubUsername`, `email`, `name`, `avatarUrl`
   - `createdAt`, `updatedAt`

2. **staticanalysisreports** - Analysis reports
   - `repository`, `repositoryUrl`, `commitHash`, `commitUrl`
   - `userId` (optional - for user association)
   - `rust_analysis`, `ai_analysis`, `scores`, `result`
   - `performance` metrics
   - `createdAt`, `updatedAt`

### Solana/Arcium (Confidential Storage)

**Purpose**: Store encrypted audit results on-chain
**Program**: Bulwark Storage (`25kmZvexST8MZ1pbUbHECzapos78v2SMmySnxsSYr3vE`)
**Network**: Solana Devnet
**Encryption**: RescueCipher with X25519 key exchange

**Data Stored**:
- Audit effort estimates
- Hotspot counts
- Commit hash (for retrieval)

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **GitHub OAuth**:
   - User clicks "Connect GitHub"
   - Redirected to GitHub OAuth authorization
   - GitHub redirects back with authorization code
   - Backend exchanges code for access token

2. **User Creation**:
   - Backend fetches GitHub user info
   - Creates/updates user in MongoDB
   - Generates JWT token

3. **JWT Token**:
   - Contains: `userId`, `githubId`, `githubUsername`
   - Expires in: 7 days (configurable)
   - Sent in: `Authorization: Bearer <token>` header

### Authorization Guards

- **JwtAuthGuard**: Requires authentication (throws 401 if missing)
- **OptionalJwtAuthGuard**: Optional authentication (works with or without token)

### User Association

- Reports can be created without authentication (no `userId`)
- Users can associate reports later via `POST /reports/:id/associate`
- `getAllReports()` filters by user if authenticated, returns all if not

---

## 📈 Performance Characteristics

### Analysis Performance

**Rust Analyzer**:
- Small contract (1K LOC): ~100ms
- Medium contract (10K LOC): ~1-2s
- Large contract (100K LOC): ~10-20s
- Memory: 50-500MB (depending on project size)

**Full Analysis Pipeline**:
- Repository cloning: ~5-30s (depends on size)
- Rust analysis: ~1-20s
- AI analysis: ~10-30s (if enabled)
- Total: ~20-80s for typical contracts

### Scalability Considerations

- **Stateless Design**: NestJS server is stateless (can scale horizontally)
- **Shared Workspace**: Rust analyzer uses shared filesystem for workspace staging
- **MongoDB**: Can be scaled via replica sets or sharding
- **Solana**: Arcium storage is decentralized (scales with Solana network)

---

## 🎯 Key Features

### 1. Multi-Source Analysis
- **GitHub Repositories**: Direct integration with GitHub API
- **File Uploads**: ZIP file upload and analysis
- **Selective Analysis**: Users can select specific files to analyze

### 2. Comprehensive Scoring
- **4-Layer Scoring**: Structural, Security, Systemic, Economic
- **23 Analysis Factors**: Deep semantic analysis
- **AI Enhancement**: Semantic understanding of code quality

### 3. Accurate Estimation
- **Historical Data**: Based on real audit timelines
- **Linear Interpolation**: Precise estimation between data points
- **Multiple Scenarios**: 2 and 3 auditor options
- **Cost Ranges**: Low and high budget scenarios

### 4. User Management
- **GitHub Integration**: Seamless authentication
- **Report Association**: Link reports to users
- **Dashboard**: User-specific report management

### 5. Export & Sharing
- **CSV Export**: Export reports with selected factors
- **Report Sharing**: Unique report IDs for sharing
- **Commit Tracking**: Link reports to specific commits

---

## 🔮 Future Enhancements

### Planned Features
- Real-time WebSocket updates during analysis
- Historical trend analysis
- IDE integration (VS Code extension)
- Custom rule engine
- Parallel file processing in Rust analyzer
- Caching layer for incremental analysis
- Visual reporting dashboard enhancements

---

## 🛠️ Development & Deployment

### Technology Stack Summary

**Frontend**:
- Next.js 15, React 19, TypeScript
- Tailwind CSS 4, Redux Toolkit
- Axios for HTTP

**Backend**:
- NestJS 11, TypeScript
- MongoDB (Mongoose)
- JWT authentication
- Solana Web3.js, Anchor

**Analysis**:
- Rust (syn crate for AST parsing)
- Axum HTTP server
- OpenAI GPT-4o (optional)

**Storage**:
- MongoDB (primary)
- Solana/Arcium (confidential)

### Environment Variables

**Backend**:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `GIT_CLIENT_ID` - GitHub OAuth client ID
- `GIT_CLIENT_SECRET` - GitHub OAuth client secret
- `GIT_CALLBACK_URL` - GitHub OAuth callback URL
- `FRONTEND_URL` - Frontend URL for redirects
- `RUST_ANALYZER_URL` - Rust analyzer HTTP server URL
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `SOLANA_KEYPAIR_PATH` - Solana keypair file path
- `ARCIUM_IDL_PATH` - Arcium IDL file path

**Rust Analyzer**:
- `PORT` - HTTP server port (default: 8080)
- `SHARED_WORKSPACE_PATH` - Workspace staging directory

---

## 📝 Summary

MySecurity is a **production-ready** platform that combines:
- **Deep static analysis** (23 factors via Rust analyzer)
- **AI-powered insights** (GPT-4o semantic analysis)
- **Accurate estimation** (historical data-based interpolation)
- **Secure storage** (Arcium confidential computing)
- **User management** (GitHub OAuth + JWT)
- **Comprehensive reporting** (visualization + export)

The platform provides **actionable security insights** and **accurate audit estimates** for Solana/Anchor smart contracts, helping developers and auditors make informed decisions about security assessments.

---

**Last Updated**: October 31, 2025
**Version**: 0.2.0
