import type {
  OperatorAccountProfile,
  OperatorSessionState,
} from "@/domain/auth-types";

const PIN_STORAGE_KEY = "buildbill:v1:operator-pin-hash";
const SESSION_STORAGE_KEY = "buildbill:v1:operator-session";

const DEFAULT_OPERATOR_PROFILE: OperatorAccountProfile = {
  operatorId: "operator-primary-01",
  displayName: "Lead Contractor (Admin)",
  role: "owner",
  companyName: "Lone Star Building Supply Co.",
  avatarInitials: "LC",
  hasPinConfigured: true,
};

// Default fallback PIN is "1234"
const DEFAULT_DEMO_PIN = "1234";

// In-memory fallback for test/SSR runtimes without sessionStorage
let fallbackSessionState: OperatorSessionState = {
  lockState: "unlocked",
  activeOperator: DEFAULT_OPERATOR_PROFILE,
  lastUnlockedAt: new Date().toISOString(),
};

type SessionStateChangeListener = (updatedSessionState: OperatorSessionState) => void;
const sessionListeners = new Set<SessionStateChangeListener>();

function notifySessionListeners(newState: OperatorSessionState): void {
  for (const listener of sessionListeners) {
    try {
      listener(newState);
    } catch (listenerError) {
      console.warn("Session listener callback error:", listenerError);
    }
  }
}

/**
 * Computes a secure SHA-256 hash string for an operator PIN using WebCrypto.
 */
export async function computePinHash(rawPin: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const pinBytes = textEncoder.encode(`buildbill:salt:${rawPin.trim()}`);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", pinBytes);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getCurrentSession(): OperatorSessionState {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return fallbackSessionState;
  }

  try {
    const rawSessionJson = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSessionJson) {
      return fallbackSessionState;
    }
    const parsedState = JSON.parse(rawSessionJson) as OperatorSessionState;
    return parsedState;
  } catch {
    return fallbackSessionState;
  }
}

export function lockCurrentSession(): void {
  const currentSession = getCurrentSession();
  const updatedSession: OperatorSessionState = {
    ...currentSession,
    lockState: "locked",
  };

  saveSessionToStorage(updatedSession);
  notifySessionListeners(updatedSession);
}

export async function unlockSessionWithPin(candidatePin: string): Promise<boolean> {
  const trimmedPin = candidatePin.trim();
  if (!trimmedPin) return false;

  // Verify against stored PIN hash (or default demo PIN "1234")
  let expectedPinHash = getStoredPinHash();
  if (!expectedPinHash) {
    expectedPinHash = await computePinHash(DEFAULT_DEMO_PIN);
    setStoredPinHash(expectedPinHash);
  }

  const candidatePinHash = await computePinHash(trimmedPin);
  const isPinValid = candidatePinHash === expectedPinHash;

  if (isPinValid) {
    const currentSession = getCurrentSession();
    const unlockedSession: OperatorSessionState = {
      ...currentSession,
      lockState: "unlocked",
      lastUnlockedAt: new Date().toISOString(),
    };
    saveSessionToStorage(unlockedSession);
    notifySessionListeners(unlockedSession);
    return true;
  }

  return false;
}

export async function setOperatorPin(newPin: string): Promise<boolean> {
  const trimmedPin = newPin.trim();
  if (trimmedPin.length < 4) return false;

  const newPinHash = await computePinHash(trimmedPin);
  setStoredPinHash(newPinHash);

  const currentSession = getCurrentSession();
  const updatedSession: OperatorSessionState = {
    ...currentSession,
    activeOperator: {
      ...currentSession.activeOperator,
      hasPinConfigured: true,
    },
  };
  saveSessionToStorage(updatedSession);
  notifySessionListeners(updatedSession);
  return true;
}

export function subscribeToSessionChanges(
  listenerCallback: SessionStateChangeListener
): () => void {
  sessionListeners.add(listenerCallback);
  return () => {
    sessionListeners.delete(listenerCallback);
  };
}

function saveSessionToStorage(sessionState: OperatorSessionState): void {
  fallbackSessionState = sessionState;
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
  } catch (storageError) {
    console.warn("Unable to save operator session to sessionStorage:", storageError);
  }
}

let fallbackPinHash: string | null = null;

function getStoredPinHash(): string | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return fallbackPinHash;
  }
  try {
    return window.localStorage.getItem(PIN_STORAGE_KEY) || fallbackPinHash;
  } catch {
    return fallbackPinHash;
  }
}

function setStoredPinHash(pinHash: string): void {
  fallbackPinHash = pinHash;
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PIN_STORAGE_KEY, pinHash);
  } catch {
    // Ignore storage write errors in restricted contexts
  }
}
