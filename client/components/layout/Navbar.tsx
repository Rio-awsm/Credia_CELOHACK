'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import Link from 'next/link';

export function Navbar() {
  const { isConnected } = useWalletConnection();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-gray-900">TaskMarket</span>
          </Link>

          {/* Navigation Links */}
          {isConnected && (
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/tasks"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Browse Tasks
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          )}

          {/* Wallet Connection */}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
