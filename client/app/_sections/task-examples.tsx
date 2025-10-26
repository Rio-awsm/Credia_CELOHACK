"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const taskExamples = [
  {
    category: "Data Labeling",
    tasks: ["Image classification", "Object detection", "Text annotation"],
    earning: "$1.50 - $5.00",
    time: "5-15 min",
  },
  {
    category: "Content Moderation",
    tasks: ["Review flagged content", "Verify guidelines compliance", "Quality assurance"],
    earning: "$2.00 - $6.00",
    time: "10-20 min",
  },
  {
    category: "Surveys & Research",
    tasks: ["Market research", "User feedback", "Opinion surveys"],
    earning: "$1.00 - $4.00",
    time: "5-10 min",
  },
  {
    category: "Transcription",
    tasks: ["Audio transcription", "Video captioning", "Translation"],
    earning: "$3.00 - $8.00",
    time: "15-30 min",
  },
]

export function TaskExamples() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Available{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              Task Types
            </span>
          </h2>
          <p className="text-lg text-foreground/70">Choose from diverse tasks that match your skills and schedule</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {taskExamples.map((task, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

              <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {task.category}
                </h3>
                <ul className="space-y-2 mb-6">
                  {task.tasks.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2 text-foreground/80"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      </motion.div>
                      {item}
                    </motion.li>
                  ))}
                </ul>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-foreground/60">Earning</p>
                    <p className="font-semibold text-primary">{task.earning}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground/60">Time</p>
                    <p className="font-semibold">{task.time}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
