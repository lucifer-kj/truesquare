import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/components/auth/LoginPage";

export interface UserSessionProfile {
  name: string;
  email: string;
  isGuest?: boolean;
}

const USER_SESSION_STORAGE_KEY = "truesquare:auth:user_profile";

export function App() {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserSessionProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(USER_SESSION_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserSessionProfile) : null;
    } catch {
      return null;
    }
  });

  const handleAuthenticationSuccess = (userProfile: UserSessionProfile) => {
    setCurrentUserProfile(userProfile);
    try {
      window.localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (storageError) {
      console.warn("Could not persist session:", storageError);
    }
  };

  const handleSignOut = () => {
    setCurrentUserProfile(null);
    try {
      window.localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    } catch (storageError) {
      console.warn("Could not clear session:", storageError);
    }
  };

  if (!currentUserProfile) {
    return <LoginPage onAuthenticationSuccess={handleAuthenticationSuccess} />;
  }

  return (
    <AppShell
      userProfile={currentUserProfile}
      onSignOut={handleSignOut}
    />
  );
}

export default App;
