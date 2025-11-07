'use client';

import StepHeader, { StepItem } from '@/shared/components/StepHeader';

type GitHubStep = 'repoSelect' | 'fileSelect' | 'progress';

const GITHUB_STEPS: Readonly<StepItem<GitHubStep>[]> = [
  { key: 'repoSelect', label: 'Select Repo' },
  { key: 'fileSelect', label: 'Select Files' },
  { key: 'progress', label: 'Analyze' },
] as const;

export default function GitHubModalHeader({
  step,
  onClose,
}: {
  step: GitHubStep;
  onClose: () => void;
}) {
  return <StepHeader steps={GITHUB_STEPS} activeKey={step} />;
}
