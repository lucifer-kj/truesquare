import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neonDatabasePool } from "./_lib/db.js";

export default async function handleHealthCheck(
  _request: VercelRequest,
  response: VercelResponse
) {
  let isDatabaseConnected = false;
  let databaseLatencyMs = -1;

  if (process.env.DATABASE_URL) {
    const startTime = Date.now();
    try {
      const client = await neonDatabasePool.connect();
      try {
        await client.query("SELECT 1;");
        isDatabaseConnected = true;
        databaseLatencyMs = Date.now() - startTime;
      } finally {
        client.release();
      }
    } catch {
      isDatabaseConnected = false;
    }
  }

  return response.status(200).json({
    status: "ok",
    application: "TrueSquare",
    environment: process.env.VERCEL_ENV || "development",
    timestamp: new Date().toISOString(),
    database: {
      provider: "Neon Serverless PostgreSQL",
      connected: isDatabaseConnected,
      latencyMs: databaseLatencyMs,
    },
    zeroKnowledgeEncryption: {
      standard: "AES-GCM-256",
      clientSideOnly: true,
      serverPlaintextAccess: false,
    },
  });
}
