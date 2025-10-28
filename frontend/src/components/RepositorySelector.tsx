"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, GitBranch, Lock, Globe, Calendar } from "lucide-react";
import { GitHubRepository } from "@/types/api";
import { githubApi } from "@/services/api";

interface RepositorySelectorProps {
  accessToken: string;
  onSelect: (repo: GitHubRepository) => Promise<void> | void;
  onBack: () => void;
}

export default function RepositorySelector({
  accessToken,
  onSelect,
  onBack,
}: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingRepoId, setAnalyzingRepoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadRepositories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const repos = await githubApi.getUserRepositories(accessToken);
      setRepositories(repos);
      setFilteredRepos(repos);
    } catch (err) {
      setError("Failed to load repositories. Please check your access token.");
      console.error("Error loading repositories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  useEffect(() => {
    const filtered = repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepos(filtered);
  }, [searchTerm, repositories]);

  const handleAnalyze = async (repo: GitHubRepository) => {
    try {
      setAnalyzingRepoId(repo.id);
      await onSelect(repo);
    } finally {
      setAnalyzingRepoId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Solidity: "bg-purple-500",
      Rust: "bg-orange-500",
      Python: "bg-green-500",
      Go: "bg-cyan-500",
    };
    return colors[language] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading repositories...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Select Repository
          </h2>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Repo List */}
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No repositories found matching your search."
                : "No repositories found."}
            </div>
          ) : (
            filteredRepos.map((repo) => {
              const isAnalyzingThis = analyzingRepoId === repo.id;
              const disableAll = analyzingRepoId !== null && !isAnalyzingThis;

              return (
                <div
                  key={repo.id}
                  className={`border border-gray-300 rounded-lg p-5 transition-all bg-gray-50 ${
                    disableAll
                      ? "opacity-60"
                      : "hover:border-blue-400 hover:shadow-lg hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <GitBranch className="w-4 h-4 text-blue-500 mr-2" />
                        <h3 className="font-bold text-gray-900 text-lg">
                          {repo.name}
                        </h3>
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-gray-500 ml-2" />
                        ) : (
                          <Globe className="w-4 h-4 text-gray-500 ml-2" />
                        )}
                      </div>

                      {repo.description && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2 font-medium">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-700">
                        {repo.language && (
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full ${getLanguageColor(
                                repo.language
                              )} mr-2`}
                            ></div>
                            <span className="font-medium">{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                          <span className="font-medium">
                            Updated {formatDate(repo.updated_at)}
                          </span>
                        </div>
                        <div className="font-medium">{repo.size} KB</div>
                      </div>
                    </div>

                    {/* Analyze button */}
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(repo);
                        }}
                        disabled={disableAll || isAnalyzingThis}
                        className={`px-4 py-2 rounded-md text-white flex items-center justify-center transition-colors ${
                          isAnalyzingThis
                            ? "bg-blue-400 cursor-wait"
                            : disableAll
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        }`}
                      >
                        {isAnalyzingThis ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                              ></path>
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          "Analyze"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {filteredRepos.length} of {repositories.length} repositories
        </div>
      </div>
    </div>
  );
}
