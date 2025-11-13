'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStoredUser, 
  fetchUserRepositories, 
  analyzeRepository,
  parseGitHubUrl,
  type User,
  type GitHubRepo,
  type AnalysisReport,
  type AnalysisRequest,
} from '@/lib/auth';

type AnalysisMode = 'my-repos' | 'public-url';

export default function AnalyzePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('public-url');
  
  // My Repos state
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Public URL state
  const [publicUrl, setPublicUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    
    // Auto-select my-repos mode if user has GitHub connected
    if (storedUser?.githubId) {
      setMode('my-repos');
    }
  }, []);

  useEffect(() => {
    // Fetch repositories when switching to my-repos mode
    if (mode === 'my-repos' && user?.githubId && repositories.length === 0) {
      loadRepositories();
    }
  }, [mode, user]);

  const loadRepositories = async () => {
    if (!user?.jwtToken) {
      setReposError('GitHub token not found. Please reconnect your GitHub account.');
      return;
    }

    setLoadingRepos(true);
    setReposError(null);
    
    try {
      const repos = await fetchUserRepositories(user.jwtToken);
      setRepositories(repos);
    } catch (error: any) {
      console.error('Failed to fetch repositories:', error);
      setReposError(error.response?.data?.message || 'Failed to fetch repositories. Please try again.');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAnalyzeMyRepo = async () => {
    if (!selectedRepo || !user) {
      return;
    }

    const [owner, repo] = selectedRepo.full_name.split('/');
    const request: AnalysisRequest = {
      owner,
      repo,
      // Include access token for private repos
      accessToken: selectedRepo.private ? user.jwtToken : undefined,
    };

    await performAnalysis(request);
  };

  const handleAnalyzePublicUrl = async () => {
    setUrlError(null);
    
    const parsed = parseGitHubUrl(publicUrl);
    if (!parsed) {
      setUrlError('Invalid GitHub URL. Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo or owner/repo)');
      return;
    }

    const request: AnalysisRequest = {
      owner: parsed.owner,
      repo: parsed.repo,
      // No access token for public repos
    };

    await performAnalysis(request);
  };

  const performAnalysis = async (request: AnalysisRequest) => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisReport(null);

    try {
      const report = await analyzeRepository(request);
      setAnalysisReport(report);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Analysis failed. Please try again.';
      setAnalysisError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredRepos = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Repository Analysis</h1>
              <p className="text-gray-600 mt-1">Analyze Rust smart contracts for security and complexity</p>
            </div>
            <button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors text-sm font-medium"
            >
              {user ? 'Back to Dashboard' : 'Home'}
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Analysis Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('my-repos')}
              disabled={!user?.githubId}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'my-repos'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } ${!user?.githubId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Repositories</h3>
              <p className="text-sm text-gray-600">
                {user?.githubId 
                  ? 'Select from your GitHub repositories'
                  : 'Connect your GitHub account to use this feature'
                }
              </p>
            </button>

            <button
              onClick={() => setMode('public-url')}
              className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                mode === 'public-url'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Public Repository URL</h3>
              <p className="text-sm text-gray-600">
                Analyze any public GitHub repository by URL
              </p>
            </button>
          </div>
        </div>

        {/* My Repos Mode */}
        {mode === 'my-repos' && user?.githubId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Repository</h2>
            
            {loadingRepos ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your repositories...</p>
              </div>
            ) : reposError ? (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{reposError}</span>
                </div>
                <button
                  onClick={loadRepositories}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Retry
                </button>
              </div>
            ) : repositories.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p>No repositories found.</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

                {/* Repository List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedRepo?.id === repo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                            {repo.private && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Private
                              </span>
                            )}
                            {repo.language && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {repo.stargazers_count}
                            </span>
                            <span>
                              Updated {new Date(repo.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredRepos.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No repositories match your search.</p>
                  )}
                </div>

                {/* Analyze Button */}
                {selectedRepo && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAnalyzeMyRepo}
                      disabled={analyzing}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        `Analyze ${selectedRepo.name}`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Public URL Mode */}
        {mode === 'public-url' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Repository URL</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository URL
                </label>
                <input
                  id="repoUrl"
                  type="text"
                  placeholder="https://github.com/owner/repository or owner/repository"
                  value={publicUrl}
                  onChange={(e) => {
                    setPublicUrl(e.target.value);
                    setUrlError(null);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                    urlError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {urlError && (
                  <p className="mt-2 text-sm text-red-600">{urlError}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Examples: <code className="bg-gray-100 px-2 py-0.5 rounded">https://github.com/solana-labs/solana</code> or <code className="bg-gray-100 px-2 py-0.5 rounded">solana-labs/solana</code>
                </p>
              </div>

              <button
                onClick={handleAnalyzePublicUrl}
                disabled={analyzing || !publicUrl}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Repository'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Error */}
        {analysisError && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Analysis Failed</p>
                <p className="mt-1 text-sm">{analysisError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisReport && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
            
            {/* Repository Info */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{analysisReport.repository}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Language: <span className="font-medium">{analysisReport.language}</span> • 
                    Framework: <span className="font-medium">{analysisReport.framework}</span>
                  </p>
                  {analysisReport.commitHash && (
                    <p className="text-sm text-gray-600 mt-1">
                      Commit: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{analysisReport.commitHash.substring(0, 8)}</code>
                    </p>
                  )}
                </div>
                <a
                  href={analysisReport.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  View on GitHub ↗
                </a>
              </div>
            </div>

            {/* Rust Analysis */}
            {analysisReport.rust_analysis && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Rust Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Lines of Code</p>
                    <p className="text-2xl font-bold text-blue-600">{analysisReport.rust_analysis.total_lines_of_code.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Functions</p>
                    <p className="text-2xl font-bold text-green-600">{analysisReport.rust_analysis.total_functions.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-4 ${analysisReport.rust_analysis.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm text-gray-600 mb-1">Analysis Status</p>
                    <p className={`text-lg font-bold ${analysisReport.rust_analysis.success ? 'text-green-600' : 'text-red-600'}`}>
                      {analysisReport.rust_analysis.success ? '✓ Success' : '✗ Failed'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {analysisReport.ai_analysis && analysisReport.ai_analysis.success && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Documentation Clarity</span>
                      <span className="text-sm font-medium">{Math.round(analysisReport.ai_analysis.documentation_clarity * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analysisReport.ai_analysis.documentation_clarity * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Testing Coverage</span>
                      <span className="text-sm font-medium">{Math.round(analysisReport.ai_analysis.testing_coverage * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${analysisReport.ai_analysis.testing_coverage * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Financial Logic Complexity</span>
                      <span className="text-sm font-medium">{Math.round(analysisReport.ai_analysis.financial_logic_complexity * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${analysisReport.ai_analysis.financial_logic_complexity * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Attack Vector Risk</span>
                      <span className="text-sm font-medium">{Math.round(analysisReport.ai_analysis.attack_vector_risk * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${analysisReport.ai_analysis.attack_vector_risk * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Analysis Performance</h4>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>Time: <span className="font-medium">{(analysisReport.performance.analysisTime / 1000).toFixed(2)}s</span></span>
                <span>Memory: <span className="font-medium">{(analysisReport.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB</span></span>
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setAnalysisReport(null);
                  setSelectedRepo(null);
                  setPublicUrl('');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium"
              >
                Analyze Another Repository
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

