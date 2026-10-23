import { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, HardHat, ShieldCheck, Delete } from "lucide-react";
import { unlockSessionWithPin } from "@/services/auth-service";
import type { OperatorAccountProfile } from "@/domain/auth-types";
import { useAccessibleMotion } from "@/design-system";

export interface PasscodeLockModalProps {
  isOpen: boolean;
  activeOperator: OperatorAccountProfile;
  onUnlockSuccess: () => void;
}

export const PasscodeLockModal: FC<PasscodeLockModalProps> = ({
  isOpen,
  activeOperator,
  onUnlockSuccess,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const activeSpringTransition = useAccessibleMotion("expressive");

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setHasError(false);

      if (nextPin.length === 4) {
        verifyPinAttempt(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prevPin) => prevPin.slice(0, -1));
    setHasError(false);
  };

  const handleClear = () => {
    setEnteredPin("");
    setHasError(false);
  };

  const verifyPinAttempt = async (pinToVerify: string) => {
    setIsVerifying(true);
    try {
      const isSuccess = await unlockSessionWithPin(pinToVerify);
      if (isSuccess) {
        setEnteredPin("");
        setHasError(false);
        onUnlockSuccess();
      } else {
        setHasError(true);
        setEnteredPin("");
      }
    } catch {
      setHasError(true);
      setEnteredPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (/^[0-9]$/.test(keyEvent.key)) {
        handleDigitPress(keyEvent.key);
      } else if (keyEvent.key === "Backspace") {
        handleBackspace();
      } else if (keyEvent.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, enteredPin]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl select-none"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={activeSpringTransition}
          className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          {/* Header & Lock Shield */}
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-center space-x-1.5">
                <HardHat className="w-4 h-4 text-primary" />
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  BuildBill Vault Locked
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeOperator.companyName}
              </p>
            </div>

            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-medium text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Operator: {activeOperator.displayName}</span>
            </div>
          </div>

          {/* 4-Digit PIN Indicator Dots */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-3 py-2">
              {[0, 1, 2, 3].map((dotIndex) => {
                const isFilled = enteredPin.length > dotIndex;

                return (
                  <motion.div
                    key={dotIndex}
                    animate={{
                      scale: isFilled ? 1.15 : 1,
                      backgroundColor: hasError
                        ? "#f43f5e"
                        : isFilled
                        ? "var(--primary)"
                        : "transparent",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-3.5 h-3.5 rounded-full border-2 ${
                      hasError
                        ? "border-rose-500"
                        : isFilled
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  />
                );
              })}
            </div>

            {hasError && (
              <p className="text-xs font-semibold text-rose-500 animate-shake">
                Incorrect PIN. Please try again.
              </p>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                disabled={isVerifying}
                className="h-12 rounded-xl bg-muted/60 hover:bg-muted active:bg-muted/90 border border-border text-base font-bold text-foreground transition-all shadow-2xs active:scale-95"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-transparent hover:bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress("0")}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-muted/60 hover:bg-muted active:bg-muted/90 border border-border text-base font-bold text-foreground transition-all shadow-2xs active:scale-95"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-transparent hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
