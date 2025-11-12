'use client';

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

export default function Home() {
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();

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
    </div>
  );
}
