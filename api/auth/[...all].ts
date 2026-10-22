import { toNodeHandler } from "better-auth/node";
import { auth } from "../_lib/auth.js";
import { ensureEncryptedVaultTableExists } from "../_lib/db.js";

// Ensure custom encryption table exists upon auth invocation
ensureEncryptedVaultTableExists().catch((error) => {
  console.warn("Failed initializing encrypted vault table:", error);
});

export default toNodeHandler(auth);
