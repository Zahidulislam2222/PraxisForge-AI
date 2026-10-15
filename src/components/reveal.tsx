"use client";
import { motion } from "motion/react";
import { settings } from "@/lib/content";
import { useSiteMotion } from "./motion-provider";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { enabled } = useSiteMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: enabled ? settings.motion.revealDistance : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: enabled ? settings.motion.revealSeconds : 0,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
