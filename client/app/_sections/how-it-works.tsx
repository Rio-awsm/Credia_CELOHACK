"use client"

import { motion } from "framer-motion"
import { CheckSquare, TrendingUp, Wallet, Zap } from "lucide-react"

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Celo wallet to get started in seconds",
  },
  {
    icon: CheckSquare,
    title: "Complete Tasks",
    description: "Choose from available tasks and complete them",
  },
  {
    icon: Zap,
    title: "AI Verification",
    description: "Gemini AI verifies your work instantly",
  },
  {
    icon: TrendingUp,
    title: "Earn & Withdraw",
    description: "Get paid in cUSD directly to your wallet",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-orange-500/5" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How it{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">works</span>
          </h2>
          <p className="text-lg text-foreground/70">Get started in 4 simple steps</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-60px)] h-1 bg-gradient-to-r from-primary via-orange-500 to-transparent rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                />
              )}

              <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 rounded-xl p-6 text-center transition-all duration-300 group">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mx-auto mb-4"
                  animate={{
                    rotate: 360,
                    boxShadow: [
                      "0 0 20px rgba(53,208,127,0.3)",
                      "0 0 40px rgba(255,140,0,0.3)",
                      "0 0 20px rgba(53,208,127,0.3)",
                    ],
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    boxShadow: { duration: 3, repeat: Number.POSITIVE_INFINITY },
                  }}
                >
                  <step.icon className="w-8 h-8 text-background" />
                </motion.div>

                <motion.div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-orange-500 text-background text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.3 }}
                >
                  {index + 1}
                </motion.div>

                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-foreground/70 text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
