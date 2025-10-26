"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth";
import { useCUSDBalance } from "@/hooks/useCUSDBalance";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { useState } from "react";

export function HeroSection() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWalletConnection();
    const { authenticate, isAuthenticating, clearAuth, isAuthenticated } = useAuth();
    const { data: balance } = useCUSDBalance(address);
    const [showNetworkModal, setShowNetworkModal] = useState(false);
  
    const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11142220');
    const isWrongNetwork = isConnected && chainId !== expectedChainId;
  
    const handleConnect = async () => {
      try {
        // Step 1: Connect wallet
        await connect();
  
        // Step 2: Authenticate
        await authenticate();
      } catch (error) {
        console.error('Connection/Authentication error:', error);
      }
    };
  
  return (
    <section className="relative min-h-[800px] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-20 pt-32">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/30 to-orange-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 150, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          style={{ top: "-10%", left: "-5%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-600/20 to-black/20 rounded-full blur-3xl"
          animate={{
            x: [0, -150, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          style={{ bottom: "-10%", right: "-5%" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
          </motion.div>
          <span className="text-sm font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            AI-Powered Verification
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Complete tasks.{" "}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Get verified by AI.
            </span>{" "}
            <span className="text-white">Earn instantly.</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-lg sm:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Join the AI-powered microtask marketplace on Celo Sepolia. Complete data labeling, surveys, and content
          moderation tasks. Get paid in cUSD instantly.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Button
              onClick={handleConnect}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8"
            >
              Connect Wallet <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-transparent"
            >
              Try Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { label: "Powered by Gemini AI", color: "from-orange-500" },
            { label: "Built on Celo Sepolia", color: "from-orange-600" },
            { label: "Instant Payments", color: "from-orange-400" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
            >
              <motion.div
                className={`w-2 h-2 bg-gradient-to-r ${item.color} to-transparent rounded-full`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
              />
              {item.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
