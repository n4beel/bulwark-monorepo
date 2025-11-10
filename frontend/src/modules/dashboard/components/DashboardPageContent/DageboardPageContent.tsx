'use client';

import DashboardHero from '@/modules/dashboard/components/Hero';
import DashboardNavbar from '@/modules/dashboard/components/NavBar/DashboardNavBar';
import AuthModal from '@/shared/components/AuthModal/AuthModal';
import Loading from '@/shared/components/Loading';
import { RootState } from '@/store/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report');
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) return <Loading />;

  return (
    <>
      <main className="min-h-screen bg-[var(--background)]">
        <DashboardNavbar />
        <DashboardHero initialReportId={reportId || undefined} />
      </main>
      <AuthModal
        open={!user}
        onClose={() => router.push('/')}
        shouldRedirect={false}
      />
    </>
  );
}
