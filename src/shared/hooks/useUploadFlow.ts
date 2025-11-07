'use client';

import { useState } from 'react';
import { uploadApi } from '@/services/api';
import { StaticAnalysisReport } from '@/types/api';

export enum UploadFlowStep {
  UPLOAD = 'upload',
  FILE_SELECT = 'fileSelect',
  PROGRESS = 'progress',
  RESULTS = 'results',
}

export function useUploadFlow() {
  const [step, setStep] = useState<UploadFlowStep>(UploadFlowStep.UPLOAD);
  const [contractFiles, setContractFiles] = useState<any[]>([]);
  const [extractedPath, setExtractedPath] = useState<string | null>(null);
  const [report, setReport] = useState<StaticAnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startFileSelect = (extracted: string, files: any[]) => {
    setExtractedPath(extracted);
    setContractFiles(files);
    setStep(UploadFlowStep.FILE_SELECT);
  };

  const goToPreviousStep = (currentStep: UploadFlowStep) => {
    switch (currentStep) {
      case UploadFlowStep.FILE_SELECT:
        setStep(UploadFlowStep.UPLOAD);
        break;
      case UploadFlowStep.PROGRESS:
        setStep(UploadFlowStep.FILE_SELECT);
        break;
      case UploadFlowStep.RESULTS:
        setStep(UploadFlowStep.PROGRESS);
        break;
    }
  };

  const runAnalysis = async (files: string[]) => {
    setStep(UploadFlowStep.PROGRESS);
    setIsAnalyzing(true);

    if (!extractedPath) return;

    try {
      const result = await uploadApi.analyzeUploadedContracts(
        extractedPath,
        files,
      );
      setReport(result);
      setIsAnalyzing(false);
      // Step 3 animation will auto-move to Step 4
    } catch (err) {
      console.error('Error:', err);
      alert('Analysis failed. Try again.');
      setIsAnalyzing(false);
      setStep(UploadFlowStep.FILE_SELECT);
    }
  };

  const completeAnalysis = () => {
    setStep(UploadFlowStep.RESULTS);
  };

  const resetFlow = () => {
    setContractFiles([]);
    setExtractedPath(null);
    setReport(null);
    setIsAnalyzing(false);
    setStep(UploadFlowStep.UPLOAD);
  };

  return {
    step,
    contractFiles,
    report,
    isAnalyzing,
    startFileSelect,
    runAnalysis,
    resetFlow,
    goToPreviousStep,
    completeAnalysis,
  };
}
