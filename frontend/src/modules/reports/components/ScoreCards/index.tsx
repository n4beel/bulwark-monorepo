import { getScoreColor } from '@/utils';
import { Database, DollarSign, Layers, Shield } from 'lucide-react';
import { JSX } from 'react';
import { StaticAnalysisReport } from '@/types/api';

interface ScoreCardsProps {
  report: StaticAnalysisReport;
  getScoreColor: (score: number) => string;
}

const ICONS: Record<string, JSX.Element> = {
  structural: <Layers className="w-6 h-6 text-blue-600 mr-3" />,
  security: <Shield className="w-6 h-6 text-red-600 mr-3" />,
  systemic: <Database className="w-6 h-6 text-purple-600 mr-3" />,
  economic: <DollarSign className="w-6 h-6 text-green-600 mr-3" />,
};

const WEIGHTS: Record<string, string> = {
  structural: 'Structural Complexity (weightage: 20/100)',
  security: 'Security Analysis Complexity (weightage: 30/100)',
  systemic: 'Systemic Analysis (weightage: 20/100)',
  economic: 'Economic Score',
};

export default function ScoreCards({ report }: ScoreCardsProps) {
  const categories = Object.keys(report?.static_analysis_scores ?? {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((key) => {
        const score = (report?.scores as any)?.[key] ?? 0;
        const subScores = (report?.static_analysis_scores as any)?.[key] ?? {};
        const colorClass = getScoreColor(score);
        const colorFill = colorClass.split(' ')[1] || 'bg-gray-400';

        return (
          <div key={key} className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {ICONS[key] ?? (
                  <Layers className="w-6 h-6 text-gray-500 mr-3" />
                )}
                <h3 className="text-lg font-normal text-[var(--black)]">
                  {WEIGHTS[key] ?? key}
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
              >
                {score.toFixed(1)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colorFill}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>

            {/* Sub Factors */}
            {/* Sub Factors */}
            <div className="space-y-2 text-sm">
              {Object.keys(subScores).map((subKey) => {
                const value =
                  typeof subScores[subKey] === 'number'
                    ? subScores[subKey]
                    : null;
                const colorClass =
                  value !== null ? getScoreColor(value) : 'text-gray-500';

                return (
                  <div key={subKey} className="flex justify-between">
                    <span className="text-[var(--black)] font-medium capitalize">
                      {subKey.replace(/_/g, ' ')}:
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md text-xs ${colorClass}`}
                    >
                      {value !== null ? value.toFixed(2) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
