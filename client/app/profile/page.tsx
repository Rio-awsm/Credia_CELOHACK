"use client";

import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Zap } from "lucide-react";

import { motion } from "framer-motion";
import { BadgeShowcase } from "../_sections/badge-showcase";
import { ReputationMeter } from "../_sections/reputation-meter";

export default function Profile() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pt-[100px]">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          className="bg-gradient-to-br from-orange-500/10 to-black/50 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 mb-8 hover:border-orange-500/50 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/50"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(255,140,0,0.5)",
                  "0 0 40px rgba(255,140,0,0.8)",
                  "0 0 20px rgba(255,140,0,0.5)",
                ],
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              <span className="text-4xl font-bold text-white">RB</span>
            </motion.div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Raj Bhattacharya
              </h1>
              <p className="text-foreground/70 mb-4">
                Verified Worker • Member since Jan 2024
              </p>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Edit Profile
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-transparent"
                  >
                    Share Profile
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tasks Completed", value: "156" },
              { label: "Approval Rate", value: "98.7%" },
              { label: "Total Earned", value: "$1,247.80", highlight: true },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="text-sm text-foreground/60 mb-1">{stat.label}</p>
                <p
                  className={`text-2xl font-bold ${
                    stat.highlight ? "text-orange-400" : ""
                  }`}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reputation Section */}
        <motion.div
          className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-8 mb-8 hover:border-orange-500/40 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Reputation & Badges
          </h2>
          <ReputationMeter />
          <BadgeShowcase />
        </motion.div>

        {/* Activity Section */}
        <motion.div
          className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-8 hover:border-orange-500/40 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Activity Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Current Streak",
                value: "12 days",
                subtitle: "Keep it up!",
                color: "orange",
              },
              {
                icon: TrendingUp,
                title: "This Week",
                value: "$142.50",
                subtitle: "+12.5% vs last week",
                color: "orange",
              },
              {
                icon: Award,
                title: "Badges Earned",
                value: "8",
                subtitle: "3 new this month",
                color: "orange",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  className="p-6 bg-gradient-to-br from-orange-500/10 to-black/30 border border-orange-500/20 rounded-xl hover:border-orange-500/40 transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-orange-400" />
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-foreground/60">{item.subtitle}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
