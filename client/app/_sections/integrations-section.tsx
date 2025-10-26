"use client"

import { motion } from "framer-motion"
import { Code2, Database, MessageSquare, Zap } from "lucide-react"

export function IntegrationsSection() {
  const integrations = [
    {
      icon: Code2,
      title: "API Integration",
      description: "Connect with your favorite tools to streamline workflows",
    },
    {
      icon: Database,
      title: "Data Sync",
      description: "Seamless data synchronization across platforms",
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Automate repetitive tasks with intelligent workflows",
    },
    {
      icon: MessageSquare,
      title: "Communication",
      description: "Real-time notifications and updates",
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-block mb-4 px-4 py-2 rounded-full border border-orange-500/50 bg-orange-500/10"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-orange-400">INTEGRATIONS</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Seamless{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Integrations
            </span>
          </h2>
          <p className="text-lg text-foreground/70">Connect with your favorite tools to streamline workflows</p>
        </motion.div>

        {/* Integration Grid with Center Hub */}
        <div className="relative">
          {/* Center Hub */}
          

          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,140,0,0.3)" />
                <stop offset="100%" stopColor="rgba(255,140,0,0.1)" />
              </linearGradient>
            </defs>
            {/* Horizontal line */}
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" />
            {/* Vertical line */}
            <line x1="50%" y1="5%" x2="50%" y2="95%" stroke="url(#lineGradient)" strokeWidth="2" />
          </svg>

          {/* Integration Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-0">
            {integrations.map((integration, index) => {
              const Icon = integration.icon
              return (
                <motion.div
                  key={index}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500/20 to-black/40 border border-orange-500/50 flex items-center justify-center mb-4 hover:border-orange-500 transition-colors"
                    animate={{
                      boxShadow: [
                        "0 0 10px rgba(255,140,0,0.2)",
                        "0 0 20px rgba(255,140,0,0.4)",
                        "0 0 10px rgba(255,140,0,0.2)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                  >
                    <Icon className="w-10 h-10 text-orange-400" />
                  </motion.div>
                  <h3 className="font-semibold text-lg mb-2">{integration.title}</h3>
                  <p className="text-sm text-foreground/60">{integration.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
