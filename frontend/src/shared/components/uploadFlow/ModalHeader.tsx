'use client';

import StepHeader, { StepItem } from '@/shared/components/StepHeader';

type UploadStep = 'upload' | 'fileSelect' | 'progress';

const UPLOAD_STEPS: Readonly<StepItem<UploadStep>[]> = [
  { key: 'upload', label: 'Upload' },
  { key: 'fileSelect', label: 'Select Files' },
  { key: 'progress', label: 'Analyze' },
] as const;

export default function ModalHeader({
  step,
  onClose,
}: {
  step: UploadStep;
  onClose: () => void;
}) {
  return <StepHeader steps={UPLOAD_STEPS} activeKey={step} compact />;
}
