"use client"

import { motion } from "framer-motion"

const stats = [
  { label: "Active Workers", value: "12,450", suffix: "+" },
  { label: "Tasks Completed", value: "2.3M", suffix: "" },
  { label: "Total Earnings", value: "$450K", suffix: "" },
  { label: "Avg Task Pay", value: "$2.50", suffix: "" },
]

export function StatsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-orange-500/5 to-accent/5" />
      <div className="absolute inset-0 border-y border-border" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl sm:text-4xl font-bold mb-2"
                animate={{ color: ["#35d07f", "#ff8c00", "#35d07f"] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
              >
                {stat.value}
                <span className="text-orange-500">{stat.suffix}</span>
              </motion.div>
              <p className="text-sm sm:text-base text-foreground/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
