import { useState, useRef, type FC, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface TooltipProps {
  content: string;
  shortcut?: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = "top",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: position === "top" ? 3 : -3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            role="tooltip"
            className={`absolute ${positionClasses[position]} z-50 pointer-events-none px-2.5 py-1 text-[11px] font-medium text-zinc-100 bg-zinc-900/95 border border-zinc-700/80 rounded-lg shadow-xl backdrop-blur-md whitespace-nowrap flex items-center space-x-1.5`}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-mono font-bold text-amber-400">
                {shortcut}
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
