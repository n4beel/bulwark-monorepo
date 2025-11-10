import AuthWatcher from '@/components/providers/AuthWatcher';
import HighlightProvider from '@/components/providers/HighlightProvider';
import ReduxProvider from '@/components/providers/ReduxProvider';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MySecurity Tool - Smart Contract Security Analysis',
  description:
    'Comprehensive smart contract security analysis platform with AI insights and static code analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HighlightProvider>
          <ReduxProvider>
            <AuthWatcher />
            {children}
          </ReduxProvider>

          <Toaster
            richColors
            closeButton
            position="top-center"
            expand={false}
          />
        </HighlightProvider>
      </body>
    </html>
  );
}
