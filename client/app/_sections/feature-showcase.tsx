"use client"

import { motion } from "framer-motion"
import { Brain, Wallet, Zap } from "lucide-react"

export function FeatureShowcase() {
  const features = [
    {
      title: "Seamless Task Marketplace",
      description: "Browse thousands of AI-verified tasks. Filter by category, difficulty, and earning potential.",
      icon: Zap,
      gradient: "from-primary to-orange-500",
      delay: 0,
    },
    {
      title: "AI-Powered Verification",
      description: "Advanced AI models verify your work instantly. Get paid only for quality submissions.",
      icon: Brain,
      gradient: "from-orange-500 to-accent",
      delay: 0.2,
    },
    {
      title: "Instant Payments",
      description: "Earn cUSD instantly on Celo Sepolia. Withdraw anytime with zero fees.",
      icon: Wallet,
      gradient: "from-accent to-primary",
      delay: 0.4,
    },
  ]

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Credia</span>
          </h2>
          <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
            The most advanced AI-powered microtask platform with instant payments and transparent verification.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

                <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition duration-300">
                  {/* Animated icon background */}
                  <motion.div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 mb-6 flex items-center justify-center`}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-foreground/60">{feature.description}</p>

                  {/* Animated bottom accent */}
                  <motion.div
                    className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: feature.delay + 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
