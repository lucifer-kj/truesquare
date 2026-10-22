import { Pool } from "@neondatabase/serverless";

/**
 * Neon Serverless PostgreSQL Database Connection Pool
 * Configured via standard DATABASE_URL environment variable.
 */
const databaseUrl = process.env.DATABASE_URL || "";

export const neonDatabasePool = new Pool({
  connectionString: databaseUrl,
});

/**
 * Executes an auto-migration to ensure the TrueSquare encrypted blob vault table exists.
 * Strictly stores only opaque encrypted payloads (AES-256 ciphertext) with zero client PII.
 */
export async function ensureEncryptedVaultTableExists(): Promise<void> {
  if (!databaseUrl) return;

  const client = await neonDatabasePool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS encrypted_contractor_documents (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        document_id VARCHAR(128) NOT NULL,
        document_number VARCHAR(64) NOT NULL,
        document_type VARCHAR(32) NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        encrypted_payload_base64 TEXT NOT NULL,
        checksum_sha256 VARCHAR(64) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, document_id)
      );
      CREATE INDEX IF NOT EXISTS idx_contractor_docs_user ON encrypted_contractor_documents(user_id);
    `);
  } finally {
    client.release();
  }
}
