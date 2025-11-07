'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import AuditorMarketplace from '@/modules/home/components/AuditorMarketplace';
import BulwarkAnimated from '@/modules/home/components/BulwarkAnimated';
import FeatureCards from '@/modules/home/components/FeatureCards';
import HeroSection from '@/modules/home/components/Hero';
import HowItWorks from '@/modules/home/components/HowItWorks';
import NewsletterSection from '@/modules/home/components/NewsLetter';
import PricingSection from '@/modules/home/components/Pricing';
import Web3TeamsSection from '@/modules/home/components/Web3TeamSection';
import { features, teamItems } from '@/modules/home/constants';
import Footer from '@/shared/components/Footer';
import Navbar from '@/shared/components/Navbar/NavBar';
import ReceiptModal from '@/shared/components/Receipt/Receipt';
import UploadFlowModal from '@/shared/components/uploadFlow/UploadFlowModal';
import GitHubFlowModal from '@/shared/components/UploadGihubFlow/GitHubModalFlow';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import { useAppSelector } from '@/shared/hooks/useAppSelector';
import { GitHubFlowStep } from '@/shared/hooks/useGitHubFlow';
import { RootState } from '@/store/store';

export default function Home() {
  const { githubToken } = useAppSelector((state: RootState) => state.auth);

  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();
  const { handleAuthSuccess, setStep } = githubFlow;

  useEffect(() => {
    const shouldOpenFlow = sessionStorage.getItem('open_github_flow');

    if (shouldOpenFlow === 'true') {
      sessionStorage.removeItem('open_github_flow');

      if (githubToken) {
        handleAuthSuccess(githubToken);
        setStep(GitHubFlowStep.REPO_SELECT);
      }
    }
  }, [handleAuthSuccess, setStep]);
  return (
    <div className="min-h-screen bg-white ">
      <Navbar />

      <HeroSection
        onConnectGitHub={() => handlers.onConnectGitHub('/', 'connect')}
        onUploadZip={handlers.onUploadZip}
        onAnalyze={handlers.onAnalyze}
      />

      <div className="w-full flex justify-center items-center h-auto py-8 px-4 mt-10 lg:mt-26 5xl:mt-40">
        <Image
          src="/icons/BulwarkHeading.svg"
          alt="Bulwark Heading"
          width={800}
          height={200}
          className="w-full max-w-[800px] h-auto"
          priority
        />
      </div>

      <BulwarkAnimated />

      <FeatureCards items={features} />

      <HowItWorks />

      <Web3TeamsSection
        title="Built for Modern Web3 Teams"
        subtitle="Serving all streams of contributors across Solana"
        items={teamItems}
      />

      <AuditorMarketplace />

      <PricingSection />

      <NewsletterSection />

      <Footer />
      <div className="hidden"> </div>

      {uploadFlow.isOpen && (
        <UploadFlowModal
          step={uploadFlow.step}
          contractFiles={uploadFlow.contractFiles}
          startFileSelect={uploadFlow.startFileSelect}
          runAnalysis={uploadFlow.runAnalysis}
          report={uploadFlow.report}
          apiReady={!uploadFlow.isAnalyzing}
          goToPreviousStep={uploadFlow.goToPreviousStep}
          completeAnalysis={uploadFlow.completeAnalysis}
          onClose={() => {
            uploadFlow.resetFlow();
            uploadFlow.setOpen(false);
          }}
          onOpenResults={(r) => {
            results.setReport(r);
            results.setOpen(true);
          }}
        />
      )}

      <GitHubFlowModal
        step={githubFlow.step}
        accessToken={githubFlow.accessToken}
        selectedRepo={githubFlow.selectedRepo}
        contractFiles={githubFlow.contractFiles}
        selectRepository={githubFlow.selectRepository}
        runAnalysis={githubFlow.runAnalysis}
        apiReady={!githubFlow.isAnalyzing}
        completeAnalysis={githubFlow.completeAnalysis}
        onClose={githubFlow.resetFlow}
        report={githubFlow.report}
        onOpenResults={(r) => {
          results.setReport(r);
          results.setOpen(true);
        }}
      />

      <ReceiptModal
        open={results.isOpen}
        report={results.report}
        onClose={() => results.setOpen(false)}
      />
    </div>
  );
}
