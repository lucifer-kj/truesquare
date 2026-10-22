import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client for TrueSquare Frontend
 * Authenticates the contractor's identity without exposing documents or master encryption keys.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
