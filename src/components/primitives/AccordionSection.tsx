import { useState, type ReactNode, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { useAccessibleMotion } from "@/design-system";

export interface AccordionSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isComplete?: boolean;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const AccordionSection: FC<AccordionSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  isComplete = false,
  defaultOpen = true,
  badge,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const activeSpringTransition = useAccessibleMotion("productive");

  return (
    <div
      id={`accordion-${id}`}
      className={`bg-card text-card-foreground border border-border rounded-xl shadow-xs transition-colors overflow-hidden ${className}`}
    >
      {/* Header bar with progressive disclosure toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center space-x-3 min-w-0">
          {icon && (
            <div className="w-7 h-7 rounded-lg bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-foreground truncate">
                {title}
              </span>
              {isComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={activeSpringTransition}
            className="text-muted-foreground"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Accordion body content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`content-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={activeSpringTransition}
            className="overflow-hidden border-t border-border/70"
          >
            <div className="p-4 sm:p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
