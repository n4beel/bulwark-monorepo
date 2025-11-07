'use client';

import { getScoreColor } from '@/utils';
import { Brain } from 'lucide-react';
import Image from 'next/image';
import { AIAnalysis } from '@/types/api';

export default function AIAnalysisTab({ ai }: { ai: AIAnalysis }) {
  if (!ai?.success) return null;

  const avgScore = Math.round(
    [
      ai.documentation_clarity,
      ai.testing_coverage,
      ai.financial_logic_complexity,
      ai.attack_vector_risk,
      ai.value_at_risk,
    ]
      .filter(Boolean)
      .reduce((a, b) => a + b, 0) / 5,
  );

  const scoreBoxes = [
    { label: 'Documentation & Clarity', value: ai.documentation_clarity },
    { label: 'Testing Coverage & QA', value: ai.testing_coverage },
    {
      label: 'Financial Logic Intricacy',
      value: ai.financial_logic_complexity,
    },
    { label: 'Potential Profit Attack Vectors', value: ai.attack_vector_risk },
    { label: 'Value at Risk & Asset Volume', value: ai.value_at_risk },
  ];

  return (
    <div className="border border-[var(--blue-primary)] rounded-lg p-8 ">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div className="flex items-center font-normal text-xl gap-2">
          <Image src="/icons/AiAgent.svg" width={22} height={22} alt="" />
          Agent-based Assessment
        </div>
        <div className="text-blue-600 font-semibold">{avgScore.toFixed(1)}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[var(--blue-primary)]/20 overflow-hidden my-4">
        <div
          className="h-full bg-[var(--blue-primary)] transition-all"
          style={{ width: `${20}%` }}
        />
      </div>

      {/* Score Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6 ">
        {scoreBoxes.map((s, index) => (
          <div
            key={index}
            className="border-l border-[var(--blue-primary)]/20  p-3 text-left"
          >
            <div className="font-normal text-[var(--text-secondary)]">
              {s.label}
            </div>
            <div className=" text-lg text-[var(--text-primary)] mt-2">
              {s.value ?? 0}
            </div>
          </div>
        ))}
      </div>
      {/* High & Medium Hotspots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* High Risk Hotspots */}
        <div className="rounded-xl  p-4 bg-[var(--gray-light)]">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-[var(--blue-primary)] w-4 h-4" />
            <span className="px-4 py-1 text-xs rounded-md bg-red-100 text-red-600">
              High Risk Hotspots
            </span>
          </div>

          {ai.analysisFactors.highRiskHotspots?.map((h, i) => (
            <>
              <div
                key={i}
                className="mb-3 rounded-lg p-3 bg-red-50/40 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {h.file}:{h.lines}
                  </p>
                  <div className="mt-2 text-xs bg-gray-200 font-mono w-fit px-2">
                    {h.components.join(', ')}
                  </div>
                </div>

                <div className="mt-2 inline-flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${getScoreColor(
                      h.risk_score,
                    )}`}
                  >
                    {h.risk_score}
                  </span>
                </div>
              </div>
            </>
          ))}
        </div>

        {/* Medium Risk Hotspots */}
        <div className="rounded-xl bg-[var(--gray-light)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-[var(--blue-primary)] w-4:h-4" />
            <span className="px-4 py-1 text-xs rounded-md  text-yellow-700">
              Medium Hotspots
            </span>
          </div>

          {ai.analysisFactors.mediumRiskHotspots?.map((h, i) => (
            <div
              key={i}
              className="mb-3 rounded-lg p-3   bg-red-50/40 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {h.file}:{h.lines}
                </p>
                <div className="mt-2 text-xs bg-gray-200 font-mono w-fit px-2">
                  {h.components.join(', ')}
                </div>
              </div>

              <div className="mt-2 inline-flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${getScoreColor(
                    h.risk_score,
                  )}`}
                >
                  {h.risk_score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {ai?.analysisFactors?.recommendations &&
        ai?.analysisFactors?.recommendations?.length > 0 && (
          <div className="rounded-xl bg-[var(--gray-light)] p-4 mt-8">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-[var(--blue-primary)] w-4 h-4" />
              <span className="px-4 py-1 text-xs rounded-md bg-blue-100 text-blue-700">
                Recommendations
              </span>
            </div>

            <ul className="list-disc ml-5 text-sm text-[var(--text-primary)]">
              {ai.analysisFactors.recommendations.map((r, i) => (
                <li key={i} className="leading-6">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
