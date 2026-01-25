"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { PlayerStats } from "@/lib/types"

type Stage = "first" | "second" | "third" | "done"

interface PodiumIntroProps {
  top3: PlayerStats[]
  onComplete: () => void
}

const firstVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
}

const secondVariants = {
  hidden: { x: -120, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 150, damping: 16 },
  },
}

const thirdVariants = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

export function PodiumIntro({ top3, onComplete }: PodiumIntroProps) {
  const [stage, setStage] = useState<Stage>("first")

  const [first, second, third] = useMemo(() => top3, [top3])

  useEffect(() => {
    const timeouts: number[] = []
    timeouts.push(window.setTimeout(() => setStage("second"), 1400))
    timeouts.push(window.setTimeout(() => setStage("third"), 2400))
    timeouts.push(window.setTimeout(() => setStage("done"), 4400))
    timeouts.push(window.setTimeout(() => onComplete(), 4900))

    return () => timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
  }, [onComplete])

  const handleSkip = () => {
    setStage("done")
    onComplete()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: stage === "done" ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      onClick={handleSkip}
    >
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Toca para saltar</p>

        <motion.div
          className="podium-card podium-gold podium-glow-first"
          variants={firstVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-4xl">🥇</div>
          <div className="mt-1 text-xl font-semibold text-amber-100">{first?.name || "Jugador"}</div>
        </motion.div>

        {stage === "second" || stage === "third" || stage === "done" ? (
          <motion.div
            className="podium-card podium-silver"
            variants={secondVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="text-3xl">🥈</div>
            <div className="mt-1 text-lg font-semibold text-slate-100">{second?.name || "Jugador"}</div>
          </motion.div>
        ) : null}

        {stage === "third" || stage === "done" ? (
          <motion.div
            className="podium-card podium-bronze"
            variants={thirdVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="text-3xl">🥉</div>
            <div className="mt-1 text-lg font-semibold text-orange-100">{third?.name || "Jugador"}</div>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}
