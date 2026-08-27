import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DashboardDataProvider } from './components/DashboardDataProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Portfolio — PMO Dashboard',
  description: 'A decision-focused PMO portfolio dashboard with an AI Copilot.',
  manifest: '/manifest.webmanifest',
  themeColor: '#123c46',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardDataProvider>{children}</DashboardDataProvider>
      </body>
    </html>
  );
}
