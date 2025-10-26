"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { useEffect, useState } from "react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
  {
    name: "Sarah Chen",
    role: "Student",
    content: "I earn $200-300 per week doing tasks in my spare time. The AI verification is super fast!",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelancer",
    content: "Finally a platform where I get paid instantly. No more waiting for payments. Love it!",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Remote Worker",
    content: "The variety of tasks keeps things interesting. I've earned over $2000 in 3 months.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Side Hustler",
    content: "Best platform I've used. Transparent, fair, and the Celo integration is seamless.",
    rating: 5,
    avatar: "JP",
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Loved by workers worldwide</h2>
          <p className="text-lg text-foreground/70">Join thousands earning on Credia</p>
        </div>

        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: -currentIndex * (100 + 24) + "%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-foreground/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <p className="text-foreground/80 flex-grow">{testimonial.content}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
