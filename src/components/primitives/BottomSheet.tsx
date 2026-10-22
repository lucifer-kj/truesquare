import { type FC, type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useAccessibleMotion } from "@/design-system";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string;
}

export const BottomSheet: FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = "85vh",
}) => {
  const activeSpringTransition = useAccessibleMotion("productive");

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={activeSpringTransition}
            style={{ maxHeight }}
            className="relative z-10 w-full bg-card text-card-foreground border-t border-border rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drag Grab Handle & Header */}
            <div className="pt-2.5 pb-2 px-4 flex flex-col items-center border-b border-border select-none">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-2" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
                  {subtitle && (
                    <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
