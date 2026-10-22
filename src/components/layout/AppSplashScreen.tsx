import { type FC } from "react";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

export interface AppSplashScreenProps {
  isLoading: boolean;
}

export const AppSplashScreen: FC<AppSplashScreenProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <motion.div
      key="truesquare-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="flex flex-col items-center max-w-xs w-full text-center space-y-6">
        {/* TrueSquare Animated Logo Mark */}
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center p-3 relative overflow-hidden"
          >
            {/* Ambient Amber Glow */}
            <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full" />

            <svg
              viewBox="0 0 128 128"
              className="w-full h-full relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="splashAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* Document Sheet */}
              <path d="M42 26 H76 L94 44 V100 H42 Z" fill="#27272A" />
              <path d="M76 26 V44 H94 Z" fill="#3F3F46" />

              {/* Carpenter's Framing Square */}
              <path d="M30 26 H42 V100 H30 Z" fill="url(#splashAmber)" />
              <path d="M30 88 H98 V100 H30 Z" fill="url(#splashAmber)" />

              {/* Document Lines */}
              <line x1="50" y1="54" x2="82" y2="54" stroke="#71717A" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="66" x2="74" y2="66" stroke="#71717A" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="78" x2="80" y2="78" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">
            TrueSquare
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Contractor Estimating &amp; Tax Invoicing
          </p>
        </div>

        {/* Indeterminate Shimmer Progress Bar */}
        <div className="w-full max-w-[180px] h-1.5 rounded-full bg-zinc-800/80 overflow-hidden relative">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"
          />
        </div>

        {/* Vault Badge */}
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local AES-GCM Vault Loaded</span>
        </div>
      </div>
    </motion.div>
  );
};
