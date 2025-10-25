import { Navbar } from '@/components/layout/Navbar';
import { QueryProvider } from '@/providers/QueryProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Celo Task Marketplace',
  description: 'AI-powered micro-task marketplace on Celo blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
