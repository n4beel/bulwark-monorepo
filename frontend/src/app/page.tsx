'use client';

import { useDispatch } from 'react-redux';
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
import AnalysisModals from '@/shared/components/AnalysisModals';
import Footer from '@/shared/components/Footer';
import Navbar from '@/shared/components/Navbar/NavBar';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import { useAppSelector } from '@/shared/hooks/useAppSelector';
import { GitHubFlowStep } from '@/shared/hooks/useGitHubFlow';
import { setOpenGithubAuthModal } from '@/store/slices/appSlice';
import { RootState } from '@/store/store';

export default function Home() {
  const { githubToken } = useAppSelector((state: RootState) => state.auth);
  const { openGithubAuthModal } = useAppSelector(
    (state: RootState) => state.app,
  );

  const dispatch = useDispatch();

  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();
  const { handleAuthSuccess, setStep } = githubFlow;

  useEffect(() => {
    const shouldOpenFlow = sessionStorage.getItem('open_github_flow');
    console.log('openGithubAuthModal', { openGithubAuthModal });
    if (openGithubAuthModal) {
      sessionStorage.removeItem('open_github_flow');
      dispatch(setOpenGithubAuthModal(false));

      if (githubToken) {
        handleAuthSuccess(githubToken);
        setStep(GitHubFlowStep.REPO_SELECT);
      }
    }
  }, [handleAuthSuccess, setStep, githubToken]);
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

      <AnalysisModals
        uploadFlow={uploadFlow}
        githubFlow={githubFlow}
        results={results}
      />

      {/* <ReceiptModal
        open={results.isOpen}
        report={results.report}
        onClose={() => results.setOpen(false)}
      /> */}
    </div>
  );
}
