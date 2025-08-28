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
