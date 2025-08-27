'use client';

import { useState, useEffect } from 'react';
import { Shield, Github, LogOut } from 'lucide-react';
import GitHubAuth from '@/components/GitHubAuth';
import RepositorySelector from '@/components/RepositorySelector';
import ContractFileSelector from '@/components/ContractFileSelector';
import ReportDisplay from '@/components/ReportDisplay';
import { GitHubRepository, PreAuditReport } from '@/types/api';
import { scopingApi, authApi } from '@/services/api';

type AppState = 'auth' | 'select' | 'fileSelect' | 'loading' | 'report';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('auth');
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [report, setReport] = useState<PreAuditReport | null>(null);
  const [error, setError] = useState('');

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    const userData = localStorage.getItem('github_user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAccessToken(token);
        setUser(user);
        setCurrentState('select');
      } catch (err) {
        // Invalid user data, clear storage
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
      }
    }
  }, []);

  const handleAuth = async (token: string) => {
    setAccessToken(token);

    // Get user info from localStorage or validate token
    const userData = localStorage.getItem('github_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
      } catch (err) {
        // Fallback: validate token and get user info
        try {
          const validation = await authApi.validateToken(token);
          if (validation.valid && validation.user) {
            setUser(validation.user);
            localStorage.setItem('github_user', JSON.stringify(validation.user));
          }
        } catch (err) {
          console.error('Failed to validate token:', err);
        }
      }
    }

    setCurrentState('select');
  };

  const handleRepoSelect = async (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setCurrentState('fileSelect');
  };

  const handleFileSelection = async (files: string[]) => {
    setSelectedFiles(files);
    setCurrentState('loading');
    setError('');

    try {
      const [owner, repoName] = selectedRepo!.full_name.split('/');
      const reportData = await scopingApi.generateReport({
        owner,
        repo: repoName,
        accessToken: accessToken,
        selectedFiles: files,
      });

      setReport(reportData);
      setCurrentState('report');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report. Please try again.');
      setCurrentState('fileSelect');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    setCurrentState('auth');
    setAccessToken('');
    setUser(null);
    setSelectedRepo(null);
    setReport(null);
    setError('');
  };

  const handleBackToAuth = () => {
    setCurrentState('auth');
    setAccessToken('');
    setUser(null);
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setError('');
  };

  const handleBackToSelect = () => {
    setCurrentState('select');
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setError('');
  };

  const handleBackToFileSelect = () => {
    setCurrentState('fileSelect');
    setSelectedFiles([]);
    setReport(null);
    setError('');
  };

  const handleNewAnalysis = () => {
    setCurrentState('select');
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">MySecurity Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar_url}
                      alt={user.name || user.login}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {user.name || user.login}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentState === 'auth' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Smart Contract Security Analysis
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get instant pre-audit reports with cost estimates, risk assessments, and recommendations
                for your smart contract projects.
              </p>
            </div>
            <GitHubAuth onAuth={handleAuth} />
          </div>
        )}

        {currentState === 'select' && (
          <RepositorySelector
            accessToken={accessToken}
            onSelect={handleRepoSelect}
            onBack={handleBackToAuth}
          />
        )}

        {currentState === 'fileSelect' && selectedRepo && (
          <ContractFileSelector
            repository={selectedRepo}
            accessToken={accessToken}
            onBack={handleBackToSelect}
            onProceed={handleFileSelection}
          />
        )}

        {currentState === 'loading' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing Repository
              </h3>
              <p className="text-gray-600">
                {selectedRepo?.full_name} • {selectedFiles.length} files selected • This may take a few moments...
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Cloning repository</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Analyzing selected contract files</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Generating audit estimates</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentState === 'report' && report && (
          <ReportDisplay
            report={report}
            onBack={handleBackToSelect}
            onNewAnalysis={handleNewAnalysis}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-4 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>MySecurity Tool • Smart Contract Security Analysis Platform</p>
            <p className="mt-1">Powered by advanced static analysis and AI-driven insights</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
