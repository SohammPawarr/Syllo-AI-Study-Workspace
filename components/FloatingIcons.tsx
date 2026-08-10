"use client";

import { motion } from "framer-motion";
import { BookOpen, Image as ImageIcon, Zap } from "lucide-react";

export default function FloatingIcons() {
  return (
    <>
      {/* Book Icon (Left) */}
      <motion.div 
        className="absolute w-24 h-24 bg-[var(--white)] border-[4px] border-[var(--brand-blue)] rounded-[32px] shadow-solid flex items-center justify-center hidden lg:flex z-0"
        initial={{ opacity: 0, scale: 0, top: "50%", left: "50%", rotate: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          top: "15%", 
          left: "8%", 
          rotate: -12,
          y: [0, -15, 0] // Floating animation
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { type: "spring", bounce: 0.6, duration: 1, delay: 0.1 },
          top: { type: "spring", bounce: 0.4, duration: 1, delay: 0.1 },
          left: { type: "spring", bounce: 0.4, duration: 1, delay: 0.1 },
          rotate: { type: "spring", bounce: 0.5, duration: 1, delay: 0.1 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 } // Start floating after burst
        }}
      >
        <BookOpen className="w-10 h-10 text-[var(--brand-blue)]" />
      </motion.div>

      {/* Image Icon (Right Bottom) */}
      <motion.div 
        className="absolute w-24 h-24 bg-[var(--white)] border-[4px] border-[var(--brand-yellow)] rounded-full shadow-solid flex items-center justify-center hidden lg:flex z-0"
        initial={{ opacity: 0, scale: 0, top: "50%", left: "50%", rotate: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          top: "75%", 
          left: "85%", 
          rotate: 15,
          y: [0, -20, 0] // Floating animation
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { type: "spring", bounce: 0.6, duration: 1, delay: 0.3 },
          top: { type: "spring", bounce: 0.4, duration: 1, delay: 0.3 },
          left: { type: "spring", bounce: 0.4, duration: 1, delay: 0.3 },
          rotate: { type: "spring", bounce: 0.5, duration: 1, delay: 0.3 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.3 } // Start floating after burst
        }}
      >
        <ImageIcon className="w-10 h-10 text-[var(--gray-900)]" />
      </motion.div>

      {/* Zap Icon (Right Top) */}
      <motion.div 
        className="absolute w-16 h-16 bg-[var(--brand-blue)] border-4 border-[var(--black)] rounded-full shadow-solid flex items-center justify-center hidden lg:flex z-0"
        initial={{ opacity: 0, scale: 0, top: "50%", left: "50%", rotate: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          top: "20%", 
          left: "85%", 
          rotate: 45,
          y: [0, -10, 0] // Floating animation
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { type: "spring", bounce: 0.6, duration: 1, delay: 0.2 },
          top: { type: "spring", bounce: 0.4, duration: 1, delay: 0.2 },
          left: { type: "spring", bounce: 0.4, duration: 1, delay: 0.2 },
          rotate: { type: "spring", bounce: 0.5, duration: 1, delay: 0.2 },
          y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 } // Start floating after burst
        }}
      >
        <Zap className="w-8 h-8 text-[var(--brand-yellow)]" />
      </motion.div>
    </>
  );
}
