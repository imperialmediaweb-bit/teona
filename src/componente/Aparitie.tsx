"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Apariție discretă la derulare: 16 pixeli în sus și opacitate.
 *
 * Doar `transform` și `opacity`, ca să nu provoace recalcul de aspect. Cine a
 * cerut mai puțină mișcare primește conținutul deja așezat.
 */
export default function Aparitie({
  children,
  intarziere = 0,
  className = "",
}: {
  children: ReactNode;
  intarziere?: number;
  className?: string;
}) {
  const fara_miscare = useReducedMotion();

  if (fara_miscare) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: intarziere, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
