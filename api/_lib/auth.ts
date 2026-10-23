import { betterAuth } from "better-auth";
import { neonDatabasePool } from "./db.js";

/**
 * Better Auth Configuration for TrueSquare Serverless Deployment
 * Backed by Neon PostgreSQL database pool.
 */
const isProductionEnvironment =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

if (isProductionEnvironment && !process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET must be configured in production environments.");
}

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET || "truesquare-local-development-secret-key-32chars";

const betterAuthBaseUrl =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173");

export const auth = betterAuth({
  database: neonDatabasePool,
  secret: betterAuthSecret,
  baseURL: betterAuthBaseUrl,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
