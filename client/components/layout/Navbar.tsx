'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const { isConnected } = useWalletConnection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
   <motion.nav
      className="fixed top-4 left-4 right-4 z-50 bg-black/40 backdrop-blur-2xl border border-orange-500/20 rounded-2xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <span className="text-white text-sm font-bold">C</span>
            </motion.div>
            <span className="hidden sm:inline bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Credia
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/tasks" className="text-sm hover:text-orange-400 transition-colors">
              Marketplace
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-orange-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/profile" className="text-sm hover:text-orange-400 transition-colors">
              Profile
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <motion.div
              className="hidden sm:inline-flex"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <WalletButton />
            </motion.div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/tasks" className="block px-4 py-2 hover:bg-orange-500/10 rounded-lg">
              Marketplace
            </Link>
            <Link href="/dashboard" className="block px-4 py-2 hover:bg-orange-500/10 rounded-lg">
              Dashboard
            </Link>
            <Link href="/profile" className="block px-4 py-2 hover:bg-orange-500/10 rounded-lg">
              Profile
            </Link>
            <WalletButton />
          </div>
        )}
      </div>
    </motion.nav>
  );
}
