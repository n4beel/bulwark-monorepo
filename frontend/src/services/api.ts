import axios from 'axios';
import { PreAuditReport, GitHubRepository, GitHubRepositoryContent, GenerateReportRequest, StaticAnalysisReport, StaticAnalysisDto } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const scopingApi = {
    // Health check
    health: async () => {
        const response = await api.post('/scoping/health');
        return response.data;
    },

    // Generate pre-audit report
    generateReport: async (request: GenerateReportRequest): Promise<PreAuditReport> => {
        const response = await api.post('/scoping/generate-report', request);
        return response.data;
    },
};

export const staticAnalysisApi = {
    // Analyze Rust contract
    analyzeRustContract: async (request: StaticAnalysisDto): Promise<StaticAnalysisReport> => {
        const response = await api.post('/static-analysis/analyze-rust-contract', request);
        return response.data;
    },

    // Get all reports
    getAllReports: async (): Promise<StaticAnalysisReport[]> => {
        const response = await api.post('/static-analysis/reports');
        return response.data;
    },
};

export const authApi = {
    // Get GitHub OAuth URL
    getGitHubAuthUrl: async (): Promise<{ authUrl: string }> => {
        const response = await api.get('/auth/github/url');
        return response.data;
    },

    // Validate GitHub token
    validateToken: async (token: string): Promise<{ valid: boolean; user?: unknown; error?: string }> => {
        const response = await api.get(`/auth/validate?token=${encodeURIComponent(token)}`);
        return response.data;
    },
};

interface ContractFile {
    path: string;
    name: string;
    size: number;
    language: string;
}

interface ContentItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
    contents?: ContentItem[];
}

export const uploadApi = {
    // Step 1: Upload and discover files (like GitHub file discovery)
    discoverFiles: async (file: File): Promise<{ extractedPath: string; contractFiles: ContractFile[] }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/uploads/discover-files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Convert the backend response to the expected format
        const contractFiles: ContractFile[] = (response.data.contract_files || []).map((filePath: string) => {
            // Extract file name from path
            const fileName = filePath.split('/').pop() || filePath;

            // Determine language from file extension
            let language = 'Unknown';
            if (fileName.endsWith('.rs')) {
                language = 'Rust (Solana/Near)';
            } else if (fileName.endsWith('.sol')) {
                language = 'Solidity (EVM)';
            }

            // Find file size from contents if available
            let size = 0;
            const findFileInContents = (contents: ContentItem[], targetPath: string): ContentItem | null => {
                for (const item of contents) {
                    if (item.path === targetPath && item.type === 'file') {
                        return item;
                    }
                    if (item.contents) {
                        const found = findFileInContents(item.contents, targetPath);
                        if (found) return found;
                    }
                }
                return null;
            };

            const fileInfo = findFileInContents(response.data.contents || [], filePath);
            if (fileInfo) {
                size = fileInfo.size;
            }

            return {
                path: filePath,
                name: fileName,
                size: size,
                language: language
            };
        });

        return {
            extractedPath: response.data.extractedPath,
            contractFiles: contractFiles
        };
    },

    // Step 2: Analyze selected uploaded contracts (like GitHub static analysis)
    analyzeUploadedContracts: async (extractedPath: string, selectedFiles: string[]): Promise<StaticAnalysisReport> => {
        const response = await api.post('/static-analysis/analyze-uploaded-contract', {
            extractedPath,
            selectedFiles,
            analysisOptions: {
                includeTests: false,
                includeDependencies: true,
                depth: 'deep'
            }
        });
        return response.data;
    },
};

export const githubApi = {
    // Get user repositories
    getUserRepositories: async (accessToken: string): Promise<GitHubRepository[]> => {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            params: {
                sort: 'updated',
                per_page: 100,
            },
        });
        return response.data;
    },

    // Get specific repository info
    getRepository: async (owner: string, repo: string, accessToken: string): Promise<GitHubRepository> => {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        return response.data;
    },

    // Get repository contents
    getRepositoryContents: async (owner: string, repo: string, accessToken: string, path: string = ''): Promise<GitHubRepositoryContent[]> => {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        return response.data;
    },
};
