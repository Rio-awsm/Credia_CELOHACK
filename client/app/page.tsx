"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { FeatureShowcase } from "./_sections/feature-showcase";
import { HeroSection } from "./_sections/hero-section";
import { HowItWorks } from "./_sections/how-it-works";
import { IntegrationsSection } from "./_sections/integrations-section";
import { StatsSection } from "./_sections/stats-section";
import { TaskExamples } from "./_sections/task-examples";
import { Testimonials } from "./_sections/testimonials";

export default function Home() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: "How much can I earn?",
      a: "Earnings vary by task complexity. Most workers earn $200-500/month.",
    },
    {
      q: "How long does verification take?",
      a: "AI verification is instant. Most tasks are approved within seconds.",
    },
    {
      q: "When do I get paid?",
      a: "Payments are instant to your Celo wallet. No waiting periods.",
    },
    {
      q: "Is there a minimum withdrawal?",
      a: "No minimum. Withdraw any amount anytime to your wallet.",
    },
  ];

  return (
    <main className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <FeatureShowcase />
      <TaskExamples />
      <HowItWorks />
      <Testimonials />
      <IntegrationsSection />

      {/* Security & Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/50 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Secure &{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Transparent
              </span>
            </h2>
            <p className="text-lg text-foreground/70">
              Your earnings and data are protected with blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Contract Verified",
                desc: "All payments verified on-chain",
              },
              {
                title: "Zero Hidden Fees",
                desc: "100% transparent pricing model",
              },
              {
                title: "Instant Withdrawals",
                desc: "Access your earnings anytime",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-orange-500/20 rounded-xl p-8 h-full hover:border-orange-500/40 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-foreground/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-orange-500/20 rounded-xl overflow-hidden hover:border-orange-500/40 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between hover:bg-orange-500/5 transition-colors"
                >
                  <h3 className="font-bold text-lg text-left">{item.q}</h3>
                  <motion.div
                    animate={{ rotate: expandedFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <ChevronDown className="w-5 h-5 text-orange-400" />
                  </motion.div>
                </button>

                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: expandedFaq === i ? "auto" : 0,
                    opacity: expandedFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-foreground/70 border-t border-orange-500/10">
                    {item.a}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-background" />
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
            style={{ top: "-10%", right: "-5%" }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to start{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              earning
            </span>
            ?
          </motion.h2>

          <motion.p
            className="text-lg text-foreground/70 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Join thousands of workers completing AI-verified tasks on Celo
            Sepolia
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-transparent"
              >
                Try Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
